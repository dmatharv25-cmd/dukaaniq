export type ProductCategory =
  | 'Dairy & Cold Storage'
  | 'Staples & Grains'
  | 'Edible Oils & Ghee'
  | 'Spices & Masalas'
  | 'Snacks & Biscuits'
  | 'Beverages & Tea'
  | 'Cleaning & Household'
  | 'Personal Care';

export type ProductUnit = 'packet' | 'kg' | 'g' | 'liter' | 'ml' | 'piece' | 'bottle' | 'box';

export type StockHealth = 'in_stock' | 'low_stock' | 'out_of_stock';
export type ExpiryHealth = 'safe' | 'expiring_soon' | 'expired';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  purchasePrice: number; // Wholesale cost per unit in ₹
  sellingPrice: number;  // MRP / Retail price per unit in ₹
  quantity: number;      // Current stock on shelf / godown
  unit: ProductUnit;     // Unit of measurement
  minThreshold: number;  // Reorder level (alert when quantity <= minThreshold)
  expiryDate: string;    // YYYY-MM-DD
  batchNumber?: string;  // Optional batch or shelf location
  notes?: string;        // Optional remarks (e.g., 'Distributor: Amul Daily Route')
  updatedAt: string;     // ISO timestamp
}

export type StatusFilter = 'all' | 'low_stock' | 'expiring_soon' | 'expired' | 'in_stock';

export type SortField = 'name' | 'quantity' | 'expiryDate' | 'sellingPrice' | 'totalValue';
export type SortOrder = 'asc' | 'desc';

export interface InventoryStats {
  totalProducts: number;
  totalQuantity: number;
  totalWholesaleValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  averageMarginPercent: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}
