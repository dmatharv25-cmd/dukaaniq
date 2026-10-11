import React from 'react';
import { Search, Filter, ArrowUpDown, Download, X } from 'lucide-react';
import { ProductCategory, StatusFilter, SortField, SortOrder } from '../types/inventory';

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ProductCategory | 'all';
  onCategoryChange: (cat: ProductCategory | 'all') => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
  categories: ProductCategory[];
  totalFilteredCount: number;
  onExportCSV: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortField,
  sortOrder,
  onSortChange,
  categories,
  totalFilteredCount,
  onExportCSV,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 shadow-xs">
      {/* Top Row: Search + Category + Sort + CSV */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by name, brand, or notes (e.g. Amul, Atta, Masala)..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[180px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value as ProductCategory | 'all')}
              className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white cursor-pointer transition-all appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="relative min-w-[160px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as SortField)}
              className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white cursor-pointer transition-all appearance-none"
            >
              <option value="name">Sort: Product Name</option>
              <option value="quantity">Sort: Stock Quantity</option>
              <option value="expiryDate">Sort: Expiry Date</option>
              <option value="sellingPrice">Sort: Selling Price</option>
              <option value="totalValue">Sort: Total Stock Value</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            title="Download inventory report as CSV for distributor order"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Status Filter Tabs (Interactive Segmented Control) + Count */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Filter by state:</span>
          
          <button
            onClick={() => onStatusChange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Items
          </button>

          <button
            onClick={() => onStatusChange('low_stock')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedStatus === 'low_stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Low Stock
          </button>

          <button
            onClick={() => onStatusChange('expiring_soon')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedStatus === 'expiring_soon'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Expiring Soon (≤15d)
          </button>

          <button
            onClick={() => onStatusChange('expired')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedStatus === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Expired
          </button>

          <button
            onClick={() => onStatusChange('in_stock')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedStatus === 'in_stock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Optimal Stock
          </button>
        </div>

        {/* Results Counter & Clear filters */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 tabular-nums">{totalFilteredCount}</strong> products
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
