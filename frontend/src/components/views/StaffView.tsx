import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import {
  Plus,
  Shield,
  UserCheck,
  Key,
  UserX,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StaffView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Termination modal state
  const [userToTerminate, setUserToTerminate] = useState<User | null>(null);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState<boolean>(false);
  const [isTerminating, setIsTerminating] = useState<boolean>(false);

  // Reactivation state
  const [reactivatingUserId, setReactivatingUserId] = useState<number | null>(null);

  // Notification feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      setFeedback({
        type: 'success',
        message: 'New staff member registered successfully!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create user',
      });
    }
  };

  const handleOpenTerminateModal = (user: User) => {
    setUserToTerminate(user);
    setIsTerminateModalOpen(true);
  };

  const handleConfirmTerminate = async () => {
    if (!userToTerminate) return;

    setIsTerminating(true);
    try {
      const res = await api.post(`/users/${userToTerminate.user_id}/terminate`);
      setIsTerminateModalOpen(false);
      setUserToTerminate(null);
      setFeedback({
        type: 'success',
        message: res.data.message || `${userToTerminate.name} has been terminated.`,
      });
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to terminate staff member.',
      });
    } finally {
      setIsTerminating(false);
    }
  };

  const handleReactivateUser = async (user: User) => {
    setReactivatingUserId(user.user_id);
    try {
      const res = await api.post(`/users/${user.user_id}/reactivate`);
      setFeedback({
        type: 'success',
        message: res.data.message || `${user.name} has been reactivated.`,
      });
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reactivate staff member.',
      });
    } finally {
      setReactivatingUserId(null);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User & Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system permissions, cashiers, managers, supervisor PIN overrides, and staff status
          </p>
        </div>

        {isAdmin && (
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

      {/* Alert Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg border text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Contact Phone</th>
              <th className="p-3.5 text-center">Status</th>
              {isAdmin && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="p-6 text-center text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="p-6 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isTargetAdmin = u.role === 'admin';
                const isCurrentLoggedInUser = u.user_id === currentUser?.user_id;

                return (
                  <tr key={u.user_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900 flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                          !u.is_active
                            ? 'bg-slate-100 border-slate-300 text-slate-400'
                            : u.role === 'admin'
                            ? 'bg-purple-100 border-purple-200 text-purple-800'
                            : u.role === 'manager'
                            ? 'bg-indigo-100 border-indigo-200 text-indigo-800'
                            : 'bg-emerald-100 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className={!u.is_active ? 'text-slate-500 line-through' : ''}>
                          {u.name}
                        </span>
                        {isCurrentLoggedInUser && (
                          <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                            You
                          </span>
                        )}
                      </div>
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
                      <Badge variant={u.is_active ? 'success' : 'danger'} dot>
                        {u.is_active ? 'Active' : 'Terminated'}
                      </Badge>
                    </td>

                    {isAdmin && (
                      <td className="p-3.5 text-right">
                        {isTargetAdmin || isCurrentLoggedInUser ? (
                          <span className="text-[11px] text-slate-400 italic px-2 py-1">
                            Protected
                          </span>
                        ) : u.is_active ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenTerminateModal(u)}
                            icon={<UserX className="w-3.5 h-3.5" />}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                          >
                            Terminate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateUser(u)}
                            isLoading={reactivatingUserId === u.user_id}
                            icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                            className="text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            Reactivate
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
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
            placeholder="e.g. juan@isaacpos.ph"
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

      {/* Terminate Staff Confirmation Modal */}
      <Modal
        isOpen={isTerminateModalOpen}
        onClose={() => {
          if (!isTerminating) {
            setIsTerminateModalOpen(false);
            setUserToTerminate(null);
          }
        }}
        title="Terminate Staff Member"
        maxWidth="md"
      >
        {userToTerminate && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-sm">
                  Confirm Termination
                </h4>
                <p className="text-rose-800 leading-relaxed">
                  Are you sure you want to terminate employment access for{' '}
                  <strong className="font-semibold text-rose-950">{userToTerminate.name}</strong>?
                </p>
              </div>
            </div>

            {/* Staff Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Employee Name:</span>
                <span className="font-bold text-slate-800">{userToTerminate.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Assigned Role:</span>
                <span className="font-mono uppercase font-semibold text-slate-800">
                  {userToTerminate.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="font-mono text-slate-700">{userToTerminate.email}</span>
              </div>
            </div>

            {/* Consequences summary */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="font-semibold text-slate-700">What happens after termination:</p>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                <li>
                  <strong>Immediate Session Invalidation:</strong> Active login tokens will be immediately revoked.
                </li>
                <li>
                  <strong>Login Blocked:</strong> They will no longer be able to log in with their email, password, or PIN.
                </li>
                <li>
                  <strong>Audit Records Intact:</strong> Historical POS receipts, refunds, and inventory logs will remain linked for store auditing.
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isTerminating}
                onClick={() => {
                  setIsTerminateModalOpen(false);
                  setUserToTerminate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isTerminating}
                onClick={handleConfirmTerminate}
                icon={<UserX className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Confirm Termination
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

