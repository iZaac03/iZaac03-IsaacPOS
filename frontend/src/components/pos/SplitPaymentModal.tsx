import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PaymentMethod, Payment } from '../../types';
import { formatPHP } from '../../utils/format';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onProcessOrder: (payments: Payment[]) => Promise<void>;
  isProcessing: boolean;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onProcessOrder,
  isProcessing,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('cash');
  const [amountInput, setAmountInput] = useState<string>('');
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [referenceInput, setReferenceInput] = useState<string>('');

  // Calculate allocated and remaining
  const totalAllocated = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, Math.round((totalAmount - totalAllocated) * 100) / 100);

  // Auto-fill amount input with remaining balance when opened or method changed
  React.useEffect(() => {
    if (isOpen && payments.length === 0) {
      setAmountInput(totalAmount.toFixed(2));
      setTenderedInput(totalAmount.toFixed(2));
    }
  }, [isOpen, totalAmount, payments.length]);

  const handleMethodChange = (method: PaymentMethod) => {
    setCurrentMethod(method);
    setAmountInput(remainingBalance.toFixed(2));
    if (method === 'cash') {
      setTenderedInput(remainingBalance.toFixed(2));
    } else {
      setTenderedInput('');
    }
    setReferenceInput('');
  };

  const handleQuickCash = (value: number) => {
    setTenderedInput(value.toString());
  };

  const handleAddPayment = () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) return;

    const tendered = currentMethod === 'cash' ? parseFloat(tenderedInput) || amt : amt;
    const change = currentMethod === 'cash' ? Math.max(0, tendered - amt) : 0;

    const newPayment: Payment = {
      payment_method: currentMethod,
      amount: amt,
      tendered_amount: tendered,
      change_amount: change,
      reference_no: referenceInput.trim() || undefined,
    };

    setPayments([...payments, newPayment]);

    // Reset inputs for next payment line
    const newRemaining = Math.max(0, remainingBalance - amt);
    setAmountInput(newRemaining > 0 ? newRemaining.toFixed(2) : '');
    setTenderedInput(newRemaining > 0 ? newRemaining.toFixed(2) : '');
    setReferenceInput('');
  };

  const handleRemovePayment = (index: number) => {
    const updated = [...payments];
    updated.splice(index, 1);
    setPayments(updated);
  };

  const handleComplete = async () => {
    if (remainingBalance > 0 && payments.length === 0) {
      // If user hasn't clicked "Add" but filled the form
      const amt = parseFloat(amountInput);
      if (amt >= totalAmount) {
        const tendered = currentMethod === 'cash' ? parseFloat(tenderedInput) || amt : amt;
        const change = currentMethod === 'cash' ? Math.max(0, tendered - amt) : 0;
        await onProcessOrder([
          {
            payment_method: currentMethod,
            amount: totalAmount,
            tendered_amount: tendered,
            change_amount: change,
            reference_no: referenceInput.trim() || undefined,
          },
        ]);
        return;
      }
    }

    if (payments.length > 0) {
      await onProcessOrder(payments);
    }
  };

  // Compute total tendered & change across all cash payments
  const totalTendered = payments.reduce((sum, p) => sum + (p.tendered_amount || p.amount), 0);
  const totalChange = Math.max(0, totalTendered - totalAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout & Payment Tender"
      subtitle="Support single or multi-tender split payments (Cash, GCash, Maya, Card)"
      maxWidth="2xl"
      darkTheme={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Tender Selection Form */}
        <div className="md:col-span-7 space-y-4">
          {/* Method Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select Tender Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleMethodChange('cash')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  currentMethod === 'cash'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('gcash')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  currentMethod === 'gcash'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm shadow-sky-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1" />
                GCash
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('maya')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  currentMethod === 'maya'
                    ? 'bg-green-500/20 border-green-500 text-green-300 shadow-sm shadow-green-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1" />
                Maya
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('card')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  currentMethod === 'card'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm shadow-purple-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" />
                Card
              </button>
            </div>
          </div>

          {/* Amount to Apply */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Amount (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-lg font-bold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {currentMethod === 'cash' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Cash Tendered (₱)
                  </label>
                  {parseFloat(tenderedInput) > parseFloat(amountInput || '0') && (
                    <span className="text-xs font-semibold text-emerald-400">
                      Change: {formatPHP(parseFloat(tenderedInput) - parseFloat(amountInput || '0'))}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  placeholder="Amount handed by customer"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-base font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[20, 50, 100, 200, 500, 1000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => handleQuickCash(denom)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      ₱{denom}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTenderedInput(amountInput)}
                    className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 rounded text-xs font-semibold border border-emerald-800 transition-colors"
                  >
                    Exact
                  </button>
                </div>
              </div>
            )}

            {(currentMethod === 'gcash' || currentMethod === 'maya') && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {currentMethod.toUpperCase()} Reference No.
                </label>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. 901847192"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            )}

            {currentMethod === 'card' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Card Approval Code / Last 4 Digits
                </label>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. AUTH-8821 or 4242"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            )}

            {remainingBalance > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleAddPayment}
              >
                Add {currentMethod.toUpperCase()} to Split Tender
              </Button>
            )}
          </div>
        </div>

        {/* Right: Allocation Summary & Balance */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Amount Due:</span>
                <span className="font-bold text-white text-sm">
                  {formatPHP(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Allocated:</span>
                <span className="font-bold text-emerald-400">
                  {formatPHP(totalAllocated)}
                </span>
              </div>

              <div
                className={`flex justify-between items-center pt-2 border-t text-xs font-bold ${
                  remainingBalance <= 0
                    ? 'border-emerald-800 text-emerald-400'
                    : 'border-amber-800 text-amber-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {remainingBalance <= 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Fully Covered
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" /> Remaining:
                    </>
                  )}
                </span>
                <span className="text-base">{formatPHP(remainingBalance)}</span>
              </div>
            </div>

            {/* List of Split Payments */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Tender Allocations ({payments.length})
              </label>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/50 rounded border border-slate-800/80">
                  No split lines added yet. You can click &quot;Complete Sale&quot; directly for single tender.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {payments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold uppercase text-slate-200">
                          {p.payment_method}
                        </span>
                        {p.reference_no && (
                          <span className="text-[10px] text-slate-400 ml-1 font-mono">
                            ({p.reference_no})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {formatPHP(p.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(idx)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalChange > 0 && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex justify-between font-semibold">
                <span>Customer Change:</span>
                <span className="text-sm font-bold">{formatPHP(totalChange)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <Button
              type="button"
              variant="dark-ghost"
              size="md"
              className="w-1/3"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emerald"
              size="md"
              className="w-2/3 text-sm font-bold"
              isLoading={isProcessing}
              disabled={
                isProcessing ||
                (payments.length === 0 &&
                  (parseFloat(amountInput) < totalAmount || isNaN(parseFloat(amountInput)))) ||
                (payments.length > 0 && remainingBalance > 0)
              }
              onClick={handleComplete}
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
