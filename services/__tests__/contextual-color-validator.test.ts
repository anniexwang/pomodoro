/**
 * Tests for Contextual Color Validator
 */

import { AIThemeResponse } from '../ai-theme-service';
import { ContextualColorValidator, contextualColorValidator } from '../contextual-color-validator';

describe('ContextualColorValidator', () => {
  let validator: ContextualColorValidator;

  beforeEach(() => {
    validator = new ContextualColorValidator();
  });

  describe('validateContextualAppropriateness', () => {
    it('should validate ocean-themed colors appropriately', () => {
      const oceanResponse: AIThemeResponse = {
        studyColors: {
          primary: '#0077BE', // Ocean blue
          secondary: '#87CEEB', // Sky blue
          accent: '#20B2AA', // Light sea green
          description: 'Ocean study colors',
        },
        breakColors: {
          primary: '#4A90E2', // Blue
          secondary: '#B0E0E6', // Powder blue
          accent: '#008B8B', // Dark cyan
          description: 'Ocean break colors',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['wave', 'ripple'],
          animations: [
            { type: 'flowing', duration: 3000, properties: {} },
            { type: 'wave', duration: 4000, properties: {} }
          ]
        },
        themeName: 'Ocean Theme',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('ocean waves', oceanResponse);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.colorAppropriatenessScore).toBeGreaterThan(0.6);
      expect(result.animationAppropriatenessScore).toBeGreaterThan(0.6);
      expect(result.overallScore).toBeGreaterThan(0.6);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect inappropriate colors for ocean theme', () => {
      const inappropriateResponse: AIThemeResponse = {
        studyColors: {
          primary: '#FF4500', // Orange red - inappropriate for ocean
          secondary: '#FFD700', // Gold - inappropriate for ocean
          accent: '#DC143C', // Crimson - inappropriate for ocean
          description: 'Fire colors for ocean theme',
        },
        breakColors: {
          primary: '#FF6347', // Tomato red
          secondary: '#FFA500', // Orange
          accent: '#B22222', // Fire brick
          description: 'More fire colors',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['flame', 'fire'],
          animations: [
            { type: 'flicker', duration: 1000, properties: {} },
            { type: 'dance', duration: 2000, properties: {} }
          ]
        },
        themeName: 'Fire Ocean',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('ocean waves', inappropriateResponse);
      
      expect(result.isAppropriate).toBe(false);
      expect(result.colorAppropriatenessScore).toBeLessThan(0.6);
      expect(result.animationAppropriatenessScore).toBeLessThan(0.6);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate sunset-themed colors appropriately', () => {
      const sunsetResponse: AIThemeResponse = {
        studyColors: {
          primary: '#FF6B35', // Orange
          secondary: '#FFD23F', // Golden yellow
          accent: '#F7931E', // Orange
          description: 'Sunset study colors',
        },
        breakColors: {
          primary: '#FF8C42', // Coral
          secondary: '#FFF8DC', // Cornsilk
          accent: '#E74C3C', // Red
          description: 'Sunset break colors',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['horizon', 'glow'],
          animations: [
            { type: 'fade', duration: 5000, properties: {} },
            { type: 'glow', duration: 3000, properties: {} }
          ]
        },
        themeName: 'Sunset Theme',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('sunset evening', sunsetResponse);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.colorAppropriatenessScore).toBeGreaterThan(0.6);
      expect(result.animationAppropriatenessScore).toBeGreaterThan(0.6);
      expect(result.overallScore).toBeGreaterThan(0.6);
    });

    it('should validate forest-themed colors appropriately', () => {
      const forestResponse: AIThemeResponse = {
        studyColors: {
          primary: '#228B22', // Forest green
          secondary: '#90EE90', // Light green
          accent: '#006400', // Dark green
          description: 'Forest study colors',
        },
        breakColors: {
          primary: '#32CD32', // Lime green
          secondary: '#F0FFF0', // Honeydew
          accent: '#8FBC8F', // Dark sea green
          description: 'Forest break colors',
        },
        visualElements: {
          backgroundType: 'pattern',
          elements: ['leaves', 'branches'],
          animations: [
            { type: 'gentle-sway', duration: 4000, properties: {} },
            { type: 'organic', duration: 6000, properties: {} }
          ]
        },
        themeName: 'Forest Theme',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('forest nature', forestResponse);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.colorAppropriatenessScore).toBeGreaterThan(0.6);
      expect(result.animationAppropriatenessScore).toBeGreaterThan(0.6);
    });

    it('should handle prompts with no specific context', () => {
      const genericResponse: AIThemeResponse = {
        studyColors: {
          primary: '#6B73FF',
          secondary: '#F0F2FF',
          accent: '#4C51BF',
          description: 'Generic study colors',
        },
        breakColors: {
          primary: '#48BB78',
          secondary: '#F0FFF4',
          accent: '#38A169',
          description: 'Generic break colors',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['simple'],
          animations: [
            { type: 'gentle', duration: 3000, properties: {} }
          ]
        },
        themeName: 'Generic Theme',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('productivity focus', genericResponse);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.colorAppropriatenessScore).toBe(0.7); // Neutral score
      expect(result.animationAppropriatenessScore).toBe(0.7); // Neutral score
      expect(result.overallScore).toBe(0.7);
      expect(result.recommendations).toContain('Consider using more specific prompt keywords for better contextual validation');
    });

    it('should detect inappropriate animations for context', () => {
      const inappropriateAnimationResponse: AIThemeResponse = {
        studyColors: {
          primary: '#B0E0E6', // Appropriate winter colors
          secondary: '#F0F8FF',
          accent: '#DCDCDC',
          description: 'Winter study colors',
        },
        breakColors: {
          primary: '#E0FFFF',
          secondary: '#F5F5F5',
          accent: '#C0C0C0',
          description: 'Winter break colors',
        },
        visualElements: {
          backgroundType: 'particles',
          elements: ['snow', 'ice'],
          animations: [
            { type: 'flicker', duration: 1000, properties: {} }, // Inappropriate for winter
            { type: 'intensity', duration: 500, properties: {} } // Inappropriate for winter
          ]
        },
        themeName: 'Winter Fire',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('winter snow', inappropriateAnimationResponse);
      
      expect(result.colorAppropriatenessScore).toBeGreaterThan(0.4); // Colors are appropriate
      expect(result.animationAppropriatenessScore).toBeLessThan(0.6); // Animations are inappropriate
      expect(result.isAppropriate).toBe(false); // Overall inappropriate due to animations
      expect(result.issues.some(issue => issue.includes('inappropriate for this context'))).toBe(true);
    });

    it('should handle themes with no animations', () => {
      const noAnimationResponse: AIThemeResponse = {
        studyColors: {
          primary: '#228B22',
          secondary: '#90EE90',
          accent: '#006400',
          description: 'Forest colors',
        },
        breakColors: {
          primary: '#32CD32',
          secondary: '#F0FFF0',
          accent: '#8FBC8F',
          description: 'Forest break colors',
        },
        visualElements: {
          backgroundType: 'pattern',
          elements: ['leaves'],
          animations: [] // No animations
        },
        themeName: 'Static Forest',
        confidence: 0.9,
      };

      const result = validator.validateContextualAppropriateness('forest', noAnimationResponse);
      
      expect(result.animationAppropriatenessScore).toBe(0.5); // Neutral score for no animations
      expect(result.recommendations.some(rec => rec.includes('Consider adding'))).toBe(true);
    });
  });

  describe('color family validation', () => {
    it('should correctly identify colors in blue family', () => {
      const validator = new ContextualColorValidator();
      
      // Access private method through type assertion for testing
      const calculateColorFamilyMatch = (validator as any).calculateColorFamilyMatch.bind(validator);
      const colorFamilies = ContextualColorValidator['COLOR_FAMILIES'];
      
      const blueColors = ['#0077BE', '#4A90E2', '#87CEEB'];
      const score = calculateColorFamilyMatch(blueColors, [colorFamilies.blues]);
      
      expect(score).toBeGreaterThan(0.7);
    });

    it('should correctly identify colors not in expected family', () => {
      const validator = new ContextualColorValidator();
      
      // Access private method through type assertion for testing
      const calculateColorFamilyMatch = (validator as any).calculateColorFamilyMatch.bind(validator);
      const colorFamilies = ContextualColorValidator['COLOR_FAMILIES'];
      
      const redColors = ['#FF0000', '#DC143C', '#B22222'];
      const score = calculateColorFamilyMatch(redColors, [colorFamilies.blues]);
      
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('HSL conversion', () => {
    it('should convert hex colors to HSL correctly', () => {
      const validator = new ContextualColorValidator();
      
      // Access private method through type assertion for testing
      const hexToHsl = (validator as any).hexToHsl.bind(validator);
      
      // Test red color
      const redHsl = hexToHsl('#FF0000');
      expect(redHsl).toEqual({ h: 0, s: 100, l: 50 });
      
      // Test blue color
      const blueHsl = hexToHsl('#0000FF');
      expect(blueHsl).toEqual({ h: 240, s: 100, l: 50 });
      
      // Test green color
      const greenHsl = hexToHsl('#00FF00');
      expect(greenHsl).toEqual({ h: 120, s: 100, l: 50 });
    });

    it('should handle invalid hex colors', () => {
      const validator = new ContextualColorValidator();
      
      // Access private method through type assertion for testing
      const hexToHsl = (validator as any).hexToHsl.bind(validator);
      
      const invalidHsl = hexToHsl('invalid');
      expect(invalidHsl).toBeNull();
    });
  });

  describe('static utility methods', () => {
    it('should return available contexts', () => {
      const contexts = ContextualColorValidator.getAvailableContexts();
      
      expect(contexts).toContain('ocean');
      expect(contexts).toContain('sunset');
      expect(contexts).toContain('forest');
      expect(contexts).toContain('mountain');
      expect(contexts).toContain('fire');
      expect(contexts).toContain('space');
      expect(contexts).toContain('spring');
      expect(contexts).toContain('winter');
    });

    it('should return expected color families for context', () => {
      const oceanFamilies = ContextualColorValidator.getExpectedColorFamilies('ocean');
      
      expect(oceanFamilies.length).toBeGreaterThan(0);
      expect(oceanFamilies.some(family => family.name === 'Blues')).toBe(true);
    });

    it('should return expected animations for context', () => {
      const oceanAnimations = ContextualColorValidator.getExpectedAnimations('ocean');
      
      expect(oceanAnimations).toContain('flowing');
      expect(oceanAnimations).toContain('wave');
      expect(oceanAnimations).toContain('ripple');
    });

    it('should return empty arrays for unknown context', () => {
      const unknownFamilies = ContextualColorValidator.getExpectedColorFamilies('unknown');
      const unknownAnimations = ContextualColorValidator.getExpectedAnimations('unknown');
      
      expect(unknownFamilies).toEqual([]);
      expect(unknownAnimations).toEqual([]);
    });
  });

  describe('singleton instance', () => {
    it('should provide a singleton instance', () => {
      expect(contextualColorValidator).toBeInstanceOf(ContextualColorValidator);
    });
  });
});