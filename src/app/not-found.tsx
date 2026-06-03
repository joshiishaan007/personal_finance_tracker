import { Compass } from 'lucide-react';
import { Link } from '@/components/ui/Link';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center text-center">
        <Compass size={56} strokeWidth={1.8} className="text-brand-500" aria-hidden />
        <Heading level={1} className="text-3xl font-bold mt-4">Page not found</Heading>
        <Text variant="muted" className="mt-2">This page doesn&apos;t exist — but your finances are right where you left them.</Text>
        <Link
          href="/dashboard"
          className="inline-block mt-6 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors no-underline hover:no-underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
