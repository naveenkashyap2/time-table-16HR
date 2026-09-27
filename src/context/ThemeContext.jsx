import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings, useStudyActions } from './StudyContext.jsx';

/**
 * ThemeContext — PRD §11.3
 * Sets `document.documentElement.dataset.theme`. `system` follows
 * prefers-color-scheme through a matchMedia listener. The choice lives in
 * sl_settings; index.html reads it before first paint (no theme flash).
 */

const ThemeContext = createContext(null);

const QUERY = '(prefers-color-scheme: dark)';

function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const settings = useSettings();
  const { updateSettings } = useStudyActions();
  const preference = settings.theme || 'system';

  const [systemValue, setSystemValue] = useState(systemTheme);

  // Follow the OS only while the preference is "system".
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setSystemValue(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = preference === 'system' ? systemValue : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#150E1F' : '#7C3AED');
  }, [resolved]);

  const setTheme = useCallback(
    (next) => updateSettings({ theme: next }),
    [updateSettings],
  );

  const toggleTheme = useCallback(
    () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
    [resolved, setTheme],
  );

  const value = useMemo(
    () => ({ preference, resolved, isDark: resolved === 'dark', setTheme, toggleTheme }),
    [preference, resolved, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
