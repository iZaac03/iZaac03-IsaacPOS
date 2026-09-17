<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Store;
use App\Models\User;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::first();
        $cashier = User::where('role', 'cashier')->first() ?? User::first();
        $custRegular = Customer::first();
        $prod1 = Product::where('sku', 'BEV-KOP-002')->first() ?? Product::first();
        $prod2 = Product::where('sku', 'GRO-PFC-005')->first() ?? Product::skip(1)->first();
        $prod3 = Product::where('sku', 'PER-COL-002')->first() ?? Product::skip(2)->first();
        $prod4 = Product::where('sku', 'PER-SAF-001')->first() ?? Product::skip(3)->first();

        if (!$store || !$cashier || !$prod1) {
            return;
        }

        $today = date('Ymd');

        // Order 1: Cash sale
        $o1 = Order::firstOrCreate(
            ['order_number' => "ORD-{$today}-0001"],
            [
                'store_id' => $store->store_id,
                'user_id' => $cashier->user_id,
                'customer_id' => $custRegular?->customer_id,
                'subtotal' => 173.00,
                'vatable_sales' => 154.46,
                'vat_amount' => 18.54,
                'total_amount' => 173.00,
                'amount_paid' => 200.00,
                'change_amount' => 27.00,
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'notes' => 'Customer paid in cash (₱200 bill)',
            ]
        );

        OrderItem::firstOrCreate(
            ['order_id' => $o1->order_id, 'product_id' => $prod1->product_id],
            [
                'product_name' => $prod1->name,
                'quantity' => 2,
                'unit_cost' => 25,
                'unit_price' => 34,
                'subtotal' => 68,
                'total' => 68,
            ]
        );

        Payment::firstOrCreate(
            ['order_id' => $o1->order_id, 'payment_method' => 'cash'],
            [
                'store_id' => $store->store_id,
                'amount' => 173.00,
                'tendered_amount' => 200.00,
                'change_amount' => 27.00,
                'status' => 'completed',
            ]
        );

        // Order 2: Split Tender (GCash + Cash)
        $o2 = Order::firstOrCreate(
            ['order_number' => "ORD-{$today}-0002"],
            [
                'store_id' => $store->store_id,
                'user_id' => $cashier->user_id,
                'subtotal' => 475.00,
                'vatable_sales' => 424.11,
                'vat_amount' => 50.89,
                'total_amount' => 475.00,
                'amount_paid' => 475.00,
                'change_amount' => 0.00,
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'notes' => 'Split payment GCash and Cash',
            ]
        );

        Payment::firstOrCreate(
            ['order_id' => $o2->order_id, 'payment_method' => 'gcash'],
            [
                'store_id' => $store->store_id,
                'amount' => 300.00,
                'reference_no' => 'GC-901847192',
                'status' => 'completed',
            ]
        );

        Payment::firstOrCreate(
            ['order_id' => $o2->order_id, 'payment_method' => 'cash'],
            [
                'store_id' => $store->store_id,
                'amount' => 175.00,
                'status' => 'completed',
            ]
        );

        // Order 3: Senior Citizen discount
        $o3 = Order::firstOrCreate(
            ['order_number' => "ORD-{$today}-0003"],
            [
                'store_id' => $store->store_id,
                'user_id' => $cashier->user_id,
                'subtotal' => 166.00,
                'vatable_sales' => 0.00,
                'vat_amount' => 0.00,
                'vat_exempt_sales' => 118.57,
                'discount_type' => 'senior_pwd',
                'discount_rate' => 20.00,
                'discount_amount' => 47.43,
                'total_amount' => 118.57,
                'amount_paid' => 120.00,
                'change_amount' => 1.43,
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'notes' => 'Senior Citizen discount applied (OSCA-NCR-2018-8841)',
            ]
        );

        Payment::firstOrCreate(
            ['order_id' => $o3->order_id, 'payment_method' => 'cash'],
            [
                'store_id' => $store->store_id,
                'amount' => 118.57,
                'status' => 'completed',
            ]
        );
    }
}
