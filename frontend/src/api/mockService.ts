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

const USERS_KEY = 'isaacpos_demo_users';
const PRODUCTS_KEY = 'isaacpos_demo_products';
const ORDERS_KEY = 'isaacpos_demo_orders';

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
    const body = typeof data === 'string' ? JSON.parse(data) : data || {};
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
    const body = typeof data === 'string' ? JSON.parse(data) : data || {};
    const products = getStoredProducts();
    const idx = products.findIndex((p) => p.product_id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...body };
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

  // 16. ANALYTICS / STOCK ALERTS / PURCHASE ORDERS FALLBACK
  if (cleanUrl.includes('analytics') || cleanUrl.includes('purchase-order') || cleanUrl.includes('alert')) {
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

  // Default fallback
  return {
    status: 200,
    data: { data: [], message: 'Success' },
  };
};
