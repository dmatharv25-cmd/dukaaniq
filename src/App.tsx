/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, ActiveTab } from './components/NavigationTabs';
import { DashboardStats } from './components/DashboardStats';
import { AlertBanners } from './components/AlertBanners';
import { InventoryFilters } from './components/InventoryFilters';
import { ProductTable } from './components/ProductTable';
import { ProductModal } from './components/ProductModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { StudentGuideModal } from './components/StudentGuideModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { RecordSaleModal } from './components/RecordSaleModal';
import { SalesCSVImportModal } from './components/SalesCSVImportModal';
import { SalesHistoryView } from './components/SalesHistoryView';
import { DemandIntelligenceView } from './components/DemandIntelligenceView';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { generateSyntheticKiranaSales } from './data/syntheticSales';
import {
  Product,
  ProductCategory,
  StatusFilter,
  SortField,
  SortOrder,
  InventoryStats,
} from './types/inventory';
import { SaleTransaction } from './types/demand';
import {
  getDaysUntilExpiry,
  getStockStatus,
  getExpiryStatus,
  calculateMarginPercent,
  getRelativeDate,
} from './utils/formatters';
import { formatDateISO, buildProductForecast } from './utils/forecasting';

const INVENTORY_STORAGE_KEY = 'dukaaniq_kirana_inventory_v1';
const SALES_STORAGE_KEY = 'dukaaniq_sales_history_v1';

const ALL_CATEGORIES: ProductCategory[] = [
  'Dairy & Cold Storage',
  'Staples & Grains',
  'Edible Oils & Ghee',
  'Spices & Masalas',
  'Snacks & Biscuits',
  'Beverages & Tea',
  'Cleaning & Household',
  'Personal Care',
];

