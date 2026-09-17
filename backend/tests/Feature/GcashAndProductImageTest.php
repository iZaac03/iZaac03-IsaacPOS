<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\Store;
use App\Models\User;
use App\Models\Product;
use App\Models\GcashTransaction;
use Illuminate\Http\UploadedFile;

class GcashAndProductImageTest extends TestCase
{
    use DatabaseTransactions;
    public function test_product_stores_base64_image_directly_in_database(): void
    {
        $user = User::first();
        $store = Store::first();
        $category = \App\Models\Category::first() ?? \App\Models\Category::create([
            'store_id' => $store->store_id,
            'name' => 'General',
            'slug' => 'general-' . uniqid(),
        ]);

        $dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $sku = 'TEST-IMG-' . time();
        $product = Product::create([
            'store_id' => $store->store_id,
            'category_id' => $category->category_id,
            'barcode' => 'BAR-' . time(),
            'sku' => $sku,
            'name' => 'Database Image Test Product',
            'cost_price' => 20.00,
            'selling_price' => 35.00,
            'stock_quantity' => 50,
            'reorder_level' => 10,
            'unit' => 'pcs',
            'image_url' => $dummyBase64,
        ]);

        $fresh = Product::where('sku', $sku)->first();
        $this->assertNotNull($fresh);
        $this->assertEquals($dummyBase64, $fresh->image_url);

        // Clean up
        $fresh->forceDelete();
    }

    public function test_gcash_transaction_creation_and_fee_calculation(): void
    {
        $user = User::first();
        $store = Store::first();

        $response = $this->actingAs($user)->postJson('/api/gcash-transactions', [
            'transaction_type' => 'cash_in',
            'customer_phone' => '09170000001',
            'customer_name' => 'Test Customer',
            'amount' => 1000.00,
            'reference_number' => 'REF-' . time(),
        ]);

        $response->assertStatus(201);
        $data = $response->json('transaction');

        $this->assertEquals('cash_in', $data['transaction_type']);
        $this->assertEquals('1000.00', $data['amount']);
        $this->assertEquals('20.00', $data['fee']);
        $this->assertEquals('1020.00', $data['total_amount']);

        // Clean up
        GcashTransaction::where('customer_phone', '09170000001')->delete();
    }

    public function test_gcash_phone_validation_rejects_invalid_prefixes_or_lengths(): void
    {
        $user = User::first();

        // 10 digits
        $res1 = $this->actingAs($user)->postJson('/api/gcash-transactions', [
            'transaction_type' => 'cash_in',
            'customer_phone' => '0917123456',
            'amount' => 500,
        ]);
        $res1->assertStatus(422);

        // Does not start with 09
        $res2 = $this->actingAs($user)->postJson('/api/gcash-transactions', [
            'transaction_type' => 'cash_in',
            'customer_phone' => '08171234567',
            'amount' => 500,
        ]);
        $res2->assertStatus(422);
    }

    public function test_gcash_analytics_dashboard_includes_gcash_kpis_and_summary(): void
    {
        $user = User::first();
        $response = $this->actingAs($user)->getJson('/api/analytics/dashboard');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'kpis' => [
                'sales_today',
                'orders_today',
                'gcash_fees_today',
                'gcash_cash_in_today',
                'gcash_cash_out_today',
                'gcash_txns_today',
            ],
            'gcash_summary' => [
                'today' => [
                    'fees_earned',
                    'cash_in_volume',
                    'cash_out_volume',
                    'txns_count',
                ],
                'month' => [
                    'fees_earned',
                    'cash_in_volume',
                    'cash_out_volume',
                    'txns_count',
                ],
            ],
            'cashier_audit',
        ]);
    }

    public function test_void_gcash_transaction(): void
    {
        $user = User::first();

        $createRes = $this->actingAs($user)->postJson('/api/gcash-transactions', [
            'transaction_type' => 'cash_in',
            'customer_phone' => '09170000002',
            'amount' => 500.00,
        ]);
        $createRes->assertStatus(201);
        $txnId = $createRes->json('transaction.gcash_transaction_id');

        $voidRes = $this->actingAs($user)->postJson("/api/gcash-transactions/{$txnId}/void", [
            'reason' => 'wrong_amount',
            'notes' => 'Test voiding transaction',
        ]);
        $voidRes->assertStatus(200);
        $this->assertEquals('voided', $voidRes->json('transaction.status'));
    }
}
