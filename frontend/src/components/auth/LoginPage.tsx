import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, Mail, Shield, Key, UserCheck, Delete, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithPin } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState<string>('cashier@klaropos.ph');
  const [password, setPassword] = useState<string>('password123');
  const [pinCode, setPinCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  // Email/Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Instant Login
  const handleInstantLogin = async (roleName: string, roleEmail: string) => {
    setError('');
    setLoggingInRole(roleName);
    setIsLoading(true);
    setEmail(roleEmail);
    setPassword('password123');
    try {
      await login(roleEmail, 'password123');
    } catch (err: any) {
      setError(
        err.response?.data?.message || `Failed to sign in as ${roleName}. Please try again.`
      );
    } finally {
      setIsLoading(false);
      setLoggingInRole(null);
    }
  };

  // PIN Submit
  const handlePinSubmit = async (codeToSubmit?: string) => {
    const code = codeToSubmit || pinCode;
    if (code.length < 4) {
      setError('Please enter a valid 6-digit staff PIN.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await loginWithPin(code);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid PIN code. Please check your PIN.');
      setPinCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumpadPress = (digit: string) => {
    if (pinCode.length >= 6) return;
    const next = pinCode + digit;
    setPinCode(next);
    if (next.length === 6) {
      handlePinSubmit(next);
    }
  };

  const handleNumpadClear = () => {
    setPinCode('');
  };

  const handleNumpadBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-950 text-slate-100">
      {/* Background radial accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1 bg-white rounded-full shadow-2xl shadow-emerald-950/80 border-2 border-emerald-500/50 mb-1">
            <img
              src="/logo.png"
              alt="Daumar Grocery Store"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Daumar <span className="text-emerald-400">Grocery Store</span>
          </h1>
          <p className="text-xs text-amber-400 font-bold tracking-wide">
            Fresh & Quality Since 2026 • Point-of-Sale System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'password'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'pin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cashier PIN Pad
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/90 border-2 border-rose-800 text-rose-200 rounded-xl text-xs font-bold animate-in fade-in">
              {error}
            </div>
          )}

          {/* MODE 1: Email & Password Form */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                className="w-full text-sm font-black shadow-lg shadow-emerald-600/30 h-12"
                isLoading={isLoading && !loggingInRole}
              >
                Sign In to POS Register
              </Button>
            </form>
          )}

          {/* MODE 2: Cashier PIN Pad */}
          {authMode === 'pin' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Enter 6-Digit Staff PIN Code:
                </span>
                <div className="flex justify-center items-center gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center font-mono font-black text-xl transition-all ${
                        pinCode.length > idx
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {pinCode.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Touch Numpad */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleNumpadPress(digit)}
                    className="h-12 bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 hover:border-slate-700 text-white rounded-xl text-lg font-black transition-all active:scale-95 flex items-center justify-center"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="h-12 bg-slate-950 hover:bg-rose-950/50 border-2 border-slate-800 text-rose-400 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('0')}
                  className="h-12 bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 hover:border-slate-700 text-white rounded-xl text-lg font-black transition-all active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumpadBackspace}
                  className="h-12 bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 text-slate-400 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <Button
                type="button"
                variant="emerald"
                size="md"
                className="w-full text-xs font-black h-11 mt-2"
                onClick={() => handlePinSubmit()}
                isLoading={isLoading}
                disabled={pinCode.length < 4}
              >
                Sign In with PIN
              </Button>
            </div>
          )}

          {/* Quick 1-Click Instant Login (actually logs in immediately!) */}
          <div className="pt-4 border-t-2 border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Instant 1-Click Demo Login:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Cashier button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInstantLogin('Cashier', 'cashier@klaropos.ph')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border-2 border-slate-800 hover:border-emerald-500 text-slate-200 text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-xs text-white">Cashier</span>
                <span className="text-[10px] text-emerald-400/90 font-mono font-bold">
                  {loggingInRole === 'Cashier' ? 'Signing in...' : 'PIN: 112233'}
                </span>
              </button>

              {/* Manager button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInstantLogin('Manager', 'manager@klaropos.ph')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-indigo-950/40 border-2 border-slate-800 hover:border-indigo-500 text-slate-200 text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <Key className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-xs text-white">Manager</span>
                <span className="text-[10px] text-indigo-400/90 font-mono font-bold">
                  {loggingInRole === 'Manager' ? 'Signing in...' : 'PIN: 123456'}
                </span>
              </button>

              {/* Admin button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInstantLogin('Admin', 'admin@klaropos.ph')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 border-2 border-slate-800 hover:border-purple-500 text-slate-200 text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="font-black text-xs text-white">Admin</span>
                <span className="text-[10px] text-purple-400/90 font-mono font-bold">
                  {loggingInRole === 'Admin' ? 'Signing in...' : 'PIN: 999999'}
                </span>
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
