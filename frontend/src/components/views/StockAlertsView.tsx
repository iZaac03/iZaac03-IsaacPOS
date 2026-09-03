import React, { useState, useEffect } from 'react';
import { Product, StockRequest, Supplier } from '../../types';
import { api } from '../../api/client';
import { formatPHP, formatDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import {
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  PackagePlus,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StockAlertsView: React.FC<{ onNavigateToPO?: () => void }> = ({ onNavigateToPO }) => {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';

  const [items, setItems] = useState<Product[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'requests'>('alerts');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestQty, setRequestQty] = useState<string>('20');
  const [requestUrgency, setRequestUrgency] = useState<'normal' | 'urgent' | 'critical'>('urgent');
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);

  // Convert to PO Modal State (Admin / Manager)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [convertSupplierId, setConvertSupplierId] = useState<string>('');
  const [convertUnitCost, setConvertUnitCost] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [alertsRes, reqRes, supRes] = await Promise.all([
        api.get('/products/low-stock'),
        api.get('/stock-requests'),
        api.get('/suppliers'),
      ]);
      setItems(alertsRes.data.items || []);
      setStockRequests(reqRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error('Failed to load alerts & stock requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRequest = (prod?: Product) => {
    if (prod) {
      setSelectedProduct(prod);
      const reorder = parseFloat(prod.reorder_level?.toString() || '20');
      setRequestQty(Math.max(10, reorder * 2).toString());
    } else if (items.length > 0) {
      setSelectedProduct(items[0]);
      setRequestQty('20');
    }
    setRequestUrgency('urgent');
    setRequestNotes('');
    setIsRequestModalOpen(true);
  };

  const handleSubmitStockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmittingRequest(true);

    try {
      await api.post('/stock-requests', {
        product_id: selectedProduct.product_id,
        requested_quantity: parseFloat(requestQty) || 1,
        urgency: requestUrgency,
        notes: requestNotes || undefined,
      });

      alert(`Restock request for "${selectedProduct.name}" submitted! Admin & Manager notified.`);
      setIsRequestModalOpen(false);
      fetchData();
      setActiveSubTab('requests');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit stock request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleOpenConvert = (req: StockRequest) => {
    setSelectedRequest(req);
    setConvertSupplierId(suppliers[0]?.supplier_id?.toString() || '');
    setConvertUnitCost(req.product?.cost_price?.toString() || '0');
    setIsConvertModalOpen(true);
  };

  const handleConvertPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsConverting(true);

    try {
      const res = await api.post(`/stock-requests/${selectedRequest.request_id}/convert-po`, {
        supplier_id: parseInt(convertSupplierId),
        unit_cost: parseFloat(convertUnitCost) || 0,
      });

      alert(res.data.message || 'Purchase order generated!');
      setIsConvertModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert to purchase order');
    } finally {
      setIsConverting(false);
    }
  };

  const handleUpdateStatus = async (requestId: number, newStatus: string) => {
    try {
      await api.put(`/stock-requests/${requestId}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const pendingRequestsCount = stockRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Low Stock & Reorder Alerts
            </h1>
            <Badge variant="warning" size="md">
              {items.length} Needs Attention
            </Badge>
            {pendingRequestsCount > 0 && (
              <Badge variant="info" size="md">
                {pendingRequestsCount} Pending Requests
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCashier
              ? 'Submit restock requests to Managers & Admins for items running low on store shelves'
              : 'Review depleted products and approve cashier restock requests into supplier Purchase Orders'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          {/* Cashier button: Request Restock */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenRequest()}
            icon={<PackagePlus className="w-4 h-4" />}
          >
            Submit Stock Request
          </Button>

          {/* Non-cashier button: Create Purchase Order directly */}
          {!isCashier && onNavigateToPO && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToPO}
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
            >
              Go to Purchase Orders
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('alerts')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'alerts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Depleted Shelf Items ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('requests')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'requests'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-500" />
          <span>Cashier Restock Requests ({stockRequests.length})</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.2 rounded-full text-xs font-black bg-amber-500 text-white">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: Depleted Products Table */}
      {activeSubTab === 'alerts' && (
        <>
          {items.length === 0 && !isLoading ? (
            <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">All Inventory Healthy</h3>
              <p className="text-xs text-slate-500 mt-1">
                There are currently no products at or below their reorder threshold.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-4">SKU / Barcode</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Retail SRP</th>
                      <th className="py-3 px-4 text-right">Current Stock</th>
                      <th className="py-3 px-4 text-right">Reorder Level</th>
                      <th className="py-3 px-4 text-center">Urgency</th>
                      <th className="py-3 px-4 text-right">Restock Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((p) => {
                      const stock = parseFloat(p.stock_quantity.toString());
                      const reorder = parseFloat(p.reorder_level.toString());
                      const isOut = stock <= 0;

                      return (
                        <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-600">
                            <div className="font-semibold text-slate-900">{p.sku}</div>
                            <div className="text-[10px] text-slate-400">{p.barcode}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {p.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.category?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatPHP(p.selling_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isOut ? 'text-rose-600' : 'text-amber-600'}>
                              {stock} {p.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {reorder} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOut ? (
                              <Badge variant="danger" dot>
                                Out-of-Stock
                              </Badge>
                            ) : (
                              <Badge variant="warning" dot>
                                Low Stock
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenRequest(p)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>Request Restock</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Cashier Restock Requests Pipeline */}
      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Submitted Restock Requests</h3>
              <p className="text-xs text-slate-500">
                Cashier submissions awaiting manager review and supplier purchase order generation
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenRequest()}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Requested Qty</th>
                  <th className="py-3 px-4 text-center">Urgency</th>
                  <th className="py-3 px-4">Cashier Remarks</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No stock requests recorded. Cashiers can click &quot;Submit Stock Request&quot; above.
                    </td>
                  </tr>
                ) : (
                  stockRequests.map((req) => (
                    <tr key={req.request_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.requester?.name || 'Cashier'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.product?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                        {parseFloat(req.requested_quantity.toString())} {req.product?.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.urgency === 'critical' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            CRITICAL
                          </span>
                        ) : req.urgency === 'urgent' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            URGENT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {req.notes || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.status === 'pending' ? (
                          <Badge variant="warning" dot>
                            Pending
                          </Badge>
                        ) : req.status === 'approved' ? (
                          <Badge variant="info" dot>
                            Approved
                          </Badge>
                        ) : req.status === 'converted_to_po' ? (
                          <Badge variant="success" dot>
                            Converted to PO
                          </Badge>
                        ) : (
                          <Badge variant="danger" dot>
                            Rejected
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!isCashier ? (
                          <>
                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenConvert(req)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-2xs inline-flex items-center gap-1"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>Convert to PO</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(req.request_id, 'rejected')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded text-xs border border-slate-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {req.status === 'converted_to_po' && req.purchase_order && (
                              <span className="text-xs font-mono font-bold text-emerald-700">
                                {req.purchase_order.po_number}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {req.status === 'pending' ? 'Under Review' : req.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Cashier Submit Stock Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Stock Restock Request"
        subtitle="Notify Store Managers & Admins to reorder this product from suppliers"
        maxWidth="md"
        darkTheme={false}
      >
        <form onSubmit={handleSubmitStockRequest} className="space-y-4 text-xs text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Product to Restock *
            </label>
            <select
              required
              value={selectedProduct?.product_id || ''}
              onChange={(e) => {
                const prod = items.find((p) => p.product_id === parseInt(e.target.value));
                if (prod) setSelectedProduct(prod);
              }}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg bg-white text-slate-900 outline-none font-medium"
            >
              {items.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.name} (Current Stock: {p.stock_quantity} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity to Request *"
              type="number"
              min="1"
              step="1"
              required
              value={requestQty}
              onChange={(e) => setRequestQty(e.target.value)}
              placeholder="e.g. 24"
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Urgency Level *
              </label>
              <select
                value={requestUrgency}
                onChange={(e) => setRequestUrgency(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg bg-white text-slate-900 outline-none font-bold"
              >
                <option value="normal">Normal (Routine restock)</option>
                <option value="urgent">Urgent (Stock depleted today)</option>
                <option value="critical">Critical (High-demand customer request)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cashier Remarks / Customer Demand Notes
            </label>
            <textarea
              rows={2}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="e.g. 5 customers asked for this item this morning; shelf completely empty"
              className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingRequest}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send Request to Manager
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Manager/Admin Convert Request to PO Modal */}
      {selectedRequest && isConvertModalOpen && (
        <Modal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          title="Generate Purchase Order from Request"
          subtitle={`Converting Cashier Request #${selectedRequest.request_id} for ${selectedRequest.product?.name}`}
          maxWidth="md"
          darkTheme={false}
        >
          <form onSubmit={handleConvertPO} className="space-y-4 text-xs text-slate-900">
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-1">
              <div className="flex justify-between font-bold">
                <span>Product:</span>
                <span className="text-slate-900">{selectedRequest.product?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Requested Quantity:</span>
                <span className="font-black text-slate-900">
                  {selectedRequest.requested_quantity} {selectedRequest.product?.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Requested By:</span>
                <span className="font-semibold">{selectedRequest.requester?.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Supplier for Purchase Order *
              </label>
              <select
                required
                value={convertSupplierId}
                onChange={(e) => setConvertSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg bg-white text-slate-900 outline-none font-bold"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier Wholesale Unit Cost (₱) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={convertUnitCost}
              onChange={(e) => setConvertUnitCost(e.target.value)}
              placeholder="0.00"
            />

            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex justify-between font-black text-sm text-emerald-950">
              <span>Estimated Order Total:</span>
              <span className="font-mono">
                {formatPHP(
                  (parseFloat(selectedRequest.requested_quantity.toString()) || 0) *
                    (parseFloat(convertUnitCost) || 0)
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConvertModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="sm"
                isLoading={isConverting}
                icon={<ShoppingCart className="w-3.5 h-3.5" />}
              >
                Create Supplier PO
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
