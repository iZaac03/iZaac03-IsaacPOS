import React, { useState, useEffect } from 'react';
import { GcashTransaction, GcashTransactionType } from '../../types';
import { calculateGCashFee, GCASH_RATE_TIERS } from '../../utils/gcashFees';
import { formatPHP } from '../../utils/format';
import { api } from '../../api/client';
import { GcashReceiptModal } from './GcashReceiptModal';
import {
  X,
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface GcashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionComplete?: (transaction: GcashTransaction) => void;
}

export const GcashModal: React.FC<GcashModalProps> = ({
  isOpen,
  onClose,
  onTransactionComplete,
}) => {
  const [type, setType] = useState<GcashTransactionType>('cash_in');
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [feeInput, setFeeInput] = useState<string>('');
  const [isFeeManual, setIsFeeManual] = useState<boolean>(false);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showRatesChart, setShowRatesChart] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTransaction, setCompletedTransaction] = useState<GcashTransaction | null>(null);

  // Auto-calculate fee when amount changes (unless manually edited)
  const numericAmount = parseFloat(amountInput) || 0;

  useEffect(() => {
    if (!isFeeManual) {
      const calculated = calculateGCashFee(numericAmount);
      setFeeInput(calculated > 0 ? calculated.toString() : '');
    }
  }, [numericAmount, isFeeManual]);

  const numericFee = parseFloat(feeInput) || 0;
  const totalAmount = type === 'cash_in' ? numericAmount + numericFee : numericAmount;

  const resetForm = () => {
    setType('cash_in');
    setPhone('');
    setName('');
    setAmountInput('');
    setFeeInput('');
    setIsFeeManual(false);
    setReferenceNumber('');
    setNotes('');
    setErrorMessage(null);
    setCompletedTransaction(null);
    setShowRatesChart(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Preset buttons for fast checkout
  const quickPresets = [100, 300, 500, 1000, 1500, 2000, 3000, 5000];

  const handleQuickPreset = (val: number) => {
    setAmountInput(val.toString());
    setIsFeeManual(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');

    // Convert international prefix 639... to 09...
    if (val.startsWith('639')) {
      val = '0' + val.slice(2);
    } else if (val.startsWith('9')) {
      val = '0' + val;
    }

    // Ensure it starts with 09
    if (val.length > 0 && !val.startsWith('0')) {
      val = '09' + val;
    } else if (val.length > 1 && !val.startsWith('09')) {
      val = '09' + val.slice(2);
    }

    // Strictly limit to 11 digits
    setPhone(val.slice(0, 11));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numericAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      setErrorMessage('GCash mobile number must be exactly 11 digits starting with 09 (e.g. 09171234567).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        transaction_type: type,
        customer_phone: cleanPhone,
        customer_name: name.trim() || undefined,
        amount: numericAmount,
        fee: numericFee,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await api.post('/gcash-transactions', payload);
      const newTx: GcashTransaction = res.data.transaction;
      setCompletedTransaction(newTx);
      onTransactionComplete?.(newTx);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to process GCash transaction. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If transaction is completed, show the receipt modal option
  if (completedTransaction) {
    return (
      <GcashReceiptModal
        transaction={completedTransaction}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header with authentic GCash branding */}
        <div className="bg-gradient-to-r from-[#007dfe] to-[#005bb5] px-5 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-[#007dfe] font-black text-xl flex items-center justify-center shadow-xs">
              G
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight leading-tight flex items-center gap-2">
                <span>GCash Financial Services</span>
              </h2>
              <p className="text-xs text-blue-100 font-normal">
                Cash In, Cash Out & Fee Calculator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Segmented Toggle */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('cash_in');
                setIsFeeManual(false);
              }}
              className={`py-2.5 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'cash_in'
                  ? 'bg-white text-[#007dfe] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <div className="text-left leading-tight">
                <div>CASH IN</div>
                <div className="text-[10px] font-normal text-slate-500">Cust Pays Cash → Store GCash</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('cash_out');
                setIsFeeManual(false);
              }}
              className={`py-2.5 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'cash_out'
                  ? 'bg-white text-[#007dfe] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-sky-600" />
              <div className="text-left leading-tight">
                <div>CASH OUT</div>
                <div className="text-[10px] font-normal text-slate-500">Cust GCash → Store Hands Cash</div>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Quick Amount Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick Select Amount:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {quickPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickPreset(val)}
                  className={`py-1.5 px-2 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer ${
                    numericAmount === val
                      ? 'bg-[#007dfe] text-white border-[#007dfe]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ₱{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Fee Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Principal Amount (₱) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setIsFeeManual(false);
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:border-[#007dfe] focus:ring-2 focus:ring-blue-100 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Charge Fee (₱)
                </label>
                <span className="text-[10px] text-slate-400">
                  {isFeeManual ? 'Manual Override' : 'Auto Rate Tier'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={feeInput}
                  onChange={(e) => {
                    setFeeInput(e.target.value);
                    setIsFeeManual(true);
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:border-[#007dfe] focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Customer Mobile & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  GCash Mobile Number *
                </label>
                <span className={`text-[10px] font-mono font-bold ${
                  phone.length === 11 ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {phone.length}/11 digits
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="09XXXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm tracking-wider focus:border-[#007dfe] focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Must be 11 digits starting with 09
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-[#007dfe] focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          {/* Reference Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GCash Reference No. (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 1002 9384 7291"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:border-[#007dfe] focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cashier Remarks / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Transaction remarks..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-[#007dfe] focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          {/* Live Financial Summary Box */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Principal Amount:</span>
              <span className="font-mono font-semibold">{formatPHP(numericAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <span>Charge Fee (Store Income):</span>
              </span>
              <span className="font-mono font-semibold text-emerald-700">+{formatPHP(numericFee)}</span>
            </div>
            <div className="pt-2 border-t border-blue-200 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-800">
                {type === 'cash_in' ? 'Total Cash to Collect:' : 'Cash to Hand Out:'}
              </span>
              <span className="text-lg font-black font-mono text-[#007dfe]">
                {formatPHP(totalAmount)}
              </span>
            </div>
          </div>

          {/* Collapsible Rates Chart Reference */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRatesChart((prev) => !prev)}
              className="w-full px-3 py-2 bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#007dfe]" />
                <span>Store Cash In / Cash Out Rates Sheet</span>
              </span>
              {showRatesChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRatesChart && (
              <div className="p-3 bg-white max-h-52 overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-left">
                      <th className="pb-1 font-semibold">AMOUNT RANGE</th>
                      <th className="pb-1 font-semibold text-right">CHARGE FEE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {GCASH_RATE_TIERS.map((tier, idx) => (
                      <tr
                        key={idx}
                        className={
                          numericAmount >= tier.min && numericAmount <= tier.max
                            ? 'bg-blue-100 font-bold text-[#007dfe]'
                            : 'text-slate-700'
                        }
                      >
                        <td className="py-1">₱{tier.min.toLocaleString()} – ₱{tier.max.toLocaleString()}</td>
                        <td className="py-1 text-right">₱{tier.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="bg-[#007dfe] hover:bg-[#006bd1] text-white font-bold px-5 py-2.5 text-xs shadow-md"
            >
              {isSubmitting ? 'Processing...' : type === 'cash_in' ? 'Confirm Cash In' : 'Confirm Cash Out'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
