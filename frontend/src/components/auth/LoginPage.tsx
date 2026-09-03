import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShoppingBag, Lock, Mail, Shield, Key, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@klaropos.ph');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-950 text-slate-100">
      {/* Background radial accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1 bg-white rounded-full shadow-xl shadow-emerald-950/50 border-2 border-emerald-500/40 mb-1">
            <img
              src="/logo.png"
              alt="Daumar Grocery Store"
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Daumar <span className="text-emerald-400">Grocery Store</span>
          </h1>
          <p className="text-xs text-amber-400/90 font-medium tracking-wide">
            Fresh & Quality Since 2026 • Point-of-Sale System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-md text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cashier@klaropos.ph"
              darkTheme={true}
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Account Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              darkTheme={true}
              icon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="w-full text-sm font-bold shadow-lg shadow-emerald-600/30"
              isLoading={isLoading}
            >
              Sign In to Register
            </Button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider text-center">
              Quick 1-Click Role Login:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@klaropos.ph')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-[11px]">Admin</span>
                <span className="text-[9px] text-slate-500 font-mono">PIN: 999999</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@klaropos.ph')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-[11px]">Manager</span>
                <span className="text-[9px] text-slate-500 font-mono">PIN: 123456</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cashier@klaropos.ph')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-[11px]">Cashier</span>
                <span className="text-[9px] text-slate-500 font-mono">PIN: 112233</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Philippine BIR Tax Compliant POS SaaS — Version 1.0.0
        </div>
      </div>
    </div>
  );
};
