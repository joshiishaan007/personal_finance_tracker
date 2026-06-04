'use client';

import { useRouter } from 'next/navigation';
import {
  Palette, Sun, Moon, Monitor, Globe2, Sparkles, LayoutDashboard,
  CalendarRange, HardDriveDownload, RotateCcw, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUpdatePreferences } from '@/hooks/useUser';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn } from '@/lib/utils';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
];

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore',
  'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
].map((t) => ({ value: t, label: t }));

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const WEEK_START_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];

interface SectionHeaderProps {
  icon: LucideIcon;
  tone?: 'brand' | 'accent' | 'aqua';
  title: string;
}

function SectionHeader({ icon, tone = 'brand', title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <IconBadge icon={icon} tone={tone} />
      <Heading level={3}>{title}</Heading>
    </div>
  );
}

export function SettingsView() {
  const { user, refetchUser } = useAuth();
  // Drive the active state from the stored `theme` setting (stable across SSR/first paint),
  // NOT `resolvedTheme` — avoids a hydration mismatch on theme-resolved UI.
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const updatePref = useUpdatePreferences(refetchUser);

  if (!user) return null;

  const weekStart = user.preferences.weekStartsOn;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <Heading level={1}>Settings</Heading>

      {/* Appearance — theme segmented control */}
      <Card variant="glass">
        <SectionHeader icon={Palette} title="Appearance" />
        <Label className="mb-2">Theme</Label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-ink-800">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <Button
                key={opt.value}
                variant="ghost"
                onClick={() => setTheme(opt.value)}
                aria-pressed={active}
                className={cn(
                  'flex-col gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all min-h-0',
                  active
                    ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow-card'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-ink-700/50',
                )}
              >
                <Icon size={18} strokeWidth={2.2} />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Regional */}
      <Card variant="glass">
        <SectionHeader icon={Globe2} tone="aqua" title="Regional" />
        <div className="space-y-4">
          <Select
            label="Timezone"
            value={user.timezone}
            onChange={(e) => updatePref.mutate({ timezone: e.target.value })}
            options={TIMEZONE_OPTIONS}
          />
          <Select
            label="Currency"
            value={user.currency}
            onChange={(e) => updatePref.mutate({ currency: e.target.value as 'INR' | 'USD' })}
            options={CURRENCY_OPTIONS}
          />
        </div>
      </Card>

      {/* Display preferences */}
      <Card variant="glass">
        <SectionHeader icon={LayoutDashboard} tone="accent" title="Display" />
        <div className="space-y-5">
          <Label className="flex items-center justify-between cursor-pointer gap-3">
            <div>
              <Text className="font-medium">Compact mode</Text>
              <Text variant="small">Reduce padding and spacing</Text>
            </div>
            <Button
              role="switch"
              aria-checked={user.preferences.compactMode}
              onClick={() => updatePref.mutate({ compactMode: !user.preferences.compactMode })}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors p-0 min-h-0 shrink-0',
                user.preferences.compactMode ? 'bg-aurora' : 'bg-slate-300 dark:bg-ink-700',
              )}
            >
              <Text as="span" className={cn(
                'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                user.preferences.compactMode ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
              )} />
            </Button>
          </Label>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarRange size={15} strokeWidth={2.2} className="text-slate-500 dark:text-slate-400" />
              <Label>Week starts on</Label>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-ink-800">
              {WEEK_START_OPTIONS.map((opt) => {
                const active = weekStart === opt.value;
                return (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    onClick={() => updatePref.mutate({ weekStartsOn: opt.value })}
                    aria-pressed={active}
                    className={cn(
                      'rounded-xl text-sm font-semibold min-h-0 py-2.5 transition-all',
                      active
                        ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow-card'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-ink-700/50',
                    )}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Onboarding */}
      <Card variant="glass">
        <SectionHeader icon={RotateCcw} title="Onboarding" />
        <Text variant="muted" className="mb-4">Re-run the setup wizard to update currency and timezone</Text>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/onboarding')}
          leftIcon={<RotateCcw size={15} strokeWidth={2.2} />}
        >
          Re-run Onboarding
        </Button>
      </Card>

      {/* Backup reminder */}
      <Card variant="gradient">
        <div className="flex items-center gap-3">
          <IconBadge icon={HardDriveDownload} gradient />
          <div>
            <div className="flex items-center gap-1.5">
              <Text className="font-medium">Monthly backup reminder</Text>
              <Sparkles size={14} strokeWidth={2.2} className="text-brand-500" />
            </div>
            <Text variant="muted">Keep a local JSON backup of your data. Go to Profile → Export JSON.</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
