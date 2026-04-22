'use client';

import * as React from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              'bg-card text-card-foreground border border-border shadow-[var(--shadow-soft)] rounded-2xl',
            title: 'font-semibold',
            description: 'text-muted-foreground',
          },
        }}
      />
    </ThemeProvider>
  );
}

