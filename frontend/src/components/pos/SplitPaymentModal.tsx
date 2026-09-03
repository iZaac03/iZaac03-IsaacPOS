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

  const totalAllocated = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, Math.round((totalAmount - totalAllocated) * 100) / 100);

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

  const totalTendered = payments.reduce((sum, p) => sum + (p.tendered_amount || p.amount), 0);
  const totalChange = Math.max(0, totalTendered - totalAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Tender & Split Settlement"
      subtitle="Select payment method and enter amount handed by customer"
      maxWidth="3xl"
      darkTheme={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Tender Selection Form */}
        <div className="md:col-span-7 space-y-4">
          {/* Method Tabs with Large Elder-Friendly Icons */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wide">
              1. Choose Payment Type
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleMethodChange('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold transition-all ${
                  currentMethod === 'cash'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1 text-emerald-400" />
                <span className="text-sm">Cash</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('gcash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold transition-all ${
                  currentMethod === 'gcash'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-500/50 shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1 text-sky-400" />
                <span className="text-sm">GCash</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('maya')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold transition-all ${
                  currentMethod === 'maya'
                    ? 'bg-green-500/20 border-green-500 text-green-300 ring-2 ring-green-500/50 shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1 text-green-400" />
                <span className="text-sm">Maya</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold transition-all ${
                  currentMethod === 'card'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/50 shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1 text-purple-400" />
                <span className="text-sm">Card</span>
              </button>
            </div>
          </div>

          {/* Amount Inputs with Large Elder-Friendly Fonts */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                Amount to Apply (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-2xl font-black text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono"
              />
            </div>

            {currentMethod === 'cash' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Cash Received from Customer (₱)
                  </label>
                  {parseFloat(tenderedInput) > parseFloat(amountInput || '0') && (
                    <span className="text-sm font-black text-emerald-400 font-mono">
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
                  placeholder="Amount handed"
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-xl font-bold text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono"
                />

                {/* Big Elder-Friendly Quick Denomination Pills */}
                <div className="mt-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Quick Cash Bills:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[20, 50, 100, 200, 500, 1000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => handleQuickCash(denom)}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-black border border-slate-700 transition-colors shadow-xs active:scale-95"
                      >
                        ₱{denom}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTenderedInput(amountInput)}
                      className="col-span-2 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg text-sm font-black border border-emerald-700 transition-colors shadow-xs active:scale-95"
                    >
                      Exact Amount
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(currentMethod === 'gcash' || currentMethod === 'maya') && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                  {currentMethod.toUpperCase()} Reference Code
                </label>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. 901847192"
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono"
                />
              </div>
            )}

            {currentMethod === 'card' && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 uppercase tracking-wide">
                  Card Approval Code / Last 4 Digits
                </label>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. AUTH-8821 or 4242"
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono"
                />
              </div>
            )}

            {remainingBalance > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full py-2.5 font-bold"
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
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="font-semibold">Order Total Due:</span>
                <span className="font-black text-white text-base font-mono">
                  {formatPHP(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="font-semibold">Amount Tendered:</span>
                <span className="font-black text-emerald-400 text-base font-mono">
                  {formatPHP(totalAllocated)}
                </span>
              </div>

              <div
                className={`flex justify-between items-center pt-2.5 border-t text-sm font-black ${
                  remainingBalance <= 0
                    ? 'border-emerald-800 text-emerald-400'
                    : 'border-amber-800 text-amber-400'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs">
                  {remainingBalance <= 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Fully Paid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-400" /> Remaining:
                    </>
                  )}
                </span>
                <span className="text-xl font-mono">{formatPHP(remainingBalance)}</span>
              </div>
            </div>

            {/* List of Split Payments */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">
                Applied Tenders ({payments.length})
              </label>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  No split items. Click &quot;Complete Sale&quot; to pay in full.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {payments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-black uppercase text-white">
                          {p.payment_method}
                        </span>
                        {p.reference_no && (
                          <span className="text-[11px] text-slate-400 ml-1 font-mono">
                            ({p.reference_no})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white font-mono text-sm">
                          {formatPHP(p.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalChange > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-300 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">Change Due:</span>
                <span className="text-xl font-black font-mono text-white">
                  {formatPHP(totalChange)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <Button
              type="button"
              variant="dark-ghost"
              size="lg"
              className="w-1/3"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emerald"
              size="lg"
              className="w-2/3 h-14 text-base font-black shadow-lg shadow-emerald-600/30"
              isLoading={isProcessing}
              disabled={
                isProcessing ||
                (payments.length === 0 &&
                  (parseFloat(amountInput) < totalAmount || isNaN(parseFloat(amountInput)))) ||
                (payments.length > 0 && remainingBalance > 0)
              }
              onClick={handleComplete}
            >
              COMPLETE SALE
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
