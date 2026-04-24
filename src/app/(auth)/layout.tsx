import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth | Sentinel',
  description: 'Join Sentinel — creators, pros, and communities.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-[100dvh] lg:grid-cols-2 bg-background">
        {/* Brand panel */}
        <div className="relative hidden lg:flex border-r border-border bg-muted/10">
          <div className="relative w-full h-full p-12 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-primary text-primary-foreground">
                <div className="relative h-full w-full grid place-items-center font-semibold text-xl">
                  S
                </div>
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight text-foreground">Sentinel</div>
                <div className="text-sm text-muted-foreground">Unified social. Premium by default.</div>
              </div>
            </div>

            <div className="max-w-md my-auto">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Where creators and professionals
                <span className="block text-primary">
                  build their signal.
                </span>
              </h1>
              <p className="mt-5 text-base text-muted-foreground">
                Instagram-level sharing, X-style speed, LinkedIn-grade identity, and realtime chat —
                in one polished space.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { k: 'Fast', v: 'Motion-rich UI that stays snappy.' },
                  { k: 'Private', v: 'Smart controls and visibility.' },
                  { k: 'Realtime', v: 'Presence, typing, and updates.' },
                  { k: 'Professional', v: 'Resume-style profile sections.' },
                ].map((x) => (
                  <div key={x.k} className="glass rounded-3xl p-4">
                    <div className="text-sm font-semibold">{x.k}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-xs text-muted-foreground">
              “Damn this is clean.” — every new user, hopefully.
            </div>
          </div>
        </div>

        {/* Auth panel */}
        <div className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10 bg-background">
          <div className="relative w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
