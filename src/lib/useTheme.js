import { useEffect, useState } from 'react';

function initialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
  } catch {
    /* stockage indisponible */
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Thème clair / sombre, mémorisé dans le navigateur */
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}
