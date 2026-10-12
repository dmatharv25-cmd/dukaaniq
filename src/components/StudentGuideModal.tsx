import React from 'react';
import { X, Code2, Database, Calculator, GitBranch, CheckCircle2, Cpu } from 'lucide-react';

interface StudentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentGuideModal: React.FC<StudentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                DukaanIQ: BTech Student Architecture Guide
              </h3>
              <p className="text-xs text-slate-500">
                Stage 1 — Core Inventory, Valuation & Expiry Tracking Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 1. Project Overview & Stage 1 Scope */}
          <section className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <GitBranch className="w-4 h-4" />
              <span>Project Scope & Roadmap Check</span>
            </div>
            <p className="text-slate-600">
              Kirana stores in India operate on thin margins (10–20%) and often suffer food-waste losses due to expired dairy, bread, and packaged snacks. 
              <strong> Stage 1</strong> builds the essential, rock-solid inventory foundation: live stock counts, shelf-life audit, margin calculations, and low-stock alarms.
              <strong> Stage 2 (Active)</strong> adds explainable statistical demand forecasting, reorder recommendations and a waste-risk predictor that flags stock likely to expire unsold.
            </p>
          </section>

          {/* 2. File Organization */}
          <section>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Modular File Structure</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                <span className="font-mono text-emerald-700 font-semibold">src/types/inventory.ts</span>
                <p className="text-slate-500 mt-1">
                  Defines the TypeScript interfaces: <code>Product</code>, <code>ProductCategory</code>, <code>StockHealth</code>, and <code>InventoryStats</code>.
                </p>
              </div>
              <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                <span className="font-mono text-emerald-700 font-semibold">src/utils/formatters.ts</span>
                <p className="text-slate-500 mt-1">
                  Pure utility functions: Indian Rupee formatting (<code>formatINR</code>), expiry day delta calculation, and margin formulas.
                </p>
              </div>
              <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                <span className="font-mono text-emerald-700 font-semibold">src/data/initialProducts.ts</span>
                <p className="text-slate-500 mt-1">
                  18 realistic Indian Kirana products (Amul Milk, Atta, Tata Salt, Biscuits) with dynamically calibrated expiry dates.
                </p>
              </div>
              <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                <span className="font-mono text-emerald-700 font-semibold">src/components/</span>
                <p className="text-slate-500 mt-1">
                  UI Components: <code>Header</code>, <code>DashboardStats</code>, <code>AlertBanners</code>, <code>InventoryFilters</code>, <code>ProductTable</code>, and <code>ProductModal</code>.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Mathematical & Algorithmic Formulas */}
          <section>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Core Calculations & Algorithms</span>
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-md border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">1. Inventory Valuation (Wholesale vs Retail)</div>
                <div className="font-mono bg-slate-100 p-2 rounded text-[11px] text-slate-800">
                  Total Wholesale Cost = ∑ (purchasePrice_i × quantity_i)<br />
                  Total Retail Value = ∑ (sellingPrice_i × quantity_i)<br />
                  Net Expected Profit = Total Retail Value - Total Wholesale Cost
                </div>
              </div>

              <div className="p-3 rounded-md border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">2. Expiry Days Delta Algorithm</div>
                <div className="font-mono bg-slate-100 p-2 rounded text-[11px] text-slate-800">
                  diffDays = ⌈(expiryDate.getTime() - today.getTime()) / (1000 × 60 × 60 × 24)⌉<br />
                  • diffDays &lt; 0  ➔ Status: Expired (Action: Remove from sale immediately. Do not sell expired food.)<br />
                  • 0 ≤ diffDays ≤ 15  ➔ Status: Expiring Soon (Action: Check product condition, expiry date, storage requirements, and food-safety rules. Follow store policy.)<br />
                  • diffDays &gt; 15  ➔ Status: Shelf Life Remaining
                </div>
              </div>

              <div className="p-3 rounded-md border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">3. Gross Margin Percentage</div>
                <div className="font-mono bg-slate-100 p-2 rounded text-[11px] text-slate-800">
                  Margin % = ((sellingPrice - purchasePrice) / sellingPrice) × 100
                </div>
              </div>
            </div>
          </section>

          {/* 4. Stage 2 Demand Intelligence (Implemented) */}
          <section className="p-4 rounded-lg bg-teal-50/70 border border-teal-200">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm mb-1">
              <Cpu className="w-4 h-4 text-teal-700" />
              <span>Stage 2: Demand Intelligence & Reorder Engine (Active)</span>
            </div>
            <p className="text-slate-700 mb-3">
              Kirana stores cannot afford complex cloud GPU servers. DukaanIQ implements an explainable, client-side statistical time-series forecasting engine with zero backend latency:
            </p>
            <div className="space-y-2 text-[11px] text-slate-700 font-mono bg-white p-3 rounded border border-teal-100">
              <div>
                <strong>1. Day-of-Week Seasonal Smoothing:</strong><br />
                Multiplies recent baseline level by day-of-week factor: <code>S_d = avg(sales on day d) / overall_avg</code>.<br />
                Captures heavy Saturday/Sunday surges for Atta, Maggi, and Snacks.
              </div>
              <div className="pt-1.5 border-t border-slate-100">
                <strong>2. Chronological Train/Test Evaluation (No Future Leakage):</strong><br />
                Splits data into first (N - 7) days train and last 7 days test. Compares against 7-day Simple Moving Average (SMA-7) baseline using MAE, RMSE, and WAPE.
              </div>
              <div className="pt-1.5 border-t border-slate-100">
                <strong>3. Reorder Formula:</strong><br />
                <code>Reorder = max(0, LeadTimeDemand + SafetyStock - CurrentStock)</code><br />
                Prevents over-purchasing and avoids dead capital.
              </div>
            </div>
          </section>

          {/* 5. Viva / Interview Questions & Answers */}
          <section className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-2">
              BTech CSE Viva Questions & Architectural Answers
            </h4>
            <div className="space-y-2.5 text-[11px] text-slate-700">
              <div>
                <strong className="text-slate-900">Q: Why use client-side forecasting instead of a Python/Flask microservice?</strong>
                <p className="text-slate-600 mt-0.5">
                  A: Small Kirana shops operate on thin margins and often have spotty internet. Client-side forecasting runs locally in milliseconds with zero server hosting costs, complete privacy of store transactions, and works offline.
                </p>
              </div>
              <div>
                <strong className="text-slate-900">Q: Why chronological splitting instead of K-Fold cross validation?</strong>
                <p className="text-slate-600 mt-0.5">
                  A: Time-series observations are sequentially correlated. Random shuffling leaks future actual demand into training features. Chronological splits preserve temporal causality.
                </p>
              </div>
              <div>
                <strong className="text-slate-900">Q: How would this architecture scale in production for multi-device kiranas?</strong>
                <p className="text-slate-600 mt-0.5">
                  A: While Stage 2 uses browser <code>localStorage</code> for zero-dependency portability, a multi-counter supermarket would sync transactions to a PostgreSQL / TimescaleDB database via REST/GraphQL with SQLite client caching for offline resilience.
                </p>
              </div>
            </div>
          </section>

          {/* 6. How to Test Each Feature */}
          <section>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Demonstration & Testing Checklist</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
              <li><strong>Record Sale:</strong> In Store Inventory, click the shopping bag icon or &quot;Record Sale&quot; button. Enter quantity and date. Notice shelf stock decreases and transaction is logged in Sales History.</li>
              <li><strong>CSV Import:</strong> In Sales History, click &quot;Import Sales CSV&quot;, download the sample CSV, and upload it to test validation, preview, and batch ingestion.</li>
              <li><strong>Demand Intelligence:</strong> Switch to the &quot;Demand Intelligence&quot; tab. If no real sales exist, click &quot;Load 30-Day Demo History&quot; to see 7-day predicted demand charts, confidence intervals, and MAE/RMSE comparisons.</li>
              <li><strong>Reorder Formula:</strong> Change Lead Time from 2 to 3 days or adjust Safety Stock buffer. Watch suggested order quantities recalculate live!</li>
              <li><strong>Single-Click Cleanup:</strong> Click &quot;Clear Demo Sales&quot; anytime to isolate real recorded sales.</li>
            </ol>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

