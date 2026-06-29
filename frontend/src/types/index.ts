// Shared TypeScript types matching backend schemas

export type UserRole = 'customer' | 'restaurant_admin' | 'delivery_agent' | 'superadmin';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CARD' | 'UPI' | 'CASH' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  address?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Restaurant {
  id: string;
  owner_id?: string;
  name: string;
  cuisine: string;
  address: string;
  phone?: string;
  image_url?: string;
  rating: number;
  is_active: boolean;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  image_url?: string;
}

export interface OrderItem {
  id: string;
  menu_item_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  paid_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_agent_id?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string;
  special_notes?: string;
  created_at?: string;
  updated_at?: string;
  items: OrderItem[];
  payment?: Payment;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  delivered_orders: number;
  total_customers: number;
  recent_orders: Order[];
}

// Cart
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
