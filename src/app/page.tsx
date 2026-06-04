'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MODE_HOME, MODE_STORAGE_KEY, type AppMode } from '@/lib/mode';

// Land in the user's last-used mode (persisted in localStorage); default Finance.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const stored = (localStorage.getItem(MODE_STORAGE_KEY) as AppMode | null) ?? 'finance';
    router.replace(MODE_HOME[stored] ?? '/dashboard');
  }, [router]);
  return null;
}
