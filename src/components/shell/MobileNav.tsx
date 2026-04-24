'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store';
import { CREATE_ITEM, PRIMARY_NAV } from './nav';
import { ThemeToggle } from '@/components/ui';

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCounts } = useChatStore();
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        <div className="mx-auto max-w-3xl px-3 pb-3">
          <div className="glass rounded-3xl px-3 py-2">
            <div className="grid grid-cols-5">
              {PRIMARY_NAV.slice(0, 5).map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                const badge = item.href === '/chat' ? totalUnread : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2',
                      'transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                    {badge > 0 ? (
                      <span className="absolute top-1 right-6 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    ) : null}
                    {active ? (
                      <motion.span
                        layoutId="mobileNavActive"
                        className="absolute inset-0 -z-10 rounded-2xl bg-white/6"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating create */}
      <button
        onClick={() => router.push(CREATE_ITEM.href)}
        className={cn(
          'lg:hidden fixed bottom-20 right-4 z-50',
          'h-14 w-14 rounded-2xl',
          'bg-gradient-to-br from-primary via-secondary to-accent',
          'shadow-[var(--shadow-glass)]',
          'active:scale-[0.98] transition-transform'
        )}
        aria-label="Create"
      >
        <CREATE_ITEM.icon className="mx-auto h-6 w-6 text-primary-foreground" />
      </button>

      {/* Floating Theme Toggle */}
      <div className="lg:hidden fixed bottom-20 left-4 z-50">
        <ThemeToggle className="shadow-[var(--shadow-glass)] bg-white/20 dark:bg-black/20 backdrop-blur-md" />
      </div>
    </>
  );
}

