/**
 * ThemeProvider
 * Context provider para manejar el tema de la aplicación (claro/oscuro/sistema)
 */

import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme, type ResolvedTheme } from '../context/ThemeContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative } from '@/shared/utils/platform';

const STORAGE_KEY = 'app_theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored as Theme;
  }
  return 'system';
}

function getInitialResolvedTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    getInitialResolvedTheme(getInitialTheme())
  );

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the resolved theme class
    root.classList.add(resolvedTheme);

    // Update meta theme-color for mobile browsers (web PWA)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#030712' : '#0d9488'
      );
    }

    // Update native status bar (iOS/Android)
    if (isNative()) {
      StatusBar.setStyle({
        style: resolvedTheme === 'dark' ? Style.Dark : Style.Light
      }).catch(() => {});

      StatusBar.setBackgroundColor({
        color: resolvedTheme === 'dark' ? '#030712' : '#0d9488'
      }).catch(() => {});
    }

    console.log('[Theme] Applied theme:', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    console.log('[Theme] Theme changed to:', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
