import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { ActiveTab } from './Sidebar';

export interface TopHeaderProps {
  activeTab: ActiveTab;
  isElderMode: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeTab, isElderMode }) => {
  const { store, user } = useAuth();
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

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
          title: 'Point-of-Sale Register',
          desc: 'High-speed touch terminal with barcode lookup & split tender',
        };
      case 'inventory':
        return {
          title: 'Product Catalog & Inventory',
          desc: 'Item management, wholesale cost, SRP, and CSV bulk tools',
        };
      case 'alerts':
        return {
          title: 'Reorder & Low Stock Alerts',
          desc: 'Urgent restocking list for depleted products',
        };
      case 'purchase_orders':
        return {
          title: 'Supplier Purchase Orders',
          desc: 'Procurement tracking & automatic inventory stock-in',
        };
      case 'transactions':
        return {
          title: 'Order Receipts & Returns',
          desc: 'Transaction audit ledger, thermal receipts, and refunds',
        };
      case 'analytics':
        return {
          title: 'Executive Sales Analytics',
          desc: 'Revenue trajectories, tender breakdowns, and cashier audit',
        };
      case 'staff':
        return {
          title: 'Staff Accounts & Permissions',
          desc: 'Cashier accounts, managers, and supervisor PIN codes',
        };
      case 'settings':
        return {
          title: 'Branch Profile & BIR Tax Settings',
          desc: 'Store TIN, permit numbers, and thermal receipt messages',
        };
      default:
        return { title: 'KlaroPOS', desc: '' };
    }
  };

  const info = getPageInfo();

  return (
    <header
      className={`h-16 px-6 border-b flex items-center justify-between transition-colors z-20 ${
        activeTab === 'pos'
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-3">
        <div>
          <h2
            className={`font-black tracking-tight leading-tight ${
              isElderMode ? 'text-xl text-emerald-400' : 'text-lg text-slate-900'
            } ${activeTab === 'pos' ? '!text-white' : ''}`}
          >
            {info.title}
          </h2>
          <p
            className={`text-xs ${
              activeTab === 'pos' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {info.desc}
          </p>
        </div>
      </div>

      {/* Right meta info */}
      <div className="flex items-center gap-4">
        {/* Branch pill */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            activeTab === 'pos'
              ? 'bg-slate-800 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <img
            src="/logo.png"
            alt="Daumar"
            className="w-5 h-5 rounded-full object-cover bg-white shrink-0"
          />
          <span className="font-bold">{store?.store_name || 'Daumar Grocery Store'}</span>
          <span className="text-slate-400">•</span>
          <span className="font-mono text-[11px]">TIN: {store?.vat_tin || '123-456-789'}</span>
        </div>

        {/* Live Philippine Clock */}
        <div
          className={`flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border ${
            activeTab === 'pos'
              ? 'bg-slate-950 border-slate-800 text-emerald-400'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            {dateString} — {timeString}
          </span>
        </div>
      </div>
    </header>
  );
};
