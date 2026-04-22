'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">swirlHub</h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-white hover:text-white/80 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Welcome to your professional community
            </h2>
            <p className="mt-6 text-xl text-white/80">
              Share your moments, connect with professionals, chat in real-time, and grow your network.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-primary-600 rounded-full font-semibold text-lg hover:bg-white/90 transition-colors text-center"
              >
                Get Started — It&apos;s Free
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            {/* Hero illustration placeholder */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2 mt-2" />
                  </div>
                </div>
                <div className="h-40 bg-white/10 rounded-xl" />
                <div className="flex gap-4">
                  <div className="h-8 bg-white/20 rounded-full w-20" />
                  <div className="h-8 bg-white/20 rounded-full w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="bg-background py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Everything you need in one place
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-foreground">Share Media</h4>
              <p className="text-muted-foreground mt-2">Post photos and videos in beautiful galleries</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h4 className="font-semibold text-foreground">Microblog</h4>
              <p className="text-muted-foreground mt-2">Share your thoughts with posts and articles</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-foreground">Real-time Chat</h4>
              <p className="text-muted-foreground mt-2">Message anyone instantly with live updates</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-foreground">Network</h4>
              <p className="text-muted-foreground mt-2">Build your professional connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} swirlHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
