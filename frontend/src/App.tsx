import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { POSTerminal } from './components/pos/POSTerminal';
import { InventoryView } from './components/views/InventoryView';
import { StockAlertsView } from './components/views/StockAlertsView';
import { PurchaseOrdersView } from './components/views/PurchaseOrdersView';
import { TransactionsView } from './components/views/TransactionsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { StaffView } from './components/views/StaffView';
import { SettingsView } from './components/views/SettingsView';
import { api } from './api/client';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isElderMode, setIsElderMode] = useState<boolean>(() => {
    return localStorage.getItem('klaropos_elder_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('klaropos_elder_mode', isElderMode.toString());
  }, [isElderMode]);

  // Cashier Role Guard: Cashier only accesses POS, inventory, alerts, transactions, and analytics
  useEffect(() => {
    if (user?.role === 'cashier' && (activeTab === 'settings' || activeTab === 'staff' || activeTab === 'purchase_orders')) {
      setActiveTab('pos');
    }
    setIsMobileSidebarOpen(false);
  }, [user, activeTab]);

  const fetchLowStockCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/products/low-stock');
      setLowStockCount(res.data.count || 0);
    } catch {
      // Ignore background badge errors
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLowStockCount();
      const interval = setInterval(fetchLowStockCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
        <span className="text-sm font-bold tracking-wider">INITIALIZING KLAROPOS WORKSPACE...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div
      className={`min-h-screen flex bg-slate-50 text-slate-900 font-sans ${
        isElderMode ? 'elder-mode-active text-base' : 'text-sm'
      }`}
    >
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        isElderMode={isElderMode}
        setIsElderMode={setIsElderMode}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopHeader
          activeTab={activeTab}
          isElderMode={isElderMode}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'pos' && <POSTerminal isElderMode={isElderMode} />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'alerts' && (
            <StockAlertsView onNavigateToPO={() => setActiveTab('purchase_orders')} />
          )}
          {activeTab === 'purchase_orders' && <PurchaseOrdersView />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'staff' && <StaffView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};
