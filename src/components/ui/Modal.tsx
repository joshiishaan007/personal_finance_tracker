'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby={title ? 'modal-title' : undefined}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className={cn('relative bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-md animate-fade-in', className)}>
        {title && (
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-slate-100 dark:border-slate-800">
            <Heading level={2} id="modal-title" className="text-lg font-semibold">{title}</Heading>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Close"><X size={18} /></Button>
          </div>
        )}
        <div className="p-4 sm:p-6 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
