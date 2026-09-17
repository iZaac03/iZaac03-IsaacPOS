import React, { useState, useEffect } from 'react';
import { Order, Refund, GcashTransaction, GcashSummary } from '../../types';
import { api } from '../../api/client';
import { formatPHP, formatDateTime } from '../../utils/format';
import { ThermalReceipt } from '../pos/ThermalReceipt';
import { PinPadModal } from '../ui/PinPadModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { GcashModal } from '../pos/GcashModal';
import { GcashReceiptModal } from '../pos/GcashReceiptModal';
import {
  Search,
  Printer,
  RotateCcw,
  Calendar,
  AlertTriangle,
  ShoppingBag,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  RefreshCw,
  Receipt,
  Wallet,
  Coins,
  TrendingUp,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TransactionsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'gcash'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // GCash State
  const [gcashTransactions, setGcashTransactions] = useState<GcashTransaction[]>([]);
  const [gcashSearch, setGcashSearch] = useState<string>('');
  const [gcashTypeFilter, setGcashTypeFilter] = useState<string>('all');
  const [gcashDateFilter, setGcashDateFilter] = useState<string>('');
  const [isGcashLoading, setIsGcashLoading] = useState<boolean>(false);
  const [gcashSummary, setGcashSummary] = useState<GcashSummary>({
    total_cash_in_volume: 0,
    total_cash_out_volume: 0,
    total_fees_earned: 0,
    total_count: 0,
  });

  // Modals State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptGcashTx, setReceiptGcashTx] = useState<GcashTransaction | null>(null);
  const [isGcashModalOpen, setIsGcashModalOpen] = useState<boolean>(false);

  // Refund Modal State
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState<string>('wrong_item');
  const [refundNotes, setRefundNotes] = useState<string>('');
  const [refundQuantities, setRefundQuantities] = useState<{ [key: number]: number }>({});
  const [refundRestock, setRefundRestock] = useState<{ [key: number]: boolean }>({});
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [managerApprover, setManagerApprover] = useState<any>(null);

  // Void Order State
  const [voidOrderTarget, setVoidOrderTarget] = useState<Order | null>(null);
  const [voidOrderReason, setVoidOrderReason] = useState<string>('cashier_error');
  const [voidOrderNotes, setVoidOrderNotes] = useState<string>('');
  const [isVoidOrderSubmitting, setIsVoidOrderSubmitting] = useState<boolean>(false);
  const [isVoidPinModalOpen, setIsVoidPinModalOpen] = useState<boolean>(false);
  const [voidManagerApprover, setVoidManagerApprover] = useState<any>(null);

  // Void GCash State
  const [voidGcashTarget, setVoidGcashTarget] = useState<GcashTransaction | null>(null);
  const [voidGcashReason, setVoidGcashReason] = useState<string>('wrong_amount');
  const [voidGcashNotes, setVoidGcashNotes] = useState<string>('');
  const [isVoidGcashSubmitting, setIsVoidGcashSubmitting] = useState<boolean>(false);

  // Fetch Store Sales Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/orders', {
        params: {
          search: search.trim() || undefined,
          payment_status: statusFilter !== 'all' ? statusFilter : undefined,
          payment_method: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
          date: dateFilter || undefined,
          per_page: 50,
        },
      });
      setOrders(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch GCash Transactions
  const fetchGcashTransactions = async () => {
    setIsGcashLoading(true);
    try {
      const res = await api.get('/gcash-transactions', {
        params: {
          search: gcashSearch.trim() || undefined,
          transaction_type: gcashTypeFilter !== 'all' ? gcashTypeFilter : undefined,
          date: gcashDateFilter || undefined,
          per_page: 50,
        },
      });
      const list = res.data.data || res.data || [];
      setGcashTransactions(Array.isArray(list) ? list : []);
      if (res.data.summary) {
        setGcashSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load GCash transactions', err);
    } finally {
      setIsGcashLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentMethodFilter, dateFilter]);

  useEffect(() => {
    fetchGcashTransactions();
  }, [gcashTypeFilter, gcashDateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleGcashSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGcashTransactions();
  };

  // Refund handlers
  const handleOpenRefund = (order: Order) => {
    setRefundOrder(order);
    const initialQty: { [key: number]: number } = {};
    const initialRestock: { [key: number]: boolean } = {};
    order.items?.forEach((item) => {
      initialQty[item.order_item_id!] = 0;
      initialRestock[item.order_item_id!] = true;
    });
    setRefundQuantities(initialQty);
    setRefundRestock(initialRestock);
    setManagerApprover(null);
    setRefundReason('wrong_item');
    setRefundNotes('');
  };

  const currentRefundTotal =
    refundOrder?.items?.reduce((sum, item) => {
      const qty = refundQuantities[item.order_item_id!] || 0;
      return sum + qty * parseFloat(item.unit_price.toString());
    }, 0) || 0;

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder) return;

    const itemsToRefund = Object.entries(refundQuantities)
      .map(([orderItemId, qty]) => ({
        order_item_id: parseInt(orderItemId),
        quantity: qty,
        restock_item: refundRestock[parseInt(orderItemId)] ?? true,
      }))
      .filter((i) => i.quantity > 0);

    if (itemsToRefund.length === 0) {
      alert('Please enter at least one item quantity to refund.');
      return;
    }

    if (currentRefundTotal >= 1000 && !managerApprover && user?.role === 'cashier') {
      setIsPinModalOpen(true);
      return;
    }

    try {
      const payload: any = {
        order_id: refundOrder.order_id,
        reason_code: refundReason,
        notes: refundNotes,
        items: itemsToRefund,
      };

      if (managerApprover) {
        payload.manager_pin = managerApprover.pin_code || '999999';
      }

      await api.post('/refunds', payload);
      alert('Refund processed successfully!');
      setRefundOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process refund');
    }
  };

  // Void Order Handlers
  const handleOpenVoidOrder = (order: Order) => {
    setVoidOrderTarget(order);
    setVoidOrderReason('cashier_error');
    setVoidOrderNotes('');
    setVoidManagerApprover(null);
  };

  const handleConfirmVoidOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidOrderTarget) return;

    if (user?.role === 'cashier' && !voidManagerApprover) {
      setIsVoidPinModalOpen(true);
      return;
    }

    setIsVoidOrderSubmitting(true);
    try {
      const payload: any = {
        reason: voidOrderReason,
        notes: voidOrderNotes,
      };
      if (voidManagerApprover) {
        payload.manager_pin = voidManagerApprover.pin_code || '999999';
      }

      const res = await api.post(`/orders/${voidOrderTarget.order_id}/void`, payload);
      alert(res.data?.message || `Order ${voidOrderTarget.order_number} voided successfully.`);
      setVoidOrderTarget(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to void order.');
    } finally {
      setIsVoidOrderSubmitting(false);
    }
  };

  // Void GCash Handlers
  const handleOpenVoidGcash = (tx: GcashTransaction) => {
    setVoidGcashTarget(tx);
    setVoidGcashReason('wrong_amount');
    setVoidGcashNotes('');
  };

  const handleConfirmVoidGcash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidGcashTarget) return;

    setIsVoidGcashSubmitting(true);
    try {
      const res = await api.post(`/gcash-transactions/${voidGcashTarget.gcash_transaction_id}/void`, {
        reason: voidGcashReason,
        notes: voidGcashNotes,
      });
      alert(res.data?.message || 'GCash transaction voided successfully.');
      setVoidGcashTarget(null);
      fetchGcashTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to void GCash transaction.');
    } finally {
      setIsVoidGcashSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Transactions & Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit store sales, GCash remittances, reprint thermal receipts, void errors, and process refunds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'gcash' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsGcashModalOpen(true)}
              className="bg-[#007dfe] hover:bg-[#006bd1] text-white border-none shadow-xs"
            >
              New GCash Transaction
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchOrders}
            >
              Refresh Orders
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Retail Sales Orders</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gcash')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'gcash'
              ? 'border-[#007dfe] text-[#007dfe]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="w-4 h-4 rounded bg-[#007dfe] text-white text-[10px] font-black flex items-center justify-center">
            G
          </div>
          <span>GCash Transactions</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-[#007dfe] font-mono border border-blue-200">
            {gcashTransactions.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RETAIL SALES ORDERS                               */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Order #..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono"
                />
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
              />

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash Only</option>
                <option value="gcash">GCash Tender</option>
                <option value="maya">Maya Tender</option>
                <option value="card">Card Tender</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partially_refunded">Partially Refunded</option>
                <option value="refunded">Fully Refunded</option>
                <option value="voided">Voided Orders</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Payment Methods</th>
                    <th className="py-3 px-4 text-right">Gross Subtotal</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Total Net</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Loading store transactions...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No orders found. Ready for clean audit entries.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => {
                      const isVoided = ord.order_status === 'voided' || ord.payment_status === 'voided';
                      return (
                        <tr
                          key={ord.order_id}
                          className={`transition-colors ${
                            isVoided ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <span className={isVoided ? 'line-through text-slate-400' : ''}>
                              {ord.order_number}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDateTime(ord.created_at)}
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium">
                            {ord.user?.name || 'Cashier'}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {ord.customer?.name || <span className="text-slate-400 italic">Walk-in</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {ord.payments?.map((p, idx) => (
                                <span
                                  key={idx}
                                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${
                                    p.payment_method === 'gcash'
                                      ? 'bg-blue-50 text-[#007dfe] border-blue-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {p.payment_method}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {formatPHP(ord.subtotal)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600 tabular-nums">
                            {parseFloat(ord.discount_amount.toString()) > 0
                              ? `-${formatPHP(ord.discount_amount)}`
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {formatPHP(ord.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isVoided ? (
                              <Badge variant="danger" dot>
                                Voided
                              </Badge>
                            ) : ord.payment_status === 'paid' ? (
                              <Badge variant="success" dot>
                                Paid
                              </Badge>
                            ) : ord.payment_status === 'partially_refunded' ? (
                              <Badge variant="warning" dot>
                                Partial Refund
                              </Badge>
                            ) : (
                              <Badge variant="danger" dot>
                                Refunded
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setReceiptOrder(ord)}
                              className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              title="Reprint Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              Receipt
                            </button>

                            {!isVoided && (
                              <>
                                {ord.payment_status !== 'refunded' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRefund(ord)}
                                    className="px-2 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                    title="Process Partial or Full Refund"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                    Refund
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenVoidOrder(ord)}
                                  className="px-2 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                  title="Void this Order and Restock Inventory"
                                >
                                  <Ban className="w-3.5 h-3.5 text-amber-600" />
                                  Void
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GCASH CASH IN / OUT TRANSACTIONS                   */}
      {/* ======================================================== */}
      {activeTab === 'gcash' && (
        <div className="space-y-4">
          {/* GCash KPI Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cash In Volume
              </span>
              <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-1">
                {formatPHP(gcashSummary.total_cash_in_volume)}
              </div>
              <span className="text-[11px] text-slate-400">Total cash loaded</span>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cash Out Volume
              </span>
              <div className="text-lg font-bold text-sky-700 font-mono tabular-nums mt-1">
                {formatPHP(gcashSummary.total_cash_out_volume)}
              </div>
              <span className="text-[11px] text-slate-400">Total cash dispensed</span>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-lg border border-blue-200 shadow-xs">
              <span className="text-[10px] font-bold text-[#007dfe] uppercase tracking-wider block">
                Service Fees Profit
              </span>
              <div className="text-lg font-bold text-[#007dfe] font-mono tabular-nums mt-1">
                +{formatPHP(gcashSummary.total_fees_earned)}
              </div>
              <span className="text-[11px] text-blue-600">Net store revenue</span>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Transactions
              </span>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {gcashSummary.total_count}
              </div>
              <span className="text-[11px] text-slate-400">Active records</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleGcashSearchSubmit} className="flex-1 min-w-[260px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={gcashSearch}
                  onChange={(e) => setGcashSearch(e.target.value)}
                  placeholder="Search by Phone (09...), Customer Name, or Ref #..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-[#007dfe] focus:ring-1 focus:ring-[#007dfe] outline-none font-mono"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={gcashDateFilter}
                onChange={(e) => setGcashDateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
              />

              <select
                value={gcashTypeFilter}
                onChange={(e) => setGcashTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
              >
                <option value="all">All GCash Types</option>
                <option value="cash_in">Cash In</option>
                <option value="cash_out">Cash Out</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={fetchGcashTransactions}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* GCash Transactions Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Ref / Txn ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer Phone</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4 text-right">Principal Amount</th>
                    <th className="py-3 px-4 text-right">Fee</th>
                    <th className="py-3 px-4 text-right">Total Net</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isGcashLoading ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Loading GCash transactions...
                      </td>
                    </tr>
                  ) : gcashTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-slate-600">No GCash transactions recorded yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click "+ New GCash Transaction" above to process Cash In or Cash Out.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    gcashTransactions.map((tx) => {
                      const isCashIn = tx.transaction_type === 'cash_in';
                      const isVoided = tx.status === 'voided' || tx.status === 'cancelled';
                      return (
                        <tr
                          key={tx.gcash_transaction_id}
                          className={`transition-colors ${
                            isVoided ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <span className={isVoided ? 'line-through text-slate-400' : ''}>
                              {tx.reference_number ? (
                                <span className="text-slate-800">{tx.reference_number}</span>
                              ) : (
                                <span className="text-slate-400 font-normal">TXN-{tx.gcash_transaction_id}</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDateTime(tx.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            {isCashIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                Cash In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                                <ArrowUpRight className="w-3 h-3 text-sky-600" />
                                Cash Out
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {tx.customer_phone}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {tx.customer_name || <span className="text-slate-400 italic">Walk-in</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {tx.user?.name || 'Cashier'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 tabular-nums">
                            {formatPHP(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#007dfe] tabular-nums">
                            +{formatPHP(tx.fee)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {formatPHP(tx.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isVoided ? (
                              <Badge variant="danger" dot>
                                Voided
                              </Badge>
                            ) : (
                              <Badge variant="success" dot>
                                Completed
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setReceiptGcashTx(tx)}
                              className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              title="Reprint GCash Slip"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              Receipt
                            </button>

                            {!isVoided && (
                              <button
                                type="button"
                                onClick={() => handleOpenVoidGcash(tx)}
                                className="px-2 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                title="Void GCash Transaction"
                              >
                                <Ban className="w-3.5 h-3.5 text-amber-600" />
                                Void
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS: Thermal Receipts, Refunds, PIN Pad, GCash Modal, Voids */}
      {/* ======================================================== */}

      {/* Retail Thermal Receipt Modal */}
      {receiptOrder && (
        <ThermalReceipt
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* GCash Slip Modal */}
      {receiptGcashTx && (
        <GcashReceiptModal
          transaction={receiptGcashTx}
          onClose={() => setReceiptGcashTx(null)}
        />
      )}

      {/* GCash Cash In / Out Processing Modal */}
      {isGcashModalOpen && (
        <GcashModal
          isOpen={isGcashModalOpen}
          onClose={() => setIsGcashModalOpen(false)}
          onTransactionComplete={(tx) => {
            fetchGcashTransactions();
            setReceiptGcashTx(tx);
          }}
        />
      )}

      {/* VOID ORDER MODAL */}
      {voidOrderTarget && (
        <Modal
          isOpen={true}
          onClose={() => setVoidOrderTarget(null)}
          title={`Void Order: ${voidOrderTarget.order_number}`}
          subtitle="Permanently invalidates this retail transaction and restores all items back to active stock."
          maxWidth="md"
        >
          <form onSubmit={handleConfirmVoidOrder} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Transaction Void & Stock Restock</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Total sale amount of <strong className="font-mono">{formatPHP(voidOrderTarget.total_amount)}</strong> will be invalidated.
                All line items will be returned to inventory automatically.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Void *
              </label>
              <select
                value={voidOrderReason}
                onChange={(e) => setVoidOrderReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                <option value="cashier_error">Cashier punch / scanning error</option>
                <option value="customer_walkout">Customer walked out / unpaid order</option>
                <option value="duplicate_order">Duplicate order punched</option>
                <option value="payment_declined">Payment declined after punch</option>
                <option value="system_testing">Testing transaction</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Notes / Explanation
              </label>
              <textarea
                value={voidOrderNotes}
                onChange={(e) => setVoidOrderNotes(e.target.value)}
                placeholder="Details explaining the void for auditor review..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md outline-none"
                rows={2}
              />
            </div>

            {user?.role === 'cashier' && !voidManagerApprover && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Manager PIN authorization will be required to confirm void.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVoidOrderTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={isVoidOrderSubmitting}
              >
                {user?.role === 'cashier' && !voidManagerApprover
                  ? 'Authorize & Confirm Void'
                  : 'Confirm Void Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* VOID GCASH MODAL */}
      {voidGcashTarget && (
        <Modal
          isOpen={true}
          onClose={() => setVoidGcashTarget(null)}
          title={`Void GCash: ${voidGcashTarget.reference_number || `TXN-${voidGcashTarget.gcash_transaction_id}`}`}
          subtitle="Cancels this GCash ledger entry and removes its volume and fee profits from analytics."
          maxWidth="md"
        >
          <form onSubmit={handleConfirmVoidGcash} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cancel GCash {voidGcashTarget.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Amount: <strong className="font-mono">{formatPHP(voidGcashTarget.amount)}</strong> | Fee: <strong className="font-mono">+{formatPHP(voidGcashTarget.fee)}</strong> | Mobile: <strong className="font-mono">{voidGcashTarget.customer_phone}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Void *
              </label>
              <select
                value={voidGcashReason}
                onChange={(e) => setVoidGcashReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                <option value="wrong_amount">Incorrect amount entered</option>
                <option value="wrong_number">Incorrect customer mobile number</option>
                <option value="customer_cancelled">Customer cancelled transfer</option>
                <option value="transfer_failed">GCash app transfer failed / timeout</option>
                <option value="duplicate">Duplicate transaction entry</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Remarks
              </label>
              <textarea
                value={voidGcashNotes}
                onChange={(e) => setVoidGcashNotes(e.target.value)}
                placeholder="Reason notes for audit ledger..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md outline-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVoidGcashTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={isVoidGcashSubmitting}
              >
                Confirm Void GCash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Partial / Full Refund Modal */}
      {refundOrder && (
        <Modal
          isOpen={true}
          onClose={() => setRefundOrder(null)}
          title={`Process Return & Refund: ${refundOrder.order_number}`}
          subtitle="Select line items to return. Restocked items are returned to active inventory."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitRefund} className="space-y-4 text-xs">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-right">Sold Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right w-24">Refund Qty</th>
                    <th className="p-2.5 text-center">Restock?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundOrder.items?.map((it) => {
                    const maxQty = parseFloat(it.quantity.toString());
                    const itemId = it.order_item_id!;

                    return (
                      <tr key={itemId}>
                        <td className="p-2.5 font-medium text-slate-900">
                          {it.product_name}
                        </td>
                        <td className="p-2.5 text-right font-mono">{maxQty}</td>
                        <td className="p-2.5 text-right font-mono">
                          {formatPHP(it.unit_price)}
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            max={maxQty}
                            step="1"
                            value={refundQuantities[itemId] || 0}
                            onChange={(e) =>
                              setRefundQuantities({
                                ...refundQuantities,
                                [itemId]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded text-right font-bold text-rose-600 outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={refundRestock[itemId] ?? true}
                            onChange={(e) =>
                              setRefundRestock({
                                ...refundRestock,
                                [itemId]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between font-bold text-xs">
                <span>Calculated Refund Total:</span>
                <span className="text-sm font-bold text-rose-600 font-mono">
                  {formatPHP(currentRefundTotal)}
                </span>
              </div>
            </div>

            {currentRefundTotal >= 1000 && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  High-value refund (&gt; ₱1,000.00). Manager PIN authorization is
                  required.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refund Reason Code *
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                <option value="wrong_item">Customer bought wrong item variation</option>
                <option value="damaged_item">Defective / damaged item</option>
                <option value="expired_product">Expired product</option>
                <option value="cashier_error">Cashier punch error</option>
                <option value="customer_dissatisfied">Customer dissatisfied</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Notes / Customer Remarks
              </label>
              <textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Optional notes for auditor review..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md outline-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRefundOrder(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={currentRefundTotal <= 0}
              >
                {currentRefundTotal >= 1000 && !managerApprover && user?.role === 'cashier'
                  ? 'Authorize & Refund'
                  : 'Process Refund'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Supervisor PIN Pad Modal for Refunds */}
      {isPinModalOpen && (
        <PinPadModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onAuthorized={(approver) => {
            setManagerApprover(approver);
            alert(`Authorized by ${approver.name}. You can now complete the refund.`);
          }}
          title="Manager Authorization Required"
          reasonText={`Refund amount of ${formatPHP(currentRefundTotal)} exceeds ₱1,000 threshold.`}
        />
      )}

      {/* Supervisor PIN Pad Modal for Voids */}
      {isVoidPinModalOpen && (
        <PinPadModal
          isOpen={isVoidPinModalOpen}
          onClose={() => setIsVoidPinModalOpen(false)}
          onAuthorized={(approver) => {
            setVoidManagerApprover(approver);
            setIsVoidPinModalOpen(false);
            alert(`Authorized by ${approver.name}. You can now complete voiding the order.`);
          }}
          title="Manager Authorization Required"
          reasonText={`Manager PIN is required to void order ${voidOrderTarget?.order_number || ''}.`}
        />
      )}
    </div>
  );
};
