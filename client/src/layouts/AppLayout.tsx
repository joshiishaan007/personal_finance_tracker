import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from '../components/NotificationBell';
import { CommandPalette } from '../components/CommandPalette';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', shortcut: 'g d' },
  { to: '/transactions', label: 'Transactions', icon: '💸', shortcut: 'g t' },
  { to: '/analytics', label: 'Analytics', icon: '📊', shortcut: 'g a' },
  { to: '/goals', label: 'Goals', icon: '🎯', shortcut: 'g g' },
];

const MORE_ITEMS = [
  { to: '/budgets', label: 'Budgets', icon: '📋' },
  { to: '/net-worth', label: 'Net Worth', icon: '🏦' },
  { to: '/pl', label: 'P&L', icon: '📈' },
  { to: '/recurring', label: 'Recurring', icon: '🔄' },
  { to: '/reports', label: 'Reports', icon: '📄' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const ALL_NAV = [...NAV_ITEMS, ...MORE_ITEMS];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const keys: string[] = [];
    let timer: ReturnType<typeof setTimeout>;

    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); return; }
      if (e.key === '?') { setPaletteOpen(true); return; }
      if (e.key === '/') { e.preventDefault(); setPaletteOpen(true); return; }
      keys.push(e.key);
      clearTimeout(timer);
      timer = setTimeout(() => keys.splice(0), 1000);
      const combo = keys.join(' ');
      if (combo === 'g d') { keys.splice(0); void navigate('/dashboard'); }
      if (combo === 'g t') { keys.splice(0); void navigate('/transactions'); }
      if (combo === 'g a') { keys.splice(0); void navigate('/analytics'); }
      if (combo === 'g g') { keys.splice(0); void navigate('/goals'); }
      if (combo === 'n') { keys.splice(0); /* open new tx form handled in Transactions */ }
    }

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timer); };
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 gap-2 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <span className="text-2xl">💜</span>
          <span className="text-xl font-bold text-brand-600 dark:text-brand-400">FinBuddy</span>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <hr className="my-2 border-slate-200 dark:border-slate-800" />
        <p className="px-3 text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">More</p>

        {MORE_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors"
          >
            <span>🚪</span><span>Sign out</span>
          </button>
          <p className="px-3 mt-2 text-xs text-slate-400">⌘K for commands</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 lg:px-6">
          <span className="lg:hidden text-xl font-bold text-brand-600 dark:text-brand-400">💜 FinBuddy</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-300 transition-colors"
              aria-label="Open command palette"
            >
              <span>⌘K</span>
            </button>
            <NotificationBell />
            {user?.avatar && (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex z-40" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors min-h-[56px] ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 min-h-[56px]"
          aria-label="More options"
        >
          <span className="text-xl">⋯</span>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile more drawer */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950 rounded-t-2xl p-4 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-3">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            <button
              onClick={() => { setMoreOpen(false); void logout(); }}
              className="mt-4 w-full py-3 text-sm text-danger-500 font-medium rounded-xl border border-danger-200 dark:border-danger-800"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={ALL_NAV}
      />
    </div>
  );
}
