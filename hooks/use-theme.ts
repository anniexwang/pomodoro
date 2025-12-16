import { useCallback, useEffect, useState } from 'react';

import { getGeneratedThemeStorage } from '@/services/generated-theme-storage';
import { GeneratedTheme } from '@/services/theme-processor';
import { getThemeConfig, loadTheme, saveTheme, validateAccessibility, validateThemeConfig } from '@/services/theme-utils';
import { DEFAULT_THEME, THEME_CONFIGS, ThemeConfig, TimerTheme } from '@/types/timer';

interface UseThemeReturn {
  currentTheme: TimerTheme | string;
  themeConfig: ThemeConfig;
  setTheme: (theme: TimerTheme | string) => Promise<void>;
  isLoading: boolean;
  refreshThemes: () => Promise<void>;
  getGeneratedThemes: () => Promise<GeneratedTheme[]>;
  deleteGeneratedTheme: (themeId: string) => Promise<void>;
}

export const useTheme = (): UseThemeReturn => {
  const [currentTheme, setCurrentTheme] = useState<TimerTheme | string>(DEFAULT_THEME);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(THEME_CONFIGS[DEFAULT_THEME]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await loadTheme();
        setCurrentTheme(savedTheme);
        
        // Load theme configuration
        const config = await getThemeConfig(savedTheme);
        if (config) {
          setThemeConfig(config);
        } else {
          // Fallback to default theme if config not found
          setCurrentTheme(DEFAULT_THEME);
          setThemeConfig(THEME_CONFIGS[DEFAULT_THEME]);
        }
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

  // Set theme and persist to storage with enhanced validation
  const setTheme = useCallback(async (theme: TimerTheme | string) => {
    try {
      // Load and validate theme configuration first
      const config = await getThemeConfig(theme);
      if (!config) {
        console.warn('Theme config not found, falling back to default');
        theme = DEFAULT_THEME;
      } else if (!validateThemeConfig(config)) {
        console.warn('Invalid theme configuration, falling back to default');
        theme = DEFAULT_THEME;
      }

      // Validate accessibility for generated themes
      if (typeof theme === 'string' && theme.startsWith('ai-theme-') && config) {
        validateAccessibility(config as GeneratedTheme);
      }

      // Save theme preference
      await saveTheme(theme);
      
      // Apply theme immediately
      setCurrentTheme(theme);
      
      // Load final configuration
      const finalConfig = await getThemeConfig(theme);
      if (finalConfig) {
        setThemeConfig(finalConfig);
      } else {
        // Final fallback
        setCurrentTheme(DEFAULT_THEME);
        setThemeConfig(THEME_CONFIGS[DEFAULT_THEME]);
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error);
      // Still update the current theme even if saving fails
      setCurrentTheme(theme);
      
      // Try to load config anyway
      try {
        const config = await getThemeConfig(theme);
        if (config) {
          setThemeConfig(config);
        }
      } catch (configError) {
        console.warn('Failed to load theme config:', configError);
      }
    }
  }, []);

  // Get generated themes
  const getGeneratedThemes = useCallback(async (): Promise<GeneratedTheme[]> => {
    try {
      const storage = getGeneratedThemeStorage();
      return await storage.loadThemes();
    } catch (error) {
      console.warn('Failed to load generated themes:', error);
      return [];
    }
  }, []);

  // Delete a generated theme
  const deleteGeneratedTheme = useCallback(async (themeId: string): Promise<void> => {
    try {
      const storage = getGeneratedThemeStorage();
      await storage.deleteTheme(themeId);
      
      // If the deleted theme is currently active, switch to default
      if (currentTheme === themeId) {
        await setTheme(DEFAULT_THEME);
      }
    } catch (error) {
      console.error('Failed to delete generated theme:', error);
      throw error;
    }
  }, [currentTheme, setTheme]);

  // Refresh themes (useful after generating new themes)
  const refreshThemes = useCallback(async (): Promise<void> => {
    try {
      // Reload current theme config in case it was updated
      const config = await getThemeConfig(currentTheme);
      if (config && validateThemeConfig(config)) {
        setThemeConfig(config);
      }
    } catch (error) {
      console.warn('Failed to refresh themes:', error);
    }
  }, [currentTheme]);

  return {
    currentTheme,
    themeConfig,
    setTheme,
    isLoading,
    refreshThemes,
    getGeneratedThemes,
    deleteGeneratedTheme,
  };
};

