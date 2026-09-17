import React, { useState, useEffect } from 'react';
import { GcashTransaction, GcashSummary } from '../../types';
import { api } from '../../api/client';
import { formatPHP, formatDateTime } from '../../utils/format';
import { calculateGCashFee, GCASH_RATE_TIERS } from '../../utils/gcashFees';
import { GcashModal } from '../pos/GcashModal';
import { GcashReceiptModal } from '../pos/GcashReceiptModal';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Wallet,
  TrendingUp,
  RefreshCw,
  Calculator,
  Receipt,
  Smartphone,
  Ban,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const GcashView: React.FC = () => {
  const [transactions, setTransactions] = useState<GcashTransaction[]>([]);
  const [summary, setSummary] = useState<GcashSummary>({
    total_cash_in_volume: 0,
    total_cash_out_volume: 0,
    total_fees_earned: 0,
    total_count: 0,
  });
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showRates, setShowRates] = useState<boolean>(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [receiptTransaction, setReceiptTransaction] = useState<GcashTransaction | null>(null);
  const [voidTarget, setVoidTarget] = useState<GcashTransaction | null>(null);
  const [voidReason, setVoidReason] = useState<string>('wrong_amount');
  const [voidNotes, setVoidNotes] = useState<string>('');
  const [isVoidSubmitting, setIsVoidSubmitting] = useState<boolean>(false);

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTarget) return;

    setIsVoidSubmitting(true);
    try {
      const res = await api.post(`/gcash-transactions/${voidTarget.gcash_transaction_id}/void`, {
        reason: voidReason,
        notes: voidNotes,
      });
      alert(res.data?.message || 'GCash transaction voided successfully.');
      setVoidTarget(null);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to void transaction.');
    } finally {
      setIsVoidSubmitting(false);
    }
  };

  // Interactive Fee Calculator widget state
  const [testAmount, setTestAmount] = useState<string>('1000');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/gcash-transactions', {
        params: {
          search: search.trim() || undefined,
          transaction_type: typeFilter !== 'all' ? typeFilter : undefined,
          date: dateFilter || undefined,
          per_page: 50,
        },
      });

      const list = res.data.data || res.data;
      setTransactions(Array.isArray(list) ? list : []);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load GCash transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const calculatedTestFee = calculateGCashFee(parseFloat(testAmount) || 0);

  // Split rate tiers into 2 columns
  const halfLength = Math.ceil(GCASH_RATE_TIERS.length / 2);
  const col1Tiers = GCASH_RATE_TIERS.slice(0, halfLength);
  const col2Tiers = GCASH_RATE_TIERS.slice(halfLength);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#007dfe] text-white font-black flex items-center justify-center text-base shadow-xs">
              G
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              GCash Financial Services
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cash In &amp; Cash Out station, service fee audit log, and electronic voucher ledger
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchTransactions}
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            className="bg-[#007dfe] hover:bg-[#006bd1] text-white font-bold"
          >
            New Cash In / Out
          </Button>
        </div>
      </div>

      {/* ── 4 Summary Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cash In
            </div>
            <div className="text-sm sm:text-lg font-bold font-mono text-slate-900 truncate">
              {formatPHP(summary.total_cash_in_volume)}
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Money transferred to customer GCash
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cash Out
            </div>
            <div className="text-sm sm:text-lg font-bold font-mono text-slate-900 truncate">
              {formatPHP(summary.total_cash_out_volume)}
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Cash dispensed to customers
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white rounded-xl border border-blue-200 shadow-xs bg-gradient-to-br from-blue-50/40 to-white flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#007dfe]/10 text-[#007dfe] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#007dfe] uppercase tracking-wider">
              Fees Earned
            </div>
            <div className="text-sm sm:text-lg font-bold font-mono text-slate-900 truncate">
              {formatPHP(summary.total_fees_earned)}
            </div>
            <div className="text-[10px] text-slate-500 hidden sm:block">
              Net store profit from fees
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Transactions
            </div>
            <div className="text-sm sm:text-lg font-bold font-mono text-slate-900 truncate">
              {summary.total_count}
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Completed GCash orders
            </div>
          </div>
        </div>
      </div>

      {/* ── Rates & Calculator: stacked on mobile, side-by-side on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Visual Rate Sheet — collapsible on mobile */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRates(!showRates)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-sky-50 to-white lg:cursor-default"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#007dfe] text-white font-bold text-xs flex items-center justify-center">
                G
              </div>
              <h2 className="font-bold text-slate-800 text-sm tracking-tight uppercase text-left">
                GCash Cash In / Cash Out Rates Sheet
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#007dfe] bg-blue-100/70 px-2.5 py-0.5 rounded-full hidden sm:inline">
                Official Store Schedule
              </span>
              <span className="lg:hidden text-slate-400">
                {showRates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
          </button>

          <div className={`p-4 ${showRates ? 'block' : 'hidden lg:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {/* Left Column */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 flex justify-between font-bold text-slate-600 border-b border-slate-200">
                  <span>AMOUNT (₱)</span>
                  <span>CHARGE FEE</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {col1Tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 flex justify-between items-center hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-slate-700">{tier.min} – {tier.max}</span>
                      <span className="font-bold text-[#007dfe]">₱{tier.fee}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 flex justify-between font-bold text-slate-600 border-b border-slate-200">
                  <span>AMOUNT (₱)</span>
                  <span>CHARGE FEE</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {col2Tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 flex justify-between items-center hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-slate-700">{tier.min} – {tier.max}</span>
                      <span className="font-bold text-[#007dfe]">₱{tier.fee}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Calculator */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-[#007dfe]" />
              <h2 className="font-bold text-slate-800 text-sm">
                Instant Fee Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter any amount to verify the exact charge fee and customer total before processing.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Principal Amount:
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400 text-sm">
                    ₱
                  </span>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:bg-white focus:border-[#007dfe] focus:ring-1 focus:ring-[#007dfe] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/60 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Charge Fee:</span>
                  <span className="font-bold text-emerald-700">+{formatPHP(calculatedTestFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cash In Collect:</span>
                  <span className="font-bold text-slate-900">
                    {formatPHP((parseFloat(testAmount) || 0) + calculatedTestFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Out Cash:</span>
                  <span className="font-bold text-slate-900">
                    {formatPHP(parseFloat(testAmount) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Button
              className="w-full bg-[#007dfe] hover:bg-[#006bd1] text-white font-bold"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Start Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 sm:min-w-[240px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mobile, name, or ref #..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="cash_in">Cash In</option>
            <option value="cash_out">Cash Out</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
          />

          {(typeFilter !== 'all' || dateFilter || search) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setDateFilter('');
                setSearch('');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Transaction Ledger ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer Phone / Name</th>
                <th className="px-4 py-3 text-right">Principal Amount</th>
                <th className="px-4 py-3 text-right">Fee (Profit)</th>
                <th className="px-4 py-3 text-right">Total Transacted</th>
                <th className="px-4 py-3">GCash Ref No.</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#007dfe] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading GCash transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No GCash transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCashIn = tx.transaction_type === 'cash_in';
                  const isVoided = tx.status === 'voided' || tx.status === 'cancelled';
                  return (
                    <tr
                      key={tx.gcash_transaction_id}
                      className={`hover:bg-slate-50 transition-colors ${isVoided ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVoided
                              ? 'bg-slate-100 text-slate-500 line-through'
                              : isCashIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {!isVoided && (isCashIn ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          ))}
                          <span>{isVoided ? 'VOIDED' : isCashIn ? 'Cash In' : 'Cash Out'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{tx.customer_phone}</span>
                        </div>
                        {tx.customer_name && (
                          <div className="text-[11px] text-slate-500">{tx.customer_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {formatPHP(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        +{formatPHP(tx.fee)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatPHP(tx.total_amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {tx.reference_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {tx.user?.name ||
                          (tx.user?.first_name
                            ? `${tx.user.first_name} ${tx.user.last_name || ''}`.trim()
                            : 'Cashier')}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap space-x-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setReceiptTransaction(tx)}
                          className="h-7 text-xs px-2.5"
                        >
                          Slip
                        </Button>

                        {!isVoided && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Ban className="w-3.5 h-3.5 text-amber-600" />}
                            onClick={() => {
                              setVoidTarget(tx);
                              setVoidReason('wrong_amount');
                              setVoidNotes('');
                            }}
                            className="h-7 text-xs px-2 text-amber-800 border-amber-300 hover:bg-amber-50"
                          >
                            Void
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="px-4 py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-[#007dfe] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading GCash transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-400 text-sm">
              No GCash transactions found matching your criteria.
            </div>
          ) : (
            transactions.map((tx) => {
              const isCashIn = tx.transaction_type === 'cash_in';
              const isVoided = tx.status === 'voided' || tx.status === 'cancelled';
              const cashierName = tx.user?.name ||
                (tx.user?.first_name
                  ? `${tx.user.first_name} ${tx.user.last_name || ''}`.trim()
                  : 'Cashier');
              return (
                <div
                  key={tx.gcash_transaction_id}
                  className={`p-4 space-y-3 ${isVoided ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'} transition-colors`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isVoided
                            ? 'bg-slate-100 text-slate-400'
                            : isCashIn
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-sky-100 text-sky-600'
                        }`}
                      >
                        {isCashIn
                          ? <ArrowDownLeft className="w-4 h-4" />
                          : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isVoided
                                ? 'bg-rose-100 text-rose-700'
                                : isCashIn
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {isVoided ? 'VOIDED' : isCashIn ? 'Cash In' : 'Cash Out'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(tx.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-900 text-xs truncate">
                            {tx.customer_phone}
                          </span>
                          {tx.customer_name && (
                            <span className="text-[11px] text-slate-500 truncate">· {tx.customer_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-mono text-slate-900">
                        {formatPHP(tx.total_amount)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-mono font-semibold">
                        +{formatPHP(tx.fee)} fee
                      </div>
                    </div>
                  </div>

                  {/* Card Details Row */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Principal</span>
                      <span className="font-mono font-semibold text-slate-800">{formatPHP(tx.amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Ref No.</span>
                      <span className="font-mono text-slate-600 truncate block">{tx.reference_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Cashier</span>
                      <span className="text-slate-600 truncate block">{cashierName}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Printer className="w-3.5 h-3.5" />}
                      onClick={() => setReceiptTransaction(tx)}
                      className="flex-1 justify-center text-xs h-8"
                    >
                      Print Slip
                    </Button>
                    {!isVoided && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Ban className="w-3.5 h-3.5 text-amber-600" />}
                        onClick={() => {
                          setVoidTarget(tx);
                          setVoidReason('wrong_amount');
                          setVoidNotes('');
                        }}
                        className="flex-1 justify-center text-xs h-8 text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        Void
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      <GcashModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionComplete={() => {
          fetchTransactions();
        }}
      />

      {/* Reprint Receipt Slip Modal */}
      {receiptTransaction && (
        <GcashReceiptModal
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
        />
      )}

      {/* Void GCash Modal */}
      {voidTarget && (
        <Modal
          isOpen={true}
          onClose={() => setVoidTarget(null)}
          title={`Void GCash: ${voidTarget.reference_number || `TXN-${voidTarget.gcash_transaction_id}`}`}
          subtitle="Cancels this transaction entry and deducts its fee profits from analytics."
          maxWidth="md"
        >
          <form onSubmit={handleConfirmVoid} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Cancel GCash {voidTarget.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Amount: <strong className="font-mono">{formatPHP(voidTarget.amount)}</strong> | Fee: <strong className="font-mono">+{formatPHP(voidTarget.fee)}</strong> | Mobile: <strong className="font-mono">{voidTarget.customer_phone}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Void *
              </label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                <option value="wrong_amount">Incorrect amount entered</option>
                <option value="wrong_number">Incorrect customer mobile number</option>
                <option value="customer_cancelled">Customer cancelled transfer</option>
                <option value="transfer_failed">GCash app transfer failed / timeout</option>
                <option value="duplicate">Duplicate transaction entry</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Remarks
              </label>
              <textarea
                value={voidNotes}
                onChange={(e) => setVoidNotes(e.target.value)}
                placeholder="Reason notes for audit ledger..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md outline-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVoidTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={isVoidSubmitting}
              >
                Confirm Void GCash
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
