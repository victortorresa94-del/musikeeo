import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

// Claro por defecto; el oscuro solo si la persona lo elige. Clave v3: la v2 guardaba
// «dark» a todo el mundo aunque nadie lo hubiera elegido.
export const THEME_KEY = 'musikeeo-theme-v3';

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A0A0A' : '#FFFFFF');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  const choose = (t: Theme) => {
    setTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* sin almacenamiento */ }
  };
  const toggle = () => choose(theme === 'light' ? 'dark' : 'light');

  return { theme, toggle, setLight: () => choose('light'), setDark: () => choose('dark'), isDark: theme === 'dark' };
}
