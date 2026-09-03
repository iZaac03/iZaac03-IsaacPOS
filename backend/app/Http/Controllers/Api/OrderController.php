<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class OrderController extends Controller
{
    protected CheckoutService $checkoutService;

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
    }

    /**
     * List recent transactions with filter by date, status, cashier.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Order::with(['user', 'customer', 'payments', 'items'])
            ->where('store_id', $storeId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('order_number', 'LIKE', "%{$search}%");
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->input('date'));
        }

        $perPage = $request->input('per_page', 20);
        $orders = $query->latest()->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Process checkout transaction from POS Terminal.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'discount_type' => 'nullable|in:none,percentage,fixed,senior_pwd,custom',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'customer_id' => 'nullable|exists:tbl_customers,customer_id',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:tbl_products,product_id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'payments' => 'required|array|min:1',
            'payments.*.payment_method' => 'required|in:cash,gcash,maya,card',
            'payments.*.amount' => 'required|numeric|min:0.01',
            'payments.*.tendered_amount' => 'nullable|numeric|min:0',
            'payments.*.reference_no' => 'nullable|string|max:100',
            'payments.*.notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        try {
            $order = $this->checkoutService->checkout($validated, $user->user_id, $user->store_id);

            return response()->json([
                'message' => 'Order completed successfully',
                'order' => $order,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Show full order details for receipt display and printing.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $order = Order::with(['user', 'customer', 'payments', 'items.product', 'refunds.items', 'store'])
            ->where('store_id', $storeId)
            ->findOrFail($id);

        return response()->json($order);
    }
}
