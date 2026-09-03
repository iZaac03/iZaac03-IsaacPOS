export interface Store {
  store_id: number;
  store_name: string;
  logo_url?: string;
  branch_code: string;
  address: string;
  phone: string;
  email?: string;
  vat_tin: string;
  receipt_header?: string;
  receipt_footer?: string;
  is_active: boolean;
}

export type Role = 'admin' | 'manager' | 'cashier';

export interface User {
  user_id: number;
  store_id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  is_active: boolean;
  store?: Store;
}

export interface Category {
  category_id: number;
  store_id?: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  products_count?: number;
  is_active: boolean;
}

export interface Product {
  product_id: number;
  store_id: number;
  category_id: number;
  barcode: string;
  sku: string;
  name: string;
  description?: string;
  cost_price: number | string;
  selling_price: number | string;
  stock_quantity: number | string;
  reorder_level: number | string;
  unit: string;
  is_vat_exempt: boolean;
  is_active: boolean;
  category?: Category;
}

export interface Customer {
  customer_id: number;
  store_id: number;
  name: string;
  phone?: string;
  email?: string;
  senior_pwd_id?: string;
  address?: string;
  loyalty_points: number;
  is_active: boolean;
}

export interface OrderItem {
  order_item_id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  product?: Product;
}

export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'card';

export interface Payment {
  payment_id?: number;
  order_id?: number;
  store_id?: number;
  payment_method: PaymentMethod;
  amount: number;
  tendered_amount?: number;
  change_amount?: number;
  reference_no?: string;
  status?: string;
  notes?: string;
}

export interface Order {
  order_id: number;
  order_number: string;
  store_id: number;
  user_id: number;
  customer_id?: number;
  subtotal: number | string;
  vatable_sales: number | string;
  vat_amount: number | string;
  vat_exempt_sales: number | string;
  discount_type: 'none' | 'percentage' | 'fixed' | 'senior_pwd' | 'custom';
  discount_rate: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  amount_paid: number | string;
  change_amount: number | string;
  payment_status: 'paid' | 'partial' | 'refunded' | 'partially_refunded';
  order_status: 'completed' | 'voided' | 'cancelled';
  notes?: string;
  created_at: string;
  user?: User;
  customer?: Customer;
  store?: Store;
  items?: OrderItem[];
  payments?: Payment[];
  refunds?: Refund[];
}

export interface StockMovement {
  movement_id: number;
  product_id: number;
  store_id: number;
  user_id: number;
  type: 'sale' | 'restock' | 'adjustment' | 'refund' | 'po_receive' | 'initial';
  quantity_change: number | string;
  previous_quantity: number | string;
  new_quantity: number | string;
  reference_type?: string;
  reference_id?: number;
  reason?: string;
  notes?: string;
  created_at: string;
  product?: Product;
  user?: User;
}

export interface Supplier {
  supplier_id: number;
  store_id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  address?: string;
  tax_id?: string;
  is_active: boolean;
  purchase_orders_count?: number;
}

export interface PurchaseOrderItem {
  po_item_id: number;
  po_id: number;
  product_id: number;
  quantity_ordered: number | string;
  quantity_received: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  product?: Product;
}

export interface PurchaseOrder {
  po_id: number;
  po_number: string;
  store_id: number;
  supplier_id: number;
  user_id: number;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  total_amount: number | string;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  user?: User;
  items?: PurchaseOrderItem[];
}

export interface RefundItem {
  refund_item_id: number;
  refund_id: number;
  order_item_id: number;
  product_id: number;
  quantity: number | string;
  unit_price: number | string;
  refund_amount: number | string;
  restock_item: boolean;
  product?: Product;
}

export interface Refund {
  refund_id: number;
  refund_number: string;
  order_id: number;
  store_id: number;
  user_id: number;
  approved_by?: number;
  total_amount: number | string;
  reason_code: 'damaged_item' | 'wrong_item' | 'customer_dissatisfied' | 'cashier_error' | 'expired_product' | 'other';
  requires_approval: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at: string;
  order?: Order;
  user?: User;
  approver?: User;
  items?: RefundItem[];
}

export interface StockRequest {
  request_id: number;
  store_id: number;
  product_id: number;
  requested_by: number;
  requested_quantity: number | string;
  urgency: 'normal' | 'urgent' | 'critical';
  status: 'pending' | 'approved' | 'converted_to_po' | 'rejected';
  notes?: string;
  approved_by?: number;
  po_id?: number;
  created_at: string;
  product?: Product;
  requester?: User;
  approver?: User;
  purchase_order?: PurchaseOrder;
}

