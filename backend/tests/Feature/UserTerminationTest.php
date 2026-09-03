<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserTerminationTest extends TestCase
{
    public function test_admin_can_terminate_cashier_and_manager(): void
    {
        $store = Store::first();

        // Create an admin
        $admin = User::create([
            'store_id' => $store->store_id,
            'name' => 'Test Admin',
            'email' => 'test_admin_' . uniqid() . '@isaacpos.ph',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'pin_code' => '987654',
            'is_active' => true,
        ]);

        // Create a cashier with an active token
        $cashier = User::create([
            'store_id' => $store->store_id,
            'name' => 'Test Cashier',
            'email' => 'test_cashier_' . uniqid() . '@isaacpos.ph',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'pin_code' => '123123',
            'is_active' => true,
        ]);
        $cashier->createToken('cashier_token');
        $this->assertCount(1, $cashier->tokens);

        // 1. Admin terminates cashier
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/users/{$cashier->user_id}/terminate");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'is_active' => false,
        ]);

        $cashier->refresh();
        $this->assertFalse((bool)$cashier->is_active);
        $this->assertCount(0, $cashier->tokens); // tokens revoked

        // 2. Terminated cashier cannot log in
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $cashier->email,
            'password' => 'password123',
        ]);
        $loginResponse->assertStatus(403);

        // 3. Terminated cashier cannot log in with PIN
        $pinLoginResponse = $this->postJson('/api/auth/login-pin', [
            'pin_code' => '123123',
        ]);
        $pinLoginResponse->assertStatus(422);

        // 4. Admin can reactivate cashier
        $reactivateResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/users/{$cashier->user_id}/reactivate");

        $reactivateResponse->assertStatus(200);
        $cashier->refresh();
        $this->assertTrue((bool)$cashier->is_active);

        // Clean up
        $cashier->delete();
        $admin->delete();
    }

    public function test_admin_cannot_terminate_self_or_another_admin(): void
    {
        $store = Store::first();

        $admin1 = User::create([
            'store_id' => $store->store_id,
            'name' => 'Admin One',
            'email' => 'admin1_' . uniqid() . '@isaacpos.ph',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'pin_code' => '888888',
            'is_active' => true,
        ]);

        $admin2 = User::create([
            'store_id' => $store->store_id,
            'name' => 'Admin Two',
            'email' => 'admin2_' . uniqid() . '@isaacpos.ph',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'pin_code' => '777777',
            'is_active' => true,
        ]);

        // Attempt to self-terminate
        $selfTermResponse = $this->actingAs($admin1, 'sanctum')
            ->postJson("/api/users/{$admin1->user_id}/terminate");

        $selfTermResponse->assertStatus(422);
        $selfTermResponse->assertJsonFragment([
            'message' => 'You cannot terminate your own administrator account.',
        ]);

        // Attempt to terminate another admin
        $otherAdminResponse = $this->actingAs($admin1, 'sanctum')
            ->postJson("/api/users/{$admin2->user_id}/terminate");

        $otherAdminResponse->assertStatus(422);

        // Clean up
        $admin1->delete();
        $admin2->delete();
    }

    public function test_cashier_cannot_terminate_anyone(): void
    {
        $store = Store::first();

        $cashier1 = User::create([
            'store_id' => $store->store_id,
            'name' => 'Cashier 1',
            'email' => 'cashier1_' . uniqid() . '@isaacpos.ph',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'pin_code' => '555555',
            'is_active' => true,
        ]);

        $cashier2 = User::create([
            'store_id' => $store->store_id,
            'name' => 'Cashier 2',
            'email' => 'cashier2_' . uniqid() . '@isaacpos.ph',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'pin_code' => '444444',
            'is_active' => true,
        ]);

        $response = $this->actingAs($cashier1, 'sanctum')
            ->postJson("/api/users/{$cashier2->user_id}/terminate");

        $response->assertStatus(403);

        // Clean up
        $cashier1->delete();
        $cashier2->delete();
    }
}
