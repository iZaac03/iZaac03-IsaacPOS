import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ShieldCheck, Delete, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: (approver: { user_id: number; name: string; role: string }) => void;
  title?: string;
  reasonText?: string;
  darkTheme?: boolean;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  title = 'Supervisor PIN Required',
  reasonText = 'Manager or Administrator authorization is required to proceed.',
  darkTheme = false,
}) => {
  const { verifyPin } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 6) {
        verify(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verify = async (pinCode: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await verifyPin(pinCode);
      if (res.valid && res.approver) {
        onAuthorized(res.approver);
        handleClear();
        onClose();
      } else {
        setError(res.message || 'Invalid Supervisor PIN code');
        setPin('');
      }
    } catch {
      setError('Verification failed. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={reasonText}
      maxWidth="sm"
      darkTheme={darkTheme}
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>

        {/* 6 PIN Dots */}
        <div className="flex items-center gap-3 my-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                index < pin.length
                  ? darkTheme
                    ? 'bg-amber-400 border-amber-400'
                    : 'bg-slate-900 border-slate-900'
                  : darkTheme
                  ? 'border-slate-700 bg-slate-800'
                  : 'border-slate-300 bg-slate-100'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-600 mb-2">
            {error}
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className={`h-12 rounded-md font-bold text-lg cursor-pointer transition-colors active:translate-y-px ${
                darkTheme
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
              }`}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className={`h-12 rounded-md font-semibold text-xs flex items-center justify-center cursor-pointer transition-colors active:translate-y-px ${
              darkTheme
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className={`h-12 rounded-md font-bold text-lg cursor-pointer transition-colors active:translate-y-px ${
              darkTheme
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
            }`}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className={`h-12 rounded-md font-semibold text-xs flex items-center justify-center cursor-pointer transition-colors active:translate-y-px ${
              darkTheme
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 w-full flex justify-end">
          <Button
            variant={darkTheme ? 'dark-ghost' : 'ghost'}
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
