<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $suppliers = Supplier::withCount('purchaseOrders')
            ->where('store_id', $storeId)
            ->orderBy('name')
            ->get();

        return response()->json($suppliers);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'contact_person' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'phone' => 'required|string|max:50',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $supplier = Supplier::create(array_merge($validated, [
            'store_id' => $storeId,
            'is_active' => $validated['is_active'] ?? true,
        ]));

        return response()->json([
            'message' => 'Supplier created successfully',
            'supplier' => $supplier,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $supplier = Supplier::with(['purchaseOrders' => function ($q) {
            $q->latest()->take(5);
        }])
            ->where('store_id', $storeId)
            ->findOrFail($id);

        return response()->json($supplier);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $supplier = Supplier::where('store_id', $storeId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'contact_person' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'phone' => 'sometimes|required|string|max:50',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully',
            'supplier' => $supplier,
        ]);
    }
}
