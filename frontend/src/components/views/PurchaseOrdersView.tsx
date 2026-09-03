import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Supplier, Product } from '../../types';
import { api } from '../../api/client';
import { formatPHP, formatDate } from '../../utils/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import {
  Truck,
  Plus,
  ArrowRight,
  CheckCircle,
  PackageCheck,
  Eye,
  Trash2,
} from 'lucide-react';

export const PurchaseOrdersView: React.FC = () => {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);

  // Create PO Form State
  const [supplierId, setSupplierId] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [poNotes, setPoNotes] = useState<string>('');
  const [poLines, setPoLines] = useState<
    Array<{ product_id: number; quantity_ordered: number; unit_cost: number }>
  >([]);

  // Receive Form State
  const [receiveInputs, setReceiveInputs] = useState<{ [key: number]: number }>({});

  const fetchPOs = async () => {
    setIsLoading(true);
    try {
      const [poRes, supRes, prodRes] = await Promise.all([
        api.get('/purchase-orders', {
          params: { status: statusFilter !== 'all' ? statusFilter : undefined },
        }),
        api.get('/suppliers'),
        api.get('/products', { params: { per_page: 100 } }),
      ]);
      setPos(poRes.data.data || poRes.data);
      setSuppliers(supRes.data);
      setProducts(prodRes.data.data || prodRes.data);
    } catch (err) {
      console.error('Failed to load POs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [statusFilter]);

  const handleAddLine = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setPoLines([
      ...poLines,
      {
        product_id: firstProd.product_id,
        quantity_ordered: 20,
        unit_cost: parseFloat(firstProd.cost_price.toString()),
      },
    ]);
  };

  const handleLineProductChange = (index: number, prodId: number) => {
    const prod = products.find((p) => p.product_id === prodId);
    if (!prod) return;
    const updated = [...poLines];
    updated[index] = {
      ...updated[index],
      product_id: prodId,
      unit_cost: parseFloat(prod.cost_price.toString()),
    };
    setPoLines(updated);
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    const updated = [...poLines];
    updated[index].quantity_ordered = Math.max(1, qty);
    setPoLines(updated);
  };

  const handleLineCostChange = (index: number, cost: number) => {
    const updated = [...poLines];
    updated[index].unit_cost = Math.max(0, cost);
    setPoLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    const updated = [...poLines];
    updated.splice(index, 1);
    setPoLines(updated);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poLines.length === 0) {
      alert('Please add at least one product item to the purchase order.');
      return;
    }

    try {
      await api.post('/purchase-orders', {
        supplier_id: parseInt(supplierId),
        expected_delivery_date: expectedDate || undefined,
        notes: poNotes || undefined,
        items: poLines,
      });
      setIsCreateModalOpen(false);
      setPoLines([]);
      fetchPOs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create PO');
    }
  };

  const handleUpdateStatus = async (poId: number, newStatus: string) => {
    try {
      await api.put(`/purchase-orders/${poId}/status`, { status: newStatus });
      fetchPOs();
      if (selectedPO) {
        setSelectedPO({ ...selectedPO, status: newStatus as any });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initial: { [key: number]: number } = {};
    po.items?.forEach((item) => {
      const remaining =
        parseFloat(item.quantity_ordered.toString()) -
        parseFloat(item.quantity_received.toString());
      initial[item.po_item_id] = remaining > 0 ? remaining : 0;
    });
    setReceiveInputs(initial);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    const itemsReceiving = Object.entries(receiveInputs)
      .map(([poItemId, qty]) => ({
        po_item_id: parseInt(poItemId),
        quantity_receiving: qty,
      }))
      .filter((i) => i.quantity_receiving > 0);

    if (itemsReceiving.length === 0) {
      alert('Please enter a receiving quantity greater than zero.');
      return;
    }

    try {
      await api.post(`/purchase-orders/${selectedPO.po_id}/receive`, {
        items: itemsReceiving,
      });
      setIsReceiveModalOpen(false);
      setSelectedPO(null);
      fetchPOs();
      alert('Goods received! Inventory quantities and stock movements updated.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to receive goods');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="slate">Draft</Badge>;
      case 'sent':
        return <Badge variant="info">Sent to Supplier</Badge>;
      case 'partially_received':
        return <Badge variant="warning">Partially Received</Badge>;
      case 'received':
        return <Badge variant="success">Fully Received</Badge>;
      case 'closed':
        return <Badge variant="slate">Closed</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Orders & Restocking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procurement pipeline: Draft → Sent → Received (Auto-updates stock)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSupplierId(suppliers[0]?.supplier_id.toString() || '');
            setExpectedDate('');
            setPoNotes('');
            setPoLines([]);
            handleAddLine();
            setIsCreateModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          New Purchase Order
        </Button>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg w-fit text-xs font-semibold">
        {['all', 'draft', 'sent', 'partially_received', 'received', 'closed'].map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Order Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.po_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {po.po_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {po.supplier?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(po.created_at)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatPHP(po.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(po.status)}</td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {po.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(po.po_id, 'sent')}
                          className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-semibold border border-sky-200"
                        >
                          Mark Sent
                        </button>
                      )}

                      {(po.status === 'sent' || po.status === 'partially_received') && (
                        <button
                          type="button"
                          onClick={() => handleOpenReceive(po)}
                          className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-500 rounded text-xs font-semibold shadow-xs"
                        >
                          Receive Goods
                        </button>
                      )}

                      {po.status === 'received' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(po.po_id, 'closed')}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-medium border border-slate-300"
                        >
                          Close PO
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPO(po)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800"
                        title="View PO Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          {/* Product Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-semibold">
              <span>Order Line Items</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-emerald-600 hover:text-emerald-700 text-xs flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {poLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-6">
                    <select
                      value={line.product_id}
                      onChange={(e) =>
                        handleLineProductChange(idx, parseInt(e.target.value))
                      }
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity_ordered}
                      onChange={(e) =>
                        handleLineQtyChange(idx, parseFloat(e.target.value) || 1)
                      }
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-right outline-none font-mono"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unit_cost}
                      onChange={(e) =>
                        handleLineCostChange(idx, parseFloat(e.target.value) || 0)
                      }
                      placeholder="Cost"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-right outline-none font-mono"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between font-bold text-xs">
              <span>Total Estimated Cost:</span>
              <span className="font-mono text-sm text-slate-900">
                {formatPHP(
                  poLines.reduce(
                    (sum, l) => sum + l.quantity_ordered * l.unit_cost,
                    0
                  )
                )}
              </span>
            </div>
          </div>

          <Input
            label="Notes / Instructions"
            value={poNotes}
            onChange={(e) => setPoNotes(e.target.value)}
            placeholder="e.g. Deliver to back loading dock between 8AM-12PM"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save as Draft PO
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receive Goods Modal */}
      {selectedPO && isReceiveModalOpen && (
        <Modal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          title={`Receive Goods — ${selectedPO.po_number}`}
          subtitle={`Supplier: ${selectedPO.supplier?.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmReceive} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Enter the quantities received in this shipment. Verified items will
              automatically increment product stock quantities and record immutable stock movement audit logs.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-right">Ordered</th>
                    <th className="p-2.5 text-right">Already Received</th>
                    <th className="p-2.5 text-right w-28">Receiving Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPO.items?.map((item) => {
                    const ordered = parseFloat(item.quantity_ordered.toString());
                    const already = parseFloat(item.quantity_received.toString());
                    const maxRemaining = Math.max(0, ordered - already);

                    return (
                      <tr key={item.po_item_id}>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-900">
                            {item.product?.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.product?.sku}
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono">{ordered}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 font-semibold">
                          {already}
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            max={maxRemaining}
                            step="1"
                            value={receiveInputs[item.po_item_id] ?? 0}
                            onChange={(e) =>
                              setReceiveInputs({
                                ...receiveInputs,
                                [item.po_item_id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded text-right font-bold text-slate-900 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReceiveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="sm">
                Confirm & Stock In
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View PO Details Modal */}
      {selectedPO && !isReceiveModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPO(null)}
          title={`Purchase Order Details — ${selectedPO.po_number}`}
          subtitle={`Supplier: ${selectedPO.supplier?.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-bold">{selectedPO.status.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Created Date:</span>
                <span className="font-medium">{formatDate(selectedPO.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Amount:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatPHP(selectedPO.total_amount)}
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5 text-right">Ordered</th>
                  <th className="p-2.5 text-right">Received</th>
                  <th className="p-2.5 text-right">Unit Cost</th>
                  <th className="p-2.5 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPO.items?.map((it) => (
                  <tr key={it.po_item_id}>
                    <td className="p-2.5 font-medium">{it.product?.name}</td>
                    <td className="p-2.5 text-right font-mono">{it.quantity_ordered}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">
                      {it.quantity_received}
                    </td>
                    <td className="p-2.5 text-right font-mono">{formatPHP(it.unit_cost)}</td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      {formatPHP(it.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedPO(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
