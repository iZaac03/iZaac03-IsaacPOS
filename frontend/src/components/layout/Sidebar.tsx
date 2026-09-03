import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
  UserCheck,
  ZoomIn,
  ZoomOut,
  Sparkles,
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

export interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  isElderMode: boolean;
  setIsElderMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  isElderMode,
  setIsElderMode,
}) => {
  const { user, store, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const isCashier = user?.role === 'cashier';
  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'POS Register',
      sublabel: 'Touch Checkout & Scan',
      icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
      color: 'text-emerald-400',
      badge: null,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventory',
      sublabel: 'Products & Pricing',
      icon: <Package className="w-5 h-5 shrink-0" />,
      color: 'text-sky-400',
      badge: null,
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Stock Alerts',
      sublabel: 'Low Inventory Reorders',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      color: 'text-amber-400',
      badge: lowStockCount > 0 ? lowStockCount : null,
    },
    ...(!isCashier
      ? [
          {
            id: 'purchase_orders' as ActiveTab,
            label: 'Purchase Orders',
            sublabel: 'Supplier Stock Delivery',
            icon: <Truck className="w-5 h-5 shrink-0" />,
            color: 'text-blue-400',
            badge: null,
          },
        ]
      : []),
    {
      id: 'transactions' as ActiveTab,
      label: 'Transactions',
      sublabel: 'Receipts & Refunds',
      icon: <Receipt className="w-5 h-5 shrink-0" />,
      color: 'text-indigo-400',
      badge: null,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Sales Reports',
      sublabel: 'Revenue & Shift Audit',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
      color: 'text-purple-400',
      badge: null,
    },
    ...(isAdmin
      ? [
          {
            id: 'staff' as ActiveTab,
            label: 'Staff & Roles',
            sublabel: 'Cashiers & PIN Overrides',
            icon: <Users className="w-5 h-5 shrink-0" />,
            color: 'text-pink-400',
            badge: null,
          },
        ]
      : []),
    ...(!isCashier
      ? [
          {
            id: 'settings' as ActiveTab,
            label: 'Store Settings',
            sublabel: 'BIR TIN & Receipt Header',
            icon: <Settings className="w-5 h-5 shrink-0" />,
            color: 'text-slate-400',
            badge: null,
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`h-screen bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between transition-all duration-300 z-30 select-none shadow-xl ${
        collapsed ? 'w-20' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Brand Header */}
      <div>
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo.png"
              alt="Daumar Grocery Store"
              className="w-11 h-11 rounded-full object-cover bg-white p-0.5 shadow-md shadow-emerald-600/20 shrink-0 border border-emerald-500/30"
            />
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-white truncate">
                    Daumar Grocery
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    EST. 2026
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium truncate">
                  Fresh & Quality Store
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Elder-Friendly Text & Scale Switcher */}
        <div className="p-3 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsElderMode(!isElderMode)}
            className={`w-full py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold transition-all ${
              isElderMode
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
            title="Toggle Elder / Senior High-Readability Mode"
          >
            <div className="flex items-center gap-2">
              {isElderMode ? (
                <ZoomOut className="w-4 h-4 text-slate-950 shrink-0" />
              ) : (
                <ZoomIn className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              {!collapsed && (
                <span>
                  {isElderMode ? 'Large Text: ON' : 'Senior Large Text'}
                </span>
              )}
            </div>
            {!collapsed && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isElderMode
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isElderMode ? 'ACTIVE' : 'OFF'}
              </span>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-xl transition-all text-left ${
                  collapsed ? 'justify-center p-3' : 'px-3.5 py-3 gap-3.5'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/25 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
                }`}
                title={item.label}
              >
                <div
                  className={`${
                    isActive ? 'text-white' : item.color
                  }`}
                >
                  {item.icon}
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`block truncate ${
                          isElderMode ? 'text-base font-bold' : 'text-sm font-semibold'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge !== null && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-slate-950 font-black shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`block text-xs truncate ${
                        isActive ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center flex-col gap-2' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black border text-sm shrink-0 ${
                user?.role === 'admin'
                  ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                  : user?.role === 'manager'
                  ? 'bg-indigo-900/60 border-indigo-500 text-indigo-200'
                  : 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
              }`}
            >
              {user?.name.charAt(0)}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {user?.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono capitalize">
                  {user?.role === 'admin' && (
                    <Shield className="w-3 h-3 text-purple-400" />
                  )}
                  {user?.role === 'manager' && (
                    <Key className="w-3 h-3 text-indigo-400" />
                  )}
                  {user?.role === 'cashier' && (
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>{user?.role}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Sign Out of Register"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
