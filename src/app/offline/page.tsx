import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-sm space-y-3">
        <Heading level={1}>You&apos;re offline</Heading>
        <Text>
          Some things need a connection. Anything you add is saved on this device and syncs
          automatically when you&apos;re back online.
        </Text>
      </div>
    </main>
  );
}
