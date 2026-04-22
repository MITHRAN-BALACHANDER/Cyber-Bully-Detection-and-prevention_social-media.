import {
  Home,
  Compass,
  Users,
  MessageCircle,
  Bell,
  User,
  Settings,
  Plus,
  Shield,
} from 'lucide-react';
import type React from 'react';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desktopOnly?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/search', label: 'Explore', icon: Compass },
  { href: '/network', label: 'Network', icon: Users },
  { href: '/chat', label: 'Messages', icon: MessageCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/profile/me', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: Shield, desktopOnly: true },
];

export const CREATE_ITEM: NavItem = { href: '/create', label: 'Create', icon: Plus };

