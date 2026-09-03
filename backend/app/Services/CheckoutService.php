<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Exception;

class CheckoutService
{
    protected TaxService $taxService;

    public function __construct(TaxService $taxService)
    {
        $this->taxService = $taxService;
    }

    /**
     * Execute POS checkout atomically with pessimistic locking and split payments.
     */
    public function checkout(array $data, int $userId, int $storeId): Order
    {
        return DB::transaction(function () use ($data, $userId, $storeId) {
            $items = $data['items'] ?? [];
            $payments = $data['payments'] ?? [];
            $discountType = $data['discount_type'] ?? 'none';
            $discountRate = (float)($data['discount_rate'] ?? 0.00);
            $customerId = $data['customer_id'] ?? null;
            $notes = $data['notes'] ?? null;

            if (empty($items)) {
                throw new Exception('Cart is empty. Please add products before checking out.');
            }

            if (empty($payments)) {
                throw new Exception('Payment information is required.');
            }

            // 1. Calculate raw subtotal and check product availability with lockForUpdate
            $grossSubtotal = 0.00;
            $productLocks = [];

            foreach ($items as $item) {
                $product = Product::where('product_id', $item['product_id'])
                    ->where('store_id', $storeId)
                    ->lockForUpdate()
                    ->first();

                if (!$product) {
                    throw new Exception("Product ID {$item['product_id']} not found in this store.");
                }

                $quantity = (float)$item['quantity'];
                if ($quantity <= 0) {
                    throw new Exception("Invalid quantity for product {$product->name}.");
                }

                if ($product->stock_quantity < $quantity) {
                    throw new Exception("Insufficient stock for '{$product->name}'. Available: {$product->stock_quantity}, Requested: {$quantity}.");
                }

                $unitPrice = (float)($item['unit_price'] ?? $product->selling_price);
                $lineTotal = round($unitPrice * $quantity, 2);
                $grossSubtotal += $lineTotal;

                $productLocks[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'unit_cost' => (float)$product->cost_price,
                    'line_total' => $lineTotal,
                ];
            }

            // 2. Compute tax and discounts
            $vatableSales = 0.00;
            $vatAmount = 0.00;
            $vatExemptSales = 0.00;
            $discountAmount = 0.00;
            $finalTotal = $grossSubtotal;

            if ($discountType === 'senior_pwd') {
                $seniorResult = $this->taxService->calculateSeniorPwdDiscount($grossSubtotal);
                $vatableSales = $seniorResult['vatable_sales'];
                $vatAmount = $seniorResult['vat_amount'];
                $vatExemptSales = $seniorResult['vat_exempt_sales'];
                $discountAmount = $seniorResult['discount_amount'];
                $finalTotal = $seniorResult['total_amount'];
            } elseif ($discountType === 'percentage' && $discountRate > 0) {
                $discountAmount = round($grossSubtotal * ($discountRate / 100), 2);
                $finalTotal = round($grossSubtotal - $discountAmount, 2);
                $vatBreakdown = $this->taxService->calculateStandardVat($finalTotal);
                $vatableSales = $vatBreakdown['vatable_sales'];
                $vatAmount = $vatBreakdown['vat_amount'];
            } elseif ($discountType === 'fixed') {
                $discountAmount = min((float)($data['discount_amount'] ?? 0.00), $grossSubtotal);
                $finalTotal = round($grossSubtotal - $discountAmount, 2);
                $vatBreakdown = $this->taxService->calculateStandardVat($finalTotal);
                $vatableSales = $vatBreakdown['vatable_sales'];
                $vatAmount = $vatBreakdown['vat_amount'];
            } else {
                $vatBreakdown = $this->taxService->calculateStandardVat($grossSubtotal);
                $vatableSales = $vatBreakdown['vatable_sales'];
                $vatAmount = $vatBreakdown['vat_amount'];
            }

            // 3. Validate split payments
            $totalTendered = 0.00;
            $totalAmountPaid = 0.00;

            foreach ($payments as $payment) {
                $amount = (float)($payment['amount'] ?? 0.00);
                if ($amount <= 0) {
                    throw new Exception('Payment amount must be greater than zero.');
                }
                $tendered = (float)($payment['tendered_amount'] ?? $amount);
                $totalAmountPaid += $amount;
                $totalTendered += $tendered;
            }

            if (round($totalAmountPaid, 2) < round($finalTotal, 2)) {
                $shortage = round($finalTotal - $totalAmountPaid, 2);
                throw new Exception("Payment underpaid by ₱" . number_format($shortage, 2));
            }

            $changeAmount = max(0.00, round($totalTendered - $finalTotal, 2));

            // 4. Generate Order Number: ORD-YYYYMMDD-XXXX
            $today = date('Ymd');
            $orderCount = Order::whereDate('created_at', today())->count() + 1;
            $orderNumber = sprintf('ORD-%s-%04d', $today, $orderCount);

            // 5. Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'store_id' => $storeId,
                'user_id' => $userId,
                'customer_id' => $customerId,
                'subtotal' => $grossSubtotal,
                'vatable_sales' => $vatableSales,
                'vat_amount' => $vatAmount,
                'vat_exempt_sales' => $vatExemptSales,
                'discount_type' => $discountType,
                'discount_rate' => $discountRate,
                'discount_amount' => $discountAmount,
                'total_amount' => $finalTotal,
                'amount_paid' => $totalAmountPaid,
                'change_amount' => $changeAmount,
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'notes' => $notes,
            ]);

            // 6. Create Order Items and update stock with StockMovement
            foreach ($productLocks as $pLock) {
                /** @var Product $product */
                $product = $pLock['product'];
                $qty = $pLock['quantity'];
                $prevQty = (float)$product->stock_quantity;
                $newQty = round($prevQty - $qty, 2);

                $orderItem = OrderItem::create([
                    'order_id' => $order->order_id,
                    'product_id' => $product->product_id,
                    'product_name' => $product->name,
                    'quantity' => $qty,
                    'unit_cost' => $pLock['unit_cost'],
                    'unit_price' => $pLock['unit_price'],
                    'discount_amount' => 0.00,
                    'tax_amount' => 0.00,
                    'subtotal' => $pLock['line_total'],
                    'total' => $pLock['line_total'],
                ]);

                // Update product stock
                $product->stock_quantity = $newQty;
                $product->save();

                // Log immutable stock movement
                StockMovement::create([
                    'product_id' => $product->product_id,
                    'store_id' => $storeId,
                    'user_id' => $userId,
                    'type' => 'sale',
                    'quantity_change' => -$qty,
                    'previous_quantity' => $prevQty,
                    'new_quantity' => $newQty,
                    'reference_type' => 'order',
                    'reference_id' => $order->order_id,
                    'reason' => "POS Checkout Order {$order->order_number}",
                    'notes' => "Sold {$qty} {$product->unit}",
                ]);
            }

            // 7. Create Payment records
            foreach ($payments as $pData) {
                $paymentAmount = (float)$pData['amount'];
                $tendered = isset($pData['tendered_amount']) ? (float)$pData['tendered_amount'] : $paymentAmount;
                $paymentChange = $pData['payment_method'] === 'cash' ? max(0.00, round($tendered - $paymentAmount, 2)) : 0.00;

                Payment::create([
                    'order_id' => $order->order_id,
                    'store_id' => $storeId,
                    'payment_method' => $pData['payment_method'],
                    'amount' => $paymentAmount,
                    'tendered_amount' => $tendered,
                    'change_amount' => $paymentChange,
                    'reference_no' => $pData['reference_no'] ?? null,
                    'status' => 'completed',
                    'notes' => $pData['notes'] ?? null,
                ]);
            }

            return $order->load(['items', 'payments', 'customer', 'user', 'store']);
        });
    }
}
