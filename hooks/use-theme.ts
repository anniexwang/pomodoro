import { useCallback, useEffect, useState } from 'react';

import { getThemeConfig, loadTheme, saveTheme, validateThemeConfig } from '@/services/theme-utils';
import { DEFAULT_THEME, THEME_CONFIGS, ThemeConfig, TimerTheme } from '@/types/timer';

interface UseThemeReturn {
  currentTheme: TimerTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: TimerTheme) => Promise<void>;
  isLoading: boolean;
}

export const useTheme = (): UseThemeReturn => {
  const [currentTheme, setCurrentTheme] = useState<TimerTheme>(DEFAULT_THEME);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(THEME_CONFIGS[DEFAULT_THEME]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await loadTheme();
        setCurrentTheme(savedTheme);
        setThemeConfig(getThemeConfig(savedTheme));
      } catch (error) {
        console.warn('Failed to load theme:', error);
        setCurrentTheme(DEFAULT_THEME);
        setThemeConfig(THEME_CONFIGS[DEFAULT_THEME]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  // Set theme and persist to storage with validation
  const setTheme = useCallback(async (theme: TimerTheme) => {
    try {
      // Load and validate theme configuration
      const config = getThemeConfig(theme);
      if (!validateThemeConfig(config)) {
        console.warn('Invalid theme configuration, falling back to default');
        theme = DEFAULT_THEME;
      }

      // Save theme preference
      await saveTheme(theme);
      
      // Apply theme immediately
      setCurrentTheme(theme);
      setThemeConfig(getThemeConfig(theme));
    } catch (error) {
      console.warn('Failed to apply theme:', error);
      // Still update the current theme even if saving fails
      setCurrentTheme(theme);
      setThemeConfig(getThemeConfig(theme));
    }
  }, []);



  return {
    currentTheme,
    themeConfig,
    setTheme,
    isLoading,
  };
};

