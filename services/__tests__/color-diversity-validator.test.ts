/**
 * Tests for Color Diversity Validator
 */

import { AIThemeResponse } from '../ai-theme-service';
import { ColorDiversityValidator } from '../color-diversity-validator';
import { GeneratedTheme } from '../theme-processor';

describe('ColorDiversityValidator', () => {
  let validator: ColorDiversityValidator;

  beforeEach(() => {
    validator = new ColorDiversityValidator();
  });

  describe('calculateRGBDistance', () => {
    it('should calculate distance between identical colors as 0', () => {
      const distance = validator.calculateRGBDistance('#FF0000', '#FF0000');
      expect(distance).toBe(0);
    });

    it('should calculate distance between black and white as maximum', () => {
      const distance = validator.calculateRGBDistance('#000000', '#FFFFFF');
      expect(distance).toBeCloseTo(441.67, 1); // sqrt(255^2 + 255^2 + 255^2)
    });

    it('should calculate distance between similar colors as small', () => {
      const distance = validator.calculateRGBDistance('#FF0000', '#FE0000');
      expect(distance).toBeLessThan(5);
    });

    it('should calculate distance between different colors as larger', () => {
      const distance = validator.calculateRGBDistance('#FF0000', '#00FF00');
      expect(distance).toBeGreaterThan(300);
    });
  });

  describe('validateAgainstFallback', () => {
    it('should detect similarity to fallback theme', () => {
      const aiResponse: AIThemeResponse = {
        studyColors: {
          primary: '#6B73FF', // Same as fallback
          secondary: '#F0F2FF', // Same as fallback
          accent: '#4C51BF', // Same as fallback
          description: 'Fallback-like theme',
        },
        breakColors: {
          primary: '#48BB78', // Same as fallback
          secondary: '#F0FFF4', // Same as fallback
          accent: '#38A169', // Same as fallback
          description: 'Fallback-like break theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#f0f2ff', '#e6e8ff'],
        },
        themeName: 'Fallback Test',
        confidence: 0.9,
      };

      const result = validator.validateAgainstFallback(aiResponse);
      expect(result.isSimilar).toBe(true);
      expect(result.distance).toBeLessThan(50);
    });

    it('should detect uniqueness from fallback theme', () => {
      const aiResponse: AIThemeResponse = {
        studyColors: {
          primary: '#FF6B6B', // Different from fallback
          secondary: '#FFE5E5', // Different from fallback
          accent: '#CC5555', // Different from fallback
          description: 'Unique red theme',
        },
        breakColors: {
          primary: '#4ECDC4', // Different from fallback
          secondary: '#E5F9F7', // Different from fallback
          accent: '#3BA99C', // Different from fallback
          description: 'Unique teal theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#ffe5e5', '#e5f9f7'],
        },
        themeName: 'Ocean Sunset',
        confidence: 0.9,
      };

      const result = validator.validateAgainstFallback(aiResponse);
      expect(result.isSimilar).toBe(false);
      expect(result.distance).toBeGreaterThan(50);
    });
  });

  describe('validateSessionUniqueness', () => {
    it('should validate uniqueness when no previous themes exist', () => {
      const aiResponse: AIThemeResponse = {
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          description: 'First theme',
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          description: 'First break theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#ffe5e5', '#e5f9f7'],
        },
        themeName: 'First Theme',
        confidence: 0.9,
      };

      const result = validator.validateSessionUniqueness(aiResponse);
      expect(result.isUnique).toBe(true);
      expect(result.conflictingThemes).toHaveLength(0);
      expect(result.colorDistances.overall).toBeGreaterThan(50);
    });

    it('should detect similarity to previous session theme', () => {
      // Add a theme to session
      const firstTheme: GeneratedTheme = {
        id: 'test-theme-1',
        name: 'Test Theme 1',
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          gradient: ['#FFE5E5', '#FFCCCC'],
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          gradient: ['#E5F9F7', '#CCF2EF'],
        },
        backgroundElements: [],
        originalPrompt: 'test',
        createdAt: Date.now(),
        isCustom: true,
      };

      validator.addThemeToSession(firstTheme);

      // Try to validate a very similar theme
      const similarResponse: AIThemeResponse = {
        studyColors: {
          primary: '#FF6C6C', // Very similar to first theme
          secondary: '#FFE6E6', // Very similar to first theme
          accent: '#CC5656', // Very similar to first theme
          description: 'Similar theme',
        },
        breakColors: {
          primary: '#4FCDC5', // Very similar to first theme
          secondary: '#E6F9F8', // Very similar to first theme
          accent: '#3CAA9D', // Very similar to first theme
          description: 'Similar break theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#ffe6e6', '#e6f9f8'],
        },
        themeName: 'Similar Theme',
        confidence: 0.9,
      };

      const result = validator.validateSessionUniqueness(similarResponse);
      expect(result.isUnique).toBe(false);
      expect(result.conflictingThemes).toContain('test-theme-1');
      expect(result.similarityScore).toBeGreaterThan(0.7);
    });

    it('should validate uniqueness for sufficiently different theme', () => {
      // Add a theme to session
      const firstTheme: GeneratedTheme = {
        id: 'test-theme-1',
        name: 'Test Theme 1',
        studyColors: {
          primary: '#FF6B6B', // Red theme
          secondary: '#FFE5E5',
          accent: '#CC5555',
          gradient: ['#FFE5E5', '#FFCCCC'],
        },
        breakColors: {
          primary: '#4ECDC4', // Teal theme
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          gradient: ['#E5F9F7', '#CCF2EF'],
        },
        backgroundElements: [],
        originalPrompt: 'test',
        createdAt: Date.now(),
        isCustom: true,
      };

      validator.addThemeToSession(firstTheme);

      // Try to validate a different theme
      const differentResponse: AIThemeResponse = {
        studyColors: {
          primary: '#000000', // Black theme - very different from red
          secondary: '#333333',
          accent: '#666666',
          description: 'Dark theme',
        },
        breakColors: {
          primary: '#FFFFFF', // White theme - very different from teal
          secondary: '#F8F8F8',
          accent: '#E0E0E0',
          description: 'Light break theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#333333', '#f8f8f8'],
        },
        themeName: 'Black White Theme',
        confidence: 0.9,
      };

      const result = validator.validateSessionUniqueness(differentResponse);
      expect(result.isUnique).toBe(true);
      expect(result.conflictingThemes).toHaveLength(0);
      expect(result.similarityScore).toBeLessThan(0.7);
    });
  });

  describe('session management', () => {
    it('should track session themes correctly', () => {
      expect(validator.getSessionThemeCount()).toBe(0);

      const theme: GeneratedTheme = {
        id: 'test-theme-1',
        name: 'Test Theme',
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          gradient: ['#FFE5E5', '#FFCCCC'],
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          gradient: ['#E5F9F7', '#CCF2EF'],
        },
        backgroundElements: [],
        originalPrompt: 'test',
        createdAt: Date.now(),
        isCustom: true,
      };

      validator.addThemeToSession(theme);
      expect(validator.getSessionThemeCount()).toBe(1);
    });

    it('should clear session themes', () => {
      const theme: GeneratedTheme = {
        id: 'test-theme-1',
        name: 'Test Theme',
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          gradient: ['#FFE5E5', '#FFCCCC'],
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          gradient: ['#E5F9F7', '#CCF2EF'],
        },
        backgroundElements: [],
        originalPrompt: 'test',
        createdAt: Date.now(),
        isCustom: true,
      };

      validator.addThemeToSession(theme);
      expect(validator.getSessionThemeCount()).toBe(1);

      validator.clearSession();
      expect(validator.getSessionThemeCount()).toBe(0);
    });

    it('should limit session history to prevent memory bloat', () => {
      // Add 12 themes (more than the 10 limit)
      for (let i = 0; i < 12; i++) {
        const theme: GeneratedTheme = {
          id: `test-theme-${i}`,
          name: `Test Theme ${i}`,
          studyColors: {
            primary: `#FF${(60 + i).toString(16).padStart(2, '0')}${(60 + i).toString(16).padStart(2, '0')}`,
            secondary: '#FFE5E5',
            accent: '#CC5555',
            gradient: ['#FFE5E5', '#FFCCCC'],
          },
          breakColors: {
            primary: '#4ECDC4',
            secondary: '#E5F9F7',
            accent: '#3BA99C',
            gradient: ['#E5F9F7', '#CCF2EF'],
          },
          backgroundElements: [],
          originalPrompt: `test ${i}`,
          createdAt: Date.now(),
          isCustom: true,
        };

        validator.addThemeToSession(theme);
      }

      // Should be limited to 10 themes
      expect(validator.getSessionThemeCount()).toBe(10);
    });
  });
});