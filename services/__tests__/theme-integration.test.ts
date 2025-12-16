/**
 * Theme Integration Tests - Verifies generated themes work with existing theme system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_CONFIGS, TimerTheme } from '../../types/timer';
import { getGeneratedThemeStorage } from '../generated-theme-storage';
import { ThemeProcessor } from '../theme-processor';
import { applyThemeWithValidation, getThemeConfig, validateThemeConfig } from '../theme-utils';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Theme Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getThemeConfig', () => {
    it('should return predefined theme config', async () => {
      const config = await getThemeConfig(TimerTheme.DEFAULT);
      expect(config).toEqual(THEME_CONFIGS[TimerTheme.DEFAULT]);
    });

    it('should return generated theme config', async () => {
      // Create a mock generated theme
      const mockGeneratedTheme = ThemeProcessor.processAIResponse({
        studyColors: {
          primary: '#4A90E2',
          secondary: '#E8F4FD',
          accent: '#2E5BBA',
          description: 'Blue theme',
        },
        breakColors: {
          primary: '#7ED321',
          secondary: '#F0F9E8',
          accent: '#5BA818',
          description: 'Green theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#f0f8ff', '#e6f3ff'],
        },
        themeName: 'Ocean',
        confidence: 0.9,
      }, 'ocean');

      // Mock storage to return the theme
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@pomodoro_generated_themes') {
          return Promise.resolve(JSON.stringify({
            version: 1,
            generatedThemes: {
              [mockGeneratedTheme.id]: mockGeneratedTheme,
            },
            metadata: {
              totalGenerated: 1,
              lastCleanup: Date.now(),
            },
          }));
        }
        if (key === '@pomodoro_themes_version') {
          return Promise.resolve('1');
        }
        return Promise.resolve(null);
      });

      const config = await getThemeConfig(mockGeneratedTheme.id);
      expect(config).toEqual(mockGeneratedTheme);
    });

    it('should return null for unknown theme', async () => {
      const config = await getThemeConfig('unknown-theme');
      expect(config).toBeNull();
    });
  });

  describe('validateThemeConfig', () => {
    beforeEach(() => {
      // Clear session before each test to avoid diversity conflicts
      const { colorDiversityValidator } = require('../color-diversity-validator');
      colorDiversityValidator.clearSession();
    });

    it('should validate predefined theme config', () => {
      const isValid = validateThemeConfig(THEME_CONFIGS[TimerTheme.DEFAULT]);
      expect(isValid).toBe(true);
    });

    it('should validate generated theme config', () => {
      const generatedTheme = ThemeProcessor.processAIResponse({
        studyColors: {
          primary: '#4A90E2',
          secondary: '#E8F4FD',
          accent: '#2E5BBA',
          description: 'Blue theme',
        },
        breakColors: {
          primary: '#7ED321',
          secondary: '#F0F9E8',
          accent: '#5BA818',
          description: 'Green theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#f0f8ff', '#e6f3ff'],
        },
        themeName: 'Ocean',
        confidence: 0.9,
      }, 'ocean');

      const isValid = validateThemeConfig(generatedTheme);
      expect(isValid).toBe(true);
    });

    it('should reject invalid theme config', () => {
      const invalidConfig = {
        name: 'Invalid',
        studyColors: {
          primary: '#4A90E2',
          // Missing secondary and accent
        },
        breakColors: {
          primary: '#7ED321',
          // Missing secondary and accent
        },
      } as any;

      const isValid = validateThemeConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('applyThemeWithValidation', () => {
    it('should apply valid predefined theme', async () => {
      const mockOnThemeSelect = jest.fn();
      const result = await applyThemeWithValidation(TimerTheme.DEFAULT, mockOnThemeSelect);
      
      expect(result).toBe(true);
      expect(mockOnThemeSelect).toHaveBeenCalledWith(TimerTheme.DEFAULT);
    });

    it('should reject invalid theme', async () => {
      const mockOnThemeSelect = jest.fn();
      const result = await applyThemeWithValidation('invalid-theme', mockOnThemeSelect);
      
      expect(result).toBe(false);
      expect(mockOnThemeSelect).not.toHaveBeenCalled();
    });
  });

  describe('Generated Theme Storage Integration', () => {
    it('should save and load generated themes', async () => {
      const storage = getGeneratedThemeStorage();
      
      // Create a test theme
      const testTheme = ThemeProcessor.processAIResponse({
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#E55555',
          description: 'Red theme',
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#45B7B8',
          description: 'Teal theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#ffe5e5', '#e5f9f7'],
        },
        themeName: 'Sunset',
        confidence: 0.8,
      }, 'sunset');

      // Mock storage operations
      let storedData: any = {
        version: 1,
        generatedThemes: {},
        metadata: { totalGenerated: 0, lastCleanup: Date.now() },
      };

      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        if (key === '@pomodoro_generated_themes') {
          storedData = JSON.parse(value);
        }
        return Promise.resolve();
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@pomodoro_generated_themes') {
          return Promise.resolve(JSON.stringify(storedData));
        }
        if (key === '@pomodoro_themes_version') {
          return Promise.resolve('1');
        }
        return Promise.resolve(null);
      });

      // Save theme
      await storage.saveTheme(testTheme);
      
      // Load themes
      const loadedThemes = await storage.loadThemes();
      
      expect(loadedThemes).toHaveLength(1);
      expect(loadedThemes[0]).toEqual(testTheme);
    });
  });
});