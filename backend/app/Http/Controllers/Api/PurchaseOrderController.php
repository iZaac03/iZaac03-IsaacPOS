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
