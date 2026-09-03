<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockRequest;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = StockRequest::with(['product.category', 'requester', 'approver', 'purchaseOrder'])
            ->where('store_id', $user->store_id);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $requests = $query->orderByDesc('created_at')->get();

        return response()->json($requests);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:tbl_products,product_id',
            'requested_quantity' => 'required|numeric|min:1',
            'urgency' => 'in:normal,urgent,critical',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        $stockRequest = StockRequest::create([
            'store_id' => $user->store_id,
            'product_id' => $request->product_id,
            'requested_by' => $user->user_id,
            'requested_quantity' => $request->requested_quantity,
            'urgency' => $request->urgency ?? 'normal',
            'status' => 'pending',
            'notes' => $request->notes,
        ]);

        $stockRequest->load(['product.category', 'requester']);

        return response()->json([
            'message' => 'Stock request submitted successfully to managers and admins.',
            'request' => $stockRequest,
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $user = $request->user();
        $stockRequest = StockRequest::where('store_id', $user->store_id)->findOrFail($id);

        $stockRequest->status = $request->status;
        if (in_array($request->status, ['approved', 'rejected'])) {
            $stockRequest->approved_by = $user->user_id;
        }
        $stockRequest->save();

        return response()->json([
            'message' => 'Stock request status updated to ' . $request->status,
            'request' => $stockRequest->fresh(['product', 'requester', 'approver']),
        ]);
    }

    public function convertToPO(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role === 'cashier') {
            return response()->json(['message' => 'Unauthorized. Only managers and admins can generate purchase orders.'], 403);
        }

        $request->validate([
            'supplier_id' => 'required|exists:tbl_suppliers,supplier_id',
            'unit_cost' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $user, $id) {
            $stockRequest = StockRequest::with('product')->where('store_id', $user->store_id)->findOrFail($id);
            $product = $stockRequest->product;

            $unitCost = $request->unit_cost ?? $product->cost_price;
            $quantity = $stockRequest->requested_quantity;
            $totalCost = $quantity * $unitCost;

            $poNumber = 'PO-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $po = PurchaseOrder::create([
                'store_id' => $user->store_id,
                'supplier_id' => $request->supplier_id,
                'user_id' => $user->user_id,
                'po_number' => $poNumber,
                'total_amount' => $totalCost,
                'status' => 'sent',
                'notes' => 'Generated from Cashier Stock Request #' . $stockRequest->request_id . ': ' . ($stockRequest->notes ?? 'Urgent restock'),
            ]);

            PurchaseOrderItem::create([
                'po_id' => $po->po_id,
                'product_id' => $product->product_id,
                'quantity_ordered' => $quantity,
                'quantity_received' => 0,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
            ]);

            $stockRequest->update([
                'status' => 'converted_to_po',
                'approved_by' => $user->user_id,
                'po_id' => $po->po_id,
            ]);

            return response()->json([
                'message' => 'Stock request successfully converted to Purchase Order ' . $poNumber,
                'po' => $po->load(['supplier', 'items.product']),
                'request' => $stockRequest->fresh(['product', 'requester', 'purchaseOrder']),
            ]);
        });
    }
}
