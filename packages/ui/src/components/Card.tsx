import { HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md border border-[#e6e3da]/80 shadow-[0_4px_20px_-4px_rgba(28,27,24,0.03)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = ({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col gap-1.5 mb-4 ${className}`} {...props}>
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={`text-xl font-serif font-black leading-none tracking-tight text-[#1c1b18] ${className}`}
    {...props}
  >
    {children}
  </h3>
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = ({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm font-medium text-[#66635d] ${className}`} {...props}>
    {children}
  </p>
);
CardDescription.displayName = 'CardDescription';

export const CardContent = ({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);
CardContent.displayName = 'CardContent';

export const CardFooter = ({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex items-center mt-6 pt-4 border-t border-[#e6e3da]/85 ${className}`}
    {...props}
  >
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';
