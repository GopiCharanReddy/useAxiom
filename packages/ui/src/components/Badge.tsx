import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "proposed" | "pending" | "progress" | "blocked" | "completed" | "error";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-200";
    
    const variants = {
      default: "bg-zinc-800 text-zinc-300 border-zinc-700",
      proposed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      progress: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      blocked: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      error: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
