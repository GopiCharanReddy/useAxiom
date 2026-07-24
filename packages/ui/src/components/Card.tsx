import { HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl p-6 sm:p-8 transition-all duration-200 hover:shadow-md hover:border-slate-300 border border-slate-200/90 shadow-xs ${className}`}
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
    className={`text-lg font-bold leading-none tracking-tight text-slate-900 ${className}`}
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
  <p className={`text-sm font-normal text-slate-500 ${className}`} {...props}>
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
