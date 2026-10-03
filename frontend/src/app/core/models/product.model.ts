export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  category_id: number;
  category_name?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  image_url?: string;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface ProductFilterParams {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  low_stock_only?: boolean;
  sort_by?: string;
  page?: number;
  size?: number;
  include_inactive?: boolean;
}

export interface ProductCreateRequest {
  name: string;
  sku: string;
  description?: string;
  category_id: number;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductUpdateRequest {
  name?: string;
  sku?: string;
  description?: string;
  category_id?: number;
  price?: number;
  cost_price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  unit?: string;
  image_url?: string;
  is_active?: boolean;
}
