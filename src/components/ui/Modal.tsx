'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  // Save/Cancel never sit below the fold. Buttons that submit a form rendered in
  // `children` should carry `form="<id>"` (they live outside it).
  footer?: React.ReactNode;
  // 'sheet' (default): bottom sheet on mobile, centered dialog on desktop — for forms.
  // 'center': centered on every screen — for confirmations and detail/read-only views.
  placement?: 'sheet' | 'center';
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, placement = 'sheet', className }: Props) {
  // Portal needs a DOM target; only render after mount (this is SSR'd as a client component).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Lock background scroll so the page behind the dialog can't move under it.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const sheet = placement === 'sheet';

  // Rendered through a portal to <body> so `position: fixed` is anchored to the
  // VIEWPORT, not a transformed/blurred ancestor (which would otherwise pin the
  // dialog to the bottom of the scrolled page instead of the screen).
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center',
        sheet ? 'items-end sm:items-center sm:p-4' : 'items-center p-4',
      )}
      role="dialog"
      aria-modal
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      {/* Flex column so header + footer pin and only the body scrolls. dvh (not
          vh) so mobile browser chrome can't push the footer past the screen. */}
      <div
        className={cn(
          'relative flex w-full flex-col bg-white dark:bg-slate-950 shadow-xl',
          sheet
            ? 'max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] sm:max-w-md rounded-t-3xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)] sm:pb-0 animate-slide-up sm:animate-fade-in'
            : 'max-h-[calc(100dvh-2rem)] max-w-sm rounded-2xl animate-fade-in',
          className,
        )}
      >
        {/* Grab-handle affordance (mobile bottom sheet only) */}
        {sheet && (
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300/70 dark:bg-white/15 sm:hidden" aria-hidden />
        )}

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
    </div>,
    document.body,
  );
}
