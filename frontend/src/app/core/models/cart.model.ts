export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  stock_available: number;
  image_url?: string;
  unit: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  estimated_tax: number;
  delivery_fee: number;
  estimated_total: number;
  item_count: number;
  free_delivery_threshold: number;
  amount_needed_for_free_delivery: number;
}
