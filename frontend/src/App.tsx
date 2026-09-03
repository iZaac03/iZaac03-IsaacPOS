import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar, ActiveTab } from './components/layout/Navbar';
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
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [lowStockCount, setLowStockCount] = useState<number>(0);

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
      const interval = setInterval(fetchLowStockCount, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
        <span>INITIALIZING KLAROPOS WORKSPACE...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && <POSTerminal />}
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
  );
};
