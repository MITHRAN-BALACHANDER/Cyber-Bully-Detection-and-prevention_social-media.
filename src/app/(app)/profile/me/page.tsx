'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function MeProfileRedirect() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    }
  }, [router, user?.username]);

  return null;
}

