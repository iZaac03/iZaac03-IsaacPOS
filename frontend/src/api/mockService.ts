import {
  initialMockUsers,
  initialMockCategories,
  initialMockProducts,
  initialMockSuppliers,
  mockStore,
  MockUser,
  MockProduct,
  MockCategory,
} from './mockData';
import { GcashTransaction } from '../types';
import { calculateGCashFee, GCASH_RATE_TIERS } from '../utils/gcashFees';

const USERS_KEY = 'isaacpos_demo_users';
const PRODUCTS_KEY = 'isaacpos_demo_products';
const ORDERS_KEY = 'isaacpos_demo_orders';
const GCASH_KEY = 'isaacpos_demo_gcash';

function parseRequestBody(data: any): Record<string, any> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const obj: Record<string, any> = {};
    data.forEach((val, key) => {
      if (typeof val === 'string') {
        obj[key] = val;
      }
    });
    return obj;
  }
  return data || {};
}

// In-browser mock storage helpers
export const getStoredUsers = (): MockUser[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(initialMockUsers));
      return initialMockUsers;
    }
    return JSON.parse(data);
  } catch {
    return initialMockUsers;
  }
};

export const getStoredProducts = (): MockProduct[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialMockProducts));
      return initialMockProducts;
    }
    return JSON.parse(data);
  } catch {
    return initialMockProducts;
  }
};

