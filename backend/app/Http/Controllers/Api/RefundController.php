<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use App\Models\User;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class RefundController extends Controller
{
    protected RefundService $refundService;

    public function __construct(RefundService $refundService)
    {
        $this->refundService = $refundService;
    }

    /**
     * List refunds.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Refund::with(['order', 'user', 'approver', 'items.product'])
            ->where('store_id', $storeId);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('refund_number', 'LIKE', "%{$search}%");
        }

        $perPage = $request->input('per_page', 20);
        $refunds = $query->latest()->paginate($perPage);

        return response()->json($refunds);
    }

    /**
     * Create a refund request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:tbl_orders,order_id',
            'reason_code' => 'required|in:damaged_item,wrong_item,customer_dissatisfied,cashier_error,expired_product,other',
            'notes' => 'nullable|string|max:500',
            'manager_pin' => 'nullable|string|size:6',
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => 'required|exists:tbl_order_items,order_item_id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.restock_item' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $storeId = $user->store_id;

        // Verify manager PIN if provided
        $approverId = null;
        if (!empty($validated['manager_pin'])) {
            $manager = User::where('store_id', $storeId)
                ->whereIn('role', ['manager', 'admin'])
                ->where('is_active', true)
                ->where('pin_code', $validated['manager_pin'])
                ->first();

            if ($manager) {
                $approverId = $manager->user_id;
            }
        } elseif ($user->isManager()) {
            $approverId = $user->user_id;
        }

        try {
            $refund = $this->refundService->processRefund($validated, $user->user_id, $storeId, $approverId);

            return response()->json([
                'message' => $refund->status === 'pending'
                    ? 'Refund request submitted for Manager approval (> ₱1,000 threshold).'
                    : 'Refund processed successfully and inventory restocked.',
                'refund' => $refund,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Manager approval of high-value pending refund.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user->isManager()) {
            return response()->json([
                'message' => 'Only Managers and Admins can approve high-value refunds.',
            ], 403);
        }

        try {
            $refund = $this->refundService->approveRefund($id, $user->user_id, $user->store_id);

            return response()->json([
                'message' => 'Refund approved and completed. Inventory has been updated.',
                'refund' => $refund,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