export default function App() {
  // 1. Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  // 2. Inventory Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure every product has a valid expiryDate
          return parsed.map((item: Product) => {
            if (!item.expiryDate || item.expiryDate.trim() === '' || item.expiryDate === 'N/A') {
              if (item.id === 'prod-001' || item.name.toLowerCase().includes('amul taaza')) {
                return { ...item, expiryDate: getRelativeDate(2) };
              }
              const defaultMatch = INITIAL_PRODUCTS.find((ip) => ip.id === item.id);
              return {
                ...item,
                expiryDate: defaultMatch?.expiryDate || getRelativeDate(30),
              };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored inventory from localStorage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // 3. Sales Transactions State
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(SALES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse sales from localStorage:', e);
    }
    // Default: initialize with empty list (user can 1-click load demo history or record sales)
    return [];
  });

  // 4. Inventory Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 5. Modal Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isStudentGuideOpen, setIsStudentGuideOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  const [recordSaleProduct, setRecordSaleProduct] = useState<Product | null>(null);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);

  // 6. Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Save Inventory to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save inventory to localStorage:', e);
    }
  }, [products]);

  // Save Sales to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to save sales to localStorage:', e);
    }
  }, [transactions]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // 7. Calculate Real-time Inventory KPI Metrics
  const stats: InventoryStats = useMemo(() => {
    let totalWholesale = 0;
    let totalRetail = 0;
    let totalQty = 0;
    let lowStock = 0;
    let expiringSoon = 0;
    let expired = 0;

    for (const p of products) {
      const qty = p.quantity;
      totalQty += qty;
      totalWholesale += p.purchasePrice * qty;
      totalRetail += p.sellingPrice * qty;

      if (getStockStatus(p) === 'low_stock' || getStockStatus(p) === 'out_of_stock') {
        lowStock += 1;
      }

      const expiryStatus = getExpiryStatus(p.expiryDate);
      if (expiryStatus === 'expired') {
        expired += 1;
      } else if (expiryStatus === 'expiring_soon') {
        expiringSoon += 1;
      }
    }

    const potentialProfit = totalRetail - totalWholesale;
    const averageMarginPercent = totalRetail > 0 ? calculateMarginPercent(totalWholesale, totalRetail) : 0;

    return {
      totalProducts: products.length,
      totalQuantity: totalQty,
      totalWholesaleValue: totalWholesale,
      totalRetailValue: totalRetail,
      potentialProfit,
      averageMarginPercent,
      lowStockCount: lowStock,
      expiringSoonCount: expiringSoon,
      expiredCount: expired,
    };
  }, [products]);

  // Stockout Risk Count for Tab Badge
  const stockoutRiskCount = useMemo(() => {
    return products.filter((p) => {
      const forecast = buildProductForecast(p, transactions, 2, 3);
      return forecast.reorder.urgency === 'critical';
    }).length;
  }, [products, transactions]);

  // 8. Filter & Sort Computation for Inventory Table
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = product.name.toLowerCase().includes(q);
          const matchBrand = product.brand.toLowerCase().includes(q);
          const matchCategory = product.category.toLowerCase().includes(q);
          const matchBatch = product.batchNumber ? product.batchNumber.toLowerCase().includes(q) : false;
          const matchNotes = product.notes ? product.notes.toLowerCase().includes(q) : false;

          if (!matchName && !matchBrand && !matchCategory && !matchBatch && !matchNotes) {
            return false;
          }
        }

        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        if (selectedStatus === 'low_stock') {
          return product.quantity <= product.minThreshold;
        }
        if (selectedStatus === 'expiring_soon') {
          const days = getDaysUntilExpiry(product.expiryDate);
          return days >= 0 && days <= 15;
        }
        if (selectedStatus === 'expired') {
          return getDaysUntilExpiry(product.expiryDate) < 0;
        }
        if (selectedStatus === 'in_stock') {
          return product.quantity > product.minThreshold && getDaysUntilExpiry(product.expiryDate) > 15;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'quantity') {
          comparison = a.quantity - b.quantity;
        } else if (sortField === 'expiryDate') {
          comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else if (sortField === 'sellingPrice') {
          comparison = a.sellingPrice - b.sellingPrice;
        } else if (sortField === 'totalValue') {
          comparison = a.purchasePrice * a.quantity - b.purchasePrice * b.quantity;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortField, sortOrder]);

  // 9. Handlers

  // Save Product (Add or Edit)
  const handleSaveProduct = (
    productData: Omit<Product, 'id' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...productData, id, updatedAt: new Date().toISOString() } : p
        )
      );
      showToast(`Updated "${productData.name}" successfully`, 'success');
    } else {
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Added "${productData.name}" to store inventory`, 'success');
    }
    setEditingProduct(null);
    setIsAddModalOpen(false);
  };

  // Delete Product
  const handleConfirmDelete = (id: string) => {
    const productToDelete = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`Removed "${productToDelete?.name || 'Item'}" from inventory`, 'info');
  };

  // Record a dated Sale
  const handleRecordSale = (saleData: Omit<SaleTransaction, 'id' | 'timestamp'>) => {
    // 1. Deduct stock from product
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === saleData.productId) {
          const newQty = Math.max(0, p.quantity - saleData.quantity);
          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    // 2. Append transaction to sales history
    const newTxn: SaleTransaction = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [newTxn, ...prev]);

    showToast(
      `Recorded sale: ${saleData.quantity} units of ${saleData.productName}`,
      'success'
    );
  };

  // Quick Quantity Update from table (+1 or -1)
  const handleUpdateQuantity = (id: string, delta: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (delta < 0 && product.quantity > 0) {
      // Synchronize fast counter sales with sales ledger
      const todayStr = formatDateISO(new Date());
      const newTxn: SaleTransaction = {
        id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalAmount: product.sellingPrice,
        saleDate: todayStr,
        timestamp: new Date().toISOString(),
        isSynthetic: false,
        notes: 'Counter sale deduction (-1)',
      };
      setTransactions((prev) => [newTxn, ...prev]);
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newQty = Math.max(0, p.quantity + delta);
          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  // Commit CSV Import
  const handleCommitCSVImport = (importedTransactions: SaleTransaction[]) => {
    setTransactions((prev) => [...importedTransactions, ...prev]);
    showToast(
      `Successfully imported ${importedTransactions.length} sales transactions`,
      'success'
    );
  };

  // Load 30-Day Synthetic Demo History
  const handleLoadSyntheticDemo = () => {
    const synthSales = generateSyntheticKiranaSales(products);
    // Replace existing synthetic records and keep real sales
    setTransactions((prev) => [...synthSales, ...prev.filter((t) => !t.isSynthetic)]);
    showToast(
      `Loaded ${synthSales.length} synthetic Kirana transactions for 7-day forecasting demo`,
      'info'
    );
  };

  // Clear Synthetic Sales
  const handleClearSyntheticSales = () => {
    const realSales = transactions.filter((t) => !t.isSynthetic);
    setTransactions(realSales);
    showToast('Cleared synthetic demo records. Preserved real store sales.', 'info');
  };

  // Reset to default sample Kirana catalogue
  const handleConfirmReset = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    showToast('Inventory reset to default Kirana sample data', 'info');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  // Export inventory to CSV file
  const handleExportCSV = () => {
    try {
      const escapeCSV = (val: string | number | undefined | null): string => {
        if (val === undefined || val === null) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Product Name',
        'Brand',
        'Category',
        'Current Stock',
        'Unit',
        'Expiry Date',
        'Days Left Until Expiry',
        'Expiry Risk Status',
        'Wholesale Cost Price (INR)',
        'Retail Selling Price MRP (INR)',
        'Gross Margin %',
        'Reorder Threshold',
        'Stock Health Alert',
        'Total Wholesale Value (INR)',
        'Batch / Shelf Location',
        'Kirana Notes',
      ];

      const rows = filteredProducts.map((p) => {
        const effectiveExpiry =
          p.expiryDate && p.expiryDate.trim() !== '' && p.expiryDate !== 'N/A'
            ? p.expiryDate
            : p.id === 'prod-001' || p.name.toLowerCase().includes('amul taaza')
            ? getRelativeDate(2)
            : getRelativeDate(30);

        const daysLeft = getDaysUntilExpiry(effectiveExpiry);
        const expiryStatus = getExpiryStatus(effectiveExpiry);
        const stockStatus = getStockStatus(p);
        const margin = calculateMarginPercent(p.purchasePrice, p.sellingPrice);

        let expiryRiskLabel = 'Shelf Life Remaining';
        if (expiryStatus === 'expired') {
          expiryRiskLabel = `EXPIRED (${Math.abs(daysLeft)} days ago - REMOVE FROM SALE IMMEDIATELY. DO NOT SELL EXPIRED FOOD.)`;
        } else if (expiryStatus === 'expiring_soon') {
          expiryRiskLabel =
            daysLeft === 0
              ? 'EXPIRES TODAY (CRITICAL - REVIEW FOOD SAFETY)'
              : `EXPIRING SOON (${daysLeft} days left - CHECK CONDITION & STORE POLICY)`;
        } else {
          expiryRiskLabel = `Shelf Life Remaining (${daysLeft} days)`;
        }

        let stockAlertLabel = 'Optimal Stock';
        if (stockStatus === 'out_of_stock') {
          stockAlertLabel = 'OUT OF STOCK';
        } else if (stockStatus === 'low_stock') {
          stockAlertLabel = `LOW STOCK (Reorder Level: ${p.minThreshold})`;
        }

        return [
          escapeCSV(p.name),
          escapeCSV(p.brand),
          escapeCSV(p.category),
          escapeCSV(p.quantity),
          escapeCSV(p.unit),
          escapeCSV(effectiveExpiry),
          escapeCSV(daysLeft),
          escapeCSV(expiryRiskLabel),
          escapeCSV(p.purchasePrice),
          escapeCSV(p.sellingPrice),
          escapeCSV(`${margin}%`),
          escapeCSV(p.minThreshold),
          escapeCSV(stockAlertLabel),
          escapeCSV(p.purchasePrice * p.quantity),
          escapeCSV(p.batchNumber || ''),
          escapeCSV(p.notes || ''),
        ];
      });

      const csvContent =
        '\uFEFF' +
        [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `dukaaniq_kirana_inventory_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Exported inventory with expiry dates to CSV file', 'success');
    } catch (e) {
      console.error('Failed to export CSV', e);
      showToast('Failed to generate CSV export', 'warning');
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedStatus !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Top Navigation Bar */}
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenStudentGuide={() => setIsStudentGuideOpen(true)}
        onResetData={() => setIsResetModalOpen(true)}
        totalProductsCount={products.length}
      />

      {/* 2. Sub-Header Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inventoryCount={products.length}
        salesCount={transactions.length}
        stockoutRiskCount={stockoutRiskCount}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Notification Banner */}
        {toast && (
          <div className="mb-4 p-3 rounded-lg border bg-white shadow-sm flex items-center justify-between text-xs transition-all animate-in fade-in duration-200">
            <span
              className={`font-semibold ${
                toast.type === 'success'
                  ? 'text-teal-700'
                  : toast.type === 'warning'
                  ? 'text-amber-700'
                  : 'text-slate-700'
              }`}
            >
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* TAB 1: STORE INVENTORY */}
        {activeTab === 'inventory' && (
          <div>
            {/* KPI Statistics */}
            <DashboardStats
              stats={stats}
              activeStatusFilter={selectedStatus}
              onSelectStatusFilter={(status) => setSelectedStatus(status)}
            />

            {/* Actionable Warnings & Operational Alerts */}
            <AlertBanners
              products={products}
              onFilterExpired={() => setSelectedStatus('expired')}
              onFilterExpiring={() => setSelectedStatus('expiring_soon')}
              onFilterLowStock={() => setSelectedStatus('low_stock')}
            />

            {/* Filters */}
            <InventoryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={(field) => {
                if (sortField === field) {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortField(field);
                  setSortOrder('asc');
                }
              }}
              categories={ALL_CATEGORIES}
              totalFilteredCount={filteredProducts.length}
              onExportCSV={handleExportCSV}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Product Table */}
            <ProductTable
              products={filteredProducts}
              onEditProduct={(p) => setEditingProduct(p)}
              onDeleteProduct={(p) => setDeletingProduct(p)}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onRecordSaleProduct={(p) => {
                setRecordSaleProduct(p);
                setIsRecordSaleModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 2: SALES HISTORY & CSV IMPORT */}
        {activeTab === 'sales' && (
          <SalesHistoryView
            transactions={transactions}
            products={products}
            onOpenRecordSaleModal={() => {
              setRecordSaleProduct(null);
              setIsRecordSaleModalOpen(true);
            }}
            onOpenCSVImportModal={() => setIsCSVImportModalOpen(true)}
            onLoadSyntheticDemo={handleLoadSyntheticDemo}
            onClearSyntheticSales={handleClearSyntheticSales}
          />
        )}

        {/* TAB 3: DEMAND INTELLIGENCE (7-DAY FORECASTING) */}
        {activeTab === 'forecasting' && (
          <DemandIntelligenceView
            products={products}
            transactions={transactions}
            onOpenRecordSaleModal={() => {
              setRecordSaleProduct(null);
              setIsRecordSaleModalOpen(true);
            }}
            onLoadSyntheticDemo={handleLoadSyntheticDemo}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong>DukaanIQ</strong> — AI Inventory, Demand Forecasting & Food-Waste Monitoring for Kiranas.
          </div>
          <div className="flex items-center gap-3">
            <span>BTech CSE Final Project</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsStudentGuideOpen(true)}
              className="text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2 cursor-pointer"
            >
              View System Architecture & Viva Guide
            </button>
          </div>
        </div>
      </footer>

      {/* 5. Modals */}

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isAddModalOpen || Boolean(editingProduct)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        categories={ALL_CATEGORIES}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationModal
        isOpen={Boolean(deletingProduct)}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />

      {/* Record Sale Modal */}
      <RecordSaleModal
        isOpen={isRecordSaleModalOpen}
        onClose={() => {
          setIsRecordSaleModalOpen(false);
          setRecordSaleProduct(null);
        }}
        products={products}
        selectedProduct={recordSaleProduct}
        onRecordSale={handleRecordSale}
      />

      {/* Sales CSV Import Modal */}
      <SalesCSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={() => setIsCSVImportModalOpen(false)}
        existingProducts={products}
        onCommitImport={handleCommitCSVImport}
      />

      {/* BTech Student Architecture Guide Modal */}
      <StudentGuideModal
        isOpen={isStudentGuideOpen}
        onClose={() => setIsStudentGuideOpen(false)}
      />
    </div>
  );
}
