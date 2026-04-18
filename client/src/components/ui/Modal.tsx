import { useEffect } from 'react';
import { cn } from '../../lib/utils';

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
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded" aria-label="Close">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
