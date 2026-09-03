import React, { useState, useEffect } from 'react';
import { Order, Refund } from '../../types';
import { api } from '../../api/client';
import { formatPHP, formatDateTime } from '../../utils/format';
import { ThermalReceipt } from '../pos/ThermalReceipt';
import { PinPadModal } from '../ui/PinPadModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  Search,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  User as UserIcon,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TransactionsView: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Refund Modal State
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState<string>('wrong_item');
  const [refundNotes, setRefundNotes] = useState<string>('');
  const [refundQuantities, setRefundQuantities] = useState<{ [key: number]: number }>({});
  const [refundRestock, setRefundRestock] = useState<{ [key: number]: boolean }>({});
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [managerApprover, setManagerApprover] = useState<any>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/orders', {
        params: {
          search,
          payment_status: statusFilter !== 'all' ? statusFilter : undefined,
          date: dateFilter || undefined,
          per_page: 50,
        },
      });
      setOrders(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

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

  // Calculate refund sum
  const currentRefundTotal = refundOrder?.items?.reduce((sum, item) => {
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

    // Check high-value refund threshold (> ₱1,000)
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Orders & Transaction Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history, reprint thermal receipts, and issue manager-approved refunds
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order # (e.g. ORD-20260903-0001)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partially_refunded">Partially Refunded</option>
            <option value="refunded">Fully Refunded</option>
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
                    Loading transactions...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.order_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
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
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 uppercase font-medium text-slate-700"
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
                      {ord.payment_status === 'paid' ? (
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
                        className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1"
                        title="Reprint Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Receipt
                      </button>

                      {ord.payment_status !== 'refunded' && (
                        <button
                          type="button"
                          onClick={() => handleOpenRefund(ord)}
                          className="px-2 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold shadow-2xs inline-flex items-center gap-1"
                          title="Process Partial or Full Refund"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {receiptOrder && (
        <ThermalReceipt
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
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

      {/* Supervisor PIN Pad Modal */}
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
    </div>
  );
};
