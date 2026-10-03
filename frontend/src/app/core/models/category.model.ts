export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}
