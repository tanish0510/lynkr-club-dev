import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'lynkr_color_mode';

function getInitialMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

function applyMode(mode, animate) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;

  if (animate) {
    html.classList.add('theme-transitioning');
  }

  html.setAttribute('data-theme', mode);
  if (mode === 'light') {
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
  }
  try { localStorage.setItem(STORAGE_KEY, mode); } catch {}

  if (animate) {
    setTimeout(() => html.classList.remove('theme-transitioning'), 1000);
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);
  const isFirstRender = useRef(true);

  useEffect(() => {
    applyMode(mode, !isFirstRender.current);
    isFirstRender.current = false;
  }, [mode]);

  const setTheme = useCallback((m) => { setMode(m); }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
