import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, AlertCircle } from 'lucide-react';
import { Product } from '../types/inventory';
import { SaleTransaction } from '../types/demand';
import { formatINR, pluralizeUnit } from '../utils/formatters';
import { formatDateISO } from '../utils/forecasting';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product | null;
  onRecordSale: (sale: Omit<SaleTransaction, 'id' | 'timestamp'>) => void;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  onRecordSale,
}) => {
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [saleDate, setSaleDate] = useState<string>(formatDateISO(new Date()));
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (selectedProduct) {
      setProductId(selectedProduct.id);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
    setQuantity('1');
    setSaleDate(formatDateISO(new Date()));
    setNotes('');
    setError('');
    setIsSubmitting(false);
  }, [selectedProduct, isOpen, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === productId);
  const qtyNum = parseInt(quantity, 10) || 0;
  const unitPrice = currentProduct ? currentProduct.sellingPrice : 0;
  const totalAmount = qtyNum * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentProduct) {
      setError('Please select a valid product.');
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Sale quantity must be a positive integer greater than 0.');
      return;
    }

    if (qtyNum > currentProduct.quantity) {
      setError(
        `Cannot record sale of ${qtyNum} ${pluralizeUnit(currentProduct.unit, qtyNum)}. Only ${currentProduct.quantity} units available in stock.`
      );
      return;
    }

    if (!saleDate) {
      setError('Sale date is required.');
      return;
    }

    setIsSubmitting(true);

    onRecordSale({
      productId: currentProduct.id,
      productName: currentProduct.name,
      category: currentProduct.category,
      quantity: qtyNum,
      unitPrice,
      totalAmount,
      saleDate,
      isSynthetic: false,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Store Sale</h3>
              <p className="text-xs text-slate-500">Record a dated sale transaction and deduct inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                  {p.name} — Current Stock: {p.quantity} {pluralizeUnit(p.unit, p.quantity)} ({formatINR(p.sellingPrice)})
                  {p.quantity <= 0 ? ' [OUT OF STOCK]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          {currentProduct && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Available Shelf Stock:</span>{' '}
                <strong className={`tabular-nums ${currentProduct.quantity <= currentProduct.minThreshold ? 'text-amber-700' : 'text-slate-800'}`}>
                  {currentProduct.quantity} {pluralizeUnit(currentProduct.unit, currentProduct.quantity)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Unit Price:</span>{' '}
                <strong className="text-slate-800 tabular-nums">{formatINR(unitPrice)}</strong>
              </div>
            </div>
          )}

          {/* Quantity & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Sold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={currentProduct ? currentProduct.quantity : undefined}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={saleDate}
                max={formatDateISO(new Date())}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Total Value Live Preview */}
          <div className="p-3.5 bg-teal-50/60 rounded-lg border border-teal-200 flex items-center justify-between text-xs">
            <span className="text-teal-900 font-medium">Total Transaction Value:</span>
            <span className="text-base font-bold text-teal-950 tabular-nums">
              {formatINR(totalAmount)}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Counter Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Counter sale, regular customer, cash payment"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (currentProduct ? currentProduct.quantity <= 0 : true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {isSubmitting ? 'Recording...' : 'Confirm & Deduct Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

