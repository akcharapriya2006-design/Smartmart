export type OrderType = 'HOME_DELIVERY' | 'STORE_PICKUP';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export type PaymentMethod =
  | 'SIMULATED_CARD'
  | 'SIMULATED_UPI'
  | 'CASH_ON_DELIVERY'
  | 'CASH_ON_PICKUP';

export interface OrderItem {
  id: number;
  product_id?: number | null;
  product_name: string;
  product_sku: string;
  sku?: string;
  unit_price: number;
  price?: number;
  quantity: number;
  total_price: number;
  image_url?: string | null;
  product_image?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number | null;
  customer_name?: string;
  customer_email?: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total_amount: number;
  delivery_address?: string | null;
  pickup_time_slot?: string | null;
  notes?: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CheckoutRequest {
  order_type: OrderType;
  delivery_address?: string;
  pickup_time_slot?: string;
  payment_method: PaymentMethod;
  payment_details?: any;
  notes?: string;
}
