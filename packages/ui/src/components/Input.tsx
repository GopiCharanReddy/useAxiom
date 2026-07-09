import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`px-4 py-2.5 bg-zinc-900 border ${
            error ? "border-red-500/50 focus:ring-red-500/30" : "border-zinc-800 focus:ring-purple-500/30"
          } rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`px-4 py-2.5 bg-zinc-900 border ${
            error ? "border-red-500/50 focus:ring-red-500/30" : "border-zinc-800 focus:ring-purple-500/30"
          } rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none min-h-[100px] ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
