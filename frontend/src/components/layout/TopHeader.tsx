import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle2, Building, ShieldCheck, Menu, LogOut } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { TimeClockModal } from '../pos/TimeClockModal';
import { api } from '../../api/client';
import { TimeLog } from '../../types';

export interface TopHeaderProps {
  activeTab: ActiveTab;
  isElderMode: boolean;
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeTab, isElderMode, onToggleSidebar }) => {
  const { store, user } = useAuth();
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [isTimeClockOpen, setIsTimeClockOpen] = useState<boolean>(false);
  const [isTimedIn, setIsTimedIn] = useState<boolean>(false);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [timeClockDuration, setTimeClockDuration] = useState<string>('');

  const fetchStatus = async () => {
    try {
      const res = await api.get('/time-logs/status');
      setIsTimedIn(res.data.is_timed_in);
      setActiveLog(res.data.current_log);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateDuration = () => {
      if (activeLog?.time_in) {
        const start = new Date(activeLog.time_in).getTime();
        const diff = Math.max(0, Date.now() - start);
        const totalMins = Math.floor(diff / 60000);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        setTimeClockDuration(`${hrs}h ${mins}m`);
      } else {
        setTimeClockDuration('');
      }
    };
    updateDuration();
    const timer = setInterval(updateDuration, 1000);
    return () => clearInterval(timer);
  }, [activeLog]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageInfo = () => {
    switch (activeTab) {
      case 'pos':
        return {
          title: 'Point of Sale',
          desc: 'Register checkout and barcode scanner',
        };
      case 'inventory':
        return {
          title: 'Inventory & Catalog',
          desc: 'Products, wholesale costs, retail pricing, and CSV import',
        };
      case 'alerts':
        return {
          title: 'Stock Reorders',
          desc: 'Items below minimum reorder threshold',
        };
      case 'purchase_orders':
        return {
          title: 'Purchase Orders',
          desc: 'Supplier deliveries and receiving log',
        };
      case 'transactions':
        return {
          title: 'Transactions & Receipts',
          desc: 'Order history, reprints, and customer returns',
        };
      case 'analytics':
        return {
          title: 'Sales Reports & Audits',
          desc: 'Daily sales, payment methods, and cashier shift logs',
        };
      case 'staff':
        return {
          title: 'Staff Accounts',
          desc: 'User permissions and supervisor PIN overrides',
        };
      case 'settings':
        return {
          title: 'Store Settings',
          desc: 'Store information, BIR TIN, and receipt layout',
        };
      default:
        return { title: 'Daumar POS', desc: '' };
    }
  };

  const info = getPageInfo();

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 z-20">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2
            className={`font-bold tracking-tight leading-tight ${
              isElderMode ? 'text-xl sm:text-2xl text-emerald-800' : 'text-lg sm:text-xl text-slate-900'
            }`}
          >
            {info.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">{info.desc}</p>
        </div>
      </div>

      {/* Right meta info */}
      <div className="flex items-center gap-3">
        {/* Branch pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium border border-slate-300 bg-slate-50 text-slate-800">
          <img
            src="/logo.png"
            alt="Daumar"
            className="w-4 h-4 rounded object-cover bg-white shrink-0 border border-slate-300"
          />
          <span className="font-bold text-slate-900">{store?.store_name || 'Daumar Grocery Store'}</span>
          <span className="text-slate-400">•</span>
          <span className="font-mono text-[11px] text-slate-600">TIN: {store?.vat_tin || '123-456-789'}</span>
        </div>

        {/* Cashier Attendance Pill */}
        <button
          type="button"
          onClick={() => setIsTimeClockOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
            isTimedIn
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
          }`}
          title={isTimedIn ? 'Shift In Progress - Click to Time Out' : 'Click to Time In for attendance'}
        >
          {isTimedIn ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>On Duty</span>
              <span className="hidden md:inline font-mono text-[11px] text-emerald-700">
                ({timeClockDuration || 'Active'})
              </span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Time In</span>
            </>
          )}
        </button>

        {/* Live Clock */}
        <div className="flex items-center gap-2 font-mono text-xs font-semibold px-3 py-1 rounded-md border border-slate-300 bg-slate-50 text-slate-800 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="hidden sm:inline">{dateString} • </span>
          <span>{timeString}</span>
        </div>
      </div>

      {isTimeClockOpen && (
        <TimeClockModal
          isOpen={isTimeClockOpen}
          onClose={() => setIsTimeClockOpen(false)}
          onStatusChange={(timedIn, log) => {
            setIsTimedIn(timedIn);
            setActiveLog(log);
          }}
        />
      )}
    </header>
  );
};
