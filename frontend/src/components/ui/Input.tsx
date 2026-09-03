import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  darkTheme?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      darkTheme = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-semibold mb-1 ${
              darkTheme ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-xs">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`block w-full rounded-md border text-sm transition-colors py-2 ${
              icon ? 'pl-9 pr-3' : 'px-3'
            } ${
              darkTheme
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
            } ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-500">{error}</p>
        ) : helperText ? (
          <p
            className={`mt-1 text-xs ${
              darkTheme ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
