import { Product } from '../types/inventory';
import {
  SaleTransaction,
  DailyDemandPoint,
  ForecastDayPrediction,
  ModelMetrics,
  ReorderRecommendation,
  ProductForecast,
  CSVImportValidationResult,
  CSVImportRowError,
} from '../types/demand';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a local Date object
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Aggregates individual sale transactions into a complete daily time series for a product.
 * CRITICAL FOR KIRANA DATA:
 * - Starts from the product's earliest recorded transaction date (no synthetic zero-padding before history starts).
 * - Distinguishes days with recorded sales from calendar days.
 * - Handles days with zero demand within the observed date span.
 */
export function aggregateTransactionsToDailyDemand(
  transactions: SaleTransaction[],
  productId: string,
  minDaysToGenerate = 0
): DailyDemandPoint[] {
  const productTxns = transactions.filter((t) => t.productId === productId);
  if (productTxns.length === 0) {
    return [];
  }

  // Determine date bounds based on actual recorded transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = productTxns.map((t) => parseISODate(t.saleDate).getTime());
  const minTxnDate = new Date(Math.min(...dates));
  const maxTxnDate = new Date(Math.max(...dates));

  let earliestDate = new Date(minTxnDate);
  if (minDaysToGenerate > 0) {
    const minBound = new Date(today);
    minBound.setDate(minBound.getDate() - (minDaysToGenerate - 1));
    if (minBound < earliestDate) {
      earliestDate = minBound;
    }
  }

  // Aggregate by date string
  const aggregationMap = new Map<string, { quantity: number; revenue: number }>();
  for (const txn of productTxns) {
    const existing = aggregationMap.get(txn.saleDate) || { quantity: 0, revenue: 0 };
    existing.quantity += txn.quantity;
    existing.revenue += txn.totalAmount;
    aggregationMap.set(txn.saleDate, existing);
  }

  // End date is today (or latest transaction date if future/equal)
  const endDate = today > maxTxnDate ? today : maxTxnDate;

  // Build continuous series without date gaps
  const series: DailyDemandPoint[] = [];
  const currentDate = new Date(earliestDate);

  while (currentDate <= endDate) {
    const dateStr = formatDateISO(currentDate);
    const dayOfWeek = DAY_NAMES[currentDate.getDay()];
    const record = aggregationMap.get(dateStr);

    series.push({
      date: dateStr,
      dayOfWeek,
      quantity: record ? record.quantity : 0,
      revenue: record ? record.revenue : 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return series;
}

/**
 * Chronological Train/Test Split.
 * TIME-SERIES REQUIREMENT: Never randomly shuffle time-series data!
 * Takes the first (N - testDays) as train, and the last testDays as test.
 */
export function chronologicalTrainTestSplit(
  series: DailyDemandPoint[],
  testDays = 7
): { train: DailyDemandPoint[]; test: DailyDemandPoint[] } {
  if (series.length <= testDays) {
    // Insufficient data to hold out 7 days; split 70/30
    const splitIndex = Math.max(1, Math.floor(series.length * 0.7));
    return {
      train: series.slice(0, splitIndex),
      test: series.slice(splitIndex),
    };
  }

  const splitIndex = series.length - testDays;
  return {
    train: series.slice(0, splitIndex),
    test: series.slice(splitIndex),
  };
}

/**
 * Moving Average Baseline Model (SMA-7)
 * Predicts the mean of the last `window` historical points.
 */
export function calculateMovingAverageForecast(
  history: DailyDemandPoint[],
  forecastDays = 7,
  window = 7
): number[] {
  if (history.length === 0) {
    return Array(forecastDays).fill(0);
  }

  const slice = history.slice(-window);
  const sum = slice.reduce((acc, p) => acc + p.quantity, 0);
  const avg = Math.round((sum / slice.length) * 10) / 10;

  return Array(forecastDays).fill(avg);
}

/**
 * Day-of-Week Seasonal Moving Average Forecasting Model for Target Dates
 * Evaluates day-of-week multipliers on the exact chronological target dates.
 */
export function predictSeasonalDemandForDates(
  history: DailyDemandPoint[],
  targetDates: string[]
): ForecastDayPrediction[] {
  if (history.length === 0 || targetDates.length === 0) {
    return targetDates.map((dateStr) => {
      const d = parseISODate(dateStr);
      return {
        date: dateStr,
        dayOfWeek: DAY_NAMES[d.getDay()],
        predictedQuantity: 0,
        lowerBound: 0,
        upperBound: 0,
      };
    });
  }

  // Baseline demand from recent 14 days (or all if < 14)
  const recentSlice = history.slice(-14);
  const overallAvg =
    recentSlice.reduce((acc, p) => acc + p.quantity, 0) / (recentSlice.length || 1);

  // Day-of-week demand buckets
  const dayBuckets: number[][] = Array.from({ length: 7 }, () => []);
  for (const point of history) {
    const d = parseISODate(point.date);
    dayBuckets[d.getDay()].push(point.quantity);
  }

  // Calculate day-of-week seasonality factors
  const dayFactors = dayBuckets.map((bucket) => {
    if (bucket.length === 0 || overallAvg === 0) return 1.0;
    const bucketAvg = bucket.reduce((a, b) => a + b, 0) / bucket.length;
    return Math.min(2.2, Math.max(0.4, bucketAvg / overallAvg));
  });

  // Calculate historical residual variance for estimated uncertainty dispersion
  const residuals: number[] = [];
  for (let i = Math.min(7, Math.floor(history.length / 2)); i < history.length; i++) {
    const actual = history[i].quantity;
    const pointDate = parseISODate(history[i].date);
    const predicted = Math.max(0, overallAvg * dayFactors[pointDate.getDay()]);
    residuals.push(actual - predicted);
  }

  const variance =
    residuals.length > 0
      ? residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
      : 1.0;
  const stdError = Math.sqrt(variance);
  const dispersionMargin = Math.round(1.96 * stdError);

  return targetDates.map((dateStr) => {
    const d = parseISODate(dateStr);
    const dayIndex = d.getDay();
    const dayOfWeek = DAY_NAMES[dayIndex];

    const rawPred = overallAvg * dayFactors[dayIndex];
    const predictedQuantity = Math.max(0, Math.round(rawPred));

    // Estimated uncertainty range bounded at 0 and upperBound >= lowerBound
    const lowerBound = Math.max(0, predictedQuantity - dispersionMargin);
    const upperBound = Math.max(lowerBound, predictedQuantity + dispersionMargin);

    return {
      date: dateStr,
      dayOfWeek,
      predictedQuantity,
      lowerBound,
      upperBound,
    };
  });
}

/**
 * Predicts moving average demand for target dates using historical window
 */
export function predictMovingAverageForDates(
  history: DailyDemandPoint[],
  targetDates: string[],
  window = 7
): number[] {
  if (history.length === 0 || targetDates.length === 0) {
    return Array(targetDates.length).fill(0);
  }

  const slice = history.slice(-window);
  const sum = slice.reduce((acc, p) => acc + p.quantity, 0);
  const avg = Math.max(0, Math.round(sum / (slice.length || 1)));

  return Array(targetDates.length).fill(avg);
}

/**
 * Day-of-Week Seasonal Moving Average Forecasting Model (Next N calendar days)
 */
export function calculateSeasonalMovingAverageForecast(
  history: DailyDemandPoint[],
  forecastDays = 7
): ForecastDayPrediction[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDates: string[] = [];
  for (let i = 1; i <= forecastDays; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + i);
    futureDates.push(formatDateISO(targetDate));
  }

  return predictSeasonalDemandForDates(history, futureDates);
}

/**
 * Calculate Model Evaluation Metrics: MAE, RMSE, WAPE
 * MATHEMATICAL INTEGRITY RULES:
 * - MAE = (1/n) * sum(|actual - predicted|)
 * - RMSE = sqrt((1/n) * sum((actual - predicted)^2))
 * - WAPE = 100 * sum(|actual - predicted|) / sum(actual)
 * - If sum(actual) === 0: WAPE is null (unavailable / mathematically undefined).
 * - Stores unrounded values for precise mathematical comparison.
 */
export function calculateEvaluationMetrics(
  actual: number[],
  predicted: number[]
): ModelMetrics {
  const n = actual.length;
  if (n === 0) {
    return {
      mae: 0,
      rmse: 0,
      wape: null,
      unroundedMae: 0,
      unroundedRmse: 0,
      unroundedWape: null,
      testDaysEvaluated: 0,
    };
  }

  let absErrorSum = 0;
  let squaredErrorSum = 0;
  let actualSum = 0;

  for (let i = 0; i < n; i++) {
    const err = actual[i] - predicted[i];
    absErrorSum += Math.abs(err);
    squaredErrorSum += err * err;
    actualSum += actual[i];
  }

  const unroundedMae = absErrorSum / n;
  const unroundedRmse = Math.sqrt(squaredErrorSum / n);
  const mae = Math.round(unroundedMae * 100) / 100;
  const rmse = Math.round(unroundedRmse * 100) / 100;

  let wape: number | null = null;
  let unroundedWape: number | null = null;

  if (actualSum === 0) {
    // If total actual demand is zero, WAPE is unavailable rather than zero
    wape = null;
    unroundedWape = null;
  } else {
    unroundedWape = (100 * absErrorSum) / actualSum;
    wape = Math.round(unroundedWape * 10) / 10;
  }

  return {
    mae,
    rmse,
    wape,
    unroundedMae,
    unroundedRmse,
    unroundedWape,
    testDaysEvaluated: n,
  };
}

/**
 * Honest, unrounded model comparison between Seasonal Model and Baseline SMA-7
 * Compares using exact unrounded MAE values on the identical evaluation set.
 * Returns: 'tie', 'approx_equal', 'seasonal_better', or 'baseline_better'
 */
export function compareModels(
  seasonalMetrics: ModelMetrics,
  baselineMetrics: ModelMetrics
): {
  result: 'tie' | 'approx_equal' | 'seasonal_better' | 'baseline_better';
  maeDiff: number;
  explanation: string;
} {
  const unroundedDiff = baselineMetrics.unroundedMae - seasonalMetrics.unroundedMae;
  const absDiff = Math.abs(unroundedDiff);

  // 1. Identical test error
  if (absDiff === 0 || absDiff < 1e-9) {
    return {
      result: 'tie',
      maeDiff: 0,
      explanation: `Tie: Both models produced identical test error (MAE: ${seasonalMetrics.mae}).`,
    };
  }

  // 2. Negligible difference (< 0.05) or displayed rounded MAE values are equal
  // CRITICAL RULE: Never claim seasonal model outperformed baseline when their MAE values are equal!
  if (absDiff < 0.05 || seasonalMetrics.mae === baselineMetrics.mae) {
    return {
      result: 'approx_equal',
      maeDiff: Math.round(unroundedDiff * 1000) / 1000,
      explanation: `Performance approximately equal: Seasonal MAE (${seasonalMetrics.mae}) and Baseline MAE (${baselineMetrics.mae}) differ by only ${Math.round(absDiff * 1000) / 1000}.`,
    };
  }

  // 3. Seasonal model outperformed baseline
  if (unroundedDiff > 0) {
    return {
      result: 'seasonal_better',
      maeDiff: Math.round(unroundedDiff * 1000) / 1000,
      explanation: `Seasonal model outperformed baseline SMA-7 (MAE ${seasonalMetrics.mae} vs ${baselineMetrics.mae}, difference: ${Math.round(absDiff * 1000) / 1000}) by capturing day-of-week demand patterns.`,
    };
  }

  // 4. Baseline outperformed seasonal model
  return {
    result: 'baseline_better',
    maeDiff: Math.round(unroundedDiff * 1000) / 1000,
    explanation: `Baseline SMA-7 outperformed seasonal model (MAE ${baselineMetrics.mae} vs ${seasonalMetrics.mae}, difference: ${Math.round(absDiff * 1000) / 1000}). The simpler 7-day moving average generalized better on this test period.`,
  };
}

/**
 * Reorder Intelligence Formula:
 * Suggested Reorder = max(0, ceil(Lead Time Demand + Safety Stock - Current Stock))
 * Where:
 * - Lead Time Demand = Avg Daily Demand * Lead Time (days)
 * - Safety Stock = Avg Daily Demand * Safety Stock Days buffer
 *
 * Uses historical average daily demand consistently with displayed store metrics.
 */
export function calculateReorderRecommendation(
  currentStock: number,
  forecastSeries: ForecastDayPrediction[],
  leadTimeDays = 2,
  safetyStockDays = 3,
  historicalAvgDailyDemand?: number
): ReorderRecommendation {
  const totalForecast7d = forecastSeries.reduce((sum, p) => sum + p.predictedQuantity, 0);
  const forecastDailyAvg = forecastSeries.length > 0 ? totalForecast7d / forecastSeries.length : 0;

  // Consistent daily demand velocity: prefer stated historical daily demand when available
  const avgDailyDemand =
    historicalAvgDailyDemand !== undefined && historicalAvgDailyDemand > 0
      ? historicalAvgDailyDemand
      : forecastDailyAvg;

  const leadTimeDemand = Math.round(avgDailyDemand * leadTimeDays * 10) / 10;
  const safetyStockUnits = Math.round(avgDailyDemand * safetyStockDays * 10) / 10;
  const targetStockLevel = Math.ceil(leadTimeDemand + safetyStockUnits);

  const rawReorder = targetStockLevel - currentStock;
  const recommendedReorder = Math.max(0, Math.ceil(rawReorder));

  // Determine stockout day if stock is depleting
  let cumDemand = 0;
  let daysUntilStockout: number | null = null;

  for (let i = 0; i < forecastSeries.length; i++) {
    cumDemand += forecastSeries[i].predictedQuantity;
    if (cumDemand > currentStock) {
      daysUntilStockout = i + 1;
      break;
    }
  }

  let urgency: 'critical' | 'reorder_soon' | 'sufficient' = 'sufficient';
  let explanation = '';

  if (currentStock <= leadTimeDemand) {
    urgency = 'critical';
    explanation = `Current stock (${currentStock}) is below expected demand during supplier delivery lead time (${leadTimeDemand} units across ${leadTimeDays} days). Reorder immediately to avoid customer stockout.`;
  } else if (currentStock < targetStockLevel) {
    urgency = 'reorder_soon';
    explanation = `Current stock (${currentStock}) is sufficient for lead time (${leadTimeDemand} units) but below the safety stock target of ${targetStockLevel} units. Order ${recommendedReorder} units during next supplier visit.`;
  } else {
    urgency = 'sufficient';
    explanation = `Current stock (${currentStock}) comfortably covers the ${leadTimeDays}-day delivery lead time plus ${safetyStockDays}-day safety reserve (Target: ${targetStockLevel} units). No reorder needed.`;
  }

  return {
    currentStock,
    leadTimeDays,
    safetyStockDays,
    averageDailyDemand: Math.round(avgDailyDemand * 10) / 10,
    leadTimeDemand,
    safetyStockUnits,
    targetStockLevel,
    recommendedReorder,
    daysUntilStockout,
    urgency,
    explanation,
  };
}

/**
 * Builds complete ProductForecast bundle for a product.
 */
export function buildProductForecast(
  product: Product,
  transactions: SaleTransaction[],
  leadTimeDays = 2,
  safetyStockDays = 3
): ProductForecast {
  const productTxns = transactions.filter((t) => t.productId === product.id);
  const hasAnySales = productTxns.length > 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDates: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + i);
    futureDates.push(formatDateISO(targetDate));
  }

  // Handle products with NO sales history
  if (!hasAnySales) {
    const zeroForecast: ForecastDayPrediction[] = futureDates.map((dateStr) => {
      const d = parseISODate(dateStr);
      return {
        date: dateStr,
        dayOfWeek: DAY_NAMES[d.getDay()],
        predictedQuantity: 0,
        lowerBound: 0,
        upperBound: 0,
      };
    });

    const emptyMetrics: ModelMetrics = {
      mae: 0,
      rmse: 0,
      wape: null,
      unroundedMae: 0,
      unroundedRmse: 0,
      unroundedWape: null,
      testDaysEvaluated: 0,
    };

    const emptyComparison = {
      result: 'tie' as const,
      maeDiff: 0,
      explanation: 'No sales records available for model evaluation.',
    };

    const reorder = calculateReorderRecommendation(
      product.quantity,
      zeroForecast,
      leadTimeDays,
      safetyStockDays,
      0
    );

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      currentStock: product.quantity,
      hasSufficientData: false,
      calendarDaysCount: 0,
      activeSalesDaysCount: 0,
      avgDailyDemandCalendar: 0,
      avgDailyDemandActive: 0,
      totalHistoricalUnitsSold: 0,
      historicalSeries: [],
      forecastSeries: zeroForecast,
      totalForecastQuantity: 0,
      forecastMethod: 'No Historical Data',
      metrics: emptyMetrics,
      baselineMetrics: emptyMetrics,
      modelComparison: emptyComparison,
      reorder,
      explanation: 'No sales recorded for this product yet. Record counter sales or import daily sales history to generate demand projections.',
    };
  }

  // Build daily series starting strictly from the first recorded transaction
  const dailySeries = aggregateTransactionsToDailyDemand(transactions, product.id, 0);
  const totalUnitsSold = dailySeries.reduce((sum, d) => sum + d.quantity, 0);
  const calendarDaysCount = dailySeries.length;
  const activeSalesDaysCount = dailySeries.filter((d) => d.quantity > 0).length;

  const avgDailyDemandCalendar =
    calendarDaysCount > 0 ? Math.round((totalUnitsSold / calendarDaysCount) * 10) / 10 : 0;
  const avgDailyDemandActive =
    activeSalesDaysCount > 0 ? Math.round((totalUnitsSold / activeSalesDaysCount) * 10) / 10 : 0;

  // Stated historical average daily demand across calendar days (or active days if 1 day)
  const statedAvgDailyDemand =
    avgDailyDemandCalendar > 0 ? avgDailyDemandCalendar : avgDailyDemandActive;

  // Check data sufficiency: needs at least 7 calendar days history and at least 3 active sales days
  const hasSufficientData = calendarDaysCount >= 7 && activeSalesDaysCount >= 3;

  // 1. Chronological Train / Test Split for model validation (No future leakage!)
  const { train, test } = chronologicalTrainTestSplit(dailySeries, 7);

  // 2. Generate predictions on exact test set dates to compute actual accuracy
  const testDates = test.map((t) => t.date);
  const testActual = test.map((t) => t.quantity);

  const testSeasonalPred = predictSeasonalDemandForDates(train, testDates).map(
    (p) => p.predictedQuantity
  );
  const testBaselinePred = predictMovingAverageForDates(train, testDates, 7);

  const modelMetrics = calculateEvaluationMetrics(testActual, testSeasonalPred);
  const baselineMetrics = calculateEvaluationMetrics(testActual, testBaselinePred);
  const modelComparison = compareModels(modelMetrics, baselineMetrics);

  // 3. Generate future 7-day forecast from full history
  const futureForecast = predictSeasonalDemandForDates(dailySeries, futureDates);
  // Total is the exact sum of the 7 daily forecast predictions
  const totalForecastQuantity = futureForecast.reduce((sum, p) => sum + p.predictedQuantity, 0);

  // 4. Calculate reorder recommendations using stated historical average daily demand
  const reorder = calculateReorderRecommendation(
    product.quantity,
    futureForecast,
    leadTimeDays,
    safetyStockDays,
    statedAvgDailyDemand
  );

  let explanation = '';
  if (!hasSufficientData) {
    explanation = `Sparse sales history (${activeSalesDaysCount} active sales days recorded over ${calendarDaysCount} calendar days). Forecast uses baseline moving average. Recording daily sales improves accuracy.`;
  } else {
    explanation = `Over ${calendarDaysCount} calendar days (${activeSalesDaysCount} days with recorded sales), total historical sales = ${totalUnitsSold} ${product.unit}s. Average demand velocity is ${avgDailyDemandCalendar} ${product.unit}s/calendar day (${avgDailyDemandActive} ${product.unit}s/active sales day). Reorder buffer is based on ${statedAvgDailyDemand} ${product.unit}s/day across ${leadTimeDays}d lead time (${reorder.leadTimeDemand} units) + ${safetyStockDays}d safety buffer (${reorder.safetyStockUnits} units). 7-day projected demand is ${totalForecastQuantity} ${product.unit}s.`;
  }

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    unit: product.unit,
    currentStock: product.quantity,
    hasSufficientData,
    calendarDaysCount,
    activeSalesDaysCount,
    avgDailyDemandCalendar,
    avgDailyDemandActive,
    totalHistoricalUnitsSold: totalUnitsSold,
    historicalSeries: dailySeries,
    forecastSeries: futureForecast,
    totalForecastQuantity,
    forecastMethod: hasSufficientData
      ? '7-Day Seasonal Moving Average'
      : 'Insufficient Data Baseline',
    metrics: modelMetrics,
    baselineMetrics,
    modelComparison,
    reorder,
    explanation,
  };
}

