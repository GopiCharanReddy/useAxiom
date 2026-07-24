import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'proposed' | 'pending' | 'progress' | 'blocked' | 'completed' | 'error';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors duration-200 border';

    const variants = {
      default: 'bg-slate-100 text-slate-700 border-slate-200/80',
      proposed: 'bg-blue-50 text-blue-700 border-blue-200/80',
      pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
      progress: 'bg-sky-50 text-sky-700 border-sky-200/80',
      blocked: 'bg-rose-50 text-rose-700 border-rose-200/80',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      error: 'bg-rose-50 text-rose-700 border-rose-200/80',
    };

    return (
      <span ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
