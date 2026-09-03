<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Store;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Store
        $store = Store::create([
            'store_name' => 'KlaroPOS Flagship Superstore',
            'branch_code' => 'BGC-01',
            'address' => 'Ground Floor, High Street South, Bonifacio Global City, Taguig, Metro Manila',
            'phone' => '(02) 8888-5527',
            'email' => 'bgc.branch@klaropos.ph',
            'vat_tin' => '123-456-789-00000',
            'receipt_header' => 'KLAROPOS FLAGSHIP SUPERSTORE\nBIR PERMIT NO: FP-092026-0089\nBGC TAGUIG CITY, METRO MANILA',
            'receipt_footer' => 'Thank you for shopping at KlaroPOS!\nPlease keep this receipt for returns within 7 days.\nVisit us at www.klaropos.ph',
            'is_active' => true,
        ]);

        // 2. Users (Admin, Manager, Cashier)
        $admin = User::create([
            'store_id' => $store->store_id,
            'name' => 'Adiel Reyes (Admin)',
            'email' => 'admin@klaropos.ph',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'pin_code' => '999999',
            'phone' => '09171112233',
            'is_active' => true,
        ]);

        $manager = User::create([
            'store_id' => $store->store_id,
            'name' => 'Elena Gonzales (Manager)',
            'email' => 'manager@klaropos.ph',
            'password' => Hash::make('password123'),
            'role' => 'manager',
            'pin_code' => '123456',
            'phone' => '09182223344',
            'is_active' => true,
        ]);

        $cashier = User::create([
            'store_id' => $store->store_id,
            'name' => 'Paolo Mendoza (Cashier)',
            'email' => 'cashier@klaropos.ph',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'pin_code' => '112233',
            'phone' => '09193334455',
            'is_active' => true,
        ]);

        // 3. Categories
        $catGroceries = Category::create([
            'store_id' => $store->store_id,
            'name' => 'Groceries & Dry Goods',
            'slug' => 'groceries-dry-goods',
            'description' => 'Canned goods, noodles, condiments, sauces, and cooking essentials',
            'icon' => 'ShoppingBasket',
            'is_active' => true,
        ]);

        $catBeverages = Category::create([
            'store_id' => $store->store_id,
            'name' => 'Beverages & Drinks',
            'slug' => 'beverages-drinks',
            'description' => 'Cold drinks, juices, soft drinks, beers, coffee, and mineral water',
            'icon' => 'Coffee',
            'is_active' => true,
        ]);

        $catSnacks = Category::create([
            'store_id' => $store->store_id,
            'name' => 'Snacks & Confectionery',
            'slug' => 'snacks-confectionery',
            'description' => 'Chips, biscuits, crackers, chocolates, and treats',
            'icon' => 'Cookie',
            'is_active' => true,
        ]);

        $catPersonalCare = Category::create([
            'store_id' => $store->store_id,
            'name' => 'Personal Care & Hygiene',
            'slug' => 'personal-care-hygiene',
            'description' => 'Soaps, shampoos, toothpaste, toiletries, and skin care',
            'icon' => 'HeartPulse',
            'is_active' => true,
        ]);

        $catHousehold = Category::create([
            'store_id' => $store->store_id,
            'name' => 'Household & Cleaning',
            'slug' => 'household-cleaning',
            'description' => 'Detergents, fabric softeners, dishwashing liquids, and paper items',
            'icon' => 'Sparkles',
            'is_active' => true,
        ]);

        // 4. Products list
        $productsData = [
            [
                'category_id' => $catBeverages->category_id,
                'barcode' => '4800016054117',
                'sku' => 'BEV-SMB-001',
                'name' => 'San Miguel Pale Pilsen 330ml Can',
                'description' => 'Classic Filipino pale pilsen beer, perfectly brewed',
                'cost_price' => 42.00,
                'selling_price' => 55.00,
                'stock_quantity' => 120.00,
                'reorder_level' => 24.00,
                'unit' => 'can',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catBeverages->category_id,
                'barcode' => '8996001304212',
                'sku' => 'BEV-KOP-002',
                'name' => 'Kopiko 78C Coffee 240ml',
                'description' => 'Ready-to-drink roasted iced latte coffee',
                'cost_price' => 25.00,
                'selling_price' => 34.00,
                'stock_quantity' => 80.00,
                'reorder_level' => 20.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catBeverages->category_id,
                'barcode' => '4800016644202',
                'sku' => 'BEV-C2-003',
                'name' => 'C2 Green Tea Apple 500ml',
                'description' => 'Refreshing brewed green tea infused with natural apple flavor',
                'cost_price' => 22.00,
                'selling_price' => 30.00,
                'stock_quantity' => 65.00,
                'reorder_level' => 15.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catBeverages->category_id,
                'barcode' => '4801981112211',
                'sku' => 'BEV-WLK-004',
                'name' => 'Wilkins Pure Purified Water 500ml',
                'description' => 'Trusted pure distilled drinking water',
                'cost_price' => 14.00,
                'selling_price' => 20.00,
                'stock_quantity' => 150.00,
                'reorder_level' => 30.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catBeverages->category_id,
                'barcode' => '4800103112340',
                'sku' => 'BEV-SEL-005',
                'name' => 'Selecta Fortified Fresh Milk 1L',
                'description' => '100% pure fresh cow milk, 1-liter tetra pack',
                'cost_price' => 85.00,
                'selling_price' => 110.00,
                'stock_quantity' => 0.00,
                'reorder_level' => 10.00,
                'unit' => 'box',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4800016552118',
                'sku' => 'GRO-LM-001',
                'name' => 'Lucky Me! Pancit Canton Kalamansi 80g',
                'description' => 'All-time favorite instant stir-fried noodles with kalamansi flavor',
                'cost_price' => 13.50,
                'selling_price' => 18.00,
                'stock_quantity' => 200.00,
                'reorder_level' => 40.00,
                'unit' => 'pack',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4800016551104',
                'sku' => 'GRO-LM-002',
                'name' => 'Lucky Me! Instant Mami Chicken 55g',
                'description' => 'Comforting chicken noodle soup with flavorful broth',
                'cost_price' => 11.00,
                'selling_price' => 15.00,
                'stock_quantity' => 180.00,
                'reorder_level' => 35.00,
                'unit' => 'pack',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4801010111223',
                'sku' => 'GRO-DP-003',
                'name' => 'Datu Puti Soy Sauce 1L',
                'description' => 'Traditional fermented Philippine soy sauce bottle',
                'cost_price' => 48.00,
                'selling_price' => 62.00,
                'stock_quantity' => 50.00,
                'reorder_level' => 12.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4800119112234',
                'sku' => 'GRO-SS-004',
                'name' => 'Silver Swan Cane Vinegar 1L',
                'description' => 'Finest naturally fermented cane vinegar bottle',
                'cost_price' => 42.00,
                'selling_price' => 54.00,
                'stock_quantity' => 45.00,
                'reorder_level' => 12.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4800016112245',
                'sku' => 'GRO-PFC-005',
                'name' => 'Purefoods Corned Beef 210g',
                'description' => 'Premium long-strand corned beef can',
                'cost_price' => 82.00,
                'selling_price' => 105.00,
                'stock_quantity' => 40.00,
                'reorder_level' => 10.00,
                'unit' => 'can',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4800092112256',
                'sku' => 'GRO-CEN-006',
                'name' => 'Century Tuna Flakes in Oil 180g',
                'description' => 'Rich in Omega-3 DHA tuna flakes in soybean oil',
                'cost_price' => 40.00,
                'selling_price' => 52.00,
                'stock_quantity' => 60.00,
                'reorder_level' => 15.00,
                'unit' => 'can',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catGroceries->category_id,
                'barcode' => '4800361112333',
                'sku' => 'GRO-BBD-007',
                'name' => 'Bear Brand Fortified Powdered Milk 900g',
                'description' => 'Nutritious powdered milk with iron, zinc, and Vitamin C',
                'cost_price' => 280.00,
                'selling_price' => 350.00,
                'stock_quantity' => 5.00,
                'reorder_level' => 12.00,
                'unit' => 'pack',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catSnacks->category_id,
                'barcode' => '4800016611211',
                'sku' => 'SNK-PIA-001',
                'name' => 'Jack n Jill Piattos Cheese 85g',
                'description' => 'Hexagonal potato crisps seasoned with rich cheese',
                'cost_price' => 31.00,
                'selling_price' => 42.00,
                'stock_quantity' => 70.00,
                'reorder_level' => 15.00,
                'unit' => 'pack',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catSnacks->category_id,
                'barcode' => '4800016611228',
                'sku' => 'SNK-NOV-002',
                'name' => 'Jack n Jill Nova Country Cheddar 78g',
                'description' => 'Multigrain healthy snack chips with cheese flavor',
                'cost_price' => 32.00,
                'selling_price' => 43.00,
                'stock_quantity' => 55.00,
                'reorder_level' => 15.00,
                'unit' => 'pack',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catSnacks->category_id,
                'barcode' => '4800194112267',
                'sku' => 'SNK-OIS-003',
                'name' => 'Oishi Prawn Crackers Spicy 60g',
                'description' => 'Crunchy seafood snack with a savory spicy kick',
                'cost_price' => 18.00,
                'selling_price' => 25.00,
                'stock_quantity' => 90.00,
                'reorder_level' => 20.00,
                'unit' => 'pack',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catPersonalCare->category_id,
                'barcode' => '4902430112278',
                'sku' => 'PER-SAF-001',
                'name' => 'Safeguard Pure White Bar Soap 130g',
                'description' => 'Antibacterial family germ shield protection soap',
                'cost_price' => 48.00,
                'selling_price' => 62.00,
                'stock_quantity' => 85.00,
                'reorder_level' => 20.00,
                'unit' => 'bar',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catPersonalCare->category_id,
                'barcode' => '8850006112289',
                'sku' => 'PER-COL-002',
                'name' => 'Colgate Total Clean Mint Toothpaste 150g',
                'description' => '12-hour antibacterial defense and cavity protection',
                'cost_price' => 110.00,
                'selling_price' => 145.00,
                'stock_quantity' => 35.00,
                'reorder_level' => 10.00,
                'unit' => 'tube',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catPersonalCare->category_id,
                'barcode' => '8850006112296',
                'sku' => 'PER-PAL-003',
                'name' => 'Palmolive Naturals Shampoo Intensive Moisture 180ml',
                'description' => 'Infused with coco cream and milk protein extract',
                'cost_price' => 88.00,
                'selling_price' => 115.00,
                'stock_quantity' => 40.00,
                'reorder_level' => 10.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catHousehold->category_id,
                'barcode' => '4800888112302',
                'sku' => 'HOU-SRF-001',
                'name' => 'Surf Powder Detergent Sun Fresh 1.1kg',
                'description' => 'Brilliant cleaning powder with lasting freshness bursts',
                'cost_price' => 125.00,
                'selling_price' => 160.00,
                'stock_quantity' => 30.00,
                'reorder_level' => 8.00,
                'unit' => 'pouch',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catHousehold->category_id,
                'barcode' => '4902430112319',
                'sku' => 'HOU-DWN-002',
                'name' => 'Downy Fabric Conditioner Sunrise Fresh 720ml',
                'description' => 'Concentrated softening fabric conditioner refill',
                'cost_price' => 140.00,
                'selling_price' => 185.00,
                'stock_quantity' => 25.00,
                'reorder_level' => 8.00,
                'unit' => 'pouch',
                'is_vat_exempt' => false,
            ],
            [
                'category_id' => $catHousehold->category_id,
                'barcode' => '4902430112326',
                'sku' => 'HOU-JOY-003',
                'name' => 'Joy Dishwashing Liquid Lemon 790ml',
                'description' => 'Zero grease dishwashing liquid with fresh lemon power',
                'cost_price' => 115.00,
                'selling_price' => 152.00,
                'stock_quantity' => 8.00, // LOW STOCK! (8 <= 15)
                'reorder_level' => 15.00,
                'unit' => 'bottle',
                'is_vat_exempt' => false,
            ],
        ];

        $createdProducts = [];
        foreach ($productsData as $pData) {
            $prod = Product::create(array_merge($pData, [
                'store_id' => $store->store_id,
                'is_active' => true,
            ]));
            $createdProducts[$prod->sku] = $prod;

            // Log initial stock movement
            if ($prod->stock_quantity > 0) {
                StockMovement::create([
                    'product_id' => $prod->product_id,
                    'store_id' => $store->store_id,
                    'user_id' => $admin->user_id,
                    'type' => 'initial',
                    'quantity_change' => $prod->stock_quantity,
                    'previous_quantity' => 0.00,
                    'new_quantity' => $prod->stock_quantity,
                    'reference_type' => 'initial_inventory',
                    'reference_id' => null,
                    'reason' => 'Store opening opening inventory',
                    'notes' => 'Initial stock count during system onboarding',
                ]);
            }
        }

        // 5. Customers
        $custRegular = Customer::create([
            'store_id' => $store->store_id,
            'name' => 'Maria Santos',
            'phone' => '09175551234',
            'email' => 'maria.santos@gmail.com',
            'address' => 'Unit 12B Two Serendra, Taguig',
            'loyalty_points' => 120,
            'is_active' => true,
        ]);

        $custSenior = Customer::create([
            'store_id' => $store->store_id,
            'name' => 'Juan Dela Cruz (Senior)',
            'phone' => '09187778899',
            'email' => 'juan.delacruz@yahoo.com',
            'senior_pwd_id' => 'OSCA-NCR-2018-8841',
            'address' => '142 Rizal Street, Taguig City',
            'loyalty_points' => 340,
            'is_active' => true,
        ]);

        $custPWD = Customer::create([
            'store_id' => $store->store_id,
            'name' => 'Ana Reyes (PWD)',
            'phone' => '09224445566',
            'email' => 'ana.reyes@gmail.com',
            'senior_pwd_id' => 'PWD-TAG-2021-4412',
            'address' => 'Block 5 Lot 12 BGC Heights, Taguig',
            'loyalty_points' => 95,
            'is_active' => true,
        ]);

        // 6. Suppliers
        $supURC = Supplier::create([
            'store_id' => $store->store_id,
            'name' => 'Universal Robina Corporation (URC)',
            'contact_person' => 'Roberto Tan',
            'email' => 'sales@urc.com.ph',
            'phone' => '(02) 8633-7631',
            'address' => 'Tera Tower, Bridgetowne, E. Rodriguez Jr. Ave, Quezon City',
            'tax_id' => '000-128-456-00000',
            'is_active' => true,
        ]);

        $supMonde = Supplier::create([
            'store_id' => $store->store_id,
            'name' => 'Monde Nissin Corporation',
            'contact_person' => 'Liza Gomez',
            'email' => 'orders@mondenissin.com',
            'phone' => '(02) 8759-7500',
            'address' => 'Felix Reyes St., Balibago, Santa Rosa, Laguna',
            'tax_id' => '000-245-891-00000',
            'is_active' => true,
        ]);

        $supSanMiguel = Supplier::create([
            'store_id' => $store->store_id,
            'name' => 'San Miguel Pure Foods & Beverage',
            'contact_person' => 'Carlos Lim',
            'email' => 'b2b.orders@sanmiguel.com.ph',
            'phone' => '(02) 8632-3000',
            'address' => '40 San Miguel Ave, Ortigas Center, Mandaluyong City',
            'tax_id' => '000-101-789-00000',
            'is_active' => true,
        ]);

        // 7. Sample Purchase Order with URC (Sent status)
        $po1 = PurchaseOrder::create([
            'po_number' => 'PO-20260901-0001',
            'store_id' => $store->store_id,
            'supplier_id' => $supURC->supplier_id,
            'user_id' => $manager->user_id,
            'status' => 'sent',
            'total_amount' => 5460.00,
            'expected_delivery_date' => now()->addDays(2),
            'notes' => 'Scheduled restock of C2 and Jack n Jill snack lines',
        ]);

        PurchaseOrderItem::create([
            'po_id' => $po1->po_id,
            'product_id' => $createdProducts['BEV-C2-003']->product_id,
            'quantity_ordered' => 100.00,
            'quantity_received' => 0.00,
            'unit_cost' => 22.00,
            'total_cost' => 2200.00,
        ]);

        PurchaseOrderItem::create([
            'po_id' => $po1->po_id,
            'product_id' => $createdProducts['SNK-PIA-001']->product_id,
            'quantity_ordered' => 60.00,
            'quantity_received' => 0.00,
            'unit_cost' => 31.00,
            'total_cost' => 1860.00,
        ]);

        PurchaseOrderItem::create([
            'po_id' => $po1->po_id,
            'product_id' => $createdProducts['SNK-NOV-002']->product_id,
            'quantity_ordered' => 45.00,
            'quantity_received' => 0.00,
            'unit_cost' => 32.00,
            'total_cost' => 1400.00,
        ]);

        // 8. Sample Completed POS Orders demonstrating Philippine Retail Math
        // Order 1: Regular Cash Sale
        // Item: 2x Kopiko 78C (₱68.00) + 1x Purefoods Corned Beef (₱105.00) = ₱173.00
        // Vatable = 173 / 1.12 = 154.46, VAT = 18.54
        $order1 = Order::create([
            'order_number' => 'ORD-20260903-0001',
            'store_id' => $store->store_id,
            'user_id' => $cashier->user_id,
            'customer_id' => $custRegular->customer_id,
            'subtotal' => 173.00,
            'vatable_sales' => 154.46,
            'vat_amount' => 18.54,
            'vat_exempt_sales' => 0.00,
            'discount_type' => 'none',
            'discount_rate' => 0.00,
            'discount_amount' => 0.00,
            'total_amount' => 173.00,
            'amount_paid' => 200.00,
            'change_amount' => 27.00,
            'payment_status' => 'paid',
            'order_status' => 'completed',
            'notes' => 'Customer paid in cash (₱200 bill)',
        ]);

        OrderItem::create([
            'order_id' => $order1->order_id,
            'product_id' => $createdProducts['BEV-KOP-002']->product_id,
            'product_name' => $createdProducts['BEV-KOP-002']->name,
            'quantity' => 2.00,
            'unit_cost' => 25.00,
            'unit_price' => 34.00,
            'discount_amount' => 0.00,
            'tax_amount' => 7.29,
            'subtotal' => 68.00,
            'total' => 68.00,
        ]);

        OrderItem::create([
            'order_id' => $order1->order_id,
            'product_id' => $createdProducts['GRO-PFC-005']->product_id,
            'product_name' => $createdProducts['GRO-PFC-005']->name,
            'quantity' => 1.00,
            'unit_cost' => 82.00,
            'unit_price' => 105.00,
            'discount_amount' => 0.00,
            'tax_amount' => 11.25,
            'subtotal' => 105.00,
            'total' => 105.00,
        ]);

        Payment::create([
            'order_id' => $order1->order_id,
            'store_id' => $store->store_id,
            'payment_method' => 'cash',
            'amount' => 173.00,
            'tendered_amount' => 200.00,
            'change_amount' => 27.00,
            'reference_no' => null,
            'status' => 'completed',
            'notes' => 'Cash tender',
        ]);

        // Order 2: Split Payment (GCash + Cash)
        // Item: 2x Colgate Total Toothpaste (₱290.00) + 1x Downy (₱185.00) = ₱475.00
        // Split: ₱300.00 GCash + ₱175.00 Cash
        $order2 = Order::create([
            'order_number' => 'ORD-20260903-0002',
            'store_id' => $store->store_id,
            'user_id' => $cashier->user_id,
            'customer_id' => null,
            'subtotal' => 475.00,
            'vatable_sales' => 424.11,
            'vat_amount' => 50.89,
            'vat_exempt_sales' => 0.00,
            'discount_type' => 'none',
            'discount_rate' => 0.00,
            'discount_amount' => 0.00,
            'total_amount' => 475.00,
            'amount_paid' => 475.00,
            'change_amount' => 0.00,
            'payment_status' => 'paid',
            'order_status' => 'completed',
            'notes' => 'Split payment GCash and Cash',
        ]);

        OrderItem::create([
            'order_id' => $order2->order_id,
            'product_id' => $createdProducts['PER-COL-002']->product_id,
            'product_name' => $createdProducts['PER-COL-002']->name,
            'quantity' => 2.00,
            'unit_cost' => 110.00,
            'unit_price' => 145.00,
            'discount_amount' => 0.00,
            'tax_amount' => 31.07,
            'subtotal' => 290.00,
            'total' => 290.00,
        ]);

        OrderItem::create([
            'order_id' => $order2->order_id,
            'product_id' => $createdProducts['HOU-DWN-002']->product_id,
            'product_name' => $createdProducts['HOU-DWN-002']->name,
            'quantity' => 1.00,
            'unit_cost' => 140.00,
            'unit_price' => 185.00,
            'discount_amount' => 0.00,
            'tax_amount' => 19.82,
            'subtotal' => 185.00,
            'total' => 185.00,
        ]);

        Payment::create([
            'order_id' => $order2->order_id,
            'store_id' => $store->store_id,
            'payment_method' => 'gcash',
            'amount' => 300.00,
            'tendered_amount' => 300.00,
            'change_amount' => 0.00,
            'reference_no' => 'GC-901847192',
            'status' => 'completed',
            'notes' => 'GCash transfer to merchant QR',
        ]);

        Payment::create([
            'order_id' => $order2->order_id,
            'store_id' => $store->store_id,
            'payment_method' => 'cash',
            'amount' => 175.00,
            'tendered_amount' => 200.00,
            'change_amount' => 25.00,
            'reference_no' => null,
            'status' => 'completed',
            'notes' => 'Cash tender remainder',
        ]);

        // Order 3: Philippine Senior Citizen Discount (RA 9994 compliance)
        // Subtotal gross: 1x Safeguard (₱62) + 2x Century Tuna (₱104) = ₱166.00
        // Net of VAT (Vatable / 1.12) = 166.00 / 1.12 = 148.21
        // 20% Senior Citizen discount = 148.21 * 0.20 = 29.64
        // Final Payable = 148.21 - 29.64 = 118.57
        // VAT Exempt Sales = 118.57, VAT Amount = 0.00
        $order3 = Order::create([
            'order_number' => 'ORD-20260903-0003',
            'store_id' => $store->store_id,
            'user_id' => $cashier->user_id,
            'customer_id' => $custSenior->customer_id,
            'subtotal' => 166.00,
            'vatable_sales' => 0.00,
            'vat_amount' => 0.00,
            'vat_exempt_sales' => 118.57,
            'discount_type' => 'senior_pwd',
            'discount_rate' => 20.00,
            'discount_amount' => 47.43, // 166 - 118.57 (VAT exemption 17.79 + 20% discount 29.64)
            'total_amount' => 118.57,
            'amount_paid' => 120.00,
            'change_amount' => 1.43,
            'payment_status' => 'paid',
            'order_status' => 'completed',
            'notes' => 'Senior Citizen discount applied (OSCA-NCR-2018-8841)',
        ]);

        OrderItem::create([
            'order_id' => $order3->order_id,
            'product_id' => $createdProducts['PER-SAF-001']->product_id,
            'product_name' => $createdProducts['PER-SAF-001']->name,
            'quantity' => 1.00,
            'unit_cost' => 48.00,
            'unit_price' => 62.00,
            'discount_amount' => 17.71,
            'tax_amount' => 0.00,
            'subtotal' => 62.00,
            'total' => 44.29,
        ]);

        OrderItem::create([
            'order_id' => $order3->order_id,
            'product_id' => $createdProducts['GRO-CEN-006']->product_id,
            'product_name' => $createdProducts['GRO-CEN-006']->name,
            'quantity' => 2.00,
            'unit_cost' => 40.00,
            'unit_price' => 52.00,
            'discount_amount' => 29.72,
            'tax_amount' => 0.00,
            'subtotal' => 104.00,
            'total' => 74.28,
        ]);

        Payment::create([
            'order_id' => $order3->order_id,
            'store_id' => $store->store_id,
            'payment_method' => 'cash',
            'amount' => 118.57,
            'tendered_amount' => 120.00,
            'change_amount' => 1.43,
            'reference_no' => null,
            'status' => 'completed',
            'notes' => 'Cash payment with Senior Citizen OSCA ID',
        ]);
    }
}
