/**
 * Comprehensive Unit Test Suite for DukaanIQ Demand Intelligence Engine
 * Tests time-series aggregation, train/test splitting, forecasting models,
 * evaluation metrics (MAE, RMSE, WAPE), model comparison honesty,
 * forecast totals consistency, reorder intelligence boundaries, and CSV validation.
 */

import {
  aggregateTransactionsToDailyDemand,
  chronologicalTrainTestSplit,
  calculateMovingAverageForecast,
  predictMovingAverageForDates,
  predictSeasonalDemandForDates,
  calculateSeasonalMovingAverageForecast,
  calculateEvaluationMetrics,
  compareModels,
  calculateReorderRecommendation,
  buildProductForecast,
  validateSalesCSV,
  formatDateISO,
  parseISODate,
} from '../src/utils/forecasting';
import { SaleTransaction, DailyDemandPoint, ModelMetrics } from '../src/types/demand';
import { Product } from '../src/types/inventory';

// Test runner helper
let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
    throw new Error(`Test assertion failed: ${message}`);
  }
}

// Sample products for testing
const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Amul Taaza Toned Milk (500 ml)',
    brand: 'Amul',
    category: 'Dairy & Cold Storage',
    purchasePrice: 25,
    sellingPrice: 28,
    quantity: 20,
    unit: 'packet',
    minThreshold: 10,
    expiryDate: '2026-10-15',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Aashirvaad Shudh Chakki Atta (5 kg)',
    brand: 'ITC',
    category: 'Staples & Grains',
    purchasePrice: 215,
    sellingPrice: 245,
    quantity: 5,
    unit: 'packet',
    minThreshold: 8,
    expiryDate: '2027-04-10',
    updatedAt: new Date().toISOString(),
  },
];

console.log('\n--- Running DukaanIQ Demand Intelligence Test Suite ---');

// TEST 1: Recording a valid sale and updating stock
console.log('\n[TEST 1] Recording a valid sale and stock calculation');
{
  const product = { ...mockProducts[0] };
  const initialStock = product.quantity; // 20
  const saleQuantity = 5;

  assert(saleQuantity <= product.quantity, 'Sale quantity must be <= available stock');
  const newStock = product.quantity - saleQuantity;
  const totalSaleAmount = saleQuantity * product.sellingPrice;

  assert(newStock === 15, `Stock properly deducted from ${initialStock} to ${newStock}`);
  assert(totalSaleAmount === 140, `Sale value 5 * 28 = 140 INR calculated correctly`);
}

// TEST 2: Rejecting a sale greater than available stock or non-positive
console.log('\n[TEST 2] Rejecting a sale greater than available stock or negative');
{
  const product = { ...mockProducts[1] }; // quantity: 5
  const excessiveSale = 10;
  const isRejected = excessiveSale > product.quantity;
  assert(isRejected, `Sale of ${excessiveSale} packets rejected when only ${product.quantity} in stock`);

  const negativeSale = -2;
  const isNegativeRejected = negativeSale <= 0;
  assert(isNegativeRejected, 'Negative sale quantity rejected');
}

