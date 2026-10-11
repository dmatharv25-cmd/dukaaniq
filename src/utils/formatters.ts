import { Product, StockHealth, ExpiryHealth } from '../types/inventory';

/**
 * Format a number into Indian Rupee currency string (e.g. ₹1,25,000)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency with 2 decimal precision where needed
 */
export function formatINRDecimal(amount: number): string {
  if (isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Returns the difference in calendar days from today to the expiry date.
 * Negative number means expired in the past.
 * 0 means expires today.
 * Positive means expires in N days.
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = expiryDateStr.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD date string to readable format e.g. "15 Oct 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates profit margin percentage: ((Selling - Cost) / Selling) * 100
 */
export function calculateMarginPercent(purchasePrice: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  const margin = ((sellingPrice - purchasePrice) / sellingPrice) * 100;
  return Math.round(margin * 10) / 10;
}

/**
 * Determine stock status
 */
export function getStockStatus(product: Product): StockHealth {
  if (product.quantity <= 0) return 'out_of_stock';
  if (product.quantity <= product.minThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Determine expiry status
 * Critical/Expired: < 0 days
 * Expiring Soon: <= 15 days
 * Safe: > 15 days
 */
export function getExpiryStatus(expiryDateStr: string): ExpiryHealth {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days < 0) return 'expired';
  if (days <= 15) return 'expiring_soon';
  return 'safe';
}

/**
 * Helper to generate relative ISO date string (YYYY-MM-DD) for sample data
 */
export function getRelativeDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
