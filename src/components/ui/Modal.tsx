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
  // Pinned action row — stays visible at the bottom while the body scrolls, so
  // Save/Cancel never sit below the fold on mobile. Buttons that submit a form
  // rendered in `children` should carry `form="<id>"` (they live outside it).
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      {/* Bottom sheet on mobile, centered dialog on desktop. Flex column so the
          header + footer pin and only the body scrolls. dvh (not vh) so the
          mobile browser chrome can't push the footer past the visible area. */}
      <div
        className={cn(
          'relative flex w-full flex-col bg-white dark:bg-slate-950 shadow-xl sm:max-w-md',
          'max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)]',
          'rounded-t-3xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)] sm:pb-0',
          'animate-slide-up sm:animate-fade-in',
          className,
        )}
      >
        {/* Grab-handle affordance (mobile only) */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300/70 dark:bg-white/15 sm:hidden" aria-hidden />

        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 pb-3 pt-3 sm:px-6 sm:pt-5">
            <Heading level={2} id="modal-title" className="truncate text-lg font-semibold">{title}</Heading>
            <Button variant="ghost" size="sm" onClick={onClose} className="-mr-1 shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Close"><X size={18} /></Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin p-4 sm:p-6">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
