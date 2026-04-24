'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks';
import { Button, Input, Card } from '@/components/ui';

function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[A-Z]/.test(pw)) s += 1;
  if (/[0-9]/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(5, s);
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const score = passwordScore(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      username: formData.username,
      password: formData.password,
    });
    
    if (result) {
      router.push('/feed');
    } else {
      setError('Registration failed');
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
          Create your account
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Get your handle, build your presence.
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
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="User"
              required
              autoComplete="name"
              className="rounded-xl bg-background/50"
            />

            <Input
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              placeholder="user"
              required
              autoComplete="username"
              className="rounded-xl bg-background/50"
            />
          </div>

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

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            helperText="At least 8 characters"
            className="rounded-xl bg-background/50"
          />

          <div className="rounded-2xl border border-border/50 bg-background/30 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Password strength
              </div>
              <div className="text-xs font-semibold text-foreground">
                {score <= 1 ? 'Weak' : score <= 3 ? 'Good' : 'Strong'}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={[
                    'h-1.5 rounded-full transition-all duration-300',
                    i < score
                      ? score <= 1
                        ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : score <= 3
                          ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-black/5 dark:bg-white/10',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className="rounded-xl bg-background/50"
          />

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              required
              className="mt-1 w-4 h-4 rounded border-border/80 bg-background text-primary focus:ring-ring focus:ring-offset-0 transition-colors cursor-pointer"
            />
            <span className="text-sm text-muted-foreground leading-tight">
              I agree to the{' '}
              <Link href="/terms" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Privacy Policy
              </Link>
            </span>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl py-6 font-semibold shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
      </motion.div>
    </div>
  );
}
