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
          <label className="text-[10px] font-black text-[#66635d] tracking-widest uppercase mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`px-4 py-3 bg-white border ${
            error
              ? 'border-[#9f3a38] focus:ring-[#9f3a38]/20'
              : 'border-[#e6e3da] focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10'
          } rounded-lg text-[#1c1b18] placeholder-[#a09c94] text-sm focus:outline-none transition-all duration-300 shadow-sm ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-[#9f3a38] font-bold mt-1 tracking-wide">{error}</span>
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
          <label className="text-[10px] font-black text-[#66635d] tracking-widest uppercase mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`px-4 py-3 bg-white border ${
            error
              ? 'border-[#9f3a38] focus:ring-[#9f3a38]/20'
              : 'border-[#e6e3da] focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10'
          } rounded-lg text-[#1c1b18] placeholder-[#a09c94] text-sm focus:outline-none transition-all duration-300 resize-none min-h-[100px] shadow-sm ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-[#9f3a38] font-bold mt-1 tracking-wide">{error}</span>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
