<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class TimeLogAndPoAlterTest extends TestCase
{
    use DatabaseTransactions;

    protected Store $store;
    protected User $admin;
    protected User $cashier;
    protected Supplier $supplier;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::first() ?? Store::create([
            'store_name' => 'Daumar Grocery Store',
            'branch_code' => 'MAIN-' . uniqid(),
            'phone' => '09123456789',
            'address' => 'Poblacion, Ward II, Minglanilla, Cebu',
            'vat_tin' => '123-456-789-000',
        ]);

        $this->admin = User::where('role', 'admin')->first() ?? User::create([
            'store_id' => $this->store->store_id,
            'name' => 'Isaac Admin',
            'email' => 'admin_' . uniqid() . '@daumar.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->cashier = User::create([
            'store_id' => $this->store->store_id,
            'name' => 'Maria Cashier ' . uniqid(),
            'email' => 'cashier_' . uniqid() . '@daumar.com',
            'password' => bcrypt('password123'),
            'role' => 'cashier',
        ]);

        $this->supplier = Supplier::first() ?? Supplier::create([
            'store_id' => $this->store->store_id,
            'name' => 'Universal Robina Corp',
            'contact_person' => 'Juan Dela Cruz',
            'phone' => '09987654321',
        ]);

        $this->category = Category::first() ?? Category::create([
            'store_id' => $this->store->store_id,
            'name' => 'Household & Cleaning',
            'slug' => 'household-cleaning-' . uniqid(),
        ]);
    }

    public function test_cashier_can_time_in_and_time_out(): void
    {
        // 1. Initially not timed in
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/time-logs/status');

        $response->assertStatus(200)
            ->assertJson([
                'is_timed_in' => false,
                'current_log' => null,
            ]);

        // 2. Time In
        $inResponse = $this->actingAs($this->cashier)
            ->postJson('/api/time-logs/time-in', [
                'notes' => 'Opening float: P2,000 in register 1',
            ]);

        $inResponse->assertStatus(201)
            ->assertJsonFragment([
                'status' => 'timed_in',
            ]);

        $this->assertDatabaseHas('tbl_time_logs', [
            'user_id' => $this->cashier->user_id,
            'status' => 'timed_in',
        ]);

        // 3. Status is now timed in
        $statusRes = $this->actingAs($this->cashier)
            ->getJson('/api/time-logs/status');

        $statusRes->assertStatus(200)
            ->assertJson([
                'is_timed_in' => true,
            ]);

        // 4. Duplicate Time In returns existing
        $dupRes = $this->actingAs($this->cashier)
            ->postJson('/api/time-logs/time-in');

        $dupRes->assertStatus(200)
            ->assertJsonFragment([
                'message' => 'You are already clocked in.',
            ]);

        // 5. Time Out
        $outResponse = $this->actingAs($this->cashier)
            ->postJson('/api/time-logs/time-out', [
                'notes' => 'End shift clean handover',
            ]);

        $outResponse->assertStatus(200)
            ->assertJsonFragment([
                'status' => 'timed_out',
            ]);

        $this->assertDatabaseHas('tbl_time_logs', [
            'user_id' => $this->cashier->user_id,
            'status' => 'timed_out',
        ]);

        // 6. Status is now not timed in
        $finalStatus = $this->actingAs($this->cashier)
            ->getJson('/api/time-logs/status');

        $finalStatus->assertStatus(200)
            ->assertJson([
                'is_timed_in' => false,
            ]);
    }

    public function test_low_stock_products_include_active_po_and_po_can_be_altered(): void
    {
        $product = Product::create([
            'store_id' => $this->store->store_id,
            'category_id' => $this->category->category_id,
            'sku' => 'HOU-DWN-' . uniqid(),
            'barcode' => 'BC-' . uniqid(),
            'name' => 'Downy Fabric Conditioner Sunrise Fresh 720ml',
            'cost_price' => 150.00,
            'selling_price' => 185.00,
            'stock_quantity' => 6,
            'reorder_level' => 8,
            'unit' => 'pouch',
        ]);

        // 1. Without PO, active_po is null
        $resBefore = $this->actingAs($this->admin)
            ->getJson('/api/products/low-stock');

        $resBefore->assertStatus(200);
        $beforeItems = collect($resBefore->json('items'));
        $targetBefore = $beforeItems->firstWhere('product_id', $product->product_id);
        $this->assertNotNull($targetBefore);
        $this->assertNull($targetBefore['active_po']);

        // 2. Create PO
        $poNumber = 'PO-' . uniqid();
        $po = PurchaseOrder::create([
            'po_number' => $poNumber,
            'store_id' => $this->store->store_id,
            'supplier_id' => $this->supplier->supplier_id,
            'user_id' => $this->admin->user_id,
            'status' => 'draft',
            'total_amount' => 3000.00,
            'notes' => 'Weekly grocery restock',
        ]);

        $poItem = PurchaseOrderItem::create([
            'po_id' => $po->po_id,
            'product_id' => $product->product_id,
            'quantity_ordered' => 20,
            'quantity_received' => 0,
            'unit_cost' => 150.00,
            'total_cost' => 3000.00,
        ]);

        // 3. Now low-stock returns active_po
        $resAfter = $this->actingAs($this->admin)
            ->getJson('/api/products/low-stock');

        $resAfter->assertStatus(200);
        $afterItems = collect($resAfter->json('items'));
        $targetAfter = $afterItems->firstWhere('product_id', $product->product_id);
        $this->assertNotNull($targetAfter);
        $activePo = $targetAfter['active_po'];
        $this->assertNotNull($activePo);
        $this->assertEquals($poNumber, $activePo['po_number']);
        $this->assertEquals(20, $activePo['quantity_ordered']);
        $this->assertEquals('draft', $activePo['status']);

        // 4. Alter PO via PUT /purchase-orders/{id}
        $alterRes = $this->actingAs($this->admin)
            ->putJson("/api/purchase-orders/{$po->po_id}", [
                'notes' => 'Altered order to 35 pouches',
                'items' => [
                    [
                        'po_item_id' => $poItem->po_item_id,
                        'product_id' => $product->product_id,
                        'quantity_ordered' => 35,
                        'unit_cost' => 148.00,
                    ],
                ],
            ]);

        $alterRes->assertStatus(200)
            ->assertJsonFragment([
                'message' => 'Purchase order altered successfully.',
            ]);

        $this->assertDatabaseHas('tbl_purchase_order_items', [
            'po_item_id' => $poItem->po_item_id,
            'quantity_ordered' => 35,
            'unit_cost' => 148.00,
            'total_cost' => 5180.00,
        ]);

        $this->assertDatabaseHas('tbl_purchase_orders', [
            'po_id' => $po->po_id,
            'total_amount' => 5180.00,
            'notes' => 'Altered order to 35 pouches',
        ]);
    }
}
