'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("h-8 w-14 rounded-full bg-white/10", className)} />;
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
        isDark ? "bg-primary/20" : "bg-black/5 dark:bg-white/10",
        className
      )}
      role="switch"
      aria-checked={isDark}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={cn(
          "pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
          isDark ? "translate-x-3" : "-translate-x-3"
        )}
      >
        <span
          className={cn(
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity",
            isDark ? "opacity-0 duration-100 ease-out" : "opacity-100 duration-200 ease-in"
          )}
          aria-hidden="true"
        >
          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <span
          className={cn(
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity",
            isDark ? "opacity-100 duration-200 ease-in" : "opacity-0 duration-100 ease-out"
          )}
          aria-hidden="true"
        >
          <Moon className="h-3.5 w-3.5 text-foreground" />
        </span>
      </span>
    </button>
  );
}