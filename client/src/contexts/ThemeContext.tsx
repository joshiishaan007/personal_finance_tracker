import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('finbuddy-theme') as Theme | null) ?? 'system',
  );
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? getSystemTheme() : theme as 'light' | 'dark',
  );

  function applyTheme(t: Theme) {
    const resolved = t === 'system' ? getSystemTheme() : t;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('finbuddy-theme', t);
    applyTheme(t);
  }

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