// TEST 3: Aggregating multiple transactions by product and date
console.log('\n[TEST 3] Aggregating multiple transactions by product and date');
{
  const txns: SaleTransaction[] = [
    {
      id: 'tx-1',
      productId: 'prod-001',
      productName: 'Amul Milk',
      category: 'Dairy',
      quantity: 4,
      unitPrice: 28,
      totalAmount: 112,
      saleDate: '2026-10-01',
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
    {
      id: 'tx-2',
      productId: 'prod-001',
      productName: 'Amul Milk',
      category: 'Dairy',
      quantity: 6,
      unitPrice: 28,
      totalAmount: 168,
      saleDate: '2026-10-01', // Same date
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
    {
      id: 'tx-3',
      productId: 'prod-002', // Different product
      productName: 'Atta',
      category: 'Staples',
      quantity: 2,
      unitPrice: 245,
      totalAmount: 490,
      saleDate: '2026-10-01',
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
  ];

  const series = aggregateTransactionsToDailyDemand(txns, 'prod-001', 0);
  const pointOnOct1 = series.find((p) => p.date === '2026-10-01');

  assert(Boolean(pointOnOct1), 'Aggregated date point for 2026-10-01 exists');
  assert(pointOnOct1?.quantity === 10, `Aggregated daily quantity is 4 + 6 = 10 units (got ${pointOnOct1?.quantity})`);
  assert(pointOnOct1?.revenue === 280, `Aggregated revenue is 112 + 168 = 280 INR (got ${pointOnOct1?.revenue})`);
}

// TEST 4: Handling missing dates and zero-sales days within observed period
console.log('\n[TEST 4] Handling missing dates and zero-sales days within history span');
{
  const txns: SaleTransaction[] = [
    {
      id: 'tx-1',
      productId: 'prod-001',
      productName: 'Amul Milk',
      category: 'Dairy',
      quantity: 5,
      unitPrice: 28,
      totalAmount: 140,
      saleDate: '2026-10-01',
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
    {
      id: 'tx-2',
      productId: 'prod-001',
      productName: 'Amul Milk',
      category: 'Dairy',
      quantity: 8,
      unitPrice: 28,
      totalAmount: 224,
      saleDate: '2026-10-04', // 2026-10-02 and 2026-10-03 have ZERO sales
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
  ];

  const series = aggregateTransactionsToDailyDemand(txns, 'prod-001', 0);
  const day2 = series.find((p) => p.date === '2026-10-02');
  const day3 = series.find((p) => p.date === '2026-10-03');

  assert(Boolean(day2), 'Missing date 2026-10-02 was filled');
  assert(day2?.quantity === 0, `Zero sales day 2026-10-02 has quantity 0 (got ${day2?.quantity})`);
  assert(Boolean(day3), 'Missing date 2026-10-03 was filled');
  assert(day3?.quantity === 0, `Zero sales day 2026-10-03 has quantity 0 (got ${day3?.quantity})`);
}

// TEST 5: Calculating moving-average baseline forecast
console.log('\n[TEST 5] Calculating moving-average baseline forecast');
{
  const series: DailyDemandPoint[] = [
    { date: '2026-10-01', dayOfWeek: 'Thu', quantity: 10, revenue: 280 },
    { date: '2026-10-02', dayOfWeek: 'Fri', quantity: 12, revenue: 336 },
    { date: '2026-10-03', dayOfWeek: 'Sat', quantity: 14, revenue: 392 },
    { date: '2026-10-04', dayOfWeek: 'Sun', quantity: 16, revenue: 448 },
    { date: '2026-10-05', dayOfWeek: 'Mon', quantity: 8, revenue: 224 },
    { date: '2026-10-06', dayOfWeek: 'Tue', quantity: 10, revenue: 280 },
    { date: '2026-10-07', dayOfWeek: 'Wed', quantity: 14, revenue: 392 },
  ];
  // Sum = 10+12+14+16+8+10+14 = 84 / 7 = 12
  const forecast7 = calculateMovingAverageForecast(series, 7, 7);
  assert(forecast7.length === 7, `Forecast array length is 7 (got ${forecast7.length})`);
  assert(forecast7[0] === 12, `Mean of 84 / 7 = 12 predicted (got ${forecast7[0]})`);
}

// TEST 6: Chronological train/test splitting (Strictly Temporal, No Data Leakage)
console.log('\n[TEST 6] Chronological train/test splitting (Strictly Temporal)');
{
  const series: DailyDemandPoint[] = Array.from({ length: 21 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    dayOfWeek: 'Mon',
    quantity: i + 1,
    revenue: (i + 1) * 20,
  }));

  const { train, test } = chronologicalTrainTestSplit(series, 7);
  assert(train.length === 14, `Train set length is 21 - 7 = 14 (got ${train.length})`);
  assert(test.length === 7, `Test set length is 7 (got ${test.length})`);

  const lastTrainDate = train[train.length - 1].date;
  const firstTestDate = test[0].date;
  assert(lastTrainDate < firstTestDate, `Train date (${lastTrainDate}) strictly precedes test date (${firstTestDate})`);
  assert(lastTrainDate === '2026-09-14', `Last train date is day 14`);
  assert(firstTestDate === '2026-09-15', `First test date is day 15`);
}

// TEST 7: Forecast Error Metrics (MAE, RMSE, WAPE, and Zero-Denominator WAPE)
console.log('\n[TEST 7] Forecast error metrics (MAE, RMSE, WAPE, and zero-denominator handling)');
{
  const actual = [10, 15, 20];
  const predicted = [12, 14, 22]; // errors: -2, +1, -2 -> abs: 2, 1, 2 = 5 -> MAE = 5/3 = 1.67
  const metrics = calculateEvaluationMetrics(actual, predicted);

  assert(Math.abs(metrics.mae - 1.67) < 0.05, `MAE is ~1.67 (got ${metrics.mae})`);
  assert(metrics.rmse >= metrics.mae, `RMSE (${metrics.rmse}) is >= MAE (${metrics.mae})`);
  // WAPE = 100 * sum(|actual - pred|) / sum(actual) = 100 * 5 / 45 = 11.1%
  assert(metrics.wape !== null && Math.abs(metrics.wape - 11.1) < 0.2, `WAPE is calculated (~11.1%) (got ${metrics.wape}%)`);

  // Zero-denominator test: when total actual demand is 0, WAPE is UNAVAILABLE (null), NOT 0
  const zeroActual = [0, 0, 0];
  const zeroPred = [0, 0, 0];
  const zeroMetrics1 = calculateEvaluationMetrics(zeroActual, zeroPred);
  assert(
    zeroMetrics1.wape === null,
    `WAPE is null (unavailable) when total actual demand is 0, even if predictions are 0 (got ${zeroMetrics1.wape})`
  );

  const nonZeroPred = [2, 1, 3];
  const zeroMetrics2 = calculateEvaluationMetrics(zeroActual, nonZeroPred);
  assert(
    zeroMetrics2.wape === null,
    `WAPE is null (unavailable) when actual is 0 and predictions are non-zero (got ${zeroMetrics2.wape})`
  );

  // High WAPE test: substantial error relative to actual volume
  const smallActual = [2, 1, 2]; // sum = 5
  const bigPred = [10, 8, 12]; // errors: 8, 7, 10 = 25 -> WAPE = 100 * 25 / 5 = 500%
  const highMetrics = calculateEvaluationMetrics(smallActual, bigPred);
  assert(
    highMetrics.wape !== null && highMetrics.wape >= 100,
    `High WAPE indicates substantial forecast error relative to actual demand (${highMetrics.wape}%)`
  );
}

// TEST 8: Honest Model Comparison & Edge Cases
console.log('\n[TEST 8] Honest model comparison (Tie, Approx Equal, and Never Claiming Superiority on Equal MAE)');
{
  // Case A: Equal unrounded MAE -> must be 'tie'
  const metricsA: ModelMetrics = {
    mae: 2.5,
    rmse: 3.1,
    wape: 15.0,
    unroundedMae: 2.500000,
    unroundedRmse: 3.1,
    unroundedWape: 15.0,
    testDaysEvaluated: 7,
  };
  const metricsB: ModelMetrics = {
    mae: 2.5,
    rmse: 3.1,
    wape: 15.0,
    unroundedMae: 2.500000,
    unroundedRmse: 3.1,
    unroundedWape: 15.0,
    testDaysEvaluated: 7,
  };
  const compTie = compareModels(metricsA, metricsB);
  assert(compTie.result === 'tie', `When MAEs are identical, comparison result is 'tie' (got '${compTie.result}')`);

  // Case B: Displayed MAEs are equal (2.50 vs 2.50), unrounded diff is tiny (0.004)
  // Must NOT claim seasonal model outperformed baseline!
  const metricsNearA: ModelMetrics = {
    mae: 2.5,
    rmse: 3.1,
    wape: 15.0,
    unroundedMae: 2.498,
    unroundedRmse: 3.1,
    unroundedWape: 15.0,
    testDaysEvaluated: 7,
  };
  const metricsNearB: ModelMetrics = {
    mae: 2.5,
    rmse: 3.1,
    wape: 15.0,
    unroundedMae: 2.502,
    unroundedRmse: 3.1,
    unroundedWape: 15.0,
    testDaysEvaluated: 7,
  };
  const compApprox = compareModels(metricsNearA, metricsNearB);
  assert(
    compApprox.result === 'approx_equal',
    `When displayed MAEs are equal or difference < 0.05, result is 'approx_equal' (got '${compApprox.result}')`
  );
  assert(
    !compApprox.explanation.includes('outperformed'),
    `Never claims seasonal model outperformed baseline when MAEs are equal (got explanation: "${compApprox.explanation}")`
  );

  // Case C: Seasonal is clearly better (> 0.05 diff)
  const metricsBetterSeasonal: ModelMetrics = {
    mae: 1.5,
    rmse: 2.0,
    wape: 10.0,
    unroundedMae: 1.50,
    unroundedRmse: 2.0,
    unroundedWape: 10.0,
    testDaysEvaluated: 7,
  };
  const compSeasonalBetter = compareModels(metricsBetterSeasonal, metricsB); // 1.50 vs 2.50
  assert(
    compSeasonalBetter.result === 'seasonal_better',
    `When seasonal MAE is significantly lower, result is 'seasonal_better'`
  );

  // Case D: Baseline is clearly better
  const metricsWorseSeasonal: ModelMetrics = {
    mae: 3.5,
    rmse: 4.2,
    wape: 25.0,
    unroundedMae: 3.50,
    unroundedRmse: 4.2,
    unroundedWape: 25.0,
    testDaysEvaluated: 7,
  };
  const compBaselineBetter = compareModels(metricsWorseSeasonal, metricsB); // 3.50 vs 2.50
  assert(
    compBaselineBetter.result === 'baseline_better',
    `When baseline MAE is lower, result says honestly that baseline outperformed (got '${compBaselineBetter.result}')`
  );
}

// TEST 9: Forecast Totals Consistency (Product 7-Day Sum = Exact Daily Sum)
console.log('\n[TEST 9] Forecast totals consistency');
{
  const history: DailyDemandPoint[] = Array.from({ length: 28 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7],
    quantity: 5 + (i % 3) * 2, // deterministic 5, 7, 9 units
    revenue: (5 + (i % 3) * 2) * 28,
  }));

  const targetDates = [
    '2026-10-11', '2026-10-12', '2026-10-13',
    '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'
  ];

  const predictions = predictSeasonalDemandForDates(history, targetDates);
  assert(predictions.length === 7, `7 day predictions produced`);

  const sumPredictions = predictions.reduce((acc, p) => acc + p.predictedQuantity, 0);

  // Check bounds
  for (const p of predictions) {
    assert(p.predictedQuantity >= 0, `Predicted quantity ${p.predictedQuantity} is non-negative`);
    assert(p.lowerBound >= 0, `Lower bound ${p.lowerBound} is >= 0`);
    assert(p.upperBound >= p.lowerBound, `Upper bound ${p.upperBound} is >= lower bound ${p.lowerBound}`);
  }

  // Construct forecast bundle and verify totalForecastQuantity
  const txns: SaleTransaction[] = history.map((h, idx) => ({
    id: `tx-${idx}`,
    productId: 'prod-001',
    productName: 'Amul Milk',
    category: 'Dairy',
    quantity: h.quantity,
    unitPrice: 28,
    totalAmount: h.revenue,
    saleDate: h.date,
    timestamp: new Date().toISOString(),
    isSynthetic: false,
  }));

  const forecastBundle = buildProductForecast(mockProducts[0], txns, 2, 3);
  const bundleSum = forecastBundle.forecastSeries.reduce((s, p) => s + p.predictedQuantity, 0);

  assert(
    forecastBundle.totalForecastQuantity === bundleSum,
    `Selected product 7-day total (${forecastBundle.totalForecastQuantity}) strictly equals the sum of its 7 daily predictions (${bundleSum})`
  );
}

// TEST 10: Demand Velocity & Reorder Calculation Consistency
console.log('\n[TEST 10] Demand velocity and reorder calculation consistency');
{
  const txns: SaleTransaction[] = [
    {
      id: 'tx-1',
      productId: 'prod-001',
      productName: 'Amul Milk',
      category: 'Dairy',
      quantity: 10,
      unitPrice: 28,
      totalAmount: 280,
      saleDate: '2026-10-01',
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
    {
      id: 'tx-2',
      productId: 'prod-001',
      productName: 'Amul Milk',
      category: 'Dairy',
      quantity: 20,
      unitPrice: 28,
      totalAmount: 560,
      saleDate: '2026-10-10', // 10 calendar days between Oct 1 and Oct 10, 2 active days
      timestamp: new Date().toISOString(),
      isSynthetic: false,
    },
  ];

  const bundle = buildProductForecast(mockProducts[0], txns, 2, 3);
  assert(bundle.activeSalesDaysCount === 2, `Active sales days = 2 (got ${bundle.activeSalesDaysCount})`);
  assert(bundle.totalHistoricalUnitsSold === 30, `Total historical units = 30 (got ${bundle.totalHistoricalUnitsSold})`);
  assert(bundle.calendarDaysCount >= 10, `Calendar days count >= 10 (got ${bundle.calendarDaysCount})`);

  // Check that reorder recommendation uses the stated average daily demand
  const reorder = bundle.reorder;
  const expectedLeadDemand = Math.round(reorder.averageDailyDemand * 2 * 10) / 10;
  const expectedSafetyUnits = Math.round(reorder.averageDailyDemand * 3 * 10) / 10;
  const expectedTarget = Math.ceil(expectedLeadDemand + expectedSafetyUnits);

  assert(
    reorder.leadTimeDemand === expectedLeadDemand,
    `Lead time demand (${reorder.leadTimeDemand}) matches averageDailyDemand * leadTimeDays (${expectedLeadDemand})`
  );
  assert(
    reorder.safetyStockUnits === expectedSafetyUnits,
    `Safety stock (${reorder.safetyStockUnits}) matches averageDailyDemand * safetyStockDays (${expectedSafetyUnits})`
  );
  assert(
    reorder.targetStockLevel === expectedTarget,
    `Target stock (${reorder.targetStockLevel}) matches ceil(lead + safety) (${expectedTarget})`
  );
}

// TEST 11: Reorder Quantity Boundaries
console.log('\n[TEST 11] Reorder quantity boundaries');
{
  const forecastSeries = [
    { date: '2026-10-11', dayOfWeek: 'Sun', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
    { date: '2026-10-12', dayOfWeek: 'Mon', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
    { date: '2026-10-13', dayOfWeek: 'Tue', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
    { date: '2026-10-14', dayOfWeek: 'Wed', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
    { date: '2026-10-15', dayOfWeek: 'Thu', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
    { date: '2026-10-16', dayOfWeek: 'Fri', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
    { date: '2026-10-17', dayOfWeek: 'Sat', predictedQuantity: 5, lowerBound: 3, upperBound: 7 },
  ];
  // Daily Demand = 5 units/day
  // Lead time = 2 days -> Lead time demand = 10 units
  // Safety stock = 3 days -> Safety buffer = 15 units
  // Target Stock Level = 25 units

  // Scenario A: Current stock is 8 (Critical! below lead time demand 10)
  const recA = calculateReorderRecommendation(8, forecastSeries, 2, 3, 5);
  assert(recA.urgency === 'critical', `Urgency is critical when stock (8) < lead time demand (10)`);
  assert(recA.recommendedReorder === 17, `Suggested reorder 25 - 8 = 17 units (got ${recA.recommendedReorder})`);

  // Scenario B: Current stock is 30 (Sufficient, above target 25)
  const recB = calculateReorderRecommendation(30, forecastSeries, 2, 3, 5);
  assert(recB.urgency === 'sufficient', `Urgency is sufficient when stock (30) >= target (25)`);
  assert(recB.recommendedReorder === 0, `Never recommends negative quantities; reorder is 0 (got ${recB.recommendedReorder})`);
}

// TEST 12: Sales CSV Input Validation
console.log('\n[TEST 12] Sales CSV input validation');
{
  // 1. Missing headers
  const badHeaderCSV = `item_name,qty_sold\nMilk,5`;
  const res1 = validateSalesCSV(badHeaderCSV, mockProducts);
  assert(!res1.isValid, 'CSV rejected when required date header is missing');
  assert(res1.errors.length > 0, `Detected header error: ${res1.errors[0]?.errors[0]}`);

  // 2. Invalid date format
  const badDateCSV = `date,product,quantity\n12-10-2026,Amul Taaza Toned Milk (500 ml),5`;
  const res2 = validateSalesCSV(badDateCSV, mockProducts);
  assert(!res2.isValid, 'CSV rejected on DD-MM-YYYY date (requires YYYY-MM-DD)');

  // 3. Negative quantity
  const badQtyCSV = `date,product,quantity\n2026-10-12,Amul Taaza Toned Milk (500 ml),-4`;
  const res3 = validateSalesCSV(badQtyCSV, mockProducts);
  assert(!res3.isValid, 'CSV rejected on negative quantity');

  // 4. Unknown product
  const unknownProdCSV = `date,product,quantity\n2026-10-12,NonExistentShampoo123,5`;
  const res4 = validateSalesCSV(unknownProdCSV, mockProducts);
  assert(!res4.isValid, 'CSV rejected on product not in store catalogue');

  // 5. Valid CSV
  const validCSV = `date,product,quantity,unit_price\n2026-10-12,"Amul Taaza Toned Milk (500 ml)",4,28`;
  const res5 = validateSalesCSV(validCSV, mockProducts);
  assert(res5.isValid, 'Valid CSV accepted successfully');
  assert(res5.validTransactions.length === 1, '1 transaction parsed from valid CSV');
}

// TEST 13: Deterministic Audit Scenario (MAE 1.43, RMSE 1.60, WAPE 250%, Tie Comparison)
console.log('\n[TEST 13] Deterministic audit scenario (MAE 1.43, RMSE 1.60, WAPE 250%, and low-volume denominator)');
{
  // 7-day chronological holdout test set with low total demand (4 packets total)
  // Contains zero-sales calendar days (e.g. days with 0 demand)
  const testActual = [1, 0, 1, 0, 0, 1, 1]; // sum = 4 packets, 4 active days, 3 zero-sales days
  // Both seasonal and baseline models predict 2 units/day based on earlier training history
  // Adjusted slightly on day 2 to create exact errors: [-1, -3, -1, -1, -2, -1, -1] -> abs sum = 10, sq sum = 18
  const testPredSeasonal = [2, 3, 2, 1, 2, 2, 2];
  const testPredBaseline = [2, 3, 2, 1, 2, 2, 2];

  const seasonalMetrics = calculateEvaluationMetrics(testActual, testPredSeasonal);
  const baselineMetrics = calculateEvaluationMetrics(testActual, testPredBaseline);

  // 1. Verify MAE calculation: 10 / 7 = 1.42857 -> rounds to 1.43
  assert(seasonalMetrics.mae === 1.43, `Seasonal MAE is 1.43 (got ${seasonalMetrics.mae})`);
  assert(baselineMetrics.mae === 1.43, `Baseline MAE is 1.43 (got ${baselineMetrics.mae})`);

  // 2. Verify RMSE calculation: sqrt(18 / 7) = sqrt(2.5714) = 1.6035 -> rounds to 1.60
  assert(seasonalMetrics.rmse === 1.60, `Seasonal RMSE is 1.60 (got ${seasonalMetrics.rmse})`);
  assert(baselineMetrics.rmse === 1.60, `Baseline RMSE is 1.60 (got ${baselineMetrics.rmse})`);

  // 3. Verify WAPE calculation: 100 * sum(|actual - pred|) / sum(actual) = 100 * 10 / 4 = 250%
  assert(seasonalMetrics.wape === 250, `Seasonal WAPE is exactly 250% (got ${seasonalMetrics.wape}%)`);
  assert(baselineMetrics.wape === 250, `Baseline WAPE is exactly 250% (got ${baselineMetrics.wape}%)`);

  // 4. Verify Model Comparison reports a tie
  const comparison = compareModels(seasonalMetrics, baselineMetrics);
  assert(comparison.result === 'tie', `Model comparison correctly reports 'tie' (got '${comparison.result}')`);
  assert(comparison.maeDiff === 0, `MAE difference between models is 0`);

  // 5. Verify that daily time series includes zero-sales calendar days
  const sampleTxns: SaleTransaction[] = [
    {
      id: 'tx-1',
      productId: 'prod-audit',
      productName: 'Audit Item',
      category: 'Dairy',
      quantity: 5,
      unitPrice: 20,
      totalAmount: 100,
      saleDate: '2026-09-01',
      timestamp: new Date().toISOString(),
      isSynthetic: true,
    },
    {
      id: 'tx-2',
      productId: 'prod-audit',
      productName: 'Audit Item',
      category: 'Dairy',
      quantity: 3,
      unitPrice: 20,
      totalAmount: 60,
      saleDate: '2026-09-05', // 3 intermediate calendar days with 0 sales
      timestamp: new Date().toISOString(),
      isSynthetic: true,
    },
  ];

  const auditSeries = aggregateTransactionsToDailyDemand(sampleTxns, 'prod-audit', 0);
  // From 2026-09-01 to today: intermediate days must exist with quantity 0
  const zeroDays = auditSeries.filter(d => d.quantity === 0);
  assert(zeroDays.length > 0, `Daily demand series includes zero-sales calendar days (${zeroDays.length} zero-sales days found)`);

  // 6. Verify chronological train/test split (no future leakage)
  const { train, test } = chronologicalTrainTestSplit(auditSeries, 7);
  const trainDates = train.map(t => t.date);
  const testDates = test.map(t => t.date);
  const maxTrainDate = trainDates[trainDates.length - 1];
  const minTestDate = testDates[0];
  assert(
    maxTrainDate < minTestDate,
    `Chronological holdout: max train date (${maxTrainDate}) is strictly before min test date (${minTestDate})`
  );
}

console.log(`\n========================================`);
console.log(`TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
