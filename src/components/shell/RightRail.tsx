'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Flame, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useChatStore } from '@/store';
import { cn } from '@/lib/utils';

function RailCard({
  title,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className={cn(
              'inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium',
              'text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors'
            )}
          >
            {actionLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function RightRail() {
  const { onlineUsers } = useChatStore();

  return (
    <aside className="hidden xl:flex xl:w-[340px] flex-col gap-4 p-4">
      <RailCard title="Trending" actionHref="/search" actionLabel="Explore">
        <div className="space-y-2">
          {[
            { tag: '#designsystems', meta: '12.4k posts', icon: TrendingUp },
            { tag: '#startups', meta: '8.1k posts', icon: Flame },
            { tag: '#aiassist', meta: '5.6k posts', icon: Sparkles },
          ].map((t) => (
            <motion.div
              key={t.tag}
              whileHover={{ y: -1 }}
              className={cn(
                'rounded-2xl px-3 py-2',
                'bg-white/5 hover:bg-white/7 transition-colors'
              )}
            >
              <div className="flex items-center gap-2">
                <t.icon className="h-4 w-4 text-accent" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold">{t.tag}</div>
                  <div className="text-xs text-muted-foreground">{t.meta}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </RailCard>

      <RailCard title="Online now">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
          <div className="text-sm text-muted-foreground">Active users</div>
          <div className="text-sm font-semibold">{onlineUsers.size}</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Realtime presence is powered by Socket.IO.
        </p>
      </RailCard>

      <RailCard title="Analytics">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'DAU', value: '—' },
            { label: 'Posts/day', value: '—' },
            { label: 'Churn', value: '—' },
            { label: 'Reports', value: '—' },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-white/5 px-3 py-3">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">{m.value}</div>
            </div>
          ))}
        </div>
      </RailCard>
    </aside>
  );
}

