<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Store;
use App\Models\User;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\CheckoutService;
use App\Services\RefundService;
use App\Services\TaxService;
use Exception;

class CheckoutAndRefundTest extends TestCase
{
    protected CheckoutService $checkoutService;
    protected RefundService $refundService;

    protected function setUp(): void
    {
        parent::setUp();
        $taxService = new TaxService();
        $this->checkoutService = new CheckoutService($taxService);
        $this->refundService = new RefundService();
    }

    public function test_pos_checkout_creates_order_and_reduces_inventory_and_logs_movement(): void
    {
        $store = Store::first();
        $user = User::where('role', 'cashier')->first();
        $product = Product::where('store_id', $store->store_id)
            ->where('stock_quantity', '>', 10)
            ->first();

        $initialStock = (float)$product->stock_quantity;
        $qtyToBuy = 2.00;

        $checkoutData = [
            'discount_type' => 'none',
            'items' => [
                [
                    'product_id' => $product->product_id,
                    'quantity' => $qtyToBuy,
                    'unit_price' => (float)$product->selling_price,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount' => round($qtyToBuy * (float)$product->selling_price, 2),
                    'tendered_amount' => round($qtyToBuy * (float)$product->selling_price, 2) + 50,
                ],
            ],
        ];

        $order = $this->checkoutService->checkout($checkoutData, $user->user_id, $store->store_id);

        $this->assertNotNull($order);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertCount(1, $order->items);
        $this->assertCount(1, $order->payments);

        // Verify product stock decremented
        $product->refresh();
        $this->assertEquals($initialStock - $qtyToBuy, (float)$product->stock_quantity);

        // Verify immutable stock movement logged
        $movement = StockMovement::where('product_id', $product->product_id)
            ->where('reference_type', 'order')
            ->where('reference_id', $order->order_id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals('sale', $movement->type);
        $this->assertEquals(-$qtyToBuy, (float)$movement->quantity_change);
        $this->assertEquals($initialStock, (float)$movement->previous_quantity);
        $this->assertEquals($initialStock - $qtyToBuy, (float)$movement->new_quantity);
    }

    public function test_pos_checkout_rejects_insufficient_stock(): void
    {
        $this->expectException(Exception::class);

        $store = Store::first();
        $user = User::where('role', 'cashier')->first();
        $product = Product::where('store_id', $store->store_id)->first();

        $excessiveQty = (float)$product->stock_quantity + 9999;

        $checkoutData = [
            'discount_type' => 'none',
            'items' => [
                [
                    'product_id' => $product->product_id,
                    'quantity' => $excessiveQty,
                    'unit_price' => (float)$product->selling_price,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount' => 100000,
                ],
            ],
        ];

        $this->checkoutService->checkout($checkoutData, $user->user_id, $store->store_id);
    }

    public function test_split_payments_validation(): void
    {
        $store = Store::first();
        $user = User::where('role', 'cashier')->first();
        $product = Product::where('store_id', $store->store_id)
            ->where('stock_quantity', '>', 5)
            ->first();

        $totalPrice = round(2 * (float)$product->selling_price, 2);
        $half1 = round($totalPrice / 2, 2);
        $half2 = round($totalPrice - $half1, 2);

        $checkoutData = [
            'discount_type' => 'none',
            'items' => [
                [
                    'product_id' => $product->product_id,
                    'quantity' => 2,
                    'unit_price' => (float)$product->selling_price,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'gcash',
                    'amount' => $half1,
                    'reference_no' => 'GC-TEST-12345',
                ],
                [
                    'payment_method' => 'cash',
                    'amount' => $half2,
                    'tendered_amount' => $half2,
                ],
            ],
        ];

        $order = $this->checkoutService->checkout($checkoutData, $user->user_id, $store->store_id);

        $this->assertCount(2, $order->payments);
        $this->assertEquals($totalPrice, (float)$order->total_amount);
        $this->assertEquals($totalPrice, (float)$order->amount_paid);
    }

    public function test_refund_restocks_product_and_logs_movement(): void
    {
        $store = Store::first();
        $cashier = User::where('role', 'cashier')->first();
        $product = Product::where('store_id', $store->store_id)
            ->where('stock_quantity', '>', 5)
            ->first();

        // Perform checkout of 2 units
        $checkoutData = [
            'discount_type' => 'none',
            'items' => [
                [
                    'product_id' => $product->product_id,
                    'quantity' => 2,
                    'unit_price' => (float)$product->selling_price,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount' => round(2 * (float)$product->selling_price, 2),
                ],
            ],
        ];

        $order = $this->checkoutService->checkout($checkoutData, $cashier->user_id, $store->store_id);
        $orderItem = $order->items->first();

        $stockBeforeRefund = (float)$product->fresh()->stock_quantity;

        // Refund 1 unit with restock
        $refundData = [
            'order_id' => $order->order_id,
            'reason_code' => 'wrong_item',
            'notes' => 'Customer bought wrong variation',
            'items' => [
                [
                    'order_item_id' => $orderItem->order_item_id,
                    'quantity' => 1,
                    'restock_item' => true,
                ],
            ],
        ];

        $refund = $this->refundService->processRefund($refundData, $cashier->user_id, $store->store_id);

        $this->assertNotNull($refund);
        $this->assertEquals('completed', $refund->status);
        $this->assertEquals('partially_refunded', $order->fresh()->payment_status);

        // Verify stock incremented back by 1
        $this->assertEquals($stockBeforeRefund + 1, (float)$product->fresh()->stock_quantity);

        // Verify refund movement logged
        $movement = StockMovement::where('product_id', $product->product_id)
            ->where('reference_type', 'refund')
            ->where('reference_id', $refund->refund_id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals('refund', $movement->type);
        $this->assertEquals(1.00, (float)$movement->quantity_change);
    }
}
