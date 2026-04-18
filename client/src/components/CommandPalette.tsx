import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  function go(to: string) {
    void navigate(to);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4" role="dialog" aria-modal aria-label="Command palette">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-slate-400">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) go(filtered[0].to);
            }}
          />
          <kbd className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-64 overflow-y-auto py-2">
          {filtered.map((item) => (
            <li key={item.to}>
              <button
                onClick={() => go(item.to)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors text-left"
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd className="text-xs text-slate-400">{item.shortcut}</kbd>
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-center text-sm text-slate-400 py-6">No results</li>
          )}
        </ul>
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex gap-4 text-xs text-slate-400">
          <span>↑↓ navigate</span><span>↵ open</span><span>g d/t/a/g jump</span>
        </div>
      </div>
    </div>
  );
}
