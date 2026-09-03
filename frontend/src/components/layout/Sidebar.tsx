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
  X,
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  isElderMode,
  setIsElderMode,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, store, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const isCashier = user?.role === 'cashier';
  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'Point of Sale',
      sublabel: 'Register & Barcode Scan',
      icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventory',
      sublabel: 'Products & Stock Levels',
      icon: <Package className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Stock Alerts',
      sublabel: 'Reorder Depleted Items',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      badge: lowStockCount > 0 ? lowStockCount : null,
    },
    ...(!isCashier
      ? [
          {
            id: 'purchase_orders' as ActiveTab,
            label: 'Purchase Orders',
            sublabel: 'Supplier Shipments',
            icon: <Truck className="w-5 h-5 shrink-0" />,
            badge: null,
          },
        ]
      : []),
    {
      id: 'transactions' as ActiveTab,
      label: 'Transactions',
      sublabel: 'Receipts & Returns',
      icon: <Receipt className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Reports & Audits',
      sublabel: 'Sales & Shift Summaries',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    ...(isAdmin
      ? [
          {
            id: 'staff' as ActiveTab,
            label: 'Staff Management',
            sublabel: 'Users & Permissions',
            icon: <Users className="w-5 h-5 shrink-0" />,
            badge: null,
          },
        ]
      : []),
    ...(!isCashier
      ? [
          {
            id: 'settings' as ActiveTab,
            label: 'Store Settings',
            sublabel: 'BIR TIN & Tax Info',
            icon: <Settings className="w-5 h-5 shrink-0" />,
            badge: null,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 lg:static h-screen bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between transition-all duration-200 z-50 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64 sm:w-68'}`}
      >
        {/* Top Brand Header */}
        <div>
          <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src="/logo.png"
                alt="Daumar Grocery Store"
                className="w-10 h-10 rounded-md object-cover bg-white p-0.5 shrink-0 border border-slate-700"
              />
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-bold text-sm tracking-tight text-white truncate">
                    Daumar Grocery
                  </div>
                  <p className="text-[11px] text-slate-400 truncate font-mono">
                    Terminal Workstation
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Close button on mobile */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Desktop collapse button */}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:block p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Elder-Friendly Text & Scale Switcher */}
          <div className="p-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setIsElderMode(!isElderMode)}
              className={`w-full py-2 px-3 rounded flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors ${
                isElderMode
                  ? 'bg-amber-500 text-slate-950 font-bold border border-amber-600'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
              }`}
              title="Toggle Large Text Mode"
            >
              <div className="flex items-center gap-2">
                {isElderMode ? (
                  <ZoomOut className="w-4 h-4 text-slate-950 shrink-0" />
                ) : (
                  <ZoomIn className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                {!collapsed && (
                  <span>
                    {isElderMode ? 'Large Text Mode' : 'Large Text'}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                    isElderMode
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isElderMode ? 'ON' : 'OFF'}
                </span>
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center rounded-md transition-colors text-left cursor-pointer ${
                    collapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
                  } ${
                    isActive
                      ? 'bg-emerald-700 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <div className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </div>

                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`block truncate ${
                            isElderMode ? 'text-base font-bold' : 'text-sm font-medium'
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.badge !== null && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-slate-950 font-bold font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className={`block text-[11px] truncate ${
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
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div
            className={`flex items-center ${
              collapsed ? 'justify-center flex-col gap-2' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono capitalize">
                    {user?.role}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sign Out of Register"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
