export type TransactionType =
  | 'PURCHASE_ORDER'
  | 'SALE'
  | 'RETURN'
  | 'MANUAL_ADJUSTMENT'
  | 'DAMAGE';

export interface StockLevel {
  product_id: number;
  name: string;
  sku: string;
  category_name?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  is_low_stock: boolean;
  price: number;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  change_quantity: number;
  transaction_type: TransactionType;
  reference_id?: string;
  note?: string;
  created_at: string;
  created_by_name?: string;
}

export interface LowStockAlertSummary {
  total_low_stock_count: number;
  critical_out_of_stock_count: number;
  alerts: StockLevel[];
}

export interface RestockRequest {
  product_id: number;
  quantity: number;
  note?: string;
}
