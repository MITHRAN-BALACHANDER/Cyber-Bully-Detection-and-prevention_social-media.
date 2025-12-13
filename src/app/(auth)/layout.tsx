import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | SocialHub',
  description: 'Sign in to your SocialHub account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-background py-12 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
