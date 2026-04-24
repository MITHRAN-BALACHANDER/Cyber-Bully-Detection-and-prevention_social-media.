'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Chrome, Github, ShieldCheck } from 'lucide-react';
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
          Create your account
        </h2>
        <p className="mt-2 text-muted-foreground">
          Get your handle, build your presence.
        </p>
      </motion.div>

      <Card className="p-6 sm:p-7">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" type="button" className="justify-center">
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="secondary" type="button" className="justify-center">
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <div className="text-xs text-muted-foreground">or</div>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-danger/10 border border-border rounded-2xl text-danger text-sm font-medium">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            placeholder="johndoe"
            required
            autoComplete="username"
          />

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
            autoComplete="new-password"
            helperText="At least 8 characters"
          />

          <div className="rounded-2xl border border-border bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Password strength
              </div>
              <div className="text-xs font-semibold text-foreground">
                {score <= 1 ? 'Weak' : score <= 3 ? 'Good' : 'Strong'}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={[
                    'h-1.5 rounded-full',
                    i < score
                      ? score <= 1
                        ? 'bg-danger'
                        : score <= 3
                          ? 'bg-warning'
                          : 'bg-success'
                      : 'bg-white/10',
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
          />

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              required
              className="mt-1 w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
