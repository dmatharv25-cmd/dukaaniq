import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { Product } from '../types/inventory';
import { SaleTransaction, ProductForecast } from '../types/demand';
import { buildProductForecast } from '../utils/forecasting';
import { formatINR } from '../utils/formatters';

interface DemandIntelligenceViewProps {
  products: Product[];
  transactions: SaleTransaction[];
  onOpenRecordSaleModal: () => void;
  onLoadSyntheticDemo: () => void;
}

export const DemandIntelligenceView: React.FC<DemandIntelligenceViewProps> = ({
  products,
  transactions,
  onOpenRecordSaleModal,
  onLoadSyntheticDemo,
}) => {
  // Configurable reorder settings
  const [leadTimeDays, setLeadTimeDays] = useState<number>(2); // Default 2 days
  const [safetyStockDays, setSafetyStockDays] = useState<number>(3); // Default 3 days buffer

  // Selected product for deep dive
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? products[0].id : ''
  );

  // Compute forecasts for all products
  const allForecasts: ProductForecast[] = useMemo(() => {
    return products.map((product) =>
      buildProductForecast(product, transactions, leadTimeDays, safetyStockDays)
    );
  }, [products, transactions, leadTimeDays, safetyStockDays]);

  // Selected forecast
  const currentForecast = useMemo(() => {
    return (
      allForecasts.find((f) => f.productId === selectedProductId) ||
      allForecasts[0]
    );
  }, [allForecasts, selectedProductId]);

  // Summary Aggregate KPIs
  const summary = useMemo(() => {
    const totalUnits = allForecasts.reduce((sum, f) => sum + f.totalForecastQuantity, 0);
    const totalValue = allForecasts.reduce((sum, f) => {
      const prod = products.find((p) => p.id === f.productId);
      return sum + f.totalForecastQuantity * (prod ? prod.sellingPrice : 0);
    }, 0);

    const stockoutRiskCount = allForecasts.filter(
      (f) => f.reorder.urgency === 'critical' || (f.reorder.daysUntilStockout !== null && f.reorder.daysUntilStockout <= 7)
    ).length;

    const reorderNeededCount = allForecasts.filter(
      (f) => f.reorder.recommendedReorder > 0
    ).length;

    const sufficientDataCount = allForecasts.filter((f) => f.hasSufficientData).length;

    return {
      totalForecastUnits: totalUnits,
      totalForecastValue: totalValue,
      stockoutRiskCount,
      reorderNeededCount,
      sufficientDataCount,
    };
  }, [allForecasts, products]);

  // Max value for scaling SVG chart
  const chartMax = useMemo(() => {
    if (!currentForecast) return 20;
    const histMax = Math.max(...currentForecast.historicalSeries.map((d) => d.quantity), 0);
    const foreMax = Math.max(...currentForecast.forecastSeries.map((d) => d.upperBound), 0);
    return Math.max(histMax, foreMax, 10);
  }, [currentForecast]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Configuration Toolbar */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight">DukaanIQ Demand Intelligence</h2>
            <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded">
              7-Day Explainable Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Time-series demand forecasting, stockout risk projection, and distributor reorder recommendations
          </p>
        </div>

        {/* Lead time & Safety stock controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-300">Supplier Lead Time:</span>
            <select
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value={1}>1 Day (Daily route)</option>
              <option value={2}>2 Days (Bi-weekly)</option>
              <option value={3}>3 Days (Standard)</option>
              <option value={5}>5 Days (Weekly delivery)</option>
            </select>
          </div>

          <span aria-hidden="true" className="text-slate-600 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Safety Buffer:</span>
            <select
              value={safetyStockDays}
              onChange={(e) => setSafetyStockDays(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value={1}>1 Day buffer</option>
              <option value={2}>2 Days buffer</option>
              <option value={3}>3 Days buffer (Recommended)</option>
              <option value={5}>5 Days buffer</option>
              <option value={7}>7 Days buffer</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Insufficient Data Warning Banner (Honest State) */}
      {summary.sufficientDataCount === 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900 font-semibold">
                Sparse Sales History Detected
              </strong>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Statistical forecasting requires at least 7–14 days of historical sales. To immediately evaluate the 7-day Day-of-Week model, MAE/RMSE metrics, and reorder formulas for your viva, load the synthetic 30-day Kirana dataset.
              </p>
            </div>
          </div>
          <button
            onClick={onLoadSyntheticDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            <span>Load 30-Day Demo History</span>
          </button>
        </div>
      )}

      {/* 3. High-Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Forecast Demand */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Catalogue 7-Day Demand
              </span>
              <span className="text-[10px] text-slate-400">All {products.length} store SKUs combined</span>
            </div>
            <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {summary.totalForecastUnits} units
            </span>
            <span className="text-xs text-slate-500">store-wide projected demand</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Projected Store Revenue:</span>
            <strong className="text-teal-900 font-bold tabular-nums">
              {formatINR(summary.totalForecastValue)}
            </strong>
          </div>
        </div>

        {/* Stockout Risk */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Stockout Risk (7 Days)
            </span>
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              summary.stockoutRiskCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tabular-nums ${
              summary.stockoutRiskCount > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {summary.stockoutRiskCount} SKUs
            </span>
            <span className="text-xs text-slate-500">will exhaust shelf stock</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Depletion window:</span>
            <span className={`font-semibold ${summary.stockoutRiskCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {summary.stockoutRiskCount > 0 ? 'Exhausts within lead time' : 'Inventory sufficient'}
            </span>
          </div>
        </div>

        {/* Reorder Required */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Reorder Action Required
            </span>
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              summary.reorderNeededCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tabular-nums ${
              summary.reorderNeededCount > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {summary.reorderNeededCount} Products
            </span>
            <span className="text-xs text-slate-500">below target buffer</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Buffer parameters:</span>
            <span className="font-medium text-slate-700 tabular-nums">
              {leadTimeDays}d lead + {safetyStockDays}d safety
            </span>
          </div>
        </div>
      </div>

      {/* 4. Product Deep Dive Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Product for 7-Day Forecast Deep-Dive
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 min-w-[280px]"
            >
              {allForecasts.map((f) => (
                <option key={f.productId} value={f.productId}>
                  {f.productName} (Stock: {f.currentStock} {f.unit}s)
                  {f.reorder.recommendedReorder > 0 ? ` — [Order ${f.reorder.recommendedReorder}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {currentForecast && (
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded">
                <span className="text-slate-500 mr-1.5">Selected SKU 7-Day Total:</span>
                <strong className="text-teal-900 font-bold tabular-nums">
                  {currentForecast.totalForecastQuantity} {currentForecast.unit}s
                </strong>
                <span className="text-slate-400 text-[11px] ml-1.5">
                  ({formatINR(currentForecast.totalForecastQuantity * (products.find(p => p.id === currentForecast.productId)?.sellingPrice || 0))})
                </span>
              </div>
              <span className="font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-1 rounded">
                {currentForecast.forecastMethod}
              </span>
              <span className="text-slate-500 text-[11px]">
                {currentForecast.calendarDaysCount > 0 ? (
                  <>
                    <strong className="text-slate-800">{currentForecast.calendarDaysCount}</strong> calendar days (
                    <strong className="text-slate-800">{currentForecast.activeSalesDaysCount}</strong> active sales days)
                  </>
                ) : (
                  'No sales recorded'
                )}
              </span>
            </div>
          )}
        </div>

        {currentForecast && (
          <div className="space-y-6">
            {/* Visual Demand Chart (Historical vs 7-Day Prediction) */}
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-slate-800">
                  Daily Demand Timeline (Past {currentForecast.historicalSeries.length} Days vs Next 7 Days Predicted)
                </span>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs inline-block"></span>
                    <span>Actual Historical Demand</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-teal-600 rounded-xs inline-block"></span>
                    <span>Forecast (Next 7 Days)</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Bar & Point Chart */}
              <div className="h-48 border border-slate-200 rounded-lg bg-slate-50/50 p-3 flex flex-col justify-between">
                <div className="flex-1 flex items-end gap-1 sm:gap-1.5 overflow-x-auto pb-1">
                  {/* Historical Bars */}
                  {currentForecast.historicalSeries.slice(-14).map((point, idx) => {
                    const heightPercent = Math.min(100, Math.max(8, (point.quantity / chartMax) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-slate-300 group-hover:bg-slate-400 rounded-t-xs transition-all flex items-start justify-center"
                        >
                          <span className="text-[9px] font-mono text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity -mt-4">
                            {point.quantity}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center">
                          {point.dayOfWeek}
                        </span>
                      </div>
                    );
                  })}

                  {/* Vertical Divider between History and Future */}
                  <div className="w-[1px] h-full bg-teal-300 mx-1 border-dashed"></div>

                  {/* 7-Day Forecast Bars */}
                  {currentForecast.forecastSeries.map((point, idx) => {
                    const heightPercent = Math.min(100, Math.max(8, (point.predictedQuantity / chartMax) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[24px] flex flex-col items-center justify-end h-full group relative"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-teal-600 group-hover:bg-teal-700 rounded-t-xs transition-all flex items-start justify-center shadow-xs"
                        >
                          <span className="text-[9px] font-mono text-teal-900 font-bold -mt-4">
                            {point.predictedQuantity}
                          </span>
                        </div>
                        <span className="text-[9px] font-semibold text-teal-800 mt-1 truncate w-full text-center">
                          +{idx + 1}d
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-200">
                  <span>← Recent Actual Sales (Units)</span>
                  <span className="text-teal-700 font-semibold">7-Day Projected Window →</span>
                </div>
              </div>
            </div>

            {/* 7-Day Daily Breakdown Table */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <h4 className="text-xs font-semibold text-slate-800">
                  Day-by-Day Forecast Schedule ({currentForecast.productName})
                </h4>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  Exact 7-day sum:{' '}
                  <strong className="text-teal-900">
                    {currentForecast.forecastSeries.map((p) => p.predictedQuantity).join(' + ')} ={' '}
                    {currentForecast.totalForecastQuantity} {currentForecast.unit}s
                  </strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Forecast Day</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Predicted Demand</th>
                      <th className="py-2.5 px-3 text-right">Estimated uncertainty range</th>
                      <th className="py-2.5 px-3 text-right">Estimated Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentForecast.forecastSeries.map((fDay, idx) => {
                      const prod = products.find((p) => p.id === currentForecast.productId);
                      const unitPrice = prod ? prod.sellingPrice : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            Day +{idx + 1} ({fDay.dayOfWeek})
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{fDay.date}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-teal-900 tabular-nums">
                            {fDay.predictedQuantity} {currentForecast.unit}s
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                            [{fDay.lowerBound} to {fDay.upperBound} {currentForecast.unit}s]
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-800">
                            {formatINR(fDay.predictedQuantity * unitPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 italic">
                * Note: Daily forecasted quantities are rounded to integers for practical grocery shelf stocking. The 7-day selected product total, day-by-day schedule, chart, projected revenue, and catalogue-wide forecast sum these identical predictions directly without rounding drift. Estimated uncertainty range reflects historical residual dispersion (±1.96 × SE bounded at 0; discrete count lower bounds are non-negative).
              </p>
            </div>

            {/* Reorder Intelligence & Model Accuracy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Reorder Intelligence Formula Walkthrough */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Reorder Recommendation
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      currentForecast.reorder.urgency === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : currentForecast.reorder.urgency === 'reorder_soon'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {currentForecast.reorder.urgency === 'critical'
                      ? 'Immediate Order'
                      : currentForecast.reorder.urgency === 'reorder_soon'
                      ? 'Order Soon'
                      : 'Stock Sufficient'}
                  </span>
                </div>

                {/* Mathematical Formula breakdown */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
                  <div className="text-slate-500 font-sans text-[10px]">
                    Formula: Reorder = max(0, Lead Time Demand + Safety Stock - Current Stock)
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex justify-between">
                    <span>Lead Time Demand ({leadTimeDays}d × {currentForecast.reorder.averageDailyDemand}/d):</span>
                    <strong className="tabular-nums">{currentForecast.reorder.leadTimeDemand} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Stock Buffer ({safetyStockDays}d × {currentForecast.reorder.averageDailyDemand}/d):</span>
                    <strong className="tabular-nums">{currentForecast.reorder.safetyStockUnits} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Stock Level:</span>
                    <strong className="tabular-nums">{currentForecast.reorder.targetStockLevel} units</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Available Shelf Stock:</span>
                    <strong className="tabular-nums">{currentForecast.currentStock} units</strong>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between text-teal-900 font-bold text-xs">
                    <span>Suggested Order Quantity:</span>
                    <span className="tabular-nums">
                      {currentForecast.reorder.recommendedReorder} {currentForecast.unit}s
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentForecast.reorder.explanation}
                </p>
              </div>

              {/* Card 2: Model Performance & Accuracy Metrics */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Model Validation & Metrics
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Chronological Test (Last {currentForecast.metrics.testDaysEvaluated} Days)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">MAE (Error)</span>
                    <strong className="text-sm font-bold text-slate-900 tabular-nums">
                      {currentForecast.metrics.mae}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Mean Abs Error</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">RMSE</span>
                    <strong className="text-sm font-bold text-slate-900 tabular-nums">
                      {currentForecast.metrics.rmse}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Root Mean Sq</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">WAPE</span>
                    <strong className="text-xs font-bold text-slate-900 tabular-nums block mt-0.5">
                      {currentForecast.metrics.wape !== null
                        ? `${currentForecast.metrics.wape}%`
                        : 'Unavailable'}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {currentForecast.metrics.wape !== null ? 'Weighted %' : '0 actual demand'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  * Note: WAPE is calculated as 100 × ∑|actual - predicted| / ∑actual. When total actual demand in the evaluation period is zero, WAPE is mathematically undefined (displayed as Unavailable). For low-volume SKUs where total holdout demand is low (e.g., only 4 units), even modest daily forecast errors (1–2 units) naturally yield a high WAPE (e.g., 250%) because error is substantial relative to actual sales volume.
                </p>

                {/* Honest Comparison against moving average baseline */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                    <span>Baseline Model Comparison (SMA-7):</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        currentForecast.modelComparison.result === 'seasonal_better'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : currentForecast.modelComparison.result === 'tie'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : currentForecast.modelComparison.result === 'approx_equal'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {currentForecast.modelComparison.result === 'seasonal_better'
                        ? 'Seasonal Model Outperformed'
                        : currentForecast.modelComparison.result === 'tie'
                        ? 'Tie'
                        : currentForecast.modelComparison.result === 'approx_equal'
                        ? 'Performance approximately equal'
                        : 'Baseline SMA-7 Outperformed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {currentForecast.modelComparison.explanation}
                  </p>
                </div>

                {/* "Why this recommendation?" panel */}
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-xs">
                  <div className="font-semibold text-teal-950 mb-1">
                    Why this recommendation?
                  </div>
                  <p className="text-teal-900 leading-relaxed text-[11px]">
                    {currentForecast.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
