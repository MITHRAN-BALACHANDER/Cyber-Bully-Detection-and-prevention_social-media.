'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result) {
      router.push('/feed');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.35),transparent_60%)]" />
            <div className="relative h-full w-full grid place-items-center text-primary-foreground font-semibold text-2xl">
              S
            </div>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            Sentinel
          </span>
        </Link>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-2 text-muted-foreground">
          Sign in to your account.
        </p>
        <div className="mt-4 text-xs text-muted-foreground">
          Trusted by builders, creators, and teams.
        </div>
      </motion.div>

      <Card className="p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-border rounded-2xl text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
