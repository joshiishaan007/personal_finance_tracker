'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { List, ListItem } from '@/components/ui/List';
import { Text } from '@/components/ui/Text';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  shortcut?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
}

export function CommandPalette({ open, onClose, items }: Props) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  function go(to: string) {
    router.push(to);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4" role="dialog" aria-modal aria-label="Command palette">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search size={18} className="text-slate-400 shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="border-0 bg-transparent dark:bg-transparent px-0 py-0 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) go(filtered[0].to);
            }}
          />
          <Text as="span" className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">ESC</Text>
        </div>
        <List className="max-h-64 overflow-y-auto py-2 space-y-0">
          {filtered.map((item) => (
            <ListItem key={item.to}>
              <Button
                variant="ghost"
                onClick={() => go(item.to)}
                className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/40 text-left rounded-none justify-start')}
              >
                <Text as="span" className="text-base">{item.icon}</Text>
                <Text as="span" className="flex-1">{item.label}</Text>
                {item.shortcut && (
                  <Text as="span" className="text-xs text-slate-400">{item.shortcut}</Text>
                )}
              </Button>
            </ListItem>
          ))}
          {filtered.length === 0 && (
            <ListItem className="text-center text-sm text-slate-400 py-6">No results</ListItem>
          )}
        </List>
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex gap-4 text-xs text-slate-400">
          <Text as="span">↑↓ navigate</Text><Text as="span">↵ open</Text><Text as="span">g d/t/a/g jump</Text>
        </div>
      </div>
    </div>
  );
}
