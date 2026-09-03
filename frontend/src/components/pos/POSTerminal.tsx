import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Customer, Order, OrderItem, Payment } from '../../types';
import { api } from '../../api/client';
import { formatPHP } from '../../utils/format';
import { SplitPaymentModal } from './SplitPaymentModal';
import { ThermalReceipt } from './ThermalReceipt';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Search,
  Barcode,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  UserCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const POSTerminal: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Discount & Customer state
  const [isSeniorPwd, setIsSeniorPwd] = useState<boolean>(false);
  const [seniorPwdId, setSeniorPwdId] = useState<string>('');
  const [customDiscountType, setCustomDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [customDiscountValue, setCustomDiscountValue] = useState<number>(0);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch products and categories
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { per_page: 100 } }),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load POS catalog', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    barcodeInputRef.current?.focus();
  }, []);

  // Handle direct barcode scanner input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const res = await api.get('/products/scan', { params: { code } });
      if (res.data.found && res.data.product) {
        addToCart(res.data.product);
        setScanMessage({ text: `Added: ${res.data.product.name}` });
      }
    } catch {
      setScanMessage({ text: `Barcode '${code}' not found in catalog`, isError: true });
    } finally {
      setBarcodeInput('');
      setTimeout(() => setScanMessage(null), 3000);
      barcodeInputRef.current?.focus();
    }
  };

  // Add item to cart
  const addToCart = (product: Product) => {
    const stock = parseFloat(product.stock_quantity.toString());
    if (stock <= 0) {
      setScanMessage({ text: `'${product.name}' is out of stock!`, isError: true });
      setTimeout(() => setScanMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= stock) {
          setScanMessage({ text: `Cannot add more. Only ${stock} units available in stock.`, isError: true });
          setTimeout(() => setScanMessage(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unit_price,
                total: (item.quantity + 1) * item.unit_price,
              }
            : item
        );
      } else {
        const unitPrice = parseFloat(product.selling_price.toString());
        const unitCost = parseFloat(product.cost_price.toString());
        return [
          ...prev,
          {
            product_id: product.product_id,
            product_name: product.name,
            quantity: 1,
            unit_cost: unitCost,
            unit_price: unitPrice,
            discount_amount: 0,
            tax_amount: 0,
            subtotal: unitPrice,
            total: unitPrice,
            product,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            const stock = parseFloat(item.product?.stock_quantity?.toString() || '999');
            if (newQty <= 0) return null;
            if (newQty > stock) {
              setScanMessage({ text: `Only ${stock} units available in stock.`, isError: true });
              setTimeout(() => setScanMessage(null), 3000);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unit_price,
              total: newQty * item.unit_price,
            };
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setIsSeniorPwd(false);
    setSeniorPwdId('');
    setCustomDiscountType('none');
    setCustomDiscountValue(0);
  };

  // Tax & Discount Calculations (Philippine 12% VAT + Senior/PWD RA 9994 rules)
  const rawSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  let vatableSales = 0;
  let vatAmount = 0;
  let vatExemptSales = 0;
  let discountAmount = 0;
  let totalDue = rawSubtotal;

  if (rawSubtotal > 0) {
    if (isSeniorPwd) {
      // 1. Remove 12% VAT
      const netOfVat = Math.round((rawSubtotal / 1.12) * 100) / 100;
      // 2. 20% discount on net of VAT
      const seniorDiscount = Math.round(netOfVat * 0.20 * 100) / 100;
      totalDue = Math.round((netOfVat - seniorDiscount) * 100) / 100;
      discountAmount = Math.round((rawSubtotal - totalDue) * 100) / 100;
      vatExemptSales = totalDue;
      vatableSales = 0;
      vatAmount = 0;
    } else if (customDiscountType === 'percentage' && customDiscountValue > 0) {
      discountAmount = Math.round(rawSubtotal * (customDiscountValue / 100) * 100) / 100;
      totalDue = Math.max(0, Math.round((rawSubtotal - discountAmount) * 100) / 100);
      vatableSales = Math.round((totalDue / 1.12) * 100) / 100;
      vatAmount = Math.round((totalDue - vatableSales) * 100) / 100;
    } else if (customDiscountType === 'fixed' && customDiscountValue > 0) {
      discountAmount = Math.min(rawSubtotal, customDiscountValue);
      totalDue = Math.max(0, Math.round((rawSubtotal - discountAmount) * 100) / 100);
      vatableSales = Math.round((totalDue / 1.12) * 100) / 100;
      vatAmount = Math.round((totalDue - vatableSales) * 100) / 100;
    } else {
      vatableSales = Math.round((rawSubtotal / 1.12) * 100) / 100;
      vatAmount = Math.round((rawSubtotal - vatableSales) * 100) / 100;
    }
  }

  // Handle Checkout submission
  const handleProcessOrder = async (payments: Payment[]) => {
    setIsProcessingCheckout(true);
    try {
      const payload = {
        discount_type: isSeniorPwd ? 'senior_pwd' : customDiscountType,
        discount_rate: customDiscountType === 'percentage' ? customDiscountValue : isSeniorPwd ? 20 : 0,
        discount_amount: discountAmount,
        notes: isSeniorPwd && seniorPwdId ? `Senior/PWD ID: ${seniorPwdId}` : undefined,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        payments,
      };

      const res = await api.post('/orders/checkout', payload);
      setCompletedOrder(res.data.order);
      setIsPaymentModalOpen(false);
      clearCart();
      fetchData(); // Refresh product stock levels
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed. Please check payment and stock.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* LEFT SECTION: Catalog & Touch Terminal Controls */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
        {/* Top Control Bar: Barcode Scanner & Search */}
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-3">
          {/* Fast Barcode Scan Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[240px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                <Barcode className="w-5 h-5" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / SKU (Press Enter)..."
                className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
          </form>

          {/* Text Search Input */}
          <div className="w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <Button
            variant="dark-ghost"
            size="sm"
            onClick={fetchData}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Sync
          </Button>
        </div>

        {/* Live Notification Banner */}
        {scanMessage && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b animate-in fade-in duration-150 ${
              scanMessage.isError
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
            }`}
          >
            {scanMessage.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Category Pills */}
        <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.category_id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3.5 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Loading POS catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
              <ShoppingBag className="w-12 h-12 mb-2 text-slate-600" />
              <p>No products found matching query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const stock = parseFloat(product.stock_quantity.toString());
                const reorder = parseFloat(product.reorder_level.toString());
                const isOutOfStock = stock <= 0;
                const isLowStock = stock <= reorder && stock > 0;

                return (
                  <div
                    key={product.product_id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`p-3 rounded-lg border flex flex-col justify-between transition-all select-none ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer active:scale-98 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {product.sku}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                            Low ({stock})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                            {stock} {product.unit}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-slate-100 line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-400">
                        {formatPHP(product.selling_price)}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        {product.barcode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & POS Checkout Drawer */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-slate-900 flex flex-col h-full border-l border-slate-800">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">Active Cart</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-semibold">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
              <ShoppingBag className="w-10 h-10 mb-3 text-slate-700" />
              <p className="font-medium text-slate-400">Cart is empty</p>
              <p className="mt-1 text-slate-500">
                Scan barcode or click items from the catalog on the left.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-slate-200 truncate leading-tight">
                    {item.product_name}
                  </h5>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatPHP(item.unit_price)} × {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-700 rounded-md bg-slate-900 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="p-1 hover:bg-slate-800 text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold text-white text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-bold text-white text-xs w-16 text-right">
                    {formatPHP(item.total)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discounts & Philippine RA 9994 Senior/PWD Controls */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2 text-xs">
          {/* Senior Citizen / PWD 20% Discount Toggle (BIR RA 9994 Compliance) */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck
                className={`w-4 h-4 ${
                  isSeniorPwd ? 'text-amber-400' : 'text-slate-500'
                }`}
              />
              <div>
                <span className="font-semibold block text-slate-200">
                  Senior Citizen / PWD (20% + VAT Exempt)
                </span>
                <span className="text-[10px] text-slate-400">
                  Philippine RA 9994 / RA 10754
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isSeniorPwd}
              onChange={(e) => {
                setIsSeniorPwd(e.target.checked);
                if (e.target.checked) setCustomDiscountType('none');
              }}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {isSeniorPwd && (
            <input
              type="text"
              value={seniorPwdId}
              onChange={(e) => setSeniorPwdId(e.target.value)}
              placeholder="Enter OSCA ID / PWD Booklet No.*"
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-500/50 rounded text-xs text-amber-300 placeholder-slate-500 outline-none font-mono"
            />
          )}

          {/* Standard discount selector if not senior */}
          {!isSeniorPwd && (
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={customDiscountType}
                onChange={(e) => setCustomDiscountType(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs outline-none"
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₱)</option>
              </select>
              {customDiscountType !== 'none' && (
                <input
                  type="number"
                  min="0"
                  value={customDiscountValue}
                  onChange={(e) => setCustomDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="Value"
                  className="w-20 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none font-mono"
                />
              )}
            </div>
          )}
        </div>

        {/* Financial Summary & Pay Action */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Gross Subtotal:</span>
              <span className="text-slate-200 font-mono">{formatPHP(rawSubtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>
                  {isSeniorPwd ? 'Senior/PWD 20% Discount:' : 'Discount Applied:'}
                </span>
                <span className="font-mono">-{formatPHP(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
              <span>VATable Sales (12%):</span>
              <span className="font-mono">{formatPHP(vatableSales)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>VAT Amount (12%):</span>
              <span className="font-mono">{formatPHP(vatAmount)}</span>
            </div>
            {vatExemptSales > 0 && (
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>VAT-Exempt Sales:</span>
                <span className="font-mono">{formatPHP(vatExemptSales)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">
                Total Amount Due
              </span>
              <span className="text-xl font-bold text-white font-mono">
                {formatPHP(totalDue)}
              </span>
            </div>

            <Button
              variant="emerald"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-sm font-bold px-6 shadow-lg shadow-emerald-600/30"
            >
              Pay & Tender
            </Button>
          </div>
        </div>
      </div>

      {/* Split Payment Modal */}
      {isPaymentModalOpen && (
        <SplitPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={totalDue}
          onProcessOrder={handleProcessOrder}
          isProcessing={isProcessingCheckout}
        />
      )}

      {/* Thermal Receipt Print Preview */}
      {completedOrder && (
        <ThermalReceipt
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
};
