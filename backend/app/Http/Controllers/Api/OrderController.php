<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

        if ($request->filled('payment_method') && $request->input('payment_method') !== 'all') {
            $pm = $request->input('payment_method');
            $query->whereHas('payments', function ($q) use ($pm) {
                $q->where('payment_method', $pm);
            });
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

    /**
     * Void a completed or pending order, restocking all items and updating payment/order status.
     */
    public function voidOrder(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
            'manager_pin' => 'nullable|string|max:10',
        ]);

        // If user is cashier, require manager authorization
        if ($user->role === 'cashier') {
            $managerPin = $validated['manager_pin'] ?? null;
            if (!$managerPin) {
                return response()->json([
                    'message' => 'Manager authorization PIN is required to void an order.',
                ], 403);
            }
            $manager = User::where('store_id', $storeId)
                ->whereIn('role', ['manager', 'admin'])
                ->where('pin_code', $managerPin)
                ->where('is_active', true)
                ->first();

            if (!$manager) {
                return response()->json([
                    'message' => 'Invalid manager authorization PIN.',
                ], 403);
            }
        }

        $order = Order::with(['items', 'payments'])
            ->where('store_id', $storeId)
            ->findOrFail($id);

        if ($order->order_status === 'voided') {
            return response()->json([
                'message' => 'This order has already been voided.',
            ], 422);
        }

        DB::transaction(function () use ($order, $user, $storeId, $validated) {
            $now = Carbon::now();
            $reason = $validated['reason'];
            $notes = $validated['notes'] ?? '';
            $voidNotice = "[VOIDED on {$now->toDateTimeString()} by {$user->name}: {$reason}" . ($notes ? " - {$notes}" : "") . "]";

            // 1. Restock each item
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    $product = Product::where('store_id', $storeId)->find($item->product_id);
                    if ($product) {
                        $prevQty = (float)$product->stock_quantity;
                        $restockQty = (float)$item->quantity;
                        $newQty = $prevQty + $restockQty;

                        $product->stock_quantity = $newQty;
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->product_id,
                            'store_id' => $storeId,
                            'user_id' => $user->user_id,
                            'type' => 'void',
                            'quantity_change' => $restockQty,
                            'previous_quantity' => $prevQty,
                            'new_quantity' => $newQty,
                            'reference_type' => 'order_void',
                            'reference_id' => $order->order_id,
                            'reason' => "Void Order {$order->order_number}: {$reason}",
                            'notes' => $notes ?: 'Order voided by ' . $user->name,
                        ]);
                    }
                }
            }

            // 2. Void payments
            Payment::where('order_id', $order->order_id)
                ->update(['status' => 'voided']);

            // 3. Mark order as voided
            $order->order_status = 'voided';
            $order->payment_status = 'voided';
            $order->notes = $order->notes ? $order->notes . "\n" . $voidNotice : $voidNotice;
            $order->save();
        });

        return response()->json([
            'message' => "Order {$order->order_number} voided successfully and inventory restored.",
            'order' => $order->fresh(['user', 'customer', 'payments', 'items.product']),
        ]);
    }
}
