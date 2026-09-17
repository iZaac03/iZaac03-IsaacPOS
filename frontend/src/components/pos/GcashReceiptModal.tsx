import React from 'react';
import { GcashTransaction } from '../../types';
import { formatPHP, formatDateTime } from '../../utils/format';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export interface GcashReceiptModalProps {
  transaction: GcashTransaction;
  onClose: () => void;
}

export const GcashReceiptModal: React.FC<GcashReceiptModalProps> = ({ transaction, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isCashIn = transaction.transaction_type === 'cash_in';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="bg-white rounded-md shadow-xl max-w-sm w-full overflow-hidden border border-slate-300">
        {/* Top actions bar (hidden during printing) */}
        <div className="no-print flex items-center justify-between px-4 py-3 bg-[#007dfe] text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              GCash Receipt Slip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="bg-white text-slate-800 hover:bg-slate-100"
            >
              Print Slip
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt (80mm width standard) */}
        <div
          id="thermal-receipt"
          className="p-6 bg-white text-slate-900 font-mono text-xs leading-tight max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-xl bg-[#007dfe] text-white font-bold flex items-center justify-center text-xl shadow-sm">
                G
              </div>
            </div>
            <h2 className="font-bold text-sm tracking-wider uppercase text-[#007dfe]">
              GCash Financial Service
            </h2>
            <div className="inline-block px-2.5 py-0.5 rounded font-bold text-[11px] uppercase tracking-wide bg-slate-100 border border-slate-300 mt-1">
              {isCashIn ? '★ CASH IN TRANSACTION ★' : '★ CASH OUT TRANSACTION ★'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              IsaacPOS Official Partner Station
            </p>
          </div>

          {/* Meta Information */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-bold">#GC-{transaction.gcash_transaction_id.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formatDateTime(transaction.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier / Staff:</span>
              <span>
                {transaction.user?.name ||
                  (transaction.user?.first_name
                    ? `${transaction.user.first_name} ${transaction.user.last_name || ''}`.trim()
                    : 'Cashier')}
              </span>
            </div>
            {transaction.reference_number && (
              <div className="flex justify-between">
                <span className="text-slate-500">GCash Ref No:</span>
                <span className="font-bold text-slate-900">{transaction.reference_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">GCash Mobile No:</span>
              <span className="font-bold text-slate-900">{transaction.customer_phone}</span>
            </div>
            {transaction.customer_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold">{transaction.customer_name}</span>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Principal Amount:</span>
              <span className="font-semibold">{formatPHP(transaction.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Service Charge Fee:</span>
              <span className="font-semibold">{formatPHP(transaction.fee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold">
              <span>{isCashIn ? 'Total Cash Collected:' : 'Cash Disbursed:'}</span>
              <span className="text-[#007dfe]">{formatPHP(transaction.total_amount)}</span>
            </div>
          </div>

          {/* Verification & Notice */}
          <div className="pt-4 text-center space-y-1 text-[10px] text-slate-500">
            <div className="flex items-center justify-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>STATUS: COMPLETED</span>
            </div>
            <p className="pt-1">Please verify SMS notification on your mobile phone.</p>
            <p>Keep this slip as proof of your GCash transaction.</p>
            <p className="font-semibold pt-1">Maraming Salamat!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
