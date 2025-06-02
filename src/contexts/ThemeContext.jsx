import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Check if dark mode preference is stored in localStorage
  const storedTheme = localStorage.getItem('theme');
  
  // Initialize state based on stored preference or system preference
  const [darkMode, setDarkMode] = useState(() => {
    if (storedTheme) {
      return storedTheme === 'dark';
    } else {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  });

  // Update DOM when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Set specific theme
  const setTheme = (theme) => {
    setDarkMode(theme === 'dark');
  };

  const value = {
    darkMode,
    toggleDarkMode,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
} 