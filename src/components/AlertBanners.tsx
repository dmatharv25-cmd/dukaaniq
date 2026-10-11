import React, { useState } from 'react';
import { AlertTriangle, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types/inventory';
import { getDaysUntilExpiry } from '../utils/formatters';

interface AlertBannersProps {
  products: Product[];
  onFilterExpiring: () => void;
  onFilterLowStock: () => void;
  onFilterExpired: () => void;
}

export const AlertBanners: React.FC<AlertBannersProps> = ({
  products,
  onFilterExpiring,
  onFilterLowStock,
  onFilterExpired,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const expiredProducts = products.filter(p => getDaysUntilExpiry(p.expiryDate) < 0);
  const expiringSoonProducts = products.filter(p => {
    const d = getDaysUntilExpiry(p.expiryDate);
    return d >= 0 && d <= 7;
  });
  const criticalLowStockProducts = products.filter(p => p.quantity <= p.minThreshold);

  const totalWarnings = expiredProducts.length + expiringSoonProducts.length + criticalLowStockProducts.length;

  if (totalWarnings === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-800">
            Kirana Operational Alerts
          </h2>
          <span className="text-xs text-slate-500">
            ({totalWarnings} items require attention)
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'View details'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Expired Items (Critical Food Safety) */}
          <div className="rounded-md border border-rose-200 bg-rose-50/60 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Expired Stock ({expiredProducts.length})
                </span>
                <span className="text-[11px] font-normal text-rose-700">Immediate Action</span>
              </div>
              <p className="text-xs text-rose-700/90 leading-relaxed">
                {expiredProducts.length > 0 ? (
                  <>
                    <span className="font-semibold">{expiredProducts.map(p => p.name).slice(0, 2).join(', ')}</span>
                    {expiredProducts.length > 2 && ` and ${expiredProducts.length - 2} more`} past expiry date.{' '}
                    <span className="font-semibold text-rose-800">Remove from sale immediately. Do not sell expired food.</span>
                  </>
                ) : (
                  'No expired items found. Shelves are clear.'
                )}
              </p>
            </div>
            {expiredProducts.length > 0 && (
              <button
                onClick={onFilterExpired}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-800 hover:text-rose-950 cursor-pointer pt-1"
              >
                <span>Filter {expiredProducts.length} expired items</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Expiring in 7 Days (Food-Waste Risk) */}
          <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Expiring in ≤ 7 Days ({expiringSoonProducts.length})
                </span>
                <span className="text-[11px] font-normal text-amber-700">Food Safety Review</span>
              </div>
              <p className="text-xs text-amber-700/90 leading-relaxed">
                {expiringSoonProducts.length > 0 ? (
                  <>
                    <span className="font-semibold">{expiringSoonProducts.map(p => p.name).slice(0, 2).join(', ')}</span>
                    {expiringSoonProducts.length > 2 && ` +${expiringSoonProducts.length - 2} items`}.{' '}
                    <span>Check product condition, expiry date, storage requirements, and applicable food-safety rules. Follow store policy.</span>
                  </>
                ) : (
                  'No items expiring in the next 7 days.'
                )}
              </p>
            </div>
            {expiringSoonProducts.length > 0 && (
              <button
                onClick={onFilterExpiring}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer pt-1"
              >
                <span>View {expiringSoonProducts.length} near-expiry items</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 3. Reorder Alerts (Low Stock) */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
                  Low Stock Reorder ({criticalLowStockProducts.length})
                </span>
                <span className="text-[11px] font-normal text-slate-500">Distributor List</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {criticalLowStockProducts.length > 0 ? (
                  <>
                    <span className="font-semibold text-slate-800">{criticalLowStockProducts.map(p => p.name).slice(0, 2).join(', ')}</span>
                    {criticalLowStockProducts.length > 2 && ` +${criticalLowStockProducts.length - 2} items`} below minimum threshold.
                  </>
                ) : (
                  'All items above minimum reorder threshold.'
                )}
              </p>
            </div>
            {criticalLowStockProducts.length > 0 && (
              <button
                onClick={onFilterLowStock}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 cursor-pointer pt-1"
              >
                <span>View {criticalLowStockProducts.length} low-stock items</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
