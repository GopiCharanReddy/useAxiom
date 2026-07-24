import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-700 tracking-wide mb-1">{label}</label>
        )}
        <input
          ref={ref}
          type={type}
          className={`px-3.5 py-2.5 bg-white border ${
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
          } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all duration-200 shadow-xs ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-600 font-medium mt-1 tracking-wide">{error}</span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-700 tracking-wide mb-1">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`px-3.5 py-2.5 bg-white border ${
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
          } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all duration-200 resize-none min-h-[100px] shadow-xs ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-600 font-medium mt-1 tracking-wide">{error}</span>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
