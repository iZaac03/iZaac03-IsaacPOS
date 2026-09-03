<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Customer::where('store_id', $storeId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%")
                    ->orWhere('senior_pwd_id', 'LIKE', "%{$search}%");
            });
        }

        $customers = $query->orderBy('name')->take(50)->get();

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'senior_pwd_id' => 'nullable|string|max:100',
            'address' => 'nullable|string',
        ]);

        $customer = Customer::create(array_merge($validated, [
            'store_id' => $storeId,
            'loyalty_points' => 0,
            'is_active' => true,
        ]));

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer,
        ], 201);
    }
}
