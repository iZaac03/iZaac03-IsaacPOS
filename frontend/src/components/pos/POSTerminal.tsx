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
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

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
      className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-100 text-slate-900 select-none ${
        isElderMode ? 'text-base' : 'text-sm'
      }`}
    >
      {/* Mobile-Only View Switcher (Tabs for Catalog vs Cart on small screens) */}
      <div className="md:hidden px-4 py-2.5 bg-white border-b-2 border-slate-200 flex items-center gap-2 z-10 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${
            mobileView === 'catalog'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Product Catalog ({filteredProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'cart'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>Order Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono text-[10px]">
              {formatPHP(totalPayable)}
            </span>
          )}
        </button>
      </div>

      {/* LEFT SECTION: Catalog & Fast Touch Controls (BRIGHT MODE) */}
      <div
        className={`flex-1 flex flex-col h-full border-r-2 border-slate-200 overflow-hidden ${
          mobileView === 'cart' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Control Bar: Crisp White Barcode & Search */}
        <div className="p-3 sm:p-4 bg-white border-b-2 border-slate-200 flex flex-wrap items-center gap-2.5 sm:gap-3 shadow-xs">
          {/* Barcode Scan Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[220px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <Barcode className="w-6 h-6" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / Enter SKU (Press Enter)..."
                className={`w-full pl-12 pr-4 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono text-slate-900 placeholder-slate-500 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all ${
                  isElderMode ? 'py-3 text-lg' : 'py-2.5 text-base'
                }`}
              />
            </div>
          </form>

          {/* Text Search Input */}
          <div className="w-full sm:w-60 md:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product..."
              className={`w-full pl-11 pr-4 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all ${
                isElderMode ? 'py-3 text-base' : 'py-2.5 text-sm'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border-2 border-slate-300 transition-colors flex items-center gap-1.5 font-bold text-xs shadow-xs"
            title="Sync Database Catalog"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Sync</span>
          </button>
        </div>

        {/* Live Notification Banner */}
        {scanMessage && (
          <div
            className={`px-5 py-3 font-black flex items-center gap-3 border-b-2 animate-in fade-in duration-150 ${
              scanMessage.isError
                ? 'bg-rose-100 text-rose-900 border-rose-300 text-sm'
                : 'bg-emerald-100 text-emerald-950 border-emerald-300 text-sm'
            }`}
          >
            {scanMessage.isError ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Category Pills with Bright High-Contrast Styling */}
        <div className="px-4 py-3 bg-white border-b-2 border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl font-bold whitespace-nowrap transition-all border ${
              isElderMode ? 'px-4 py-2.5 text-sm' : 'px-3.5 py-2 text-xs'
            } ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30 border-emerald-600 ring-2 ring-emerald-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`rounded-xl font-bold whitespace-nowrap transition-all border ${
                isElderMode ? 'px-4 py-2.5 text-sm' : 'px-3.5 py-2 text-xs'
              } ${
                selectedCategory === cat.category_id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30 border-emerald-600 ring-2 ring-emerald-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid — Crisp Bright White with High-Contrast Text */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-bold text-base">
              Loading Daumar Grocery products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
              <ShoppingBag className="w-16 h-16 mb-3 text-slate-400" />
              <p className="font-bold text-lg text-slate-800">No matching products found</p>
              <p className="text-sm text-slate-500 mt-1">Try searching with another keyword or category.</p>
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
                    className={`rounded-xl border-2 flex flex-col justify-between transition-all select-none ${
                      isElderMode ? 'p-4 min-h-[140px]' : 'p-3.5 min-h-[120px]'
                    } ${
                      isOutOfStock
                        ? 'bg-slate-200/70 border-slate-300 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-emerald-600 hover:shadow-xl cursor-pointer active:scale-97 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-mono font-bold text-slate-500 truncate">
                          {product.sku}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            LOW: {stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {stock} {product.unit}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`font-black text-slate-900 line-clamp-2 leading-tight ${
                          isElderMode ? 'text-base' : 'text-sm'
                        }`}
                      >
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2.5 border-t-2 border-slate-100 flex items-center justify-between">
                      <span
                        className={`font-black text-emerald-700 font-mono ${
                          isElderMode ? 'text-2xl' : 'text-xl'
                        }`}
                      >
                        {formatPHP(product.selling_price)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {product.barcode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Summary Button (only when in catalog on small screens) */}
        {cart.length > 0 && mobileView === 'catalog' && (
          <div className="md:hidden p-3 bg-white border-t-2 border-slate-200 shadow-lg shrink-0">
            <button
              type="button"
              onClick={() => setMobileView('cart')}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm flex items-center justify-between px-4 shadow-md shadow-emerald-700/30 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>View Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              </div>
              <span className="font-mono text-base">{formatPHP(totalPayable)} →</span>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Bright Active Cart & Checkout Panel */}
      <div
        className={`bg-white flex flex-col h-full border-l-2 border-slate-200 shadow-2xl ${
          mobileView === 'catalog' ? 'hidden md:flex' : 'flex'
        } ${
          isElderMode ? 'w-full md:w-[420px] lg:w-[460px]' : 'w-full md:w-[380px] lg:w-[410px]'
        }`}
      >
        {/* Cart Header */}
        <div className="px-5 py-4 border-b-2 border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Active Order Cart</h3>
              <p className="text-xs font-semibold text-slate-500">
                {cart.reduce((s, i) => s + i.quantity, 0)} items selected
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 border border-rose-300"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Line Items with High-Contrast Steppers */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <ShoppingBag className="w-14 h-14 mb-3 text-slate-300" />
              <p className="font-black text-base text-slate-700">Cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                Click items on the left or scan barcodes with your barcode gun to begin.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-3.5 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-slate-900 text-sm truncate leading-snug">
                    {item.product_name}
                  </h5>
                  <div className="text-xs text-emerald-700 font-mono mt-0.5 font-bold">
                    {formatPHP(item.unit_price)} each
                  </div>
                </div>

                {/* Bright Elder-Friendly Steppers */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border-2 border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg transition-colors active:scale-95"
                      title="Decrease Quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-9 text-center font-black text-slate-900 text-sm font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg transition-colors active:scale-95"
                      title="Increase Quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="font-black text-slate-950 text-base w-20 text-right font-mono">
                    {formatPHP(item.total)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bright Senior Citizen / PWD 20% Discount Section */}
        <div className="p-4 bg-white border-t-2 border-slate-200 space-y-3">
          <div
            className={`p-3 rounded-xl border-2 transition-all ${
              isSeniorPwd
                ? 'bg-amber-50 border-amber-400 shadow-sm'
                : 'bg-slate-50 border-slate-200'
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
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-sm block text-slate-900">
                    Senior Citizen / PWD (20% Off)
                  </span>
                  <span className="text-xs text-amber-700 font-bold">
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
                className="w-6 h-6 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            {isSeniorPwd && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-200">
                <input
                  type="text"
                  value={seniorPwdId}
                  onChange={(e) => setSeniorPwdId(e.target.value)}
                  placeholder="Enter OSCA ID / PWD Booklet Number *"
                  className="w-full px-3 py-2 bg-white border-2 border-amber-400 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Other discount */}
          {!isSeniorPwd && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">Other Discount:</span>
              <select
                value={customDiscountType}
                onChange={(e) => setCustomDiscountType(e.target.value as any)}
                className="bg-slate-50 border-2 border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs outline-none font-medium"
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
                  className="w-24 bg-white border-2 border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono font-bold"
                />
              )}
            </div>
          )}
        </div>

        {/* Bright Financial Summary & Big Pay Button */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-200 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Gross Subtotal:</span>
              <span className="text-slate-900 font-mono font-black">{formatPHP(rawSubtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-amber-800 font-bold">
                <span>
                  {isSeniorPwd ? 'Senior 20% + VAT Exemption:' : 'Discount Benefit:'}
                </span>
                <span className="font-mono">-{formatPHP(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>VATable (12%): {formatPHP(vatableSales)}</span>
              <span>12% VAT: {formatPHP(vatAmount)}</span>
            </div>
          </div>

          <div className="pt-2 border-t-2 border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Total Payable
                </span>
                <span
                  className={`font-black text-slate-950 font-mono leading-none ${
                    isElderMode ? 'text-4xl text-emerald-700' : 'text-3xl text-emerald-700'
                  }`}
                >
                  {formatPHP(totalDue)}
                </span>
              </div>

              {cart.length > 0 && (
                <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  Ready to Tender
                </span>
              )}
            </div>

            <Button
              variant="emerald"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full h-14 text-lg font-black tracking-wide rounded-xl shadow-xl shadow-emerald-600/25 active:scale-98 transition-transform"
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
