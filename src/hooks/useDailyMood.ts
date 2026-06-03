'use client';

import { useCallback, useState } from 'react';

// Client-only daily mood check-in, keyed by calendar day in localStorage.
// Intentionally not persisted server-side yet (no collection/migration) — a
// lightweight habit nudge; backend persistence is a follow-up.
function todayKey(): string {
  return `mood-${new Date().toISOString().slice(0, 10)}`;
}

export function useDailyMood() {
  const key = todayKey();
  const [mood, setMoodState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  });

  const setMood = useCallback(
    (value: string) => {
      localStorage.setItem(key, value);
      setMoodState(value);
    },
    [key],
  );

  return { mood, setMood };
}
