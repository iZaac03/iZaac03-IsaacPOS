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
      title="Payment Tender"
      subtitle="Select payment tender and customer cash amount"
      maxWidth="2xl"
      darkTheme={false}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-slate-900">
        {/* Left: Tender Selection Form */}
        <div className="sm:col-span-7 space-y-3">
          {/* Method Tabs */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleMethodChange('cash')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border font-bold transition-colors cursor-pointer active:translate-y-px ${
                  currentMethod === 'cash'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Cash</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('gcash')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border font-bold transition-colors cursor-pointer active:translate-y-px ${
                  currentMethod === 'gcash'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-0.5" />
                <span className="text-xs">GCash</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('maya')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border font-bold transition-colors cursor-pointer active:translate-y-px ${
                  currentMethod === 'maya'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Maya</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('card')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border font-bold transition-colors cursor-pointer active:translate-y-px ${
                  currentMethod === 'card'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Card</span>
              </button>
            </div>
          </div>

          {/* Amount Inputs */}
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-md border border-slate-300">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wide">
                Amount to Apply (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xl font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono tabular-nums"
              />
            </div>

            {currentMethod === 'cash' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Cash Tendered (₱)
                  </label>
                  {parseFloat(tenderedInput) > parseFloat(amountInput || '0') && (
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
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
                  placeholder="Cash given"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-lg font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono tabular-nums"
                />

                {/* Quick Cash Bills */}
                <div className="mt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Quick Cash Bills:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[20, 50, 100, 200, 500, 1000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => handleQuickCash(denom)}
                        className="py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-md text-xs font-bold font-mono border border-slate-300 transition-colors active:translate-y-px cursor-pointer"
                      >
                        ₱{denom}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTenderedInput(amountInput)}
                      className="col-span-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-xs font-bold border border-slate-300 transition-colors active:translate-y-px cursor-pointer"
                    >
                      Exact Amount
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(currentMethod === 'gcash' || currentMethod === 'maya') && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wide">
                  {currentMethod.toUpperCase()} Ref Code
                </label>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. 901847192"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono font-semibold"
                />
              </div>
            )}

            {currentMethod === 'card' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wide">
                  Approval Code / Last 4 Digits
                </label>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. 4242"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono font-semibold"
                />
              </div>
            )}

            {remainingBalance > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full py-1.5 font-bold text-xs"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddPayment}
              >
                Add {currentMethod.toUpperCase()} to Split Tender
              </Button>
            )}
          </div>
        </div>

        {/* Right: Allocation Summary & Balance */}
        <div className="sm:col-span-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-300 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="font-medium">Total Due:</span>
                <span className="font-bold text-slate-950 text-sm font-mono tabular-nums">
                  {formatPHP(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span className="font-medium">Tendered:</span>
                <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                  {formatPHP(totalAllocated)}
                </span>
              </div>

              <div
                className={`flex justify-between items-center pt-2 border-t text-xs font-bold ${
                  remainingBalance <= 0
                    ? 'border-emerald-200 text-emerald-800'
                    : 'border-amber-200 text-amber-800'
                }`}
              >
                <span className="flex items-center gap-1 text-[11px]">
                  {remainingBalance <= 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fully Paid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Remaining:
                    </>
                  )}
                </span>
                <span className="text-base font-mono tabular-nums">{formatPHP(remainingBalance)}</span>
              </div>
            </div>

            {/* List of Split Payments */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wide">
                Applied Tenders ({payments.length})
              </label>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 p-2 bg-slate-50 rounded-md border border-slate-200 text-center">
                  No split items. Click &quot;Complete Sale&quot; to pay in full.
                </p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {payments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-bold uppercase text-slate-900">
                          {p.payment_method}
                        </span>
                        {p.reference_no && (
                          <span className="text-[10px] text-slate-500 ml-1 font-mono">
                            ({p.reference_no})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 font-mono text-xs tabular-nums">
                          {formatPHP(p.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
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
              <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-wider">Change Due:</span>
                <span className="text-xl font-black font-mono text-emerald-800">
                  {formatPHP(totalChange)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t-2 border-slate-200 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-1/3 text-xs"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emerald"
              size="md"
              className="w-2/3 h-11 text-sm font-black shadow-md shadow-emerald-600/30"
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
