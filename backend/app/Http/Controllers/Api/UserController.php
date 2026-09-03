<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $users = User::where('store_id', $storeId)
            ->select('user_id', 'store_id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:tbl_users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,manager,cashier',
            'pin_code' => 'nullable|string|size:6',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $user = User::create([
            'store_id' => $storeId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'pin_code' => $validated['pin_code'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $user = User::where('store_id', $storeId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'email' => "sometimes|required|email|max:150|unique:tbl_users,email,{$id},user_id",
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|required|in:admin,manager,cashier',
            'pin_code' => 'nullable|string|size:6',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }
}
