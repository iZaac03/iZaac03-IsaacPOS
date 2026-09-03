import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Truck, Plus, Phone, Mail, MapPin } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await api.put(`/suppliers/${selectedSupplier.supplier_id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setIsModalOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
      alert('Supplier saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Supplier & Vendor Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage distributor contacts, commercial terms, and purchase histories
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedSupplier(null);
            setFormData({
              name: '',
              contact_person: '',
              phone: '',
              email: '',
              address: '',
              tax_id: '',
            });
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-8 text-slate-400 text-xs">
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-slate-400 text-xs">
            No suppliers registered.
          </div>
        ) : (
          suppliers.map((sup) => (
            <div
              key={sup.supplier_id}
              className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-900 leading-tight">
                    {sup.name}
                  </span>
                  <Badge variant={sup.is_active ? 'success' : 'slate'} size="sm">
                    {sup.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {sup.contact_person && (
                  <p className="text-xs text-slate-600 font-medium">
                    Contact: {sup.contact_person}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700">{sup.phone}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-600 line-clamp-2">
                      {sup.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {sup.purchase_orders_count || 0} Purchase Orders
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSupplier(sup);
                    setFormData({
                      name: sup.name,
                      contact_person: sup.contact_person || '',
                      phone: sup.phone,
                      email: sup.email || '',
                      address: sup.address || '',
                      tax_id: sup.tax_id || '',
                    });
                    setIsModalOpen(true);
                  }}
                  className="text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Edit Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Edit Supplier' : 'Register New Supplier'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
          <Input
            label="Supplier / Company Name *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Universal Robina Corporation (URC)"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
              placeholder="e.g. Roberto Tan"
            />
            <Input
              label="Phone Number *"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 09171234567"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sales@supplier.com.ph"
            />
            <Input
              label="BIR Tax ID (TIN)"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="000-123-456-00000"
            />
          </div>

          <Input
            label="Office / Warehouse Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Pasig City, Metro Manila"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {selectedSupplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
