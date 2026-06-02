'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartColumnBig,
  Target,
  Wallet,
  Landmark,
  TrendingUp,
  Repeat,
  FileText,
  User,
  Settings,
  Plus,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Command,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationBell } from '@/components/NotificationBell';
import { CommandPalette } from '@/components/CommandPalette';
import { Link } from '@/components/ui/Link';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Heading } from '@/components/ui/Heading';
import { GradientText } from '@/components/ui/GradientText';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'g d' },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, shortcut: 'g t' },
  { to: '/analytics', label: 'Analytics', icon: ChartColumnBig, shortcut: 'g a' },
  { to: '/goals', label: 'Goals', icon: Target, shortcut: 'g g' },
];

const MORE_NAV: NavItem[] = [
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/net-worth', label: 'Net Worth', icon: Landmark },
  { to: '/pl', label: 'P&L', icon: TrendingUp },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...MORE_NAV];

// CommandPalette's contract wants a string `icon`; the redesigned nav uses lucide
// components, so feed the palette an icon-less projection (it renders the label).
const PALETTE_ITEMS = ALL_NAV.map((i) => ({ to: i.to, label: i.label, icon: '', shortcut: i.shortcut }));

function isActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="p-2 active:scale-95"
    >
      {dark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
    </Button>
  );
}

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    // Plain img: external Google avatar URL needs referrerPolicy and no next/image loader/domain config.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="w-8 h-8 rounded-full ring-2 ring-white/60 dark:ring-white/10" referrerPolicy="no-referrer" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-aurora text-white grid place-items-center text-sm font-semibold shadow-glow">
      <Text as="span" className="text-white">{name.charAt(0).toUpperCase()}</Text>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const activeItem = ALL_NAV.find((i) => isActive(pathname, i.to));
  const pageTitle = activeItem?.label ?? 'Personal Finance Tracker';

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
      if (combo === 'g d') { keys.splice(0); router.push('/dashboard'); }
      if (combo === 'g t') { keys.splice(0); router.push('/transactions'); }
      if (combo === 'g a') { keys.splice(0); router.push('/analytics'); }
      if (combo === 'g g') { keys.splice(0); router.push('/goals'); }
      if (combo === 'n') { keys.splice(0); /* open new tx form handled in Transactions */ }
    }

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timer); };
  }, [router]);

  function renderSidebarItem(item: NavItem) {
    const active = isActive(pathname, item.to);
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        href={item.to}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] no-underline hover:no-underline active:scale-[0.98]',
          active
            ? 'bg-aurora-soft text-brand-700 dark:text-brand-200'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-ink-800/70 hover:text-slate-800 dark:hover:text-slate-200',
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-aurora"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        <Icon size={18} strokeWidth={2.2} className={cn('shrink-0 transition-colors', active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400')} />
        <Text as="span" className={cn(active ? 'text-brand-700 dark:text-brand-200' : '')}>{item.label}</Text>
      </Link>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r p-4 gap-1.5 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-2 no-underline hover:no-underline">
          <GradientText className="text-lg leading-tight">Personal Finance Tracker</GradientText>
        </Link>

        <nav className="flex flex-col gap-1.5" aria-label="Primary">
          {PRIMARY_NAV.map(renderSidebarItem)}
        </nav>

        <div className="my-2 h-px bg-slate-200/70 dark:bg-white/5" />
        <Text as="span" className="px-3 text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">More</Text>

        <nav className="flex flex-col gap-1.5" aria-label="Secondary">
          {MORE_NAV.map(renderSidebarItem)}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-200/70 dark:border-white/5">
          <Button
            variant="ghost"
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40 justify-start min-h-0 active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={2.2} />
            <Text as="span">Sign out</Text>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2 px-3 mt-1 text-xs text-slate-400 justify-start min-h-0 active:scale-[0.98]"
            aria-label="Open command palette"
          >
            <Command size={14} strokeWidth={2.2} />
            <Text as="span" className="text-xs">K for commands</Text>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Glass sticky top bar */}
        <header className="sticky top-0 z-30 glass pt-safe flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center min-w-0">
            <Heading level={4} className="hidden lg:block truncate">{pageTitle}</Heading>
            <GradientText className="lg:hidden text-lg">Personal Finance Tracker</GradientText>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 border border-slate-200/70 dark:border-white/10 rounded-xl hover:border-brand-300 dark:hover:border-brand-500/50 min-h-0 active:scale-95"
              aria-label="Open command palette"
            >
              <Command size={14} strokeWidth={2.2} />
              <Text as="span" className="text-xs">K</Text>
            </Button>
            <NotificationBell />
            <ThemeToggle />
            <Avatar src={user?.avatar} name={user?.name ?? '?'} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-safe-nav lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t pb-safe flex items-stretch z-40"
        aria-label="Main navigation"
      >
        {PRIMARY_NAV.slice(0, 2).map((item) => renderBottomItem(item, pathname))}

        {/* Center FAB — opens the Transactions add modal via ?new=1 */}
        <div className="relative flex-1 flex justify-center">
          <Link
            href="/transactions?new=1"
            aria-label="Add transaction"
            className="absolute -top-5 w-14 h-14 rounded-full bg-aurora shadow-glow grid place-items-center text-white no-underline hover:no-underline active:scale-95 transition-transform"
          >
            <Plus size={26} strokeWidth={2.4} className="text-white" />
          </Link>
        </div>

        {PRIMARY_NAV.slice(2, 4).map((item) => renderBottomItem(item, pathname))}

        <Button
          variant="ghost"
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 min-h-[56px] rounded-none px-0 active:scale-95"
          aria-label="More options"
        >
          <MoreHorizontal size={22} strokeWidth={2.2} />
          <Text as="span" className="text-[11px]">More</Text>
        </Button>
      </nav>

      {/* Mobile more sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="absolute bottom-0 left-0 right-0 glass rounded-t-4xl p-4 pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300/70 dark:bg-white/10" />
            <div className="grid grid-cols-3 gap-3">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl text-sm font-medium no-underline hover:no-underline active:scale-95 transition-all',
                      active
                        ? 'bg-aurora-soft text-brand-700 dark:text-brand-200'
                        : 'bg-slate-50/80 dark:bg-ink-800/60 text-slate-700 dark:text-slate-300',
                    )}
                  >
                    <Icon size={22} strokeWidth={2.2} className={active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'} />
                    <Text as="span">{item.label}</Text>
                  </Link>
                );
              })}
            </div>
            <Button
              variant="ghost"
              onClick={() => { setMoreOpen(false); void logout(); }}
              className="mt-4 w-full py-3 text-sm text-danger-500 font-medium rounded-2xl border border-danger-200 dark:border-danger-800/60 active:scale-[0.98]"
              leftIcon={<LogOut size={16} strokeWidth={2.2} />}
            >
              Sign out
            </Button>
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={PALETTE_ITEMS}
      />
    </div>
  );
}

function renderBottomItem(item: NavItem, pathname: string) {
  const active = isActive(pathname, item.to);
  const Icon = item.icon;
  return (
    <Link
      key={item.to}
      href={item.to}
      className={cn(
        'relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium transition-colors min-h-[56px] no-underline hover:no-underline active:scale-95',
        active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400',
      )}
    >
      {active && (
        <motion.span
          layoutId="bottomnav-active"
          className="absolute top-0 h-0.5 w-8 rounded-full bg-aurora"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      <Icon size={22} strokeWidth={2.2} />
      <Text as="span" className="text-[11px]">{item.label}</Text>
    </Link>
  );
}
