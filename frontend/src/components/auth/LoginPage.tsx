import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, Mail, Delete, Eye, EyeOff } from 'lucide-react';

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
        setError('Network Error: Cannot reach backend server. Please check your connection.');
      } else if (err.response.status === 404 || typeof err.response.data === 'string') {
        setError('API Endpoint Not Found (404). Please verify backend connectivity.');
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
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1 bg-white rounded-lg border border-slate-700 shadow-sm mb-1">
            <img
              src="/logo.png"
              alt="Daumar Grocery Store"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            Daumar Grocery Store
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Point of Sale Terminal • Station Sign-in
          </p>
        </div>

        {/* Login Workstation Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xl space-y-5">
          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-md border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError('');
              }}
              className={`py-2 rounded transition-colors cursor-pointer ${
                authMode === 'password'
                  ? 'bg-emerald-700 text-white'
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
              className={`py-2 rounded transition-colors cursor-pointer ${
                authMode === 'pin'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cashier PIN Pad
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-md text-xs font-semibold">
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
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cashier@daumargrocery.ph"
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
                    className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
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
                className="w-full text-sm font-bold h-11 mt-2"
                isLoading={isLoading}
              >
                Sign In to Terminal
              </Button>
            </form>
          )}

          {/* MODE 2: Cashier PIN Pad */}
          {authMode === 'pin' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Enter 6-Digit Staff PIN:
                </span>
                <div className="flex justify-center items-center gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`w-9 h-11 rounded-md border flex items-center justify-center font-mono font-bold text-lg ${
                        pinCode.length > idx
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
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
                    className="h-12 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-md text-lg font-bold transition-colors active:translate-y-px cursor-pointer flex items-center justify-center"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="h-12 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 text-rose-400 rounded-md text-xs font-bold transition-colors active:translate-y-px cursor-pointer flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('0')}
                  className="h-12 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-md text-lg font-bold transition-colors active:translate-y-px cursor-pointer flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumpadBackspace}
                  className="h-12 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-md text-xs font-bold transition-colors active:translate-y-px cursor-pointer flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <Button
                type="button"
                variant="emerald"
                size="md"
                className="w-full text-xs font-bold h-11 mt-2"
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
        <div className="text-center text-xs text-slate-500 font-mono">
          BIR Compliant POS Terminal • Version 1.0.0
        </div>
      </div>
    </div>
  );
};
