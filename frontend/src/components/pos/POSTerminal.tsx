import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Customer, Order, OrderItem, Payment } from '../../types';
import { api } from '../../api/client';
import { formatPHP } from '../../utils/format';
import { SplitPaymentModal } from './SplitPaymentModal';
import { ThermalReceipt } from './ThermalReceipt';
import { CameraScannerModal } from './CameraScannerModal';
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
  Camera,
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

// Web Audio API beep synthesizer for supermarket barcode scanner
const playScanBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime); // Crisp supermarket register beep
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    // Audio restricted
  }
};

const playErrorBuzz = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
  } catch (e) {
    // Audio restricted
  }
};

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { per_page: 100 } }),
        api.get('/categories'),
      ]);
      const rawProducts = prodRes.data?.data || prodRes.data;
      const rawCategories = catRes.data?.data || catRes.data;
      setProducts(Array.isArray(rawProducts) ? rawProducts : []);
      setCategories(Array.isArray(rawCategories) ? rawCategories : []);
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

  const lastScanCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const processScannedCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    // Guard against rapid duplicate scans of the same barcode within 1500ms
    if (code === lastScanCodeRef.current && now - lastScanTimeRef.current < 1500) {
      return;
    }
    lastScanCodeRef.current = code;
    lastScanTimeRef.current = now;

    // 1. Instant in-memory check (0ms response)
    const localMatch = products.find(
      (p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (localMatch) {
      const stock = parseFloat(localMatch.stock_quantity.toString());
      if (stock <= 0) {
        playErrorBuzz();
        setScanMessage({ text: `'${localMatch.name}' is out of stock!`, isError: true });
        setTimeout(() => setScanMessage(null), 3500);
        return;
      }
      playScanBeep();
      addToCart(localMatch);
      setScanMessage({ text: `Scanned: ${localMatch.name} (${formatPHP(localMatch.selling_price)})` });
      setTimeout(() => setScanMessage(null), 3500);
      return;
    }

    // 2. Database backend lookup fallback
    try {
      const res = await api.get('/products/scan', { params: { code } });
      if (res.data.found && res.data.product) {
        const prod = res.data.product;
        const stock = parseFloat(prod.stock_quantity.toString());
        if (stock <= 0) {
          playErrorBuzz();
          setScanMessage({ text: `'${prod.name}' is out of stock!`, isError: true });
          setTimeout(() => setScanMessage(null), 3500);
          return;
        }
        playScanBeep();
        addToCart(prod);
        setScanMessage({ text: `Scanned: ${prod.name} (${formatPHP(prod.selling_price)})` });
      }
    } catch {
      playErrorBuzz();
      setScanMessage({ text: `Barcode '${code}' not found in catalog`, isError: true });
    } finally {
      setTimeout(() => setScanMessage(null), 3500);
      barcodeInputRef.current?.focus();
    }
  };

  // Global hardware barcode scanner gun listener (USB / Bluetooth)
  useEffect(() => {
    let buffer = '';
    let lastTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Do not intercept if user is typing in notes or other inputs
      if (
        isPaymentModalOpen ||
        isCameraScannerOpen ||
        (target &&
          (target.tagName === 'TEXTAREA' ||
            (target.tagName === 'INPUT' && target !== barcodeInputRef.current)))
      ) {
        return;
      }

      const now = Date.now();
      const diff = now - lastTime;
      lastTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          processScannedCode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // Hardware barcode scanners send keys very rapidly (< 60ms)
        if (diff > 120) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, isPaymentModalOpen, isCameraScannerOpen]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;
    setBarcodeInput('');
    await processScannedCode(code);
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
      {/* Mobile-Only View Switcher */}
      <div className="md:hidden px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2 z-10 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`flex-1 py-2 rounded-md font-bold text-xs transition-colors cursor-pointer ${
            mobileView === 'catalog'
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Product Catalog ({filteredProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2 rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileView === 'cart'
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>Order Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold tabular-nums">
              {formatPHP(totalDue)}
            </span>
          )}
        </button>
      </div>

      {/* LEFT SECTION: Catalog & Fast Touch Controls */}
      <div
        className={`flex-1 flex flex-col h-full border-r border-slate-200 overflow-hidden ${
          mobileView === 'cart' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Control Bar: Barcode & Search */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5">
          {/* Barcode Scan Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[220px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Barcode className="w-5 h-5" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / SKU (Press Enter)..."
                className={`w-full pl-10 pr-3 bg-slate-50 border border-slate-300 rounded-md font-mono text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 outline-none transition-colors ${
                  isElderMode ? 'py-2.5 text-base' : 'py-2 text-sm'
                }`}
              />
            </div>
          </form>

          {/* Text Search Input */}
          <div className="w-full sm:w-60 md:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className={`w-full pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 outline-none transition-colors ${
                isElderMode ? 'py-2.5 text-base' : 'py-2 text-sm'
              }`}
            />
          </div>

          {/* Camera Scanner Button */}
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md border border-emerald-800 transition-colors flex items-center gap-1.5 font-semibold text-xs active:translate-y-px cursor-pointer shrink-0"
            title="Open Camera Barcode Scanner"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-300 transition-colors flex items-center gap-1.5 font-semibold text-xs active:translate-y-px cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Sync</span>
          </button>
        </div>

        {/* Notification Banner */}
        {scanMessage && (
          <div
            className={`px-4 py-2 font-bold flex items-center gap-2 border-b text-xs ${
              scanMessage.isError
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-emerald-50 text-emerald-950 border-emerald-200'
            }`}
          >
            {scanMessage.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              isElderMode ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
            } ${
              selectedCategory === null
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                isElderMode ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
              } ${
                selectedCategory === cat.category_id
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3 overflow-y-auto bg-slate-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-semibold text-sm">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
              <ShoppingBag className="w-12 h-12 mb-2 text-slate-400" />
              <p className="font-bold text-base text-slate-800">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">Try another search keyword or category.</p>
            </div>
          ) : (
            <div
              className={`grid gap-2.5 ${
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
                    className={`rounded-md border flex flex-col justify-between transition-colors select-none overflow-hidden ${
                      isElderMode ? 'p-3 min-h-[140px]' : 'p-2.5 min-h-[125px]'
                    } ${
                      isOutOfStock
                        ? 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-300 hover:border-slate-500 hover:bg-slate-50 cursor-pointer active:translate-y-px'
                    }`}
                  >
                    <div>
                      <div className="flex gap-2.5 items-start">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className={`${
                              isElderMode ? 'w-16 h-16' : 'w-12 h-12'
                            } rounded object-cover border border-slate-200 bg-slate-100 shrink-0`}
                            loading="lazy"
                            onError={(e) => {
                              // Fallback on broken image link
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className={`${
                              isElderMode ? 'w-16 h-16 text-sm' : 'w-12 h-12 text-xs'
                            } rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-mono font-bold shrink-0`}
                          >
                            {product.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[10px] font-mono font-semibold text-slate-500 truncate">
                              {product.sku}
                            </span>
                            {isOutOfStock ? (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                OUT
                              </span>
                            ) : isLowStock ? (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                LOW: {stock}
                              </span>
                            ) : (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {stock}
                              </span>
                            )}
                          </div>
                          <h4
                            className={`font-bold text-slate-900 line-clamp-2 leading-tight ${
                              isElderMode ? 'text-sm' : 'text-xs sm:text-sm'
                            }`}
                          >
                            {product.name}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={`font-bold text-slate-900 font-mono tabular-nums ${
                          isElderMode ? 'text-lg' : 'text-base'
                        }`}
                      >
                        {formatPHP(product.selling_price)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {product.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Summary Button */}
        {cart.length > 0 && mobileView === 'catalog' && (
          <div className="md:hidden p-3 bg-white border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setMobileView('cart')}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold text-sm flex items-center justify-between px-4 active:translate-y-px transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              </div>
              <span className="font-mono text-sm tabular-nums">{formatPHP(totalDue)} →</span>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Cart & Checkout Panel */}
      <div
        className={`bg-white flex flex-col h-full border-l border-slate-200 ${
          mobileView === 'catalog' ? 'hidden md:flex' : 'flex'
        } ${
          isElderMode ? 'w-full md:w-[420px] lg:w-[460px]' : 'w-full md:w-[380px] lg:w-[410px]'
        }`}
      >
        {/* Cart Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Current Order</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="px-2 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 border border-rose-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <ShoppingBag className="w-12 h-12 mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">Cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                Click items from the catalog or scan barcodes to begin order.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-3 rounded-md bg-white border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-900 text-xs truncate leading-snug">
                    {item.product_name}
                  </h5>
                  <div className="text-xs text-slate-600 font-mono mt-0.5 tabular-nums">
                    {formatPHP(item.unit_price)} each
                  </div>
                </div>

                {/* Steppers */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors active:translate-y-px cursor-pointer"
                      title="Decrease Quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold text-slate-900 text-xs font-mono tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors active:translate-y-px cursor-pointer"
                      title="Increase Quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-bold text-slate-900 text-sm w-16 text-right font-mono tabular-nums">
                    {formatPHP(item.total)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Senior Citizen / PWD 20% Discount Section */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
          <div
            className={`p-2.5 rounded-md border transition-colors ${
              isSeniorPwd
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="senior-pwd-checkbox"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center ${
                    isSeniorPwd
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-900">
                    Senior Citizen / PWD (20% Off)
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium font-mono">
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
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            {isSeniorPwd && (
              <div className="mt-2 pt-2 border-t border-amber-200">
                <input
                  type="text"
                  value={seniorPwdId}
                  onChange={(e) => setSeniorPwdId(e.target.value)}
                  placeholder="Enter OSCA ID / PWD Booklet Number *"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs text-slate-900 placeholder-slate-400 outline-none font-mono font-semibold"
                />
              </div>
            )}
          </div>

          {/* Other discount */}
          {!isSeniorPwd && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-600">Other Discount:</span>
              <select
                value={customDiscountType}
                onChange={(e) => setCustomDiscountType(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2 py-1 text-xs outline-none cursor-pointer"
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
                  className="w-20 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 text-xs outline-none font-mono font-bold tabular-nums"
                />
              )}
            </div>
          )}
        </div>

        {/* Financial Summary & Pay Button */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between text-xs">
              <span className="font-medium">Subtotal:</span>
              <span className="text-slate-900 font-mono font-bold tabular-nums">{formatPHP(rawSubtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-amber-800 font-semibold">
                <span>
                  {isSeniorPwd ? 'Senior 20% + VAT Exemption:' : 'Discount Benefit:'}
                </span>
                <span className="font-mono tabular-nums">-{formatPHP(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-mono tabular-nums">
              <span>VATable: {formatPHP(vatableSales)}</span>
              <span>12% VAT: {formatPHP(vatAmount)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Payable
                </span>
                <span
                  className={`font-black text-slate-900 font-mono tabular-nums leading-none ${
                    isElderMode ? 'text-3xl' : 'text-2xl'
                  }`}
                >
                  {formatPHP(totalDue)}
                </span>
              </div>

              {cart.length > 0 && (
                <span className="text-[10px] text-emerald-800 font-bold font-mono uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Ready
                </span>
              )}
            </div>

            <Button
              variant="emerald"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full h-12 text-base font-bold rounded-md active:translate-y-px"
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

      {/* Camera Live Barcode Scanner Modal */}
      {isCameraScannerOpen && (
        <CameraScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onScanSuccess={(code) => processScannedCode(code)}
          sampleProducts={products}
        />
      )}
    </div>
  );
};
