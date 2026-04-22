/**
 * Button Component
 * Reusable button with variants
 */

'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantClasses = {
  primary:
    'text-primary-foreground bg-gradient-to-br from-primary via-secondary to-accent shadow-[var(--shadow-soft)] hover:brightness-110 active:scale-[0.98]',
  secondary:
    'bg-card/70 text-card-foreground border border-border backdrop-blur-xl hover:bg-card/80 shadow-[0_0_0_1px_var(--border)_inset]',
  outline:
    'bg-transparent text-foreground border border-border hover:bg-white/5 shadow-[0_0_0_1px_var(--border)_inset]',
  ghost:
    'bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5',
  danger:
    'bg-danger text-white hover:brightness-110 active:scale-[0.98] shadow-[var(--shadow-soft)]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-2xl',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
