'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Command as CommandIcon, Search } from 'lucide-react';
import { Command } from 'cmdk';
import { PRIMARY_NAV, SECONDARY_NAV, CREATE_ITEM } from './nav';

export function useCommandK(onOpen?: () => void) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        onOpen?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);

  return { open, setOpen };
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const run = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <div
      className={[
        'fixed inset-0 z-[100] transition',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="absolute left-1/2 top-[10%] w-[min(720px,calc(100%-24px))] -translate-x-1/2">
        <Command
          className="glass overflow-hidden rounded-3xl"
          loop
        >
          <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
            <div className="grid place-items-center h-9 w-9 rounded-2xl bg-white/5">
              <CommandIcon className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Command.Input
                placeholder="Search actions…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="text-xs text-muted-foreground">Esc</div>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-sm text-muted-foreground">
              No results.
            </Command.Empty>

            <Command.Group heading="Create" className="px-1 py-2">
              <Command.Item
                onSelect={() => run(CREATE_ITEM.href)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm aria-selected:bg-white/6"
              >
                <CREATE_ITEM.icon className="h-5 w-5 text-accent" />
                <span className="flex-1 font-medium">{CREATE_ITEM.label}</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-white/5" />

            <Command.Group heading="Navigate" className="px-1 py-2">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
                <Command.Item
                  key={item.href}
                  onSelect={() => run(item.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm aria-selected:bg-white/6"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {pathname === item.href ? (
                    <span className="text-xs text-muted-foreground">Current</span>
                  ) : null}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

