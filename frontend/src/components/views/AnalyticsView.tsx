import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { formatPHP } from '../../utils/format';
import { Button } from '../ui/Button';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading executive dashboard & audit charts...
      </div>
    );
  }

  const { kpis, revenue_trend, payments_by_method, top_products, cashier_audit } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Analytics & Executive Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store performance metrics, revenue trends, tender distributions, and cashier audits
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Sales Today</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {formatPHP(kpis.sales_today)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {kpis.orders_today} orders processed
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Sales This Week</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {formatPHP(kpis.sales_this_week)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Current calendar week</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Sales This Month</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {formatPHP(kpis.sales_this_month)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {kpis.orders_this_month} orders total
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Orders Today</span>
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {kpis.orders_today}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            Live register count
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-600 font-mono">
            {kpis.low_stock_count}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Items at/under reorder</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Refunds Today</span>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-rose-600 font-mono">
            {formatPHP(kpis.refunds_today)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Approved returns</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Revenue Trend */}
        <div className="lg:col-span-8 p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Revenue Trajectory (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Daily completed gross sales in Philippine Pesos (₱)
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue_trend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₱${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatPHP(val), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payments Breakdown */}
        <div className="lg:col-span-4 p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Payment Methods Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total volume by tender method
            </p>

            <div className="space-y-3">
              {payments_by_method.map((p: any) => {
                const colors: { [key: string]: string } = {
                  cash: 'bg-emerald-500',
                  gcash: 'bg-sky-500',
                  maya: 'bg-green-500',
                  card: 'bg-purple-500',
                };
                const color = colors[p.payment_method] || 'bg-slate-500';

                return (
                  <div key={p.payment_method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold uppercase text-slate-700">
                        {p.payment_method} ({p.count} txns)
                      </span>
                      <span className="font-bold font-mono text-slate-900">
                        {formatPHP(p.total_amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              15,
                              (parseFloat(p.total_amount) /
                                (kpis.sales_this_month || 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Includes split tender amounts</span>
            <span className="font-semibold text-slate-700">Real-time sync</span>
          </div>
        </div>
      </div>

      {/* Top Products & Cashier Audit Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">
              Top 5 Best-Selling Products
            </h3>
            <p className="text-xs text-slate-500">Ranked by unit sales volume</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <th className="p-3">Product Name</th>
                <th className="p-3 text-right">Units Sold</th>
                <th className="p-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top_products.map((tp: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-900">
                    <span className="inline-block w-5 text-slate-400 font-mono">
                      #{idx + 1}
                    </span>
                    {tp.product_name}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {parseFloat(tp.total_qty).toFixed(0)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600">
                    {formatPHP(tp.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cashier Shift Audit Table */}
        <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Cashier Shift Audit (Today)
              </h3>
              <p className="text-xs text-slate-500">
                Individual cashier sales, discounts granted, and refunds
              </p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <th className="p-3">Cashier</th>
                <th className="p-3 text-right">Txns</th>
                <th className="p-3 text-right">Gross Sales</th>
                <th className="p-3 text-right">Discounts</th>
                <th className="p-3 text-right">Refunds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashier_audit.map((ca: any) => (
                <tr key={ca.cashier_id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{ca.name}</div>
                    <div className="text-[10px] text-slate-400">{ca.email}</div>
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-slate-800">
                    {ca.transactions_count}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatPHP(ca.total_sales)}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-600">
                    {formatPHP(ca.total_discounts)}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-600">
                    {ca.refunds_count > 0 ? formatPHP(ca.refunds_amount) : '₱0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
