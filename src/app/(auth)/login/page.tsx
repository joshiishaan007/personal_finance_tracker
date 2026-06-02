'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ENDPOINTS } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { GradientText } from '@/components/ui/GradientText';
import { IconBadge } from '@/components/ui/IconBadge';

function LoginCard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const error = searchParams.get('error');

  return (
    <div className="w-full max-w-sm animate-slide-up">
      <div className="flex flex-col items-center text-center mb-8">
        <IconBadge icon={Wallet} size="lg" gradient className="mb-5 animate-float" />
        <GradientText as="div" className="text-3xl">Personal Finance Tracker</GradientText>
        <Text variant="muted" className="mt-2">Your lifetime personal finance companion</Text>
      </div>

      <Card variant="glass" padding="lg" className="shadow-card-lg">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-danger-50 dark:bg-danger-500/10 px-3.5 py-3 text-danger-700 dark:text-danger-300">
            <AlertCircle size={18} strokeWidth={2.2} className="shrink-0" />
            <Text as="span" className="text-sm text-danger-700 dark:text-danger-300">Sign-in failed. Please try again.</Text>
          </div>
        )}

        {/* Full-page nav to the OAuth start route — NOT the client router (server sets the redirect + cookie). */}
        <a
          href={ENDPOINTS.auth.google}
          className="group flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-card hover:shadow-card-lg active:scale-[0.98] transition-all duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>

        <div className="mt-5 flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <ShieldCheck size={15} strokeWidth={2.2} className="shrink-0" />
          <Text variant="small">By continuing, you agree to use this app responsibly. No data is sold or shared.</Text>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
        <Sparkles size={14} strokeWidth={2.2} />
        <Text variant="small">Free forever · Built for 30+ years of daily use</Text>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton w-12 h-12 rounded-full" />}>
      <LoginCard />
    </Suspense>
  );
}
