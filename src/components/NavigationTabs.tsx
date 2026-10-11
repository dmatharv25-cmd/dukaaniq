import React from 'react';
import { Package, Receipt, LineChart } from 'lucide-react';

export type ActiveTab = 'inventory' | 'sales' | 'forecasting';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  inventoryCount: number;
  salesCount: number;
  stockoutRiskCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  inventoryCount,
  salesCount,
  stockoutRiskCount,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: Inventory */}
          <button
            onClick={() => onTabChange('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Store Inventory</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300 tabular-nums">
              {inventoryCount}
            </span>
          </button>

          {/* Tab 2: Sales History */}
          <button
            onClick={() => onTabChange('sales')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Receipt className="w-4 h-4 text-teal-400" />
            <span>Sales History & Import</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300 tabular-nums">
              {salesCount}
            </span>
          </button>

          {/* Tab 3: Demand Intelligence (Forecasting) */}
          <button
            onClick={() => onTabChange('forecasting')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'forecasting'
                ? 'bg-teal-900/40 text-teal-200 border border-teal-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LineChart className="w-4 h-4 text-teal-400" />
            <span>Demand Intelligence</span>
            {stockoutRiskCount > 0 ? (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tabular-nums">
                {stockoutRiskCount} risk
              </span>
            ) : (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                7-Day
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
