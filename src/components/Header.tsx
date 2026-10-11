import React from 'react';
import { Plus, BookOpen, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenStudentGuide: () => void;
  onResetData: () => void;
  totalProductsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenStudentGuide,
  onResetData,
  totalProductsCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  DukaanIQ
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Stage 1: Core Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Kirana Inventory & Food-Waste Monitor
              </p>
            </div>
          </div>

          {/* Zone 2: Store Context & Actions */}
          <div className="hidden md:flex items-center gap-5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Store:</span>
              <span className="font-semibold text-slate-800">Shree Ganesh Kirana & Provisions</span>
            </div>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Catalogue:</span>
              <span className="font-semibold text-slate-800 tabular-nums">{totalProductsCount} SKUs</span>
            </div>
          </div>

          {/* Zone 3: Primary Action & Guide Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onResetData}
              title="Reset to default Kirana sample products"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>

            <button
              onClick={onOpenStudentGuide}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-md border border-slate-300 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>BTech Project Guide</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
