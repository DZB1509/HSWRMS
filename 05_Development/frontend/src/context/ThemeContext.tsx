import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'blush';

export const THEMES: { id: Theme; labelKey: string; defaultLabel: string; icon: string }[] = [
  { id: 'light', labelKey: 'theme.light', defaultLabel: 'Light', icon: '☀' },
  { id: 'dark', labelKey: 'theme.dark', defaultLabel: 'Dark', icon: '☾' },
  { id: 'blush', labelKey: 'theme.blush', defaultLabel: 'Blush', icon: '✿' },
];

export const THEME_STORAGE_KEY = 'hswrms-theme';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'blush' || stored === 'light') {
      return stored;
    }
  } catch (e) {
    // localStorage may be unavailable in some private sandboxes
  }
  return 'light';
};

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'blush') {
        newTheme = 'light';
      }
      setThemeState(newTheme);
      applyTheme(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {
        // Safe fallback
      }
    },
    [applyTheme]
  );

  useEffect(() => {
    // Ensure document attribute is synced on mount
    applyTheme(theme);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
