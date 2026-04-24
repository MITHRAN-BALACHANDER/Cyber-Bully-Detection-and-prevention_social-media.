'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuthStore } from '@/store';
import { MessageSquare, Share2, Users, ArrowRight, Zap, Shield, Sparkles, Layout } from 'lucide-react';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, isLoading, router]);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Ambient Radial Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-accent/15 blur-[80px]" />
      </div>

      {/* Glassmorphic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Sentinel</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-6 shadow-md hover:shadow-primary/20 transition-all duration-300">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full flex flex-col items-center pt-32 lg:pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Hero Typography */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Next Generation Networking</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Connect, Grow & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Thrive Together
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Share your moments, build professional connections, chat in real-time, and grow your digital network in a beautifully crafted ecosystem.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 gap-2 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                  Start Exploring <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full px-8 bg-card hover:bg-muted border border-border transition-all">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Animated Mock UI Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block w-full aspect-square rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-md shadow-2xl p-8 overflow-hidden"
          >
            {/* Structural wireframes */}
            <div className="w-full h-full rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl flex flex-col p-4 shadow-inner relative z-0">
              <div className="w-full h-12 border-b border-border/50 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              
              <div className="flex-1 flex gap-4">
                <div className="w-1/3 h-full rounded-xl bg-card border border-border/50 p-4 flex flex-col gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex flex-col items-center justify-center">
                    <div className="w-4 h-4 bg-primary/40 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 rounded-full bg-muted mt-2" />
                  <div className="h-3 w-1/2 rounded-full bg-muted/60" />
                  <div className="h-24 w-full rounded-xl bg-secondary/10 mt-4 border border-secondary/20" />
                  <div className="h-24 w-full rounded-xl bg-accent/10 mt-2 border border-accent/20" />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="h-32 w-full rounded-xl bg-card border border-border/50 p-4">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30" />
                        <div>
                          <div className="h-4 w-24 rounded-full bg-muted" />
                          <div className="h-3 w-16 rounded-full bg-muted/60 mt-2" />
                        </div>
                     </div>
                     <div className="mt-4 flex flex-col gap-2">
                        <div className="h-3 w-full rounded-full bg-muted/50" />
                        <div className="h-3 w-4/5 rounded-full bg-muted/50" />
                     </div>
                  </div>
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-[6px] border-primary/20 border-t-primary/60 animate-spin" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements (Framer Motion) */}
            <motion.div 
              animate={{ y: [0, -15, 0] }} 
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }} 
              className="absolute top-12 -left-6 p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-2xl flex items-center gap-4 z-10"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">+1k Connections</p>
                <p className="text-xs text-muted-foreground">Growing fast</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }} 
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }} 
              className="absolute bottom-24 -right-8 p-4 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center gap-4 z-10"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                 <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">New Message</span>
                <span className="text-xs text-primary-foreground/80">from Design Team</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Bento Grid Features */}
      <section className="relative z-10 w-full bg-card/30 border-y border-border/40 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Everything in one view
            </h2>
            <p className="text-lg text-muted-foreground">
              A comprehensive toolkit architected to handle every aspect of modern communication seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
            {/* Feature 1 (Large Span) */}
            <div className="md:col-span-2 p-8 lg:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                 <Layout className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Immersive Microblogging</h3>
              <p className="text-muted-foreground text-lg max-w-md">
                Share rich formatted articles, dynamic galleries, and bite-sized thoughts in a deeply engaging feed layout designed for maximum retention.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 lg:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
               <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
               <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-secondary" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-foreground mb-3">Real-time Sync</h3>
                 <p className="text-muted-foreground">
                   Instantmatic connection sockets mean you never have to refresh. Live typers, live likes, live life.
                 </p>
               </div>
            </div>

            {/* Feature 3 */}
            <div className="p-8 lg:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
               <div className="absolute left-0 bottom-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500" />
               <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                 <Shield className="w-7 h-7 text-accent" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-foreground mb-3">Enterprise Safety</h3>
                 <p className="text-muted-foreground">
                   Semantic AI moderation runs silently in the background, keeping conversations enriching and protective.
                 </p>
               </div>
            </div>

            {/* Feature 4 (Large Span) */}
            <div className="md:col-span-2 p-8 lg:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute right-0 bottom-0 w-full h-full bg-gradient-to-tl from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6">
                 <Share2 className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Universal Networking</h3>
              <p className="text-muted-foreground text-lg max-w-lg">
                Build professional bridges with advanced connection graphs. Discover mutuals, track engagement algorithms, and elevate your global reach instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-background border-t border-border/40 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
              S
            </div>
            <span className="font-bold tracking-tight text-foreground">swirlHub</span>
          </div>
          
          <div className="text-sm font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} swirlHub. Crafted internally for excellence.
          </div>
        </div>
      </footer>
    </div>
  );
}
