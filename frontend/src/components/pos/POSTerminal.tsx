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
  Sparkles,
} from 'lucide-react';

export interface POSTerminalProps {
  isElderMode?: boolean;
}

export const POSTerminal: React.FC<POSTerminalProps> = ({ isElderMode = false }) => {
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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const res = await api.get('/products/scan', { params: { code } });
      if (res.data.found && res.data.product) {
        addToCart(res.data.product);
        setScanMessage({ text: `Added to cart: ${res.data.product.name}` });
      }
    } catch {
      setScanMessage({ text: `Barcode '${code}' not found in catalog`, isError: true });
    } finally {
      setBarcodeInput('');
      setTimeout(() => setScanMessage(null), 3500);
      barcodeInputRef.current?.focus();
    }
  };

  const addToCart = (product: Product) => {
    const stock = parseFloat(product.stock_quantity.toString());
    if (stock <= 0) {
      setScanMessage({ text: `'${product.name}' is out of stock!`, isError: true });
      setTimeout(() => setScanMessage(null), 3500);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= stock) {
          setScanMessage({ text: `Cannot add more. Only ${stock} units available in stock.`, isError: true });
          setTimeout(() => setScanMessage(null), 3500);
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
              setTimeout(() => setScanMessage(null), 3500);
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

  // Philippine 12% VAT + Senior/PWD RA 9994 rules
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
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed. Please check payment and stock.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

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
    <div
      className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 text-slate-100 select-none ${
        isElderMode ? 'text-base' : 'text-sm'
      }`}
    >
      {/* LEFT SECTION: Catalog & Fast Touch Controls */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
        {/* Top Control Bar: Large Barcode Scanner & Search */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-3">
          {/* Barcode Scan Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[280px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Barcode className="w-6 h-6" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / Enter SKU (Press Enter)..."
                className={`w-full pl-12 pr-4 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all ${
                  isElderMode ? 'py-3 text-lg' : 'py-2.5 text-base'
                }`}
              />
            </div>
          </form>

          {/* Text Search Input */}
          <div className="w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product..."
              className={`w-full pl-11 pr-4 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all ${
                isElderMode ? 'py-3 text-base' : 'py-2.5 text-sm'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 font-bold text-xs"
            title="Sync Database Catalog"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync</span>
          </button>
        </div>

        {/* Live Notification Banner */}
        {scanMessage && (
          <div
            className={`px-5 py-2.5 font-bold flex items-center gap-3 border-b animate-in fade-in duration-150 ${
              scanMessage.isError
                ? 'bg-rose-950 text-rose-200 border-rose-800 text-sm'
                : 'bg-emerald-950 text-emerald-200 border-emerald-800 text-sm'
            }`}
          >
            {scanMessage.isError ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Category Pills with Large Touch Targets */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl font-bold whitespace-nowrap transition-all ${
              isElderMode ? 'px-4 py-2.5 text-sm' : 'px-3.5 py-2 text-xs'
            } ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-400'
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
              className={`rounded-xl font-bold whitespace-nowrap transition-all ${
                isElderMode ? 'px-4 py-2.5 text-sm' : 'px-3.5 py-2 text-xs'
              } ${
                selectedCategory === cat.category_id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid with Elder-Friendly Sizing */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium">
              Loading POS products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <ShoppingBag className="w-14 h-14 mb-3 text-slate-600" />
              <p className="font-bold text-lg">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching with another keyword or category.</p>
            </div>
          ) : (
            <div
              className={`grid gap-3.5 ${
                isElderMode
                  ? 'grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {filteredProducts.map((product) => {
                const stock = parseFloat(product.stock_quantity.toString());
                const reorder = parseFloat(product.reorder_level.toString());
                const isOutOfStock = stock <= 0;
                const isLowStock = stock <= reorder && stock > 0;

                return (
                  <div
                    key={product.product_id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`rounded-xl border flex flex-col justify-between transition-all select-none ${
                      isElderMode ? 'p-4 min-h-[140px]' : 'p-3.5 min-h-[120px]'
                    } ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500 hover:bg-slate-850 cursor-pointer active:scale-97 shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-mono text-slate-400 truncate">
                          {product.sku}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-950 text-rose-300 border border-rose-800">
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-950 text-amber-300 border border-amber-800">
                            LOW: {stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {stock} {product.unit}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`font-bold text-white line-clamp-2 leading-tight ${
                          isElderMode ? 'text-base' : 'text-sm'
                        }`}
                      >
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span
                        className={`font-black text-emerald-400 font-mono ${
                          isElderMode ? 'text-xl' : 'text-lg'
                        }`}
                      >
                        {formatPHP(product.selling_price)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
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

      {/* RIGHT SECTION: Active Cart & Large Checkout Controls */}
      <div
        className={`bg-slate-900 flex flex-col h-full border-l border-slate-800 shadow-2xl ${
          isElderMode ? 'w-full md:w-[420px] lg:w-[460px]' : 'w-full md:w-[380px] lg:w-[410px]'
        }`}
      >
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Active Order Cart</h3>
              <p className="text-xs text-slate-400">
                {cart.reduce((s, i) => s + i.quantity, 0)} items selected
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 border border-rose-900/40"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Line Items with Large Touch Steppers */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <ShoppingBag className="w-12 h-12 mb-3 text-slate-600" />
              <p className="font-bold text-base text-slate-300">Cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                Click items on the left catalog or scan a barcode to begin checkout.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-white text-sm truncate leading-snug">
                    {item.product_name}
                  </h5>
                  <div className="text-xs text-emerald-400 font-mono mt-0.5 font-bold">
                    {formatPHP(item.unit_price)} each
                  </div>
                </div>

                {/* Elder-Friendly Large Stepper (+ / -) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border-2 border-slate-700 rounded-lg bg-slate-900 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-black text-lg transition-colors active:scale-95"
                      title="Decrease Quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-9 text-center font-black text-white text-sm font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-black text-lg transition-colors active:scale-95"
                      title="Increase Quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="font-black text-white text-sm w-20 text-right font-mono">
                    {formatPHP(item.total)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Elder-Friendly Senior Citizen / PWD 20% Discount Section */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div
            className={`p-3 rounded-xl border transition-all ${
              isSeniorPwd
                ? 'bg-amber-950/40 border-amber-500 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="senior-pwd-checkbox"
                className="flex items-center gap-2.5 cursor-pointer flex-1"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSeniorPwd
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-sm block text-white">
                    Senior Citizen / PWD (20% Off)
                  </span>
                  <span className="text-[11px] text-amber-400 font-medium">
                    12% VAT Exemption (RA 9994 / RA 10754)
                  </span>
                </div>
              </label>
              <input
                id="senior-pwd-checkbox"
                type="checkbox"
                checked={isSeniorPwd}
                onChange={(e) => {
                  setIsSeniorPwd(e.target.checked);
                  if (e.target.checked) setCustomDiscountType('none');
                }}
                className="w-6 h-6 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {isSeniorPwd && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-900/60">
                <input
                  type="text"
                  value={seniorPwdId}
                  onChange={(e) => setSeniorPwdId(e.target.value)}
                  placeholder="Enter OSCA ID / PWD Booklet Number *"
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/60 rounded-lg text-sm text-amber-200 placeholder-slate-500 outline-none font-mono"
                />
              </div>
            )}
          </div>

          {/* Standard discount selector */}
          {!isSeniorPwd && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">Other Discount:</span>
              <select
                value={customDiscountType}
                onChange={(e) => setCustomDiscountType(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="none">None</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Pesos (₱)</option>
              </select>
              {customDiscountType !== 'none' && (
                <input
                  type="number"
                  min="0"
                  value={customDiscountValue}
                  onChange={(e) => setCustomDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="Value"
                  className="w-24 bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono font-bold"
                />
              )}
            </div>
          )}
        </div>

        {/* Financial Summary & Giant Pay Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between text-sm">
              <span>Gross Subtotal:</span>
              <span className="text-slate-200 font-mono font-bold">{formatPHP(rawSubtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-amber-400 font-bold">
                <span>
                  {isSeniorPwd ? 'Senior 20% + VAT Exemption:' : 'Discount Benefit:'}
                </span>
                <span className="font-mono">-{formatPHP(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
              <span>VATable Sales (12%): {formatPHP(vatableSales)}</span>
              <span>12% VAT: {formatPHP(vatAmount)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Payable
                </span>
                <span
                  className={`font-black text-white font-mono leading-none ${
                    isElderMode ? 'text-3xl text-emerald-400' : 'text-2xl'
                  }`}
                >
                  {formatPHP(totalDue)}
                </span>
              </div>

              {cart.length > 0 && (
                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                  Ready to Pay
                </span>
              )}
            </div>

            <Button
              variant="emerald"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full h-14 text-base font-black tracking-wide rounded-xl shadow-xl shadow-emerald-600/30 active:scale-98 transition-transform"
            >
              PAY & TENDER (₱)
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
