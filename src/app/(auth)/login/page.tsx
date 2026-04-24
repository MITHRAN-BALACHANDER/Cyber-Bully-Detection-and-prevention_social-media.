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
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <Link href="/" className="inline-flex flex-col items-center gap-4 group">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50 transition-transform group-hover:scale-105 bg-primary">
            <div className="relative h-full w-full grid place-items-center text-primary-foreground font-semibold text-2xl shadow-inner">
              S
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Sentinel
          </span>
        </Link>
        <h2 className="mt-8 text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Sign in to your account to continue.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <Card className="p-8 backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="rounded-xl bg-background/50"
              />
            </div>

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="rounded-xl bg-background/50"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border/80 bg-background text-primary focus:ring-ring focus:ring-offset-0 transition-colors"
                  />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl py-6 font-semibold shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
