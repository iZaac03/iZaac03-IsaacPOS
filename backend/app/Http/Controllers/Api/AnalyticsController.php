<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Refund;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Comprehensive analytics and reporting dashboard.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $now = Carbon::now();

        // 1. KPI Summaries
        $todayOrders = Order::where('store_id', $storeId)
            ->whereDate('created_at', $now->toDateString())
            ->where('order_status', 'completed');

        $salesToday = (float)$todayOrders->sum('total_amount');
        $ordersCountToday = $todayOrders->count();

        $weekOrders = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])
            ->where('order_status', 'completed');

        $salesThisWeek = (float)$weekOrders->sum('total_amount');

        $monthOrders = Order::where('store_id', $storeId)
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->where('order_status', 'completed');

        $salesThisMonth = (float)$monthOrders->sum('total_amount');
        $ordersCountMonth = $monthOrders->count();

        $lowStockCount = Product::where('store_id', $storeId)
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->count();

        $totalRefundsToday = (float)Refund::where('store_id', $storeId)
            ->whereDate('created_at', $now->toDateString())
            ->whereIn('status', ['approved', 'completed'])
            ->sum('total_amount');

        // 2. Daily Revenue Trend (Last 7 Days) for Chart.js
        $revenueTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->toDateString();
            $label = $now->copy()->subDays($i)->format('M d (D)');

            $dailyTotal = (float)Order::where('store_id', $storeId)
                ->whereDate('created_at', $date)
                ->where('order_status', 'completed')
                ->sum('total_amount');

            $revenueTrend[] = [
                'date' => $date,
                'label' => $label,
                'total' => $dailyTotal,
            ];
        }

        // 3. Payment Methods Breakdown
        $paymentsByMethod = Payment::where('store_id', $storeId)
            ->where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        // 4. Top 5 Best Selling Products
        $topProducts = OrderItem::whereHas('order', function ($q) use ($storeId) {
            $q->where('store_id', $storeId)->where('order_status', 'completed');
        })
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(total) as total_revenue'))
            ->groupBy('product_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // 5. Cashier Shift Audit Table
        $cashiers = User::where('store_id', $storeId)
            ->where('role', 'cashier')
            ->get();

        $cashierAudit = [];
        foreach ($cashiers as $c) {
            $cOrders = Order::where('store_id', $storeId)
                ->where('user_id', $c->user_id)
                ->whereDate('created_at', $now->toDateString())
                ->where('order_status', 'completed');

            $cRefunds = Refund::where('store_id', $storeId)
                ->where('user_id', $c->user_id)
                ->whereDate('created_at', $now->toDateString())
                ->where('status', 'completed');

            $cashierAudit[] = [
                'cashier_id' => $c->user_id,
                'name' => $c->name,
                'email' => $c->email,
                'transactions_count' => $cOrders->count(),
                'total_sales' => (float)$cOrders->sum('total_amount'),
                'total_discounts' => (float)$cOrders->sum('discount_amount'),
                'refunds_count' => $cRefunds->count(),
                'refunds_amount' => (float)$cRefunds->sum('total_amount'),
            ];
        }

        return response()->json([
            'kpis' => [
                'sales_today' => $salesToday,
                'orders_today' => $ordersCountToday,
                'sales_this_week' => $salesThisWeek,
                'sales_this_month' => $salesThisMonth,
                'orders_this_month' => $ordersCountMonth,
                'low_stock_count' => $lowStockCount,
                'refunds_today' => $totalRefundsToday,
            ],
            'revenue_trend' => $revenueTrend,
            'payments_by_method' => $paymentsByMethod,
            'top_products' => $topProducts,
            'cashier_audit' => $cashierAudit,
        ]);
    }
}
