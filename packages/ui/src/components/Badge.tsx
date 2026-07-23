import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'proposed' | 'pending' | 'progress' | 'blocked' | 'completed' | 'error';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-200 border';

    const variants = {
      default: 'bg-[#f2efe9] text-[#66635d] border-[#e6e3da]',
      proposed: 'bg-[#FAF4E8] text-[#8c7853] border-[#eedebf]',
      pending: 'bg-[#FCF5EB] text-[#bda272] border-[#ebd4b1]',
      progress: 'bg-[#eef2f6] text-[#4d6a8c] border-[#d8e3ed]',
      blocked: 'bg-[#fdf2f2] text-[#9f3a38] border-[#fcdada]',
      completed: 'bg-[#f0f5f0] text-[#3e593e] border-[#d5ebd5]',
      error: 'bg-[#fdf2f2] text-[#9f3a38] border-[#fcdada]',
    };

    return (
      <span ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
