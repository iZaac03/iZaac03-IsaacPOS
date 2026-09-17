<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StoreController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/login-pin', [AuthController::class, 'loginWithPin']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Identity
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/verify-pin', [AuthController::class, 'verifyPin']);

    // Store Profile
    Route::get('/store', [StoreController::class, 'show']);
    Route::put('/store', [StoreController::class, 'update']);

    // Products & POS Scanning
    Route::get('/products/export/csv', [ProductController::class, 'exportCsv']);
    Route::post('/products/import/csv', [ProductController::class, 'importCsv']);
    Route::get('/products/scan', [ProductController::class, 'scan']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    Route::apiResource('products', ProductController::class);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);

    // Customers (including Senior/PWD ID records)
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);

    // Orders & POS Checkout
    Route::post('/orders/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/void', [OrderController::class, 'voidOrder']);

    // Refunds & Manager Overrides
    Route::get('/refunds', [RefundController::class, 'index']);
    Route::post('/refunds', [RefundController::class, 'store']);
    Route::post('/refunds/{id}/approve', [RefundController::class, 'approve']);

    // Stock Movement Audit Ledger
    Route::get('/stock-movements', [StockMovementController::class, 'index']);
    Route::post('/stock-movements/adjust', [StockMovementController::class, 'adjust']);

    // Suppliers & Purchase Orders
    Route::apiResource('suppliers', SupplierController::class);
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
    Route::put('/purchase-orders/{id}', [PurchaseOrderController::class, 'update']);
    Route::put('/purchase-orders/{id}/status', [PurchaseOrderController::class, 'updateStatus']);
    Route::post('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'receive']);

    // Attendance & Cashier Shift Time Logs
    Route::get('/time-logs/status', [\App\Http\Controllers\Api\TimeLogController::class, 'status']);
    Route::post('/time-logs/time-in', [\App\Http\Controllers\Api\TimeLogController::class, 'timeIn']);
    Route::post('/time-logs/time-out', [\App\Http\Controllers\Api\TimeLogController::class, 'timeOut']);
    Route::get('/time-logs', [\App\Http\Controllers\Api\TimeLogController::class, 'index']);

    // Cashier Stock Requests & Restock Approvals
    Route::get('/stock-requests', [\App\Http\Controllers\Api\StockRequestController::class, 'index']);
    Route::post('/stock-requests', [\App\Http\Controllers\Api\StockRequestController::class, 'store']);
    Route::put('/stock-requests/{id}/status', [\App\Http\Controllers\Api\StockRequestController::class, 'updateStatus']);
    Route::post('/stock-requests/{id}/convert-po', [\App\Http\Controllers\Api\StockRequestController::class, 'convertToPO']);

    // Analytics Dashboard & Cashier Audit
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);

    // GCash Cash In / Cash Out Services
    Route::get('/gcash-transactions/rates', [\App\Http\Controllers\Api\GcashTransactionController::class, 'rates']);
    Route::get('/gcash-transactions', [\App\Http\Controllers\Api\GcashTransactionController::class, 'index']);
    Route::post('/gcash-transactions', [\App\Http\Controllers\Api\GcashTransactionController::class, 'store']);
    Route::get('/gcash-transactions/{id}', [\App\Http\Controllers\Api\GcashTransactionController::class, 'show']);
    Route::post('/gcash-transactions/{id}/void', [\App\Http\Controllers\Api\GcashTransactionController::class, 'voidTransaction']);

    // User & Staff Management (Admin)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/terminate', [UserController::class, 'terminate']);
    Route::post('/users/{id}/reactivate', [UserController::class, 'reactivate']);
});

