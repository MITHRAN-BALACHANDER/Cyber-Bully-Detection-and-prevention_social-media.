import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth | SocialHub',
  description: 'Join SocialHub — creators, pros, and communities.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/10 to-accent/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.25),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-accent/20 blur-3xl" />

          <div className="relative h-full p-12 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
                <div className="relative h-full w-full grid place-items-center text-primary-foreground font-semibold text-xl">
                  S
                </div>
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight text-foreground">SocialHub</div>
                <div className="text-sm text-muted-foreground">Unified social. Premium by default.</div>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Where creators and professionals
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
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

            <div className="mt-auto text-xs text-muted-foreground">
              “Damn this is clean.” — every new user, hopefully.
            </div>
          </div>
        </div>

        {/* Auth panel */}
        <div className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-[420px] w-[740px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/14 via-secondary/8 to-accent/10 blur-3xl lg:hidden" />
          </div>
          <div className="relative w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
