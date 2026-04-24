import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Sentinel',
  description:
    'A unified modern social platform for creators, professionals, and communities.',
  keywords: ['Sentinel', 'social', 'networking', 'chat', 'posts', 'media'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans`}>
        <AppProviders>
          <div className="min-h-screen flex flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
