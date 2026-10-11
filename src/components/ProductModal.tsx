import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Product, ProductCategory, ProductUnit } from '../types/inventory';
import { calculateMarginPercent, formatINR, getRelativeDate } from '../utils/formatters';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'updatedAt'>, id?: string) => void;
  initialProduct?: Product | null;
  categories: ProductCategory[];
}

const UNITS: ProductUnit[] = ['packet', 'kg', 'g', 'liter', 'ml', 'piece', 'bottle', 'box'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  categories,
}) => {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Dairy & Cold Storage');
  const [purchasePrice, setPurchasePrice] = useState<string>('50');
  const [sellingPrice, setSellingPrice] = useState<string>('60');
  const [quantity, setQuantity] = useState<string>('10');
  const [unit, setUnit] = useState<ProductUnit>('packet');
  const [minThreshold, setMinThreshold] = useState<string>('5');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setBrand(initialProduct.brand);
      setCategory(initialProduct.category);
      setPurchasePrice(String(initialProduct.purchasePrice));
      setSellingPrice(String(initialProduct.sellingPrice));
      setQuantity(String(initialProduct.quantity));
      setUnit(initialProduct.unit);
      setMinThreshold(String(initialProduct.minThreshold));
      setExpiryDate(initialProduct.expiryDate || getRelativeDate(30));
      setBatchNumber(initialProduct.batchNumber || '');
      setNotes(initialProduct.notes || '');
    } else {
      // Default new product values
      setName('');
      setBrand('');
      setCategory('Dairy & Cold Storage');
      setPurchasePrice('40');
      setSellingPrice('50');
      setQuantity('15');
      setUnit('packet');
      setMinThreshold('5');
      // Default expiry date 30 days ahead
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setExpiryDate(nextMonth.toISOString().split('T')[0]);
      setBatchNumber('');
      setNotes('');
    }
    setErrors({});
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const costNum = parseFloat(purchasePrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const currentMargin = calculateMarginPercent(costNum, sellNum);
  const profitPerUnit = sellNum - costNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!brand.trim()) newErrors.brand = 'Brand name is required';
    if (!purchasePrice || costNum < 0) newErrors.purchasePrice = 'Valid wholesale cost is required';
    if (!sellingPrice || sellNum <= 0) newErrors.sellingPrice = 'Valid selling price (MRP) is required';
    if (costNum > sellNum) {
      newErrors.sellingPrice = 'Selling price is lower than cost (negative margin)';
    }
    if (quantity === '' || parseInt(quantity, 10) < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    if (!expiryDate) {
      newErrors.expiryDate = 'Expiry date is required for food waste monitoring';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        name: name.trim(),
        brand: brand.trim(),
        category,
        purchasePrice: costNum,
        sellingPrice: sellNum,
        quantity: parseInt(quantity, 10) || 0,
        unit,
        minThreshold: parseInt(minThreshold, 10) || 0,
        expiryDate,
        batchNumber: batchNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      initialProduct?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Kirana Product' : 'Add New Grocery Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter inventory details, cost prices, and expiry dates for real-time tracking
            </p>
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
          {/* Row 1: Product Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amul Taaza Toned Milk (500 ml)"
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-md border ${
                  errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Manufacturer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Amul, ITC, Tata, Nestlé"
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-md border ${
                  errors.brand ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
              {errors.brand && <p className="mt-1 text-[11px] text-rose-600">{errors.brand}</p>}
            </div>
          </div>

          {/* Row 2: Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white capitalize"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Pricing & Margin Live Calculator */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wholesale Cost Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                {errors.purchasePrice && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.purchasePrice}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retail Selling Price / MRP (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                {errors.sellingPrice && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.sellingPrice}</p>
                )}
              </div>
            </div>

            {/* Live Financial Margin Calculation Preview */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Unit Margin: <strong className={`font-semibold tabular-nums ${currentMargin < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {currentMargin}% ({formatINR(profitPerUnit)} profit/unit)
                </strong>
              </span>
              <span className="text-slate-400">Calculated automatically</span>
            </div>
          </div>

          {/* Row 4: Quantity & Reorder Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Quantity in Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              {errors.quantity && <p className="mt-1 text-[11px] text-rose-600">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Threshold (Alert Level)
              </label>
              <input
                type="number"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder="Alert when stock falls to this"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-400">Trigger low-stock warning when quantity ≤ threshold</p>
            </div>
          </div>

          {/* Row 5: Expiry Date & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.expiryDate && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Shelf Location (Optional)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. Rack A-1, BATCH-99"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kirana Remarks / Distributor Info (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery arrives Tuesday morning; Supplier: Rajesh Provisions"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {isEditing ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
