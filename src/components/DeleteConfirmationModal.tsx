import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product } from '../types/inventory';
import { formatINR, pluralizeUnit } from '../utils/formatters';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Remove Product from Inventory?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Are you sure you want to remove <strong className="text-slate-800">{product.name}</strong> ({product.brand})? This item currently has <strong className="text-slate-800">{product.quantity} {pluralizeUnit(product.unit, product.quantity)}</strong> valued at <strong className="text-slate-800">{formatINR(product.purchasePrice * product.quantity)}</strong>.
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1 mb-5">
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium text-slate-800">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Expiry Date:</span>
              <span className="font-medium text-slate-800">{product.expiryDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(product.id);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

