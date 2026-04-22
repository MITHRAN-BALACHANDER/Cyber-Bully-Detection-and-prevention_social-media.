'use client';

import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Card, Avatar, Button } from '@/components/ui';

type Notif = {
  id: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  time: string;
};

const demo: Notif[] = [
  {
    id: '1',
    group: 'Today',
    icon: Heart,
    title: 'New like',
    body: 'Ari liked your post.',
    time: '2m',
  },
  {
    id: '2',
    group: 'Today',
    icon: MessageCircle,
    title: 'New reply',
    body: '“This is insanely clean.”',
    time: '38m',
  },
  {
    id: '3',
    group: 'Yesterday',
    icon: UserPlus,
    title: 'Connection request',
    body: 'Maya wants to connect.',
    time: '1d',
  },
  {
    id: '4',
    group: 'Earlier',
    icon: Bell,
    title: 'Weekly digest',
    body: 'Your analytics are trending up.',
    time: '5d',
  },
];

export default function NotificationsPage() {
  const groups = ['Today', 'Yesterday', 'Earlier'] as const;

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Realtime updates — grouped for calm scanning.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          Mark all read
        </Button>
      </div>

      <div className="mt-5 space-y-6">
        {groups.map((g) => {
          const items = demo.filter((n) => n.group === g);
          if (items.length === 0) return null;
          return (
            <div key={g}>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">{g}</div>
              <Card className="p-2">
                <div className="space-y-1">
                  {items.map((n, idx) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-3xl bg-white/4 hover:bg-white/6 transition-colors px-3 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative mt-0.5">
                          <Avatar name="—" size="sm" />
                          <div className="absolute -bottom-1 -right-1 grid place-items-center h-5 w-5 rounded-full bg-card border border-border">
                            <n.icon className="h-3 w-3 text-accent" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate text-sm font-semibold">{n.title}</div>
                            <div className="text-xs text-muted-foreground">{n.time}</div>
                          </div>
                          <div className="mt-0.5 text-sm text-muted-foreground">{n.body}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

