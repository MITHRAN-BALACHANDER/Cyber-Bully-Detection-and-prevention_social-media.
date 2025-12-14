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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/20 via-transparent to-transparent" />
      <div className="relative w-full">
        {children}
      </div>
    </div>
  );
}
