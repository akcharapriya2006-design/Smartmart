export interface DashboardSummary {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  pending_orders_count: number;
  recent_sales_today: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  order_count: number;
}

export interface CategorySharePoint {
  category_name: string;
  revenue: number;
  units_sold: number;
  percentage: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_sku: string;
  category_name: string;
  units_sold: number;
  total_revenue: number;
}

export interface CustomerSummary {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  default_address?: string;
  orders_count: number;
  total_spent: number;
  is_active: boolean;
  joined_at: string;
}