export const getStoredOrders = (): any[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredOrders = (orders: any[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const saveStoredProducts = (products: MockProduct[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const saveStoredUsers = (users: MockUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getStoredGcashTransactions = (): GcashTransaction[] => {
  try {
    const data = localStorage.getItem(GCASH_KEY);
    if (!data) {
      return [];
    }
    const parsed: GcashTransaction[] = JSON.parse(data);
    // Purge any legacy demo/sample records
    const cleaned = parsed.filter(
      (t) => t.gcash_transaction_id !== 1001 && t.gcash_transaction_id !== 1002
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(GCASH_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
};

export const saveStoredGcashTransactions = (txs: GcashTransaction[]) => {
  localStorage.setItem(GCASH_KEY, JSON.stringify(txs));
};

/**
 * Handles mock requests when offline or deployed without a live backend (e.g. Vercel)
 */
export const handleMockResponse = async (url: string, method: string = 'get', data?: any, params?: any) => {
  const cleanUrl = url.replace(/^\/api/, '');

  // 1. AUTH: LOGIN WITH EMAIL & PASSWORD
  if (cleanUrl === '/auth/login' && method.toLowerCase() === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data || {};
    const users = getStoredUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === (body.email || '').toLowerCase().trim()
    );

    const isMatch =
      user &&
      (body.password === 'password123' ||
        body.password === 'password' ||
        body.password === 'admin123');

    if (!user || !isMatch) {
      const err: any = new Error('The provided credentials do not match our records.');
      err.response = {
        status: 422,
        data: {
          message: 'The provided credentials do not match our records.',
          errors: { email: ['The provided credentials do not match our records.'] },
        },
      };
      throw err;
    }

    if (!user.is_active) {
      const err: any = new Error('Your account is deactivated.');
      err.response = {
        status: 403,
        data: { message: 'Your account is deactivated. Please contact your administrator.' },
      };
      throw err;
    }

    return {
      status: 200,
      data: {
        token: `demo-token-${Date.now()}`,
        user: { ...user, store: mockStore },
        message: 'Login successful (Demo Mode)',
      },
    };
  }

  // 2. AUTH: LOGIN WITH PIN
  if (cleanUrl === '/auth/pin' && method.toLowerCase() === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data || {};
    const users = getStoredUsers();
    const user = users.find((u) => u.pin_code === body.pin_code);

    if (!user) {
      const err: any = new Error('Invalid PIN code.');
      err.response = {
        status: 401,
        data: { message: 'Invalid PIN code. Please check your 6-digit staff code.' },
      };
      throw err;
    }

    if (!user.is_active) {
      const err: any = new Error('Your account is deactivated.');
      err.response = {
        status: 403,
        data: { message: 'Your account is deactivated. Please contact your administrator.' },
      };
      throw err;
    }

    return {
      status: 200,
      data: {
        token: `demo-token-${Date.now()}`,
        user: { ...user, store: mockStore },
        message: 'PIN login successful (Demo Mode)',
      },
    };
  }

  // 3. AUTH: ME
  if (cleanUrl === '/auth/me' && method.toLowerCase() === 'get') {
    const storedUserStr = localStorage.getItem('isaacpos_user') || localStorage.getItem('klaropos_user');
    const user = storedUserStr ? JSON.parse(storedUserStr) : initialMockUsers[0];
    return {
      status: 200,
      data: { user: { ...user, store: mockStore } },
    };
  }

  // 4. AUTH: LOGOUT
  if (cleanUrl === '/auth/logout' && method.toLowerCase() === 'post') {
    return {
      status: 200,
      data: { message: 'Successfully logged out' },
    };
  }

  // 5. PRODUCTS: GET
  if (cleanUrl === '/products' && method.toLowerCase() === 'get') {
    let products = getStoredProducts();
    const categories = initialMockCategories;

    // Attach category object
    products = products.map((p) => ({
      ...p,
      category: categories.find((c) => c.category_id === p.category_id),
    }));

    if (params?.search) {
      const s = params.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.barcode.includes(s) ||
          p.sku.toLowerCase().includes(s)
      );
    }
    if (params?.category_id) {
      products = products.filter((p) => p.category_id === Number(params.category_id));
    }
    if (params?.barcode) {
      products = products.filter((p) => p.barcode === params.barcode);
    }

    return {
      status: 200,
      data: { data: products },
    };
  }

  // 6. PRODUCTS: CREATE
  if (cleanUrl === '/products' && method.toLowerCase() === 'post') {
    const body = parseRequestBody(data);
    const products = getStoredProducts();
    const newProduct: MockProduct = {
      product_id: Date.now(),
      category_id: Number(body.category_id) || 1,
      barcode: body.barcode || String(Date.now()),
      sku: body.sku || `SKU-${Date.now()}`,
      name: body.name || 'New Product',
      description: body.description || '',
      cost_price: Number(body.cost_price) || 0,
      selling_price: Number(body.selling_price) || 0,
      stock_quantity: Number(body.stock_quantity) || 0,
      reorder_level: Number(body.reorder_level) || 10,
      unit: body.unit || 'piece',
      is_vat_exempt: Boolean(body.is_vat_exempt),
      image_url: body.image_url || undefined,
    };
    products.unshift(newProduct);
    saveStoredProducts(products);
    return {
      status: 201,
      data: { data: newProduct, message: 'Product created successfully' },
    };
  }

  // 7. PRODUCTS: UPDATE
  if (cleanUrl.startsWith('/products/') && (method.toLowerCase() === 'put' || method.toLowerCase() === 'post')) {
    const id = Number(cleanUrl.split('/')[2]);
    const body = parseRequestBody(data);
    const products = getStoredProducts();
    const idx = products.findIndex((p) => p.product_id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...body };
      if (body.remove_image) {
        products[idx].image_url = undefined;
      }
      saveStoredProducts(products);
      return {
        status: 200,
        data: { data: products[idx], message: 'Product updated successfully' },
      };
    }
  }

  // 8. CATEGORIES: GET
  if (cleanUrl === '/categories' && method.toLowerCase() === 'get') {
    return {
      status: 200,
      data: initialMockCategories,
    };
  }

  // 9. SUPPLIERS: GET
  if (cleanUrl === '/suppliers' && method.toLowerCase() === 'get') {
    return {
      status: 200,
      data: initialMockSuppliers,
    };
  }

  // 10. ORDERS: GET
  if (cleanUrl === '/orders' && method.toLowerCase() === 'get') {
    const orders = getStoredOrders();
    return {
      status: 200,
      data: { data: orders },
    };
  }

  // 11. ORDERS: POST (CHECKOUT)
  if (cleanUrl === '/orders' && method.toLowerCase() === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data || {};
    const orders = getStoredOrders();
    const products = getStoredProducts();

    // Deduct stock
    if (Array.isArray(body.items)) {
      body.items.forEach((item: any) => {
        const p = products.find((prod) => prod.product_id === item.product_id);
        if (p) {
          p.stock_quantity = Math.max(0, p.stock_quantity - (item.quantity || 1));
        }
      });
      saveStoredProducts(products);
    }

    const newOrder = {
      order_id: Date.now(),
      order_number: `ORD-${Date.now().toString().slice(-6)}`,
      receipt_number: `REC-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      created_at: new Date().toISOString(),
      ...body,
    };

    orders.unshift(newOrder);
    saveStoredOrders(orders);

    return {
      status: 201,
      data: { data: newOrder, message: 'Order completed successfully' },
    };
  }

  // 12. USERS: GET
  if (cleanUrl === '/users' && method.toLowerCase() === 'get') {
    const users = getStoredUsers();
    return {
      status: 200,
      data: users,
    };
  }

  // 12b. PRODUCTS LOW STOCK
  if (cleanUrl === '/products/low-stock' && method.toLowerCase() === 'get') {
    const products = getStoredProducts();
    const low = products.filter((p) => p.stock_quantity <= p.reorder_level);
    return {
      status: 200,
      data: {
        items: low.map((p) => ({
          product_id: p.product_id,
          product: p,
          current_stock: p.stock_quantity,
          reorder_level: p.reorder_level,
          is_out_of_stock: p.stock_quantity <= 0,
        })),
        count: low.length,
      },
    };
  }

  // 12c. STOCK REQUESTS
  if (cleanUrl === '/stock-requests' && method.toLowerCase() === 'get') {
    return {
      status: 200,
      data: [],
    };
  }

  // 13. USERS: TERMINATE
  if (cleanUrl.match(/\/users\/\d+\/terminate/) && method.toLowerCase() === 'post') {
    const parts = cleanUrl.split('/');
    const userId = Number(parts[2]);
    const users = getStoredUsers();
    const target = users.find((u) => u.user_id === userId);
    if (target) {
      target.is_active = false;
      saveStoredUsers(users);
      return {
        status: 200,
        data: { message: `Staff member ${target.name} has been terminated.` },
      };
    }
  }

  // 14. USERS: REACTIVATE
  if (cleanUrl.match(/\/users\/\d+\/reactivate/) && method.toLowerCase() === 'post') {
    const parts = cleanUrl.split('/');
    const userId = Number(parts[2]);
    const users = getStoredUsers();
    const target = users.find((u) => u.user_id === userId);
    if (target) {
      target.is_active = true;
      saveStoredUsers(users);
      return {
        status: 200,
        data: { message: `Staff member ${target.name} has been reactivated.` },
      };
    }
  }

  // 15. USERS: POST (ADD USER)
  if (cleanUrl === '/users' && method.toLowerCase() === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data || {};
    const users = getStoredUsers();
    const newUser: MockUser = {
      user_id: Date.now(),
      store_id: 1,
      name: body.name || 'New Staff',
      email: body.email || `staff${Date.now()}@isaacpos.ph`,
      role: body.role || 'cashier',
      pin_code: body.pin_code || '123456',
      phone: body.phone || '09000000000',
      is_active: true,
      store: mockStore,
    };
    users.push(newUser);
    saveStoredUsers(users);
    return {
      status: 201,
      data: { data: newUser, message: 'Staff member registered successfully.' },
    };
  }

  // 16. ANALYTICS DASHBOARD
  if (cleanUrl === '/analytics/dashboard' && method.toLowerCase() === 'get') {
    const gcashTxs = getStoredGcashTransactions();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayGcash = gcashTxs.filter((t) => t.created_at?.startsWith(todayStr) && t.status === 'completed');

    const gcashFeesToday = todayGcash.reduce((sum, t) => sum + Number(t.fee || 0), 0);
    const gcashCashInToday = todayGcash
      .filter((t) => t.transaction_type === 'cash_in')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const gcashCashOutToday = todayGcash
      .filter((t) => t.transaction_type === 'cash_out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const gcashTxnsToday = todayGcash.length;

    const gcashFeesMonth = gcashTxs
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.fee || 0), 0);
    const gcashCashInMonth = gcashTxs
      .filter((t) => t.transaction_type === 'cash_in' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const gcashCashOutMonth = gcashTxs
      .filter((t) => t.transaction_type === 'cash_out' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      status: 200,
      data: {
        kpis: {
          sales_today: 18450.0,
          orders_today: 28,
          sales_this_week: 112300.0,
          sales_this_month: 468200.0,
          orders_this_month: 615,
          low_stock_count: 3,
          refunds_today: 0,
          gcash_fees_today: gcashFeesToday,
          gcash_cash_in_today: gcashCashInToday,
          gcash_cash_out_today: gcashCashOutToday,
          gcash_txns_today: gcashTxnsToday,
          gcash_fees_month: gcashFeesMonth,
        },
        gcash_summary: {
          today: {
            fees_earned: gcashFeesToday,
            cash_in_volume: gcashCashInToday,
            cash_out_volume: gcashCashOutToday,
            txns_count: gcashTxnsToday,
          },
          month: {
            fees_earned: gcashFeesMonth,
            cash_in_volume: gcashCashInMonth,
            cash_out_volume: gcashCashOutMonth,
            txns_count: gcashTxs.length,
          },
        },
        revenue_trend: [
          { date: '2026-09-11', label: 'Sep 11 (Fri)', total: 14200 },
          { date: '2026-09-12', label: 'Sep 12 (Sat)', total: 22800 },
          { date: '2026-09-13', label: 'Sep 13 (Sun)', total: 19400 },
          { date: '2026-09-14', label: 'Sep 14 (Mon)', total: 16100 },
          { date: '2026-09-15', label: 'Sep 15 (Tue)', total: 15300 },
          { date: '2026-09-16', label: 'Sep 16 (Wed)', total: 17800 },
          { date: '2026-09-17', label: 'Sep 17 (Thu)', total: 18450 },
        ],
        payments_by_method: [
          { payment_method: 'cash', total_amount: 12200, count: 18 },
          { payment_method: 'gcash', total_amount: 4850, count: 8 },
          { payment_method: 'card', total_amount: 1400, count: 2 },
        ],
        top_products: [
          { product_name: 'San Miguel Pale Pilsen 330ml', total_qty: 68, total_revenue: 4420 },
          { product_name: 'Lucky Me Instant Pancit Canton Kalamansi', total_qty: 54, total_revenue: 1080 },
          { product_name: 'Coca-Cola Mismo 290ml', total_qty: 48, total_revenue: 960 },
          { product_name: 'Kopiko Blanca 3-in-1 Coffee 30g', total_qty: 42, total_revenue: 588 },
          { product_name: 'Bear Brand Fortified Milk 33g', total_qty: 36, total_revenue: 648 },
        ],
        cashier_audit: [
          {
            cashier_id: 2,
            name: 'Isaac Cashier',
            email: 'cashier@klaropos.ph',
            transactions_count: 28,
            total_sales: 18450.0,
            total_discounts: 350.0,
            refunds_count: 0,
            refunds_amount: 0,
            gcash_count: gcashTxnsToday,
            gcash_fees: gcashFeesToday,
            gcash_cash_in: gcashCashInToday,
            gcash_cash_out: gcashCashOutToday,
          },
        ],
      },
    };
  }

  // 17. STOCK ALERTS / PURCHASE ORDERS FALLBACK
  if (cleanUrl.includes('purchase-order') || cleanUrl.includes('alert')) {
    return {
      status: 200,
      data: {
        data: [],
        metrics: {
          gross_sales: 34500.0,
          net_sales: 30803.57,
          vat_amount: 3696.43,
          transaction_count: 42,
          average_ticket: 821.43,
        },
      },
    };
  }

  // GCASH: RATES
  if (cleanUrl === '/gcash-transactions/rates' && method.toLowerCase() === 'get') {
    return {
      status: 200,
      data: { rates: GCASH_RATE_TIERS },
    };
  }

  // GCASH: GET TRANSACTIONS
  if (cleanUrl === '/gcash-transactions' && method.toLowerCase() === 'get') {
    let txs = getStoredGcashTransactions();
    if (params?.search) {
      const q = params.search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.customer_phone.includes(q) ||
          (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
          (t.reference_number && t.reference_number.includes(q))
      );
    }
    if (params?.transaction_type && params.transaction_type !== 'all') {
      txs = txs.filter((t) => t.transaction_type === params.transaction_type);
    }
    if (params?.date) {
      txs = txs.filter((t) => t.created_at.startsWith(params.date));
    }

    const totalCashIn = txs
      .filter((t) => t.transaction_type === 'cash_in' && t.status === 'completed')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalCashOut = txs
      .filter((t) => t.transaction_type === 'cash_out' && t.status === 'completed')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalFees = txs
      .filter((t) => t.status === 'completed')
      .reduce((s, t) => s + Number(t.fee), 0);

    return {
      status: 200,
      data: {
        data: txs,
        summary: {
          total_cash_in_volume: totalCashIn,
          total_cash_out_volume: totalCashOut,
          total_fees_earned: totalFees,
          total_count: txs.length,
        },
      },
    };
  }

  // GCASH: CREATE TRANSACTION
  if (cleanUrl === '/gcash-transactions' && method.toLowerCase() === 'post') {
    const body = parseRequestBody(data);
    const cleanPhone = (body.customer_phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      const err: any = new Error('The GCash mobile number must be exactly 11 digits starting with 09 (e.g. 09171234567).');
      err.response = { status: 422, data: { message: err.message } };
      throw err;
    }

    const amount = Number(body.amount) || 0;
    const fee =
      body.fee !== undefined && body.fee !== '' ? Number(body.fee) : calculateGCashFee(amount);
    const totalAmount = body.transaction_type === 'cash_in' ? amount + fee : amount;

    const newTx: GcashTransaction = {
      gcash_transaction_id: Date.now(),
      store_id: 1,
      user_id: 2,
      transaction_type: body.transaction_type || 'cash_in',
      customer_name: body.customer_name || null,
      customer_phone: cleanPhone,
      amount,
      fee,
      total_amount: totalAmount,
      reference_number: body.reference_number || null,
      status: 'completed',
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      user: {
        user_id: 2,
        first_name: 'Isaac',
        last_name: 'Cashier',
        username: 'cashier1',
      },
    };

    const list = getStoredGcashTransactions();
    list.unshift(newTx);
    saveStoredGcashTransactions(list);

    return {
      status: 201,
      data: { transaction: newTx, message: 'GCash transaction completed successfully' },
    };
  }

  // GCASH: VOID TRANSACTION
  if (cleanUrl.includes('/gcash-transactions/') && cleanUrl.endsWith('/void') && method.toLowerCase() === 'post') {
    const id = parseInt(cleanUrl.split('/')[2]);
    const body = parseRequestBody(data);
    const list = getStoredGcashTransactions();
    const tx = list.find((t) => t.gcash_transaction_id === id);
    if (tx) {
      tx.status = 'cancelled';
      tx.notes = (tx.notes ? tx.notes + '\n' : '') + `[VOIDED: ${body.reason || 'Voided'}]`;
      saveStoredGcashTransactions(list);
    }
    return {
      status: 200,
      data: { message: 'GCash transaction voided successfully', transaction: tx },
    };
  }

  // ORDERS: VOID ORDER
  if (cleanUrl.includes('/orders/') && cleanUrl.endsWith('/void') && method.toLowerCase() === 'post') {
    const body = parseRequestBody(data);
    return {
      status: 200,
      data: { message: 'Order voided successfully and inventory restored.' },
    };
  }

  // Default fallback
  return {
    status: 200,
    data: { data: [], message: 'Success' },
  };
};
