import React, { useState } from 'react';
import { X, Upload, Download, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Product } from '../types/inventory';
import { SaleTransaction, CSVImportValidationResult } from '../types/demand';
import { validateSalesCSV, formatDateISO } from '../utils/forecasting';
import { formatINR } from '../utils/formatters';

interface SalesCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onCommitImport: (transactions: SaleTransaction[]) => void;
}

export const SalesCSVImportModal: React.FC<SalesCSVImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onCommitImport,
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<CSVImportValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const result = validateSalesCSV(text, existingProducts);
      setValidationResult(result);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const today = new Date();
    const d1 = formatDateISO(new Date(today.getTime() - 86400000 * 2));
    const d2 = formatDateISO(new Date(today.getTime() - 86400000 * 1));
    const d3 = formatDateISO(today);

    const templateRows = [
      'date,product,quantity,unit_price',
      `${d1},"Amul Taaza Toned Milk (500 ml)",15,28`,
      `${d1},"Aashirvaad Shudh Chakki Atta (5 kg)",2,245`,
      `${d2},"Amul Taaza Toned Milk (500 ml)",18,28`,
      `${d2},"Parle-G Gold Gluco Biscuits (250 g)",6,30`,
      `${d3},"Tata Salt Vacuum Evaporated (1 kg)",3,28`,
      `${d3},"Maggi 2-Minute Masala Noodles (4-Pack, 280 g)",5,58`,
    ];

    const blob = new Blob(['\uFEFF' + templateRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dukaaniq_sales_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCommit = () => {
    if (!validationResult || validationResult.validTransactions.length === 0) return;
    onCommitImport(validationResult.validTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Historical Sales CSV</h3>
              <p className="text-xs text-slate-500">Bulk load daily sales data for 7-day demand forecasting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Template helper banner */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                Required CSV Column Format
              </div>
              <p className="text-slate-500 mt-0.5 text-[11px]">
                Headers must include: <code>date</code> (YYYY-MM-DD), <code>product</code> (Name or ID), <code>quantity</code>, and optional <code>unit_price</code>.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Download Example CSV</span>
            </button>
          </div>

          {/* Upload input zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-lg p-6 text-center transition-colors">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <label className="cursor-pointer font-semibold text-teal-700 hover:text-teal-800">
              <span>Choose sales CSV file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-slate-400 text-[11px] mt-1">
              {fileName ? `Selected: ${fileName}` : 'Supports UTF-8 CSV exports from POS, Excel, or Google Sheets'}
            </p>
          </div>

          {/* Validation Report */}
          {validationResult && (
            <div className="space-y-4">
              {/* Status summary */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  validationResult.errors.length === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : validationResult.validTransactions.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {validationResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="font-semibold">
                    {validationResult.errors.length === 0
                      ? `All ${validationResult.validTransactions.length} records validated successfully!`
                      : `${validationResult.validTransactions.length} valid records, ${validationResult.errors.length} rows with errors`}
                  </span>
                </div>
                <span className="text-[11px] tabular-nums font-medium">
                  {validationResult.totalRows} total rows parsed
                </span>
              </div>

              {/* Errors list if any */}
              {validationResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 space-y-1.5 max-h-36 overflow-y-auto">
                  <div className="font-semibold text-rose-800 text-[11px] uppercase tracking-wider">
                    Validation Issues Found:
                  </div>
                  {validationResult.errors.map((err, idx) => (
                    <div key={idx} className="text-[11px] text-rose-700 leading-snug">
                      <strong>Line {err.rowNumber}:</strong> {err.errors.join('; ')}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview of valid transactions */}
              {validationResult.validTransactions.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-800 mb-2">
                    Preview Ready to Commit ({validationResult.validTransactions.length} items):
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-3 text-right">Quantity</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validationResult.validTransactions.slice(0, 10).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono">{t.saleDate}</td>
                            <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[180px]">{t.productName}</td>
                            <td className="py-2 px-3 text-right tabular-nums font-semibold">{t.quantity}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{formatINR(t.unitPrice)}</td>
                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-teal-800">
                              {formatINR(t.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validationResult.validTransactions.length > 10 && (
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                      Showing first 10 of {validationResult.validTransactions.length} records
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCommit}
            disabled={!validationResult || validationResult.validTransactions.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Commit {validationResult?.validTransactions.length || 0} Transactions
          </button>
        </div>
      </div>
    </div>
  );
};
