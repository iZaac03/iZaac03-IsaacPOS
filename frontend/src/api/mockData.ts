export interface MockStore {
  store_id: number;
  store_name: string;
  logo_url: string;
  branch_code: string;
  address: string;
  phone: string;
  email: string;
  vat_tin: string;
  receipt_header: string;
  receipt_footer: string;
  is_active: boolean;
}

export interface MockUser {
  user_id: number;
  store_id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  pin_code: string;
  phone: string;
  is_active: boolean;
  store?: MockStore;
}

export interface MockCategory {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
}

export interface MockProduct {
  product_id: number;
  category_id: number;
  barcode: string;
  sku: string;
  name: string;
  description: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  is_vat_exempt: boolean;
  category?: MockCategory;
}

export const mockStore: MockStore = {
  store_id: 1,
  store_name: 'Daumar Grocery Store',
  logo_url: '/logo.png',
  branch_code: 'BGC-01',
  address: 'Ground Floor, High Street South, Bonifacio Global City, Taguig, Metro Manila',
  phone: '(02) 8888-5527',
  email: 'bgc.branch@isaacpos.ph',
  vat_tin: '123-456-789-00000',
  receipt_header: "DAUMAR GROCERY STORE\nFresh & Quality Since 2026",
  receipt_footer: "Thank you for shopping at IsaacPOS!\nPlease keep this receipt for returns within 7 days.\nVisit us at www.isaacpos.ph",
  is_active: true,
};

export const initialMockUsers: MockUser[] = [
  {
    user_id: 1,
    store_id: 1,
    name: 'Isaac Daumar (Admin)',
    email: 'admin@isaacpos.ph',
    role: 'admin',
    pin_code: '999999',
    phone: '09171112233',
    is_active: true,
    store: mockStore,
  },
  {
    user_id: 2,
    store_id: 1,
    name: 'Elena Gonzales (Manager)',
    email: 'manager@isaacpos.ph',
    role: 'manager',
    pin_code: '123456',
    phone: '09182223344',
    is_active: true,
    store: mockStore,
  },
  {
    user_id: 3,
    store_id: 1,
    name: 'Paolo Mendoza (Cashier)',
    email: 'cashier@isaacpos.ph',
    role: 'cashier',
    pin_code: '112233',
    phone: '09193334455',
    is_active: true,
    store: mockStore,
  },
  {
    user_id: 4,
    store_id: 1,
    name: 'John Isaac Samon Daumar',
    email: 'isaacdaumar03@gmail.com',
    role: 'admin',
    pin_code: '999999',
    phone: '09167140570',
    is_active: true,
    store: mockStore,
  },
];

export const initialMockCategories: MockCategory[] = [
  {
    category_id: 1,
    name: 'Groceries & Dry Goods',
    slug: 'groceries-dry-goods',
    description: 'Canned goods, noodles, condiments, sauces, and cooking essentials',
    icon: 'ShoppingBasket',
    is_active: true,
  },
  {
    category_id: 2,
    name: 'Beverages & Drinks',
    slug: 'beverages-drinks',
    description: 'Cold drinks, juices, soft drinks, beers, coffee, and mineral water',
    icon: 'Coffee',
    is_active: true,
  },
  {
    category_id: 3,
    name: 'Snacks & Confectionery',
    slug: 'snacks-confectionery',
    description: 'Chips, biscuits, crackers, chocolates, and treats',
    icon: 'Cookie',
    is_active: true,
  },
  {
    category_id: 4,
    name: 'Personal Care & Hygiene',
    slug: 'personal-care-hygiene',
    description: 'Soaps, shampoos, toothpaste, toiletries, and skin care',
    icon: 'HeartPulse',
    is_active: true,
  },
  {
    category_id: 5,
    name: 'Household & Cleaning',
    slug: 'household-cleaning',
    description: 'Detergents, fabric softeners, dishwashing liquids, and paper items',
    icon: 'Sparkles',
    is_active: true,
  },
];

