/**
 * Enhanced Theme Hook - Integrates generated themes with existing theme system
 */

import { useCallback, useEffect, useState } from 'react';

import { getGeneratedThemeStorage } from '@/services/generated-theme-storage';
import { GeneratedTheme } from '@/services/theme-processor';
import { getThemeConfig, loadTheme, saveTheme, validateAccessibility } from '@/services/theme-utils';
import { DEFAULT_THEME, THEME_CONFIGS, ThemeConfig, TimerTheme } from '@/types/timer';

interface ThemeCollection {
  predefined: Record<TimerTheme, ThemeConfig>;
  generated: GeneratedTheme[];
}

interface UseEnhancedThemeReturn {
  currentTheme: TimerTheme | string;
  themeConfig: ThemeConfig;
  setTheme: (theme: TimerTheme | string) => Promise<void>;
  isLoading: boolean;
  getAllThemes: () => Promise<ThemeCollection>;
  getGeneratedThemes: () => Promise<GeneratedTheme[]>;
  deleteGeneratedTheme: (themeId: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
}

export const useEnhancedTheme = (): UseEnhancedThemeReturn => {
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

  // Set theme and persist to storage with immediate application
  const setTheme = useCallback(async (theme: TimerTheme | string) => {
    try {
      // Validate theme exists before applying
      const config = await getThemeConfig(theme);
      if (!config) {
        console.warn('Theme config not found, falling back to default');
        theme = DEFAULT_THEME;
      }

      // Validate accessibility for generated themes
      if (typeof theme === 'string' && theme.startsWith('ai-theme-')) {
        const generatedTheme = config as GeneratedTheme;
        if (generatedTheme) {
          validateAccessibility(generatedTheme);
        }
      }

      // Save theme preference
      await saveTheme(theme);
      
      // Apply theme immediately
      setCurrentTheme(theme);
      
      // Load and apply theme configuration
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

  // Get all themes (predefined + generated)
  const getAllThemes = useCallback(async (): Promise<ThemeCollection> => {
    try {
      const storage = getGeneratedThemeStorage();
      const generatedThemes = await storage.loadThemes();
      
      return {
        predefined: THEME_CONFIGS,
        generated: generatedThemes,
      };
    } catch (error) {
      console.warn('Failed to load all themes:', error);
      return {
        predefined: THEME_CONFIGS,
        generated: [],
      };
    }
  }, []);

  // Get generated themes only
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
      if (config) {
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
    getAllThemes,
    getGeneratedThemes,
    deleteGeneratedTheme,
    refreshThemes,
  };
};

