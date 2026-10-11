import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-4">
            <RotateCcw className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Reset to Sample Kirana Inventory?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            This will restore the 18 default Kirana sample products (Amul Milk, Atta, Tata Salt, Biscuits, etc.) with calibrated expiry dates. Any custom products added during your session will be replaced.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Yes, Reset Sample Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
