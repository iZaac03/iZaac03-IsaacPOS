<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class StockMovementController extends Controller
{
    /**
     * Complete stock audit log / movements ledger.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = StockMovement::with(['product', 'user'])
            ->where('store_id', $storeId);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $perPage = $request->input('per_page', 25);
        $movements = $query->latest()->paginate($perPage);

        return response()->json($movements);
    }

    /**
     * Manual stock adjustment (requires Manager / Admin permission).
     */
    public function adjust(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isManager()) {
            return response()->json([
                'message' => 'Only Managers and Admins can perform manual stock adjustments.',
            ], 403);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:tbl_products,product_id',
            'new_quantity' => 'required|numeric|min:0',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        $storeId = $user->store_id;

        try {
            $movement = DB::transaction(function () use ($validated, $user, $storeId) {
                $product = Product::where('product_id', $validated['product_id'])
                    ->where('store_id', $storeId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $previousQty = (float)$product->stock_quantity;
                $newQty = (float)$validated['new_quantity'];
                $difference = round($newQty - $previousQty, 2);

                if ($difference == 0) {
                    throw new Exception('New quantity is the same as current stock quantity. No adjustment needed.');
                }

                $product->stock_quantity = $newQty;
                $product->save();

                return StockMovement::create([
                    'product_id' => $product->product_id,
                    'store_id' => $storeId,
                    'user_id' => $user->user_id,
                    'type' => 'adjustment',
                    'quantity_change' => $difference,
                    'previous_quantity' => $previousQty,
                    'new_quantity' => $newQty,
                    'reference_type' => 'manual_adjustment',
                    'reference_id' => null,
                    'reason' => $validated['reason'],
                    'notes' => $validated['notes'] ?? null,
                ]);
            });

            return response()->json([
                'message' => 'Stock quantity adjusted successfully and logged to audit trail.',
                'movement' => $movement->load('product'),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
