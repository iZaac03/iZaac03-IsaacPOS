<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $store = Store::findOrFail($storeId);

        return response()->json($store);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json([
                'message' => 'Only Admins can update store settings.',
            ], 403);
        }

        $store = Store::findOrFail($user->store_id);

        $validated = $request->validate([
            'store_name' => 'sometimes|required|string|max:150',
            'phone' => 'sometimes|required|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'sometimes|required|string',
            'vat_tin' => 'sometimes|required|string|max:50',
            'receipt_header' => 'nullable|string',
            'receipt_footer' => 'nullable|string',
        ]);

        $store->update($validated);

        return response()->json([
            'message' => 'Store profile updated successfully',
            'store' => $store,
        ]);
    }
}
