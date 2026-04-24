'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, Button, ThemeToggle } from '@/components/ui';
import { useAuthStore, useChatStore } from '@/store';
import { CREATE_ITEM, PRIMARY_NAV, SECONDARY_NAV } from './nav';

export function LeftSidebar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { unreadCounts } = useChatStore();

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const itemClass = (active: boolean) =>
    cn(
      'group flex items-center gap-3 rounded-2xl px-3 py-2.5',
      'text-sm font-medium transition-all duration-200',
      active
        ? 'bg-white/5 text-foreground shadow-[0_0_0_1px_var(--border)_inset]'
        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    );

  return (
    <aside className="hidden lg:flex lg:w-[280px] xl:w-[300px] flex-col gap-4 p-4">
      <div className="glass rounded-3xl p-4">
        <Link href="/feed" className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.35),transparent_60%)]" />
            <div className="relative h-full w-full grid place-items-center text-primary-foreground font-semibold text-lg">
              S
            </div>
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">Sentinel</div>
            <div className="text-xs text-muted-foreground">Unified social.</div>
          </div>
        </Link>

        <div className="mt-4">
          <Button
            className="w-full justify-center rounded-2xl"
            onClick={() => router.push(CREATE_ITEM.href)}
          >
            <CREATE_ITEM.icon className="mr-2 h-4 w-4" />
            {CREATE_ITEM.label}
          </Button>
        </div>

        <button
          onClick={onOpenCommand}
          className={cn(
            'mt-3 w-full rounded-2xl px-3 py-2 text-left',
            'bg-white/5 hover:bg-white/7 transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Command className="h-4 w-4" />
              <span className="text-sm font-medium">Command palette</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground/80">Ctrl K</span>
          </div>
        </button>
      </div>

      <nav className="glass rounded-3xl p-2">
        <div className="space-y-1">
          {PRIMARY_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const showBadge = item.href === '/chat' && totalUnread > 0;
            return (
              <Link key={item.href} href={item.href} className={itemClass(active)}>
                <Icon className="h-5 w-5 opacity-90" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white"
                  >
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="my-2 h-px bg-white/5" />

        <div className="space-y-1">
          {SECONDARY_NAV.filter((x) => !x.desktopOnly).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={itemClass(active)}>
                <Icon className="h-5 w-5 opacity-90" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="glass rounded-3xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground px-1">Theme</span>
          <ThemeToggle />
        </div>
        
        <div className="h-px bg-white/5" />

        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name || 'You'} size="md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name || '—'}</div>
            <div className="truncate text-xs text-muted-foreground">@{user?.username || '—'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

