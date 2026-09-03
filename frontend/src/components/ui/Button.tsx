import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'emerald' | 'amber' | 'danger' | 'secondary' | 'outline' | 'ghost' | 'dark-ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:translate-y-px transition-colors duration-100 cursor-pointer';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-sm sm:text-base gap-2',
  }[size];

  const variantStyles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-800 focus:ring-slate-900',
    emerald: 'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 border border-emerald-800 focus:ring-emerald-700 font-semibold',
    amber: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 border border-amber-700 focus:ring-amber-600 font-semibold',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 border border-rose-800 focus:ring-rose-700 font-semibold',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 focus:ring-slate-300',
    outline: 'border border-slate-300 text-slate-800 bg-white hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-300',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200',
    'dark-ghost': 'text-slate-300 hover:bg-slate-800 hover:text-white focus:ring-slate-700',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
