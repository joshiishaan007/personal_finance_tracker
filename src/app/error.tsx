'use client';

import { Zap } from 'lucide-react';
import { Link } from '@/components/ui/Link';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center text-center">
        <Zap size={56} strokeWidth={1.8} className="text-warn-500" aria-hidden />
        <Heading level={1} className="text-3xl font-bold mt-4">Something went wrong</Heading>
        <Text variant="muted" className="mt-2">Our servers hit a snag. Your data is safe — please try again.</Text>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="secondary" onClick={() => reset()}>Retry</Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors no-underline hover:no-underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
