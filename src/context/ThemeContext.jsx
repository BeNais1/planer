import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('planer-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.add('theme-transition');
    localStorage.setItem('planer-theme', theme);

    // Sync Electron titlebar overlay with current theme
    try {
      window.electronAPI.updateTheme(theme);
    } catch {
      // Not in Electron environment
    }

    const timer = setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 400);
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
