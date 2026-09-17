import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Store, Building2, Receipt, Save, Ban, ShieldAlert, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VoidSettings {
  require_manager_pin: boolean;
  require_pin_for_gcash: boolean;
  allow_cashier_void_cart: boolean;
  auto_restock: boolean;
  require_reason: boolean;
  max_void_amount_limit: number;
}

const DEFAULT_VOID_SETTINGS: VoidSettings = {
  require_manager_pin: true,
  require_pin_for_gcash: true,
  allow_cashier_void_cart: true,
  auto_restock: true,
  require_reason: true,
  max_void_amount_limit: 5000,
};

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [storeData, setStoreData] = useState<any>({
    store_name: '',
    branch_code: '',
    address: '',
    phone: '',
    email: '',
    vat_tin: '',
    receipt_header: '',
    receipt_footer: '',
    void_settings: DEFAULT_VOID_SETTINGS,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/store');
        setStoreData({
          ...res.data,
          void_settings: {
            ...DEFAULT_VOID_SETTINGS,
            ...(res.data.void_settings || {}),
          },
        });
      } catch (err) {
        console.error('Failed to load store settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStore();
  }, []);

  const updateVoidSetting = (key: keyof VoidSettings, value: any) => {
    setStoreData((prev: any) => ({
      ...prev,
      void_settings: {
        ...(prev.void_settings || DEFAULT_VOID_SETTINGS),
        [key]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/store', storeData);
      alert('Store settings saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading store settings...</div>;
  }

  const voidConfig: VoidSettings = storeData.void_settings || DEFAULT_VOID_SETTINGS;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Store & Fiscal Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure branch identity, BIR tax compliance, void/cancellation rules, and thermal receipt layout
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branch Identity */}
        <div className="bg-white rounded-md border border-slate-300 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 font-bold text-sm text-slate-900">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h3>Branch Profile & Contact</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Store / Branch Name *"
              required
              value={storeData.store_name}
              onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })}
            />
            <Input
              label="Branch Code (Unique) *"
              required
              value={storeData.branch_code}
              onChange={(e) => setStoreData({ ...storeData, branch_code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Store Telephone / Mobile *"
              required
              value={storeData.phone}
              onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
            />
            <Input
              label="Store Email"
              type="email"
              value={storeData.email || ''}
              onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
            />
          </div>

          <Input
            label="Branch Physical Address *"
            required
            value={storeData.address}
            onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
          />
        </div>

        {/* Void & Cancellation Rules */}
        <div className="bg-white rounded-md border border-slate-300 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3>Void & Cancellation Controls</h3>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Audit & Anti-Fraud
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={voidConfig.require_manager_pin}
                onChange={(e) => updateVoidSetting('require_manager_pin', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Require Manager PIN for Order Void</span>
                <span className="text-[11px] text-slate-500">Enforces managerial PIN authorization when cashiers void past transactions.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={voidConfig.require_pin_for_gcash}
                onChange={(e) => updateVoidSetting('require_pin_for_gcash', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Require Manager PIN for GCash Void</span>
                <span className="text-[11px] text-slate-500">Restricts voiding completed GCash cash-in and cash-out records without a PIN.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={voidConfig.allow_cashier_void_cart}
                onChange={(e) => updateVoidSetting('allow_cashier_void_cart', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Allow Cashier Cart Voiding</span>
                <span className="text-[11px] text-slate-500">Allows cashiers to quickly clear an active checkout cart before payment confirmation.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={voidConfig.auto_restock}
                onChange={(e) => updateVoidSetting('auto_restock', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Auto-Restock Items on Void</span>
                <span className="text-[11px] text-slate-500">Automatically returns line items back to inventory stock counts when voided.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={voidConfig.require_reason}
                onChange={(e) => updateVoidSetting('require_reason', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mandatory Void Reason Code</span>
                <span className="text-[11px] text-slate-500">Requires entering a cancellation reason for strict audit trail logging.</span>
              </div>
            </label>

            <div className="p-3 rounded-lg border border-slate-200 flex flex-col justify-center">
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Max Void Amount (₱) Without Admin Approval
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={voidConfig.max_void_amount_limit || 0}
                onChange={(e) => updateVoidSetting('max_void_amount_limit', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-mono outline-none"
                placeholder="5000"
              />
              <span className="text-[10px] text-slate-500 mt-1">Voids above this threshold trigger an audit flag.</span>
            </div>
          </div>
        </div>

        {/* BIR Tax & Thermal Receipt Configuration */}
        <div className="bg-white rounded-md border border-slate-300 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 font-bold text-sm text-slate-900">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h3>BIR Tax Compliance & Receipt Layout</h3>
          </div>

          <Input
            label="BIR Registered TIN (Tax Identification Number) *"
            required
            value={storeData.vat_tin}
            onChange={(e) => setStoreData({ ...storeData, vat_tin: e.target.value })}
            placeholder="123-456-789-00000"
            helperText="Appears on all official 58mm/80mm thermal sales receipts for BIR compliance."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Thermal Receipt Header Text
            </label>
            <textarea
              value={storeData.receipt_header || ''}
              onChange={(e) => setStoreData({ ...storeData, receipt_header: e.target.value })}
              rows={3}
              placeholder="e.g. BIR PERMIT NO: FP-092026-0089&#10;BGC TAGUIG CITY, METRO MANILA"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Thermal Receipt Footer Message
            </label>
            <textarea
              value={storeData.receipt_footer || ''}
              onChange={(e) => setStoreData({ ...storeData, receipt_footer: e.target.value })}
              rows={3}
              placeholder="e.g. Thank you for shopping! Items can be exchanged within 7 days with this receipt."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono outline-none"
            />
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Store Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
