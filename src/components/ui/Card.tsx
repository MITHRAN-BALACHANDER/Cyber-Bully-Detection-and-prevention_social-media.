/**
 * Card Component
 * Container component for content blocks
 */

'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-card text-card-foreground',
  bordered:
    'bg-card/70 text-card-foreground border border-border backdrop-blur-xl shadow-[0_0_0_1px_var(--border)_inset]',
  elevated:
    'bg-card/80 text-card-foreground border border-border backdrop-blur-xl shadow-[var(--shadow-soft)]',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'bordered', padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3 mb-3', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content
type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer
type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-4 pt-3 mt-3 border-t border-border',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
