import React from 'react';
import { Package, IndianRupee, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { InventoryStats, StatusFilter } from '../types/inventory';
import { formatINR } from '../utils/formatters';

interface DashboardStatsProps {
  stats: InventoryStats;
  activeStatusFilter: StatusFilter;
  onSelectStatusFilter: (status: StatusFilter) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Products & Stock Volume */}
      <div 
        onClick={() => onSelectStatusFilter('all')}
        className={`bg-white rounded-lg border p-5 cursor-pointer transition-all ${
          activeStatusFilter === 'all'
            ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Inventory
          </span>
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {stats.totalProducts}
          </span>
          <span className="text-xs text-slate-500">
            SKUs in store
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total physical units:</span>
          <span className="font-semibold text-slate-700 tabular-nums">{stats.totalQuantity} units</span>
        </div>
      </div>

      {/* 2. Total Valuation & Margin */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Stock Valuation (INR)
          </span>
          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-700">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatINR(stats.totalWholesaleValue)}
          </span>
          <span className="text-xs text-slate-500">
            cost basis
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retail value: <span className="font-semibold text-slate-700 tabular-nums">{formatINR(stats.totalRetailValue)}</span></span>
          </div>
          <span className="font-medium text-emerald-700 tabular-nums">
            ~{stats.averageMarginPercent}% avg margin
          </span>
        </div>
      </div>

      {/* 3. Low-Stock Alert */}
      <div
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'low_stock' ? 'all' : 'low_stock')}
        className={`bg-white rounded-lg border p-5 cursor-pointer transition-all ${
          activeStatusFilter === 'low_stock'
            ? 'border-amber-500 ring-1 ring-amber-500 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Low-Stock Alert
          </span>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tabular-nums ${
            stats.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {stats.lowStockCount}
          </span>
          <span className="text-xs text-slate-500">
            items below reorder level
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Status:</span>
          <span className={`font-semibold ${
            stats.lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {stats.lowStockCount > 0 ? 'Immediate reorder recommended' : 'Stock levels optimal'}
          </span>
        </div>
      </div>

      {/* 4. Expiry & Waste Alert */}
      <div
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
        className={`bg-white rounded-lg border p-5 cursor-pointer transition-all ${
          activeStatusFilter === 'expiring_soon' || activeStatusFilter === 'expired'
            ? 'border-rose-500 ring-1 ring-rose-500 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Expiry & Waste Risk
          </span>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            stats.expiredCount > 0
              ? 'bg-rose-50 text-rose-700'
              : stats.expiringSoonCount > 0
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tabular-nums ${
            stats.expiredCount > 0 ? 'text-rose-700' : stats.expiringSoonCount > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {stats.expiringSoonCount + stats.expiredCount}
          </span>
          <span className="text-xs text-slate-500">
            approaching or expired
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Breakdown:</span>
          <div className="flex items-center gap-2">
            {stats.expiredCount > 0 && (
              <span className="font-semibold text-rose-700 tabular-nums">
                {stats.expiredCount} expired
              </span>
            )}
            {stats.expiredCount > 0 && stats.expiringSoonCount > 0 && <span>·</span>}
            <span className="font-medium text-amber-700 tabular-nums">
              {stats.expiringSoonCount} in ≤15 days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
