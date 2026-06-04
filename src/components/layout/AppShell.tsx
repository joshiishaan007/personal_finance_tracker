'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartColumnBig,
  Target,
  ListChecks,
  Wallet,
  Landmark,
  TrendingUp,
  PieChart,
  LineChart,
  Scale,
  Repeat,
  FileText,
  Tag,
  User,
  Settings,
  Plus,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMode } from '@/contexts/ModeContext';
import { NotificationBell } from '@/components/NotificationBell';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ModeSwitcher } from '@/components/layout/ModeSwitcher';
import { Link } from '@/components/ui/Link';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Heading } from '@/components/ui/Heading';
import { GradientText } from '@/components/ui/GradientText';
import { cn } from '@/lib/utils';
import type { AppMode } from '@/lib/mode';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Per-mode navigation. Finance keeps the money features (savings goals at
// /savings); Goals is the life-goals + tasks app under /goals.
const FINANCE_PRIMARY: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Analytics', icon: ChartColumnBig },
  { to: '/savings', label: 'Savings Goals', icon: Target },
];
const FINANCE_MORE: NavItem[] = [
  { to: '/spending-plan', label: 'Spending Plan', icon: PieChart },
  { to: '/investments', label: 'Investments', icon: LineChart },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/net-worth', label: 'Net Worth', icon: Landmark },
  { to: '/pl', label: 'P&L', icon: TrendingUp },
  { to: '/gross-pl', label: 'Gross P&L', icon: Scale },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const GOALS_PRIMARY: NavItem[] = [
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/goals/tasks', label: 'Tasks', icon: ListChecks },
];
const GOALS_MORE: NavItem[] = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const NAV: Record<AppMode, { primary: NavItem[]; more: NavItem[]; fab: { href: string; label: string } }> = {
  finance: { primary: FINANCE_PRIMARY, more: FINANCE_MORE, fab: { href: '/transactions?new=1', label: 'Add transaction' } },
  goals: { primary: GOALS_PRIMARY, more: GOALS_MORE, fab: { href: '/goals?new=1', label: 'Add goal' } },
};

function isMatch(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

// The active item is the one with the LONGEST matching path, so /goals/tasks
// highlights Tasks (not Goals Home) while /goals/<id> highlights Goals Home.
function bestActiveTo(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter((i) => isMatch(pathname, i.to))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;
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
  const { mode } = useMode();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const { primary, more, fab } = NAV[mode];
  const allNav = [...primary, ...more];
  const activeTo = bestActiveTo(pathname, allNav);
  const pageTitle = allNav.find((i) => i.to === activeTo)?.label ?? 'Personal Finance Tracker';

  // Mobile bottom bar: 5 equal columns with the FAB dead-center — 2 left, FAB,
  // then (right nav + More) padded with spacers so the FAB stays centered.
  const bottomLeft = primary.slice(0, 2);
  const bottomRightNav = primary.slice(2, 3);
  const sheetItems = [...primary.slice(3), ...more];
  const rightSpacers = Math.max(0, 2 - (bottomRightNav.length + 1));

  function renderSidebarItem(item: NavItem) {
    const active = item.to === activeTo;
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
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-aurora" />
        )}
        <Icon size={18} strokeWidth={2.2} className={cn('shrink-0 transition-colors', active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400')} />
        <Text as="span" className={cn(active ? 'text-brand-700 dark:text-brand-200' : '')}>{item.label}</Text>
      </Link>
    );
  }

  function renderBottomItem(item: NavItem) {
    const active = item.to === activeTo;
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        href={item.to}
        aria-label={item.label}
        className={cn(
          'relative flex h-full items-center justify-center no-underline hover:no-underline active:scale-95 transition-colors',
          active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {active && (
          <div className="absolute top-0 h-0.5 w-8 rounded-full bg-aurora" />
        )}
        <Icon size={24} strokeWidth={2.2} />
      </Link>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r p-4 gap-1.5 overflow-y-auto scrollbar-thin">
        <Link href={fab.href.startsWith('/goals') ? '/goals' : '/dashboard'} className="flex items-center gap-2 px-2 py-3 no-underline hover:no-underline">
          <GradientText className="text-lg leading-tight">Personal Finance Tracker</GradientText>
        </Link>

        <ModeSwitcher className="mb-2" />

        <nav className="flex flex-col gap-1.5" aria-label="Primary">
          {primary.map(renderSidebarItem)}
        </nav>

        <div className="my-2 h-px bg-slate-200/70 dark:bg-white/5" />
        <Text as="span" className="px-3 text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">More</Text>

        <nav className="flex flex-col gap-1.5" aria-label="Secondary">
          {more.map(renderSidebarItem)}
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
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <OfflineBanner />
        {/* Glass sticky top bar */}
        <header className="sticky top-0 z-30 glass pt-safe flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center min-w-0">
            <Heading level={4} className="hidden lg:block truncate">{pageTitle}</Heading>
            <GradientText className="lg:hidden text-lg">{mode === 'goals' ? 'Goals' : 'Finance'}</GradientText>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <ThemeToggle />
            <Avatar src={user?.avatar} name={user?.name ?? '?'} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-safe-nav lg:pb-0 scrollbar-thin">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — five equal columns with the FAB dead-center */}
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 glass border-t pb-safe"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-5 h-16">
          {bottomLeft.map(renderBottomItem)}

          {/* Center FAB cell — explicitly centered (not via abspos static position) */}
          <div className="relative">
            <Link
              href={fab.href}
              aria-label={fab.label}
              className="absolute left-1/2 -top-5 -translate-x-1/2 w-14 h-14 rounded-full bg-aurora shadow-glow grid place-items-center text-white no-underline hover:no-underline active:scale-95 transition-transform"
            >
              <Plus size={26} strokeWidth={2.4} className="text-white" />
            </Link>
          </div>

          {bottomRightNav.map(renderBottomItem)}

          {/* Plain button with the same cell box-model as the nav links */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More options"
            className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400 active:scale-95 transition-colors"
          >
            <MoreHorizontal size={24} strokeWidth={2.2} />
          </button>

          {Array.from({ length: rightSpacers }).map((_, i) => (
            <div key={`spacer-${i}`} aria-hidden />
          ))}
        </div>
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
            <ModeSwitcher className="mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {sheetItems.map((item) => {
                const Icon = item.icon;
                const active = item.to === activeTo;
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
                    <Text as="span" className="text-center leading-tight">{item.label}</Text>
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
    </div>
  );
}
