import { Product } from '../types/inventory';
import { SaleTransaction } from '../types/demand';
import { formatDateISO } from '../utils/forecasting';

/**
 * Generates a realistic, deterministic 30-day Kirana sales history for sample products.
 * Used for demo and college viva presentations when real store history is not yet populated.
 * ALL RECORDS ARE EXPLICITLY MARKED with isSynthetic: true.
 */
export function generateSyntheticKiranaSales(products: Product[]): SaleTransaction[] {
  const transactions: SaleTransaction[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Velocity patterns per category/product type
  // [baseDailyUnits, weekendBoostMultiplier, zeroChance]
  const patternMap: Record<string, [number, number, number]> = {
    'prod-001': [14, 1.3, 0.0], // Amul Taaza Milk: Daily high volume, peak on weekends
    'prod-002': [3, 1.8, 0.2],  // Paneer: Higher on weekends
    'prod-003': [2, 1.5, 0.3],  // Dahi: Steady curd sales
    'prod-004': [2, 2.0, 0.1],  // Atta: Heavier on weekends
    'prod-005': [3, 1.2, 0.1],  // Tata Salt: Steady
    'prod-006': [2, 1.5, 0.2],  // Sunflower oil
    'prod-007': [1, 1.4, 0.4],  // Cow Ghee
    'prod-008': [2, 1.3, 0.3],  // Deggi Mirch
    'prod-009': [2, 2.2, 0.2],  // Pav Bhaji Masala: Strong weekend surge
    'prod-010': [6, 1.5, 0.0],  // Parle-G: High velocity snack
    'prod-011': [3, 1.6, 0.1],  // Haldiram Bhujia
    'prod-012': [4, 1.4, 0.0],  // Maggi Noodles
    'prod-013': [2, 1.3, 0.2],  // Red Label Tea
    'prod-014': [1, 1.2, 0.5],  // Bru Coffee
    'prod-015': [1, 1.7, 0.3],  // Surf Excel
    'prod-016': [4, 1.2, 0.1],  // Vim Bar
    'prod-017': [2, 1.4, 0.3],  // Dettol Soap
    'prod-018': [4, 1.4, 0.0],  // Modern Bread
  };

  // Generate for 30 historical days (from -30 days to -1 day)
  for (let d = 30; d >= 1; d--) {
    const txnDate = new Date(today);
    txnDate.setDate(txnDate.getDate() - d);
    const dateStr = formatDateISO(txnDate);
    const dayOfWeek = txnDate.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const product of products) {
      const [baseUnits, weekendMultiplier, zeroChance] =
        patternMap[product.id] || [2, 1.2, 0.2];

      // Pseudo-random deterministic noise based on day and product id
      const seed = (d * 17 + product.id.charCodeAt(product.id.length - 1) * 31) % 100;

      if (seed < zeroChance * 100) {
        // Zero sales day
        continue;
      }

      const variance = ((seed % 7) - 3) * 0.2; // -0.6 to +0.6
      const multiplier = isWeekend ? weekendMultiplier : 1.0;
      const rawUnits = Math.max(1, Math.round(baseUnits * multiplier + variance));

      transactions.push({
        id: `synth-${product.id}-${dateStr}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: rawUnits,
        unitPrice: product.sellingPrice,
        totalAmount: rawUnits * product.sellingPrice,
        saleDate: dateStr,
        timestamp: `${dateStr}T11:${String(seed % 60).padStart(2, '0')}:00.000Z`,
        isSynthetic: true,
        notes: 'Calibrated synthetic Kirana transaction for demonstration and testing',
      });
    }
  }

  return transactions;
}
