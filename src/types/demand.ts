export interface SaleTransaction {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;       // Selling price at time of sale in ₹
  totalAmount: number;     // quantity * unitPrice in ₹
  saleDate: string;        // YYYY-MM-DD
  timestamp: string;       // ISO timestamp
  isSynthetic: boolean;    // true for generated demo sales, false for real sales
  notes?: string;
}

export interface DailyDemandPoint {
  date: string;            // YYYY-MM-DD
  dayOfWeek: string;       // Mon, Tue, etc.
  quantity: number;        // Total units sold on this day
  revenue: number;         // Total revenue on this day
}

export interface ForecastDayPrediction {
  date: string;            // YYYY-MM-DD
  dayOfWeek: string;
  predictedQuantity: number;
  lowerBound: number;      // Estimated uncertainty range lower bound (>= 0)
  upperBound: number;      // Estimated uncertainty range upper bound (>= lowerBound)
}

export interface ModelMetrics {
  mae: number;             // Mean Absolute Error (rounded for display)
  rmse: number;            // Root Mean Squared Error (rounded for display)
  wape: number | null;     // Weighted Absolute Percentage Error (null if zero actual demand)
  unroundedMae: number;    // Unrounded MAE for exact comparison
  unroundedRmse: number;   // Unrounded RMSE
  unroundedWape: number | null;
  testDaysEvaluated: number;
}

export type ModelComparisonResult = 'tie' | 'approx_equal' | 'seasonal_better' | 'baseline_better';

export interface ModelComparison {
  result: ModelComparisonResult;
  maeDiff: number;         // baseline.unroundedMae - seasonal.unroundedMae (positive = seasonal better)
  explanation: string;
}

export interface ReorderRecommendation {
  currentStock: number;
  leadTimeDays: number;
  safetyStockDays: number;
  averageDailyDemand: number;
  leadTimeDemand: number;
  safetyStockUnits: number;
  targetStockLevel: number; // Lead time demand + Safety stock
  recommendedReorder: number; // max(0, target - currentStock)
  daysUntilStockout: number | null;
  urgency: 'critical' | 'reorder_soon' | 'sufficient';
  explanation: string;
}

export interface ProductForecast {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  currentStock: number;
  hasSufficientData: boolean;
  calendarDaysCount: number;         // Total calendar days in historical window
  activeSalesDaysCount: number;      // Days with at least 1 recorded sale
  avgDailyDemandCalendar: number;    // Historical units / calendar days
  avgDailyDemandActive: number;      // Historical units / active sales days
  totalHistoricalUnitsSold: number;
  historicalSeries: DailyDemandPoint[];
  forecastSeries: ForecastDayPrediction[];
  totalForecastQuantity: number;     // Exact sum of the 7 daily forecast predictions
  forecastMethod: '7-Day Seasonal Moving Average' | '7-Day Simple Moving Average' | 'Insufficient Data Baseline' | 'No Historical Data';
  metrics: ModelMetrics;
  baselineMetrics: ModelMetrics;
  modelComparison: ModelComparison;
  reorder: ReorderRecommendation;
  explanation: string;
}

export interface CSVImportRowError {
  rowNumber: number;
  rawText: string;
  errors: string[];
}

export interface CSVImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validTransactions: SaleTransaction[];
  errors: CSVImportRowError[];
}