export const initialMockProducts: MockProduct[] = [
  {
    product_id: 1,
    category_id: 2,
    barcode: '4800016054117',
    sku: 'BEV-SMB-001',
    name: 'San Miguel Pale Pilsen 330ml Can',
    description: 'Classic Filipino pale pilsen beer, perfectly brewed',
    cost_price: 42.0,
    selling_price: 55.0,
    stock_quantity: 120.0,
    reorder_level: 24.0,
    unit: 'can',
    is_vat_exempt: false,
  },
  {
    product_id: 2,
    category_id: 2,
    barcode: '8996001304212',
    sku: 'BEV-KOP-002',
    name: 'Kopiko 78C Coffee 240ml',
    description: 'Ready-to-drink roasted iced latte coffee',
    cost_price: 25.0,
    selling_price: 34.0,
    stock_quantity: 80.0,
    reorder_level: 20.0,
    unit: 'bottle',
    is_vat_exempt: false,
  },
  {
    product_id: 3,
    category_id: 2,
    barcode: '4800016644202',
    sku: 'BEV-C2-003',
    name: 'C2 Green Tea Apple 500ml',
    description: 'Refreshing brewed green tea infused with natural apple flavor',
    cost_price: 22.0,
    selling_price: 30.0,
    stock_quantity: 65.0,
    reorder_level: 15.0,
    unit: 'bottle',
    is_vat_exempt: false,
  },
  {
    product_id: 4,
    category_id: 2,
    barcode: '4801981112211',
    sku: 'BEV-WLK-004',
    name: 'Wilkins Pure Purified Water 500ml',
    description: 'Trusted pure distilled drinking water',
    cost_price: 14.0,
    selling_price: 20.0,
    stock_quantity: 150.0,
    reorder_level: 30.0,
    unit: 'bottle',
    is_vat_exempt: false,
  },
  {
    product_id: 5,
    category_id: 2,
    barcode: '4800103112340',
    sku: 'BEV-SEL-005',
    name: 'Selecta Fortified Fresh Milk 1L',
    description: '100% pure fresh cow milk, 1-liter tetra pack',
    cost_price: 85.0,
    selling_price: 110.0,
    stock_quantity: 5.0,
    reorder_level: 10.0,
    unit: 'box',
    is_vat_exempt: false,
  },
  {
    product_id: 6,
    category_id: 1,
    barcode: '4800016552118',
    sku: 'GRO-LM-001',
    name: 'Lucky Me! Pancit Canton Kalamansi 80g',
    description: 'All-time favorite instant stir-fried noodles with kalamansi flavor',
    cost_price: 13.5,
    selling_price: 18.0,
    stock_quantity: 200.0,
    reorder_level: 40.0,
    unit: 'pack',
    is_vat_exempt: false,
  },
  {
    product_id: 7,
    category_id: 1,
    barcode: '4800016551104',
    sku: 'GRO-LM-002',
    name: 'Lucky Me! Instant Mami Chicken 55g',
    description: 'Comforting chicken noodle soup with flavorful broth',
    cost_price: 11.0,
    selling_price: 15.0,
    stock_quantity: 180.0,
    reorder_level: 35.0,
    unit: 'pack',
    is_vat_exempt: false,
  },
  {
    product_id: 8,
    category_id: 1,
    barcode: '4801010111223',
    sku: 'GRO-DP-003',
    name: 'Datu Puti Soy Sauce 1L',
    description: 'Traditional fermented Philippine soy sauce bottle',
    cost_price: 48.0,
    selling_price: 62.0,
    stock_quantity: 50.0,
    reorder_level: 12.0,
    unit: 'bottle',
    is_vat_exempt: false,
  },
  {
    product_id: 9,
    category_id: 1,
    barcode: '4800119112234',
    sku: 'GRO-SS-004',
    name: 'Silver Swan Cane Vinegar 1L',
    description: 'Finest naturally fermented cane vinegar bottle',
    cost_price: 42.0,
    selling_price: 54.0,
    stock_quantity: 45.0,
    reorder_level: 12.0,
    unit: 'bottle',
    is_vat_exempt: false,
  },
  {
    product_id: 10,
    category_id: 1,
    barcode: '4800016112245',
    sku: 'GRO-PFC-005',
    name: 'Purefoods Corned Beef 210g',
    description: 'Premium long-strand corned beef can',
    cost_price: 82.0,
    selling_price: 105.0,
    stock_quantity: 40.0,
    reorder_level: 10.0,
    unit: 'can',
    is_vat_exempt: false,
  },
  {
    product_id: 11,
    category_id: 1,
    barcode: '4800092112256',
    sku: 'GRO-CEN-006',
    name: 'Century Tuna Flakes in Oil 180g',
    description: 'Rich in Omega-3 DHA tuna flakes in soybean oil',
    cost_price: 40.0,
    selling_price: 52.0,
    stock_quantity: 60.0,
    reorder_level: 15.0,
    unit: 'can',
    is_vat_exempt: false,
  },
  {
    product_id: 12,
    category_id: 3,
    barcode: '4800016611211',
    sku: 'SNK-PIA-001',
    name: 'Jack n Jill Piattos Cheese 85g',
    description: 'Hexagonal potato crisps seasoned with rich cheese',
    cost_price: 31.0,
    selling_price: 42.0,
    stock_quantity: 70.0,
    reorder_level: 15.0,
    unit: 'pack',
    is_vat_exempt: false,
  },
  {
    product_id: 13,
    category_id: 3,
    barcode: '4800016611228',
    sku: 'SNK-NOV-002',
    name: 'Jack n Jill Nova Country Cheddar 78g',
    description: 'Multigrain healthy snack chips with cheese flavor',
    cost_price: 32.0,
    selling_price: 43.0,
    stock_quantity: 55.0,
    reorder_level: 15.0,
    unit: 'pack',
    is_vat_exempt: false,
  },
  {
    product_id: 14,
    category_id: 4,
    barcode: '4902430112278',
    sku: 'PER-SAF-001',
    name: 'Safeguard Pure White Bar Soap 130g',
    description: 'Antibacterial family germ shield protection soap',
    cost_price: 48.0,
    selling_price: 60.0,
    stock_quantity: 85.0,
    reorder_level: 15.0,
    unit: 'piece',
    is_vat_exempt: false,
  },
  {
    product_id: 15,
    category_id: 5,
    barcode: '4800888112289',
    sku: 'HOU-ARI-001',
    name: 'Ariel Sunrise Fresh Powder Detergent 66g',
    description: 'Tough stain removal powder detergent sachet',
    cost_price: 15.0,
    selling_price: 20.0,
    stock_quantity: 110.0,
    reorder_level: 25.0,
    unit: 'sachet',
    is_vat_exempt: false,
  },
];

export const initialMockSuppliers = [
  {
    supplier_id: 1,
    name: 'San Miguel Brewery Distribution Corp',
    contact_person: 'Ramon Ang',
    phone: '0917-888-7622',
    email: 'smb.orders@sanmiguel.com.ph',
    address: 'Mandaluyong City, Metro Manila',
    is_active: true,
  },
  {
    supplier_id: 2,
    name: 'Monde Nissin Corporation',
    contact_person: 'Betty Ang',
    phone: '0918-555-4321',
    email: 'sales@mondenissin.com',
    address: 'Santa Rosa, Laguna',
    is_active: true,
  },
  {
    supplier_id: 3,
    name: 'Universal Robina Corporation (URC)',
    contact_person: 'Lance Gokongwei',
    phone: '0922-333-1122',
    email: 'distribution@urc.com.ph',
    address: 'Pasig City, Metro Manila',
    is_active: true,
  },
];
