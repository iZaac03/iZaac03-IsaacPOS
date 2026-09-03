import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types';
import { api } from '../../api/client';
import { formatPHP } from '../../utils/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import {
  Search,
  Plus,
  Download,
  Upload,
  SlidersHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Form
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    reorder_level: '10',
    unit: 'pcs',
    description: '',
  });

  // Stock Adjustment Form
  const [adjustData, setAdjustData] = useState({
    new_quantity: '',
    reason: 'Physical count discrepancy',
    notes: '',
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', {
          params: {
            search,
            category_id: categoryFilter || undefined,
            stock_status: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
            per_page: 50,
          },
        }),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.product_id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsCreateModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      sku: product.sku,
      category_id: product.category_id.toString(),
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      reorder_level: product.reorder_level.toString(),
      unit: product.unit,
      description: product.description || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (productId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to soft-delete '${name}'?`)) return;
    try {
      await api.delete(`/products/${productId}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleOpenAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustData({
      new_quantity: product.stock_quantity.toString(),
      reason: 'Physical count inventory discrepancy',
      notes: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.post('/stock-movements/adjust', {
        product_id: selectedProduct.product_id,
        new_quantity: parseFloat(adjustData.new_quantity),
        reason: adjustData.reason,
        notes: adjustData.notes,
      });
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/products/export/csv', '_blank');
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await api.post('/products/import/csv', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to import CSV');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory & Stock Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage products, reorder thresholds, and live stock movements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCsv}
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedProduct(null);
              setFormData({
                name: '',
                barcode: '',
                sku: '',
                category_id: categories[0]?.category_id.toString() || '',
                cost_price: '',
                selling_price: '',
                stock_quantity: '0',
                reorder_level: '10',
                unit: 'pcs',
                description: '',
              });
              setIsCreateModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, barcode, or SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Data-dense Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Wholesale Cost</th>
                <th className="py-3 px-4 text-right">Retail Price</th>
                <th className="py-3 px-4 text-right">In Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = parseFloat(p.stock_quantity.toString());
                  const reorder = parseFloat(p.reorder_level.toString());
                  const isOut = stock <= 0;
                  const isLow = stock <= reorder && stock > 0;

                  return (
                    <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        <div className="font-medium text-slate-900">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {p.name}
                        {p.is_vat_exempt && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded">
                            VAT-Exempt
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {p.category?.name || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {formatPHP(p.cost_price)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatPHP(p.selling_price)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold">
                        <span
                          className={
                            isOut
                              ? 'text-rose-600 font-bold'
                              : isLow
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-800'
                          }
                        >
                          {stock} {p.unit}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Reorder: {reorder}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isOut ? (
                          <Badge variant="danger" dot>
                            Depleted
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="warning" dot>
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" dot>
                            In Stock
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(p)}
                          title="Adjust stock quantity"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit product"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.product_id, p.name)}
                          title="Delete product"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={selectedProduct ? 'Edit Product' : 'Register New Product'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Product Name *"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kopiko 78C Coffee 240ml"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU (Stock Keeping Unit) *"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. BEV-KOP-002"
            />
            <Input
              label="Barcode (EAN-13 / UPC) *"
              required
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="e.g. 8996001304212"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Cost Price (₱) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Selling SRP (₱) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Unit (pcs, box, kg) *"
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="pcs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!selectedProduct && (
              <Input
                label="Initial Stock Quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="0"
              />
            )}
            <Input
              label="Reorder Alert Level *"
              type="number"
              step="1"
              min="0"
              required
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              placeholder="10"
            />
          </div>

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
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Manual Stock Adjustment"
        subtitle={`Adjust inventory count for '${selectedProduct?.name}'`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="flex justify-between text-slate-600 mb-1">
              <span>Current Recorded Stock:</span>
              <span className="font-bold text-slate-900">
                {selectedProduct?.stock_quantity} {selectedProduct?.unit}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Adjustment Type:</span>
              <span className="font-semibold text-slate-800">Manual Count</span>
            </div>
          </div>

          <Input
            label="Actual Physical Quantity *"
            type="number"
            step="0.01"
            min="0"
            required
            value={adjustData.new_quantity}
            onChange={(e) => setAdjustData({ ...adjustData, new_quantity: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Adjustment *
            </label>
            <select
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
            >
              <option value="Physical count discrepancy">Physical count discrepancy</option>
              <option value="Damaged / Expired stock">Damaged / Expired stock</option>
              <option value="Internal store use">Internal store use</option>
              <option value="Stock return to supplier">Stock return to supplier</option>
              <option value="Audit reconciliation">Audit reconciliation</option>
            </select>
          </div>

          <Input
            label="Notes / Auditor Remarks"
            value={adjustData.notes}
            onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
            placeholder="e.g. Box found with water damage in aisle 3"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Log Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
