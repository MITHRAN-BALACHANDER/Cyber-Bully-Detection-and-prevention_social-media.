'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { LeftSidebar } from './LeftSidebar';
import { RightRail } from './RightRail';
import { MobileNav } from './MobileNav';
import { CommandPalette, useCommandK } from './CommandPalette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useCommandK();

  return (
    <>
      <CommandPalette open={open} onOpenChange={setOpen} />

      <div className="min-h-screen bg-background">
        {/* ambient gradients */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/15 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-180px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-accent/15 via-primary/10 to-secondary/10 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[1440px]">
          <div className="flex justify-center xl:gap-4 2xl:gap-8">
            <LeftSidebar onOpenCommand={() => setOpen(true)} />

            <main className="flex-1 w-full max-w-[800px] min-w-0 px-4 sm:px-6 py-4 lg:py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>

            <RightRail />
          </div>
        </div>

        <MobileNav />
      </div>
    </>
  );
}

