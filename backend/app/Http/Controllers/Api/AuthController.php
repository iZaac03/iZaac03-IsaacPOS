<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User login with email and password. Returns Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('store')->where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account is deactivated. Please contact your administrator.',
            ], 403);
        }

        $token = $user->createToken('pos_auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'store' => $user->store,
            ],
            'message' => 'Login successful',
        ]);
    }

    /**
     * Logout and revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('store');

        return response()->json([
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'store' => $user->store,
            ],
        ]);
    }

    /**
     * Verify manager/admin PIN for supervisor authorization (voids, high-value refunds, overrides).
     */
    public function verifyPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin_code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $storeId = $user->store_id;

        // Search for active manager or admin in the same store with matching PIN
        $manager = User::where('store_id', $storeId)
            ->whereIn('role', ['manager', 'admin'])
            ->where('is_active', true)
            ->where('pin_code', $validated['pin_code'])
            ->first();

        if (!$manager) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid Manager PIN code.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'approver' => [
                'user_id' => $manager->user_id,
                'name' => $manager->name,
                'role' => $manager->role,
            ],
            'message' => "Authorized by {$manager->name} ({$manager->role})",
        ]);
    }
}
