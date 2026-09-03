import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Store, Building2, Receipt, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/store');
        setStoreData(res.data);
      } catch (err) {
        console.error('Failed to load store settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStore();
  }, []);

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

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Store & Fiscal Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure branch identity, BIR tax identification number, and official receipt layout
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branch Identity */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-semibold text-sm text-slate-900">
            <Building2 className="w-4 h-4 text-emerald-600" />
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

        {/* BIR Tax & Thermal Receipt Configuration */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-semibold text-sm text-slate-900">
            <Receipt className="w-4 h-4 text-emerald-600" />
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
