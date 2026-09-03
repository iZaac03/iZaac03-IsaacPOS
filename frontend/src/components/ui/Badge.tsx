import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
    md: 'px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
  }[size];

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border border-rose-300',
    info: 'bg-sky-50 text-sky-800 border border-sky-300',
    slate: 'bg-slate-100 text-slate-800 border border-slate-300',
  }[variant];

  const dotColors = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    info: 'bg-sky-600',
    slate: 'bg-slate-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded ${sizeStyles} ${variantStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {children}
    </span>
  );
};
