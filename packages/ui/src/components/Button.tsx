import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-black rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#8c7853] ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-widest uppercase text-xs';

    const variants = {
      primary:
        'bg-[#8c7853] text-white hover:bg-[#736243] hover:scale-[1.015] shadow-sm hover:shadow-md border border-[#7d6b4a]',
      secondary:
        'bg-[#f2efe9] text-[#1c1b18] hover:bg-[#e6e3da] hover:scale-[1.015] border border-[#e6e3da]',
      outline:
        'bg-transparent text-[#1c1b18] border border-[#1c1b18] hover:bg-[#1c1b18] hover:text-white hover:scale-[1.015]',
      ghost:
        'bg-transparent text-[#66635d] hover:bg-[#f2efe9] hover:text-[#1c1b18] border border-transparent',
      danger:
        'bg-[#9f3a38] text-white hover:bg-[#852f2d] hover:scale-[1.015] shadow-sm border border-[#8e3230]',
    };

    const sizes = {
      sm: 'px-4 py-2 gap-1.5 h-10',
      md: 'px-5 py-2.5 gap-2 h-12',
      lg: 'px-7 py-3.5 gap-2.5 h-14',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
