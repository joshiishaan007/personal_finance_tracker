import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { useNavigate } from 'react-router-dom';

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore',
  'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
].map((t) => ({ value: t, label: t }));

export function Settings() {
  const { user, refetchUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const updatePref = useMutation({
    mutationFn: (prefs: Record<string, unknown>) => api.patch('/api/user/preferences', prefs),
    onSuccess: () => { void refetchUser(); void qc.invalidateQueries({ queryKey: ['user'] }); },
  });

  if (!user) return null;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <h3 className="font-semibold mb-4">Appearance</h3>
        <Select
          label="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          options={[
            { value: 'system', label: 'System default' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Regional</h3>
        <div className="space-y-4">
          <Select
            label="Timezone"
            value={user.timezone}
            onChange={(e) => updatePref.mutate({ timezone: e.target.value })}
            options={TIMEZONE_OPTIONS}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
            <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
              {user.currency} — <span className="text-slate-400">Locked after first transaction. Contact support to change.</span>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Display</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Compact mode</p>
            <p className="text-xs text-slate-400">Reduce padding and spacing</p>
          </div>
          <button
            role="switch"
            aria-checked={user.preferences.compactMode}
            onClick={() => updatePref.mutate({ compactMode: !user.preferences.compactMode })}
            className={`relative w-10 h-6 rounded-full transition-colors ${user.preferences.compactMode ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${user.preferences.compactMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">Onboarding</h3>
        <p className="text-sm text-slate-500 mb-4">Re-run the setup wizard to update currency and timezone</p>
        <button
          onClick={() => void navigate('/onboarding')}
          className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"
        >
          → Re-run Onboarding
        </button>
      </Card>

      <Card className="border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💾</span>
          <div>
            <p className="font-medium">Monthly backup reminder</p>
            <p className="text-sm text-slate-500">Keep a local JSON backup of your data. Go to Profile → Export JSON.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
