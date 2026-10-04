import React, { createContext, useContext, useEffect, useState } from 'react';

// The inline script in index.html sets data-theme before first paint; this
// provider keeps React in sync with it and persists explicit user choices.
const STORAGE_KEY = 'atlas-theme';
const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

const systemTheme = () => matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
const storedTheme = () => { try { const t = localStorage.getItem(STORAGE_KEY); return t === 'light' || t === 'dark' ? t : null; } catch { return null; } };

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || storedTheme() || systemTheme());
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', theme === 'light' ? '#f6f7f9' : '#0a0e17'));
  }, [theme]);
  // Follow the operating system until the user picks a theme explicitly.
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const onChange = () => { if (!storedTheme()) setTheme(systemTheme()); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const toggle = () => setTheme(t => { const next = t === 'light' ? 'dark' : 'light'; try { localStorage.setItem(STORAGE_KEY, next); } catch {} return next; });
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
    {theme === 'light'
      ? <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
      : <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
  </button>;
}

// Shader-friendly palettes for the WebGL scenes. Light mode swaps additive
// glow (invisible on white) for normal blending with deep ink-blue points.
export const scenePalette = theme => theme === 'light'
  ? { light: true, a: [0.11, 0.2, 0.62], b: [0.24, 0.36, 0.86], line: 0x3150c8, lineOpacity: 1.6, alpha: 0.95 }
  : { light: false, a: [0.89, 0.97, 1.0], b: [0.72, 0.89, 1.0], line: 0xc9eaff, lineOpacity: 1, alpha: 1 };
