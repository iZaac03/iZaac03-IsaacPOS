import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import {
  ShoppingBag,
  Package,
  AlertTriangle,
  Truck,
  Receipt,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Clock,
  Store as StoreIcon,
  Shield,
  Key,
  UserCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'pos'
  | 'inventory'
  | 'alerts'
  | 'purchase_orders'
  | 'transactions'
  | 'analytics'
  | 'staff'
  | 'settings';

export interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
}) => {
  const { user, store, logout } = useAuth();
  const [timeString, setTimeString] = useState<string>('');

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
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isPOS = activeTab === 'pos';

  return (
    <header
      className={`h-16 px-4 border-b flex items-center justify-between transition-colors duration-200 select-none ${
        isPOS
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
      }`}
    >
      {/* Brand & Store Information */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight">IsaacPOS</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-500">
                PRO
              </span>
            </div>
            <p
              className={`text-[11px] truncate max-w-[180px] sm:max-w-xs ${
                isPOS ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {store?.store_name || 'Flagship Store'} ({store?.branch_code || 'BGC-01'})
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            POS Terminal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Inventory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'alerts'
                ? 'bg-amber-600 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Stock Alerts
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('purchase_orders')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'purchase_orders'
                ? 'bg-slate-900 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Purchase Orders
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Orders & Receipts
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeTab === 'staff'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : isPOS
                  ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Staff
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-sm'
                : isPOS
                ? 'text-slate-300 hover:bg-slate-850 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
        </nav>
      </div>

      {/* Right Controls: Clock, Staff Badge, Logout */}
      <div className="flex items-center gap-4">
        {/* Live Clock */}
        <div
          className={`hidden sm:flex items-center gap-1.5 font-mono text-xs ${
            isPOS ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{timeString}</span>
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold leading-tight">{user?.name}</div>
            <div className="text-[10px] capitalize text-slate-400 font-mono">
              {user?.role}
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
              user?.role === 'admin'
                ? 'bg-purple-900/40 border-purple-500/50 text-purple-300'
                : user?.role === 'manager'
                ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300'
                : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {user?.name.charAt(0)}
          </div>

          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className={`p-1.5 rounded-md transition-colors ${
              isPOS
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
