// The app runs in one of two modes. The ACTIVE mode is derived from the URL
// (single source of truth — never desyncs); the preferred mode is persisted for
// where to land on `/` and on switch.
export type AppMode = 'finance' | 'goals';

export const MODE_HOME: Record<AppMode, string> = {
  finance: '/dashboard',
  goals: '/goals',
};

export const MODE_STORAGE_KEY = 'personal-finance-tracker-mode';

export function modeForPath(pathname: string): AppMode {
  return pathname === '/goals' || pathname.startsWith('/goals/') ? 'goals' : 'finance';
}
