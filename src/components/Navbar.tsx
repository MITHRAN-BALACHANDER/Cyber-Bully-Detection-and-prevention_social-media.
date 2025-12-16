/**
 * Navbar Component
 * Main navigation bar for the application
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Users,
  MessageCircle,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  PlusSquare,
} from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore, useChatStore } from '@/store';
import { useAuth } from '@/hooks';

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/network', icon: Users, label: 'Network' },
  { href: '/chat', icon: MessageCircle, label: 'Messages' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const { unreadCounts } = useChatStore();
  const { logout } = useAuth();
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Calculate total unread messages
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const handleLogout = async () => {
    await logout();
    logoutStore();
    router.push('/login');
  };

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block group-hover:text-primary-600 transition-colors">
              swirl
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const showBadge = item.href === '/chat' && totalUnread > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                    isActive
                      ? 'text-primary-600 bg-primary-50 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {showBadge && (
                    <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Create Post */}
                <Button
                  variant="primary"
                  size="sm"
                  className="hidden sm:flex gap-2"
                  onClick={() => router.push('/create')}
                >
                  <PlusSquare className="w-4 h-4" />
                  <span className="hidden lg:inline">Create</span>
                </Button>

                {/* Notifications */}
                <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  {/* Notification badge would go here */}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                            <p className="font-semibold text-gray-900 text-base">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              @{user.username}
                            </p>
                          </div>
                          <div className="py-2">
                            <Link
                              href={`/profile/${user.username}`}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <User className="w-5 h-5" />
                              <span className="font-medium">View Profile</span>
                            </Link>
                            <Link
                              href="/settings"
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Settings className="w-5 h-5" />
                              <span className="font-medium">Settings</span>
                            </Link>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-5 h-5" />
                              <span className="font-medium">Log out</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Log in
                </Button>
                <Button onClick={() => router.push('/register')}>Sign up</Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-surface-border bg-white"
          >
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const showBadge = item.href === '/chat' && totalUnread > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
