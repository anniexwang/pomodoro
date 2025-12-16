/**
 * Theme Utilities - Pure functions for theme management without React dependencies
 */

import { DEFAULT_THEME, THEME_CONFIGS, ThemeConfig, TimerTheme } from '@/types/timer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@pomodoro_timer_theme';

/**
 * Theme persistence utilities
 */
export const saveTheme = async (theme: TimerTheme): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
  }
};

export const loadTheme = async (): Promise<TimerTheme> => {
  try {
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && Object.values(TimerTheme).includes(savedTheme as TimerTheme)) {
      return savedTheme as TimerTheme;
    }
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
  }
  return DEFAULT_THEME;
};

/**
 * Helper function to get theme config for predefined themes
 */
export const getThemeConfig = (theme: TimerTheme): ThemeConfig => {
  return THEME_CONFIGS[theme];
};

/**
 * Enhanced theme validation function
 */
export const validateThemeConfig = (config: ThemeConfig): boolean => {
  try {
    // Check required properties
    if (!config.name || !config.studyColors || !config.breakColors) {
      return false;
    }
    
    // Check color properties
    const requiredColorProps = ['primary', 'secondary', 'accent'];
    for (const prop of requiredColorProps) {
      if (!config.studyColors[prop as keyof typeof config.studyColors] || 
          !config.breakColors[prop as keyof typeof config.breakColors]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.warn('Theme validation error:', error);
    return false;
  }
};

/**
 * Theme application with validation
 */
export const applyThemeWithValidation = async (
  theme: TimerTheme,
  onThemeSelect: (theme: TimerTheme) => void
): Promise<boolean> => {
  try {
    // Get theme configuration
    const config = getThemeConfig(theme);
    
    // Validate theme structure
    if (!validateThemeConfig(config)) {
      console.warn(`Invalid theme configuration for: ${theme}`);
      return false;
    }
    
    // Apply theme
    onThemeSelect(theme);
    return true;
  } catch (error) {
    console.error('Failed to apply theme with validation:', error);
    return false;
  }
};

/**
 * Validates accessibility compliance for themes
 */
export const validateAccessibility = (theme: ThemeConfig): void => {
  try {
    // Validate study colors
    const studyContrast = calculateContrastRatio(
      theme.studyColors.primary,
      theme.studyColors.secondary
    );
    
    // Validate break colors
    const breakContrast = calculateContrastRatio(
      theme.breakColors.primary,
      theme.breakColors.secondary
    );
    
    // Check minimum contrast ratio (WCAG AA standard: 4.5:1)
    const minContrastRatio = 4.5;
    
    if (studyContrast < minContrastRatio) {
      console.warn(`Study colors contrast ratio (${studyContrast.toFixed(2)}) below WCAG AA standard (${minContrastRatio})`);
    }
    
    if (breakContrast < minContrastRatio) {
      console.warn(`Break colors contrast ratio (${breakContrast.toFixed(2)}) below WCAG AA standard (${minContrastRatio})`);
    }
    
    // Log accessibility validation results
    console.log(`Theme "${theme.name}" accessibility validation:`, {
      studyContrast: studyContrast.toFixed(2),
      breakContrast: breakContrast.toFixed(2),
      meetsWCAG: studyContrast >= minContrastRatio && breakContrast >= minContrastRatio,
    });
    
  } catch (error) {
    console.warn('Failed to validate theme accessibility:', error);
  }
};

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const luminance1 = getRelativeLuminance(color1);
  const luminance2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 guidelines
 */
export const getRelativeLuminance = (hexColor: string): number => {
  // Remove # and convert to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};