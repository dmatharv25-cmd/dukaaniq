import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Upload,
  Download,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Package,
} from 'lucide-react';
import { Product } from '../types/inventory';
import { SaleTransaction } from '../types/demand';
import { formatINR } from '../utils/formatters';

interface SalesHistoryViewProps {
  transactions: SaleTransaction[];
  products: Product[];
  onOpenRecordSaleModal: () => void;
  onOpenCSVImportModal: () => void;
  onLoadSyntheticDemo: () => void;
  onClearSyntheticSales: () => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  transactions,
  products,
  onOpenRecordSaleModal,
  onOpenCSVImportModal,
  onLoadSyntheticDemo,
  onClearSyntheticSales,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'synthetic'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.productName.toLowerCase().includes(q) && !(t.notes || '').toLowerCase().includes(q)) {
          return false;
        }
      }

      if (selectedProductId !== 'all' && t.productId !== selectedProductId) {
        return false;
      }

      if (filterType === 'real' && t.isSynthetic) {
        return false;
      }
      if (filterType === 'synthetic' && !t.isSynthetic) {
        return false;
      }

      if (startDate && t.saleDate < startDate) {
        return false;
      }
      if (endDate && t.saleDate > endDate) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedProductId, filterType, startDate, endDate]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalRev = filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalUnits = filteredTransactions.reduce((acc, t) => acc + t.quantity, 0);
    const realCount = transactions.filter((t) => !t.isSynthetic).length;
    const synthCount = transactions.filter((t) => t.isSynthetic).length;

    return {
      totalRevenue: totalRev,
      totalUnits,
      txnCount: filteredTransactions.length,
      realCount,
      synthCount,
    };
  }, [filteredTransactions, transactions]);

  // Download all sales history as CSV
  const handleExportHistoryCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Product ID', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Total Amount', 'Type', 'Notes'];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.saleDate}"`,
      `"${t.productId}"`,
      `"${t.productName.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.quantity,
      t.unitPrice,
      t.totalAmount,
      `"${t.isSynthetic ? 'Synthetic Demo' : 'Real Counter Sale'}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const content = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dukaaniq_sales_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Kirana Sales Ledger & History</h2>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Dated Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record counter sales, import historical CSV records, and power 7-day demand forecasting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {metrics.synthCount === 0 ? (
            <button
              onClick={onLoadSyntheticDemo}
              title="Loads 30-day realistic Kirana sales history for sample products"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Load 30-Day Demo History</span>
            </button>
          ) : (
            <button
              onClick={onClearSyntheticSales}
              title="Removes synthetic sales and keeps only real recorded sales"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Demo Sales ({metrics.synthCount})</span>
            </button>
          )}

          <button
            onClick={onOpenCSVImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Sales CSV</span>
          </button>

          <button
            onClick={onOpenRecordSaleModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      {/* 2. Key Daily & Ledger Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Sales Revenue
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {formatINR(metrics.totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-600" />
            <span>Filtered volume value</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Units Sold
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {metrics.totalUnits}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across {metrics.txnCount} transactions
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Real Counter Sales
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {metrics.realCount}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Recorded in store / CSV import
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Synthetic Demo Sales
          </span>
          <div className="mt-2 text-2xl font-bold text-teal-700 tabular-nums">
            {metrics.synthCount}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Explicitly marked for viva testing
          </div>
        </div>
      </div>

      {/* 3. Filtering Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product or notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Product Selector */}
          <div>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Products ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Records (Real + Synthetic)</option>
              <option value="real">Real Sales Only</option>
              <option value="synthetic">Synthetic Demo Only</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExportHistoryCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Ledger CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50"
            />
          </div>
          {(startDate || endDate || searchQuery || selectedProductId !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
                setSelectedProductId('all');
                setFilterType('all');
              }}
              className="text-teal-700 hover:text-teal-800 font-medium underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
          <span className="ml-auto text-slate-400 tabular-nums">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
        </div>
      </div>

      {/* 4. Transactions Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 mb-1">No sales transactions found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Record a counter sale when customers buy items, import a historical sales CSV, or load the 30-day synthetic dataset for testing.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onOpenRecordSaleModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md cursor-pointer"
              >
                Record First Sale
              </button>
              <button
                onClick={onLoadSyntheticDemo}
                className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md cursor-pointer"
              >
                Load Demo Sales
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-center">Record Type</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {txn.saleDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-[220px]">
                      {txn.productName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {txn.category}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-800 whitespace-nowrap">
                      {txn.quantity}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {formatINR(txn.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-teal-900 whitespace-nowrap">
                      {formatINR(txn.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {txn.isSynthetic ? (
                        <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          Synthetic Demo
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Real Counter Sale
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 truncate max-w-[180px]">
                      {txn.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