/**
 * Validates and parses Sales CSV import.
 * Checks:
 * - Required headers: date, product (id or name), quantity, unit_price
 * - Date format YYYY-MM-DD
 * - Quantity is a positive integer (> 0)
 * - Unit price is a positive number
 * - Product matches an existing catalogue product
 * - Detects duplicate records
 */
export function validateSalesCSV(
  csvContent: string,
  existingProducts: Product[]
): CSVImportValidationResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      isValid: false,
      totalRows: 0,
      validTransactions: [],
      errors: [{ rowNumber: 1, rawText: lines[0] || '', errors: ['CSV file is empty or missing data rows.'] }],
    };
  }

  // Parse header line
  const rawHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const dateIdx = rawHeaders.findIndex((h) => h === 'date' || h === 'sale_date' || h === 'transaction_date');
  const productIdx = rawHeaders.findIndex(
    (h) => h === 'product' || h === 'product_name' || h === 'product_id' || h === 'item'
  );
  const qtyIdx = rawHeaders.findIndex((h) => h === 'quantity' || h === 'qty' || h === 'units_sold');
  const priceIdx = rawHeaders.findIndex(
    (h) => h === 'price' || h === 'unit_price' || h === 'selling_price' || h === 'rate'
  );

  const headerErrors: string[] = [];
  if (dateIdx === -1) headerErrors.push("Missing required header 'date'");
  if (productIdx === -1) headerErrors.push("Missing required header 'product' or 'product_name'");
  if (qtyIdx === -1) headerErrors.push("Missing required header 'quantity'");

  if (headerErrors.length > 0) {
    return {
      isValid: false,
      totalRows: lines.length - 1,
      validTransactions: [],
      errors: [{ rowNumber: 1, rawText: lines[0], errors: headerErrors }],
    };
  }

  // Create lookups for product resolution
  const productById = new Map<string, Product>();
  const productByName = new Map<string, Product>();
  for (const p of existingProducts) {
    productById.set(p.id.toLowerCase(), p);
    productByName.set(p.name.toLowerCase().trim(), p);
  }

  const validTransactions: SaleTransaction[] = [];
  const errors: CSVImportRowError[] = [];
  const seenKeys = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple CSV row parser handling quotes
    const cells: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const rowErrors: string[] = [];

    // 1. Date Validation
    const rawDate = (cells[dateIdx] || '').replace(/^["']|["']$/g, '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      rowErrors.push(`Invalid date format '${rawDate}'. Expected YYYY-MM-DD.`);
    } else {
      const d = parseISODate(rawDate);
      if (isNaN(d.getTime())) {
        rowErrors.push(`Date '${rawDate}' is not a valid calendar date.`);
      }
    }

    // 2. Product Match Validation
    const rawProduct = (cells[productIdx] || '').replace(/^["']|["']$/g, '').trim();
    if (!rawProduct) {
      rowErrors.push('Product identifier is missing.');
    }

    let matchedProduct: Product | undefined;
    if (rawProduct) {
      matchedProduct =
        productById.get(rawProduct.toLowerCase()) ||
        productByName.get(rawProduct.toLowerCase()) ||
        existingProducts.find(
          (p) =>
            p.name.toLowerCase().includes(rawProduct.toLowerCase()) ||
            rawProduct.toLowerCase().includes(p.name.toLowerCase())
        );

      if (!matchedProduct) {
        rowErrors.push(
          `Product '${rawProduct}' not found in store catalogue. Add product to inventory first.`
        );
      }
    }

    // 3. Quantity Validation
    const rawQty = (cells[qtyIdx] || '').replace(/^["']|["']$/g, '').trim();
    const qtyNum = parseInt(rawQty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      rowErrors.push(`Quantity '${rawQty}' must be a positive integer greater than 0.`);
    }

    // 4. Price Validation
    let unitPrice = matchedProduct ? matchedProduct.sellingPrice : 0;
    if (priceIdx !== -1 && cells[priceIdx]) {
      const rawPrice = cells[priceIdx].replace(/^["']|["']$/g, '').trim();
      const parsedPrice = parseFloat(rawPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        rowErrors.push(`Unit price '${rawPrice}' is invalid.`);
      } else {
        unitPrice = parsedPrice;
      }
    }

    // 5. Duplicate Check
    const duplicateKey = `${rawDate}|${rawProduct.toLowerCase()}|${qtyNum}`;
    if (seenKeys.has(duplicateKey)) {
      rowErrors.push(`Duplicate record detected in CSV for '${rawProduct}' on ${rawDate}.`);
    } else {
      seenKeys.add(duplicateKey);
    }

    if (rowErrors.length > 0) {
      errors.push({
        rowNumber: i + 1,
        rawText: rawLine,
        errors: rowErrors,
      });
    } else if (matchedProduct) {
      validTransactions.push({
        id: `csv-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        category: matchedProduct.category,
        quantity: qtyNum,
        unitPrice,
        totalAmount: qtyNum * unitPrice,
        saleDate: rawDate,
        timestamp: new Date().toISOString(),
        isSynthetic: false,
        notes: 'Imported from CSV daily sales history',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    totalRows: lines.length - 1,
    validTransactions,
    errors,
  };
}
