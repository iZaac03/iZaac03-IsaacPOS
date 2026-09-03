import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, Mail, Delete, Eye, EyeOff, Shield, UserCheck, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithPin } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Manual Email/Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      console.error('Login error details:', err);
      if (!err.response) {
        setError('Network Error: Cannot reach backend server. If you are on Vercel, the Laravel backend is not running on Vercel.');
      } else if (err.response.status === 404 || typeof err.response.data === 'string') {
        setError('API Endpoint Not Found (404). If you are on Vercel, please test at http://localhost:5173 where the local backend is running.');
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.errors?.email?.[0] ||
            'Invalid credentials. Please verify your email and password.'
        );
      }
    } finally {
      setIsLoading(false);
    }

  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  // Manual PIN Submit
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
      setError(err.response?.data?.message || 'Invalid staff PIN. Please try again.');
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

      <div className="w-full max-w-md relative z-10 space-y-6">
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
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
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

          {/* MODE 1: Email & Password Form (Empty, Ready for Manual Typing) */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Staff Email Address"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. cashier@isaacpos.ph"
                darkTheme={true}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Account Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                darkTheme={true}
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="emerald"
                size="lg"
                className="w-full text-sm font-black shadow-lg shadow-emerald-600/30 h-12 mt-2"
                isLoading={isLoading}
              >
                Sign In to POS Register
              </Button>

              {/* 1-Click Quick Fill Credentials */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Quick-fill Demo Accounts:</span>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                    pwd: password123
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('cashier@isaacpos.ph', 'password123')}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-left text-xs transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-6 h-6 rounded bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block text-[11px] group-hover:text-emerald-300">
                        Cashier
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate block">
                        cashier@...
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@isaacpos.ph', 'password123')}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-left text-xs transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-6 h-6 rounded bg-purple-900/50 text-purple-400 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block text-[11px] group-hover:text-purple-300">
                        Admin
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate block">
                        admin@...
                      </span>
                    </div>
                  </button>
                </div>
              </div>
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
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Philippine BIR Tax Compliant POS SaaS — Version 1.0.0
        </div>
      </div>
    </div>
  );
};
