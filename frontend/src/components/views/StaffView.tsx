import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Plus, Shield, UserCheck, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StaffView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as Role,
    pin_code: '',
    phone: '',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        pin_code: '',
        phone: '',
      });
      fetchUsers();
      alert('User created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User & Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system permissions, cashiers, managers, and supervisor PIN overrides
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New Staff
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Contact Phone</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-700">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono">{u.email}</td>
                  <td className="p-3.5">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : u.role === 'manager' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Key className="w-3 h-3" /> Manager (PIN Auth)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <UserCheck className="w-3 h-3" /> Cashier
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono">{u.phone || '—'}</td>
                  <td className="p-3.5 text-center">
                    <Badge variant={u.is_active ? 'success' : 'slate'} dot>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <Input
            label="Full Name *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Juan dela Cruz"
          />

          <Input
            label="Email Address *"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. juan@klaropos.ph"
          />

          <Input
            label="Initial Password *"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 6 characters"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 outline-none"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 09171234567"
            />
          </div>

          {(formData.role === 'manager' || formData.role === 'admin') && (
            <Input
              label="Supervisor PIN Code (6 Digits) *"
              type="password"
              maxLength={6}
              required
              value={formData.pin_code}
              onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
              placeholder="e.g. 123456"
              helperText="Used to authorize high-value refunds (> ₱1,000) and inventory adjustments"
            />
          )}

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
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
