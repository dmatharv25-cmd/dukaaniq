import React from 'react';
import { Edit2, Trash2, Plus, Minus, AlertTriangle, Clock, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
import { Product } from '../types/inventory';
import {
  formatINR,
  formatDateDisplay,
  getDaysUntilExpiry,
  calculateMarginPercent,
  getStockStatus,
  getExpiryStatus,
} from '../utils/formatters';

interface ProductTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onOpenAddModal: () => void;
  onRecordSaleProduct?: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  onUpdateQuantity,
  onOpenAddModal,
  onRecordSaleProduct,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          No matching products found
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          No inventory items match your current search keywords or status filter. Try clearing filters or add a new grocery item to your store catalogue.
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">
                Product Details
              </th>
              <th scope="col" className="py-3 px-4">
                Category
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Cost Price
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                MRP / Selling
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Stock & Quick Adjust
              </th>
              <th scope="col" className="py-3 px-4">
                Expiry & Status
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Total Value
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              const expiryStatus = getExpiryStatus(product.expiryDate);
              const daysLeft = getDaysUntilExpiry(product.expiryDate);
              const margin = calculateMarginPercent(product.purchasePrice, product.sellingPrice);
              const totalWholesaleValue = product.purchasePrice * product.quantity;

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    expiryStatus === 'expired'
                      ? 'bg-rose-50/20'
                      : stockStatus === 'low_stock'
                      ? 'bg-amber-50/20'
                      : ''
                  }`}
                >
                  {/* 1. Product Name, Brand & Notes */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="font-semibold text-slate-900 leading-tight">
                      {product.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{product.brand}</span>
                      {product.batchNumber && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono text-slate-400">{product.batchNumber}</span>
                        </>
                      )}
                    </div>
                    {product.notes && (
                      <p className="mt-1 text-[11px] text-slate-400 italic truncate max-w-[220px]" title={product.notes}>
                        {product.notes}
                      </p>
                    )}
                  </td>

                  {/* 2. Category */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <span>{product.category}</span>
                  </td>

                  {/* 3. Purchase / Cost Price */}
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                    {formatINR(product.purchasePrice)}
                    <span className="block text-[10px] text-slate-400">wholesale</span>
                  </td>

                  {/* 4. Selling Price (MRP) + Margin */}
                  <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-slate-900">
                      {formatINR(product.sellingPrice)}
                    </span>
                    <span className="block text-[10px] text-emerald-700 font-medium">
                      +{margin}% margin
                    </span>
                  </td>

                  {/* 5. Current Quantity + Quick Counter Buttons */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        title="Reduce stock by 1 (e.g. sale over counter)"
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="min-w-[60px] text-center">
                        <span className={`font-bold tabular-nums text-sm ${
                          stockStatus === 'out_of_stock'
                            ? 'text-rose-600'
                            : stockStatus === 'low_stock'
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }`}>
                          {product.quantity}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          {product.unit}s
                        </span>
                      </div>

                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        title="Add 1 to stock (e.g. fresh delivery intake)"
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Stock Alert Label */}
                    <div className="mt-1 text-[10px]">
                      {stockStatus === 'out_of_stock' ? (
                        <span className="text-rose-700 font-semibold flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600 inline" /> Out of stock
                        </span>
                      ) : stockStatus === 'low_stock' ? (
                        <span className="text-amber-700 font-medium flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 inline" /> Reorder (min: {product.minThreshold})
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Reorder at ≤{product.minThreshold}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. Expiry Date & Expiry Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="tabular-nums text-slate-800 font-medium">
                      {formatDateDisplay(product.expiryDate)}
                    </div>
                    <div className="mt-1 text-[11px] flex items-center gap-1">
                      {expiryStatus === 'expired' ? (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Expired {Math.abs(daysLeft)}d ago
                        </span>
                      ) : expiryStatus === 'expiring_soon' ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft}d`}
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {daysLeft} days shelf life
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 7. Total Inventory Value */}
                  <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                    <div className="font-semibold text-slate-800">
                      {formatINR(totalWholesaleValue)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      cost basis
                    </div>
                  </td>

                  {/* 8. Actions (Record Sale / Edit / Delete) */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {onRecordSaleProduct && (
                        <button
                          onClick={() => onRecordSaleProduct(product)}
                          disabled={product.quantity <= 0}
                          title={product.quantity <= 0 ? 'Out of stock' : 'Record customer sale'}
                          className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditProduct(product)}
                        title="Edit product details"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product)}
                        title="Remove product from catalogue"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary Bar */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Showing <strong className="text-slate-800 tabular-nums">{products.length}</strong> active rows</span>
          <span>·</span>
          <span>Click <strong className="text-slate-700">+ / -</strong> to record fast counter sales</span>
        </div>
        <div className="flex items-center gap-4 tabular-nums">
          <span>
            Batch Cost: <strong className="text-slate-800">{formatINR(products.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0))}</strong>
          </span>
          <span>
            Potential Revenue: <strong className="text-emerald-700">{formatINR(products.reduce((acc, p) => acc + p.sellingPrice * p.quantity, 0))}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
