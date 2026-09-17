<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class PurchaseOrderController extends Controller
{
    protected PurchaseOrderService $poService;

    public function __construct(PurchaseOrderService $poService)
    {
        $this->poService = $poService;
    }

    /**
     * List purchase orders.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = PurchaseOrder::with(['supplier', 'user', 'items.product'])
            ->where('store_id', $storeId);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        $perPage = $request->input('per_page', 20);
        $pos = $query->latest()->paginate($perPage);

        return response()->json($pos);
    }

    /**
     * Create a purchase order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:tbl_suppliers,supplier_id',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:tbl_products,product_id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        try {
            $po = $this->poService->createPO($validated, $user->user_id, $user->store_id);

            return response()->json([
                'message' => 'Purchase Order created successfully in Draft status.',
                'purchase_order' => $po,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Show PO details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $po = PurchaseOrder::with(['supplier', 'user', 'items.product'])
            ->where('store_id', $storeId)
            ->findOrFail($id);

        return response()->json($po);
    }

    /**
     * Update/Alter an existing purchase order.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $po = PurchaseOrder::where('store_id', $storeId)->findOrFail($id);

        if (in_array($po->status, ['closed', 'cancelled'])) {
            return response()->json([
                'message' => "Cannot alter a purchase order that is already {$po->status}.",
            ], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'sometimes|required|exists:tbl_suppliers,supplier_id',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'items' => 'nullable|array',
            'items.*.po_item_id' => 'nullable|exists:tbl_purchase_order_items,po_item_id',
            'items.*.product_id' => 'required_without:items.*.po_item_id|exists:tbl_products,product_id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        if (isset($validated['supplier_id'])) {
            $po->supplier_id = $validated['supplier_id'];
        }
        if (array_key_exists('expected_delivery_date', $validated)) {
            $po->expected_delivery_date = $validated['expected_delivery_date'];
        }
        if (array_key_exists('notes', $validated)) {
            $po->notes = $validated['notes'];
        }

        if (isset($validated['items']) && is_array($validated['items'])) {
            foreach ($validated['items'] as $itemData) {
                if (!empty($itemData['po_item_id'])) {
                    $item = \App\Models\PurchaseOrderItem::where('po_id', $po->po_id)
                        ->where('po_item_id', $itemData['po_item_id'])
                        ->first();
                    if ($item) {
                        $qty = (float)$itemData['quantity_ordered'];
                        $cost = (float)$itemData['unit_cost'];
                        $item->update([
                            'quantity_ordered' => $qty,
                            'unit_cost' => $cost,
                            'total_cost' => round($qty * $cost, 2),
                        ]);
                    }
                } elseif (!empty($itemData['product_id'])) {
                    $existingItem = \App\Models\PurchaseOrderItem::where('po_id', $po->po_id)
                        ->where('product_id', $itemData['product_id'])
                        ->first();
                    $qty = (float)$itemData['quantity_ordered'];
                    $cost = (float)$itemData['unit_cost'];

                    if ($existingItem) {
                        $existingItem->update([
                            'quantity_ordered' => $qty,
                            'unit_cost' => $cost,
                            'total_cost' => round($qty * $cost, 2),
                        ]);
                    } else {
                        \App\Models\PurchaseOrderItem::create([
                            'po_id' => $po->po_id,
                            'product_id' => $itemData['product_id'],
                            'quantity_ordered' => $qty,
                            'quantity_received' => 0.00,
                            'unit_cost' => $cost,
                            'total_cost' => round($qty * $cost, 2),
                        ]);
                    }
                }
            }

            $po->total_amount = round(\App\Models\PurchaseOrderItem::where('po_id', $po->po_id)->sum('total_cost'), 2);
        }

        $po->save();

        return response()->json([
            'message' => 'Purchase order altered successfully.',
            'purchase_order' => $po->load(['supplier', 'items.product', 'user']),
        ]);
    }

    /**
     * Update PO status (draft -> sent -> closed).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $po = PurchaseOrder::where('store_id', $storeId)->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:draft,sent,closed,cancelled',
        ]);

        $po->status = $validated['status'];
        $po->save();

        return response()->json([
            'message' => "Purchase Order status updated to {$po->status}.",
            'purchase_order' => $po->load(['supplier', 'items.product']),
        ]);
    }

    /**
     * Receive goods for PO, updating inventory and stock movement logs.
     */
    public function receive(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.po_item_id' => 'required|exists:tbl_purchase_order_items,po_item_id',
            'items.*.quantity_receiving' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();

        try {
            $po = $this->poService->receiveGoods($id, $validated['items'], $user->user_id, $user->store_id);

            return response()->json([
                'message' => 'Goods received successfully and stock quantities updated.',
                'purchase_order' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
