<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    /**
     * List products with search, category filtering, stock alerts, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Product::with('category')
            ->where('store_id', $storeId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('barcode', 'LIKE', "%{$search}%")
                    ->orWhere('sku', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->input('stock_status') === 'low_stock') {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        } elseif ($request->input('stock_status') === 'out_of_stock') {
            $query->where('stock_quantity', '<=', 0);
        }

        $perPage = $request->input('per_page', 20);
        $products = $query->orderBy('name')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Fast barcode / SKU scan lookup for the POS Touch Terminal.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $storeId = $request->user()->store_id;
        $code = trim($request->input('code'));

        $product = Product::with('category')
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                    ->orWhere('sku', $code);
            })
            ->first();

        if (!$product) {
            return response()->json([
                'found' => false,
                'message' => "No product found with barcode or SKU '{$code}'.",
            ], 404);
        }

        return response()->json([
            'found' => true,
            'product' => $product,
        ]);
    }

    /**
     * Get list of stock alerts (items at or below reorder_level).
     */
    public function lowStock(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $lowStockItems = Product::with('category')
            ->where('store_id', $storeId)
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->orderBy('stock_quantity', 'asc')
            ->get();

        return response()->json([
            'count' => $lowStockItems->count(),
            'items' => $lowStockItems,
        ]);
    }

    /**
     * Create a new product and log initial inventory if stock > 0.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $validated = $request->validate([
            'category_id' => 'required|exists:tbl_categories,category_id',
            'barcode' => 'required|string|max:100',
            'sku' => 'required|string|max:100|unique:tbl_products,sku,NULL,product_id,store_id,' . $storeId,
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'is_vat_exempt' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $product = Product::create(array_merge($validated, [
            'store_id' => $storeId,
            'is_vat_exempt' => $validated['is_vat_exempt'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
        ]));

        if ($product->stock_quantity > 0) {
            StockMovement::create([
                'product_id' => $product->product_id,
                'store_id' => $storeId,
                'user_id' => $user->user_id,
                'type' => 'initial',
                'quantity_change' => $product->stock_quantity,
                'previous_quantity' => 0.00,
                'new_quantity' => $product->stock_quantity,
                'reference_type' => 'manual_creation',
                'reference_id' => $product->product_id,
                'reason' => 'Initial stock on product creation',
                'notes' => 'Product registered via inventory management',
            ]);
        }

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product->load('category'),
        ], 201);
    }

    /**
     * Show single product details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $product = Product::with(['category', 'stockMovements' => function ($q) {
            $q->latest()->take(10);
        }])
            ->where('store_id', $storeId)
            ->findOrFail($id);

        return response()->json($product);
    }

    /**
     * Update product details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $product = Product::where('store_id', $storeId)->findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:tbl_categories,category_id',
            'barcode' => 'sometimes|required|string|max:100',
            'sku' => "sometimes|required|string|max:100|unique:tbl_products,sku,{$id},product_id,store_id,{$storeId}",
            'name' => 'sometimes|required|string|max:200',
            'description' => 'nullable|string',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0',
            'reorder_level' => 'sometimes|required|numeric|min:0',
            'unit' => 'sometimes|required|string|max:20',
            'is_vat_exempt' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->load('category'),
        ]);
    }

    /**
     * Soft delete product.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $product = Product::where('store_id', $storeId)->findOrFail($id);

        $product->delete();

        return response()->json([
            'message' => "Product '{$product->name}' was deleted successfully.",
        ]);
    }

    /**
     * Export products to CSV format.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $storeId = $request->user()->store_id;
        $products = Product::with('category')->where('store_id', $storeId)->orderBy('name')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="isaacpos_inventory_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($products) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'SKU',
                'Barcode',
                'Product Name',
                'Category',
                'Cost Price',
                'Selling Price',
                'Stock Quantity',
                'Reorder Level',
                'Unit',
                'Status',
            ]);

            foreach ($products as $p) {
                fputcsv($handle, [
                    $p->sku,
                    $p->barcode,
                    $p->name,
                    $p->category ? $p->category->name : '',
                    $p->cost_price,
                    $p->selling_price,
                    $p->stock_quantity,
                    $p->reorder_level,
                    $p->unit,
                    $p->is_active ? 'Active' : 'Inactive',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Bulk import products from CSV.
     */
    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $user = $request->user();
        $storeId = $user->store_id;
        $file = $request->file('file');

        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 7) {
                $skipped++;
                continue;
            }

            $sku = trim($row[0]);
            $barcode = trim($row[1]);
            $name = trim($row[2]);
            $costPrice = (float)($row[4] ?? 0);
            $sellingPrice = (float)($row[5] ?? 0);
            $stockQty = (float)($row[6] ?? 0);
            $reorder = (float)($row[7] ?? 10);
            $unit = trim($row[8] ?? 'pcs') ?: 'pcs';

            if (empty($sku) || empty($name)) {
                $skipped++;
                continue;
            }

            $product = Product::updateOrCreate(
                ['store_id' => $storeId, 'sku' => $sku],
                [
                    'category_id' => 1, // Fallback to primary category
                    'barcode' => $barcode ?: $sku,
                    'name' => $name,
                    'cost_price' => $costPrice,
                    'selling_price' => $sellingPrice,
                    'stock_quantity' => $stockQty,
                    'reorder_level' => $reorder,
                    'unit' => $unit,
                    'is_active' => true,
                ]
            );

            $imported++;
        }

        fclose($handle);

        return response()->json([
            'message' => "Bulk import completed. {$imported} products processed, {$skipped} skipped.",
            'imported_count' => $imported,
            'skipped_count' => $skipped,
        ]);
    }
}
