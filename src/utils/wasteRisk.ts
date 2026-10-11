import type { Product } from '../types/inventory';
import type { ProductForecast } from '../types/demand';

export type WasteRiskLevel = 'expired' | 'high' | 'medium' | 'low' | 'none' | 'unknown';

export interface WasteRisk {
  level: WasteRiskLevel;
  daysUntilExpiry: number;
  expectedDemandUntilExpiry: number;
  unitsAtRisk: number;
  percentAtRisk: number;
  valueAtRisk: number;
  usedExtrapolation: boolean;
  suggestion: string;
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function calculateWasteRisk(
  product: Pick<Product, 'quantity' | 'expiryDate' | 'purchasePrice'>,
  forecast: Pick<ProductForecast, 'forecastSeries' | 'hasSufficientData'>,
  today: string = todayISO()
): WasteRisk {
  const stock = Math.max(0, product.quantity);
  const daysUntilExpiry = dayNumber(product.expiryDate) - dayNumber(today);

  if (stock === 0) {
    return { level: 'none', daysUntilExpiry, expectedDemandUntilExpiry: 0, unitsAtRisk: 0, percentAtRisk: 0, valueAtRisk: 0, usedExtrapolation: false, suggestion: 'No stock on hand.' };
  }

  if (daysUntilExpiry < 0) {
    return { level: 'expired', daysUntilExpiry, expectedDemandUntilExpiry: 0, unitsAtRisk: stock, percentAtRisk: 100, valueAtRisk: round1(stock * product.purchasePrice), usedExtrapolation: false, suggestion: 'Already expired. Remove from sale and follow store policy.' };
  }

  if (!forecast.hasSufficientData) {
    return { level: 'unknown', daysUntilExpiry, expectedDemandUntilExpiry: 0, unitsAtRisk: 0, percentAtRisk: 0, valueAtRisk: 0, usedExtrapolation: false, suggestion: 'Not enough sales history to estimate waste risk.' };
  }

  const series = forecast.forecastSeries;
  const inWindow = series
    .filter(p => dayNumber(p.date) <= dayNumber(today) + daysUntilExpiry)
    .reduce((sum, p) => sum + p.predictedQuantity, 0);

  let demand = inWindow;
  let usedExtrapolation = false;
  if (daysUntilExpiry > series.length && series.length > 0) {
    const avg = series.reduce((s, p) => s + p.predictedQuantity, 0) / series.length;
    demand += avg * (daysUntilExpiry - series.length);
    usedExtrapolation = true;
  }

  const unitsAtRisk = round1(Math.max(0, stock - demand));
  const percentAtRisk = round1((unitsAtRisk / stock) * 100);
  const valueAtRisk = round1(unitsAtRisk * product.purchasePrice);

  let level: WasteRiskLevel = 'none';
  let suggestion = 'Expected to sell before expiry.';
  if (percentAtRisk >= 50) {
    level = 'high';
    suggestion = 'Likely waste. Consider a discount, a bundle offer, or returning to the distributor.';
  } else if (percentAtRisk >= 20) {
    level = 'medium';
    suggestion = 'Some stock may go unsold. Move it to a visible shelf or run a small promotion.';
  } else if (percentAtRisk > 0) {
    level = 'low';
    suggestion = 'Small amount may go unsold. Monitor sales.';
  }

  return { level, daysUntilExpiry, expectedDemandUntilExpiry: round1(demand), unitsAtRisk, percentAtRisk, valueAtRisk, usedExtrapolation, suggestion };
}
