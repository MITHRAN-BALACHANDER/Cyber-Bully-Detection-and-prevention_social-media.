/**
 * Input Component
 * Reusable form input with label and error states
 */

'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-muted-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-2xl border bg-card/60 backdrop-blur-xl',
            'text-foreground placeholder:text-muted-foreground',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            error
              ? 'border-destructive focus:ring-destructive/30'
              : 'border-border hover:border-accent',
            props.disabled && 'bg-muted cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1 text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
