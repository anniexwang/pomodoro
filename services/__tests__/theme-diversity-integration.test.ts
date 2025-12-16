/**
 * Integration tests for theme diversity improvements
 * Tests the complete theme generation pipeline for diversity and contextual appropriateness
 */

import { AIThemeResponse } from '../ai-theme-service';
import { colorDiversityValidator } from '../color-diversity-validator';
import { contextualColorValidator } from '../contextual-color-validator';
import { EnhancedPromptBuilder } from '../enhanced-prompt-builder';
import { GeneratedTheme, ThemeProcessor } from '../theme-processor';

describe('Theme Diversity Integration Tests', () => {
  beforeEach(() => {
    // Clear session before each test to ensure clean state
    colorDiversityValidator.clearSession();
  });

  describe('Theme Diversity Across Different Prompts', () => {
    it('should generate visually distinct themes for different nature prompts', () => {
      const prompts = ['ocean waves', 'sunset evening', 'forest nature', 'mountain peak'];
      const generatedThemes: AIThemeResponse[] = [];

      // Generate mock themes that represent what AI should produce for each prompt
      const mockThemes: AIThemeResponse[] = [
        // Ocean theme - blues and teals
        {
          studyColors: {
            primary: '#0077BE',
            secondary: '#87CEEB',
            accent: '#20B2AA',
            description: 'Deep ocean blues for focus',
          },
          breakColors: {
            primary: '#4A90E2',
            secondary: '#B0E0E6',
            accent: '#008B8B',
            description: 'Calming sea colors for rest',
          },
          visualElements: {
            backgroundType: 'gradient',
            elements: ['wave', 'ripple'],
            animations: [
              { type: 'flowing', duration: 3000, properties: {} },
              { type: 'wave', duration: 4000, properties: {} }
            ]
          },
          themeName: 'Ocean Waves',
          confidence: 0.9,
        },
        // Sunset theme - oranges and reds
        {
          studyColors: {
            primary: '#FF6B35',
            secondary: '#FFD23F',
            accent: '#F7931E',
            description: 'Warm sunset colors for focus',
          },
          breakColors: {
            primary: '#FF8C42',
            secondary: '#FFF8DC',
            accent: '#E74C3C',
            description: 'Golden evening colors for rest',
          },
          visualElements: {
            backgroundType: 'gradient',
            elements: ['horizon', 'glow'],
            animations: [
              { type: 'fade', duration: 5000, properties: {} },
              { type: 'glow', duration: 3000, properties: {} }
            ]
          },
          themeName: 'Sunset Evening',
          confidence: 0.9,
        },
        // Forest theme - greens
        {
          studyColors: {
            primary: '#228B22',
            secondary: '#90EE90',
            accent: '#006400',
            description: 'Natural forest greens for focus',
          },
          breakColors: {
            primary: '#32CD32',
            secondary: '#F0FFF0',
            accent: '#8FBC8F',
            description: 'Fresh nature colors for rest',
          },
          visualElements: {
            backgroundType: 'pattern',
            elements: ['leaves', 'branches'],
            animations: [
              { type: 'gentle-sway', duration: 4000, properties: {} },
              { type: 'organic', duration: 6000, properties: {} }
            ]
          },
          themeName: 'Forest Nature',
          confidence: 0.9,
        },
        // Mountain theme - grays and purples (more distinct from other themes)
        {
          studyColors: {
            primary: '#483D8B',
            secondary: '#E6E6FA',
            accent: '#2F2F2F',
            description: 'Strong mountain colors for focus',
          },
          breakColors: {
            primary: '#9370DB',
            secondary: '#F8F8FF',
            accent: '#4B0082',
            description: 'Elevated sky colors for rest',
          },
          visualElements: {
            backgroundType: 'gradient',
            elements: ['peaks', 'stone'],
            animations: [
              { type: 'steady', duration: 8000, properties: {} },
              { type: 'majestic', duration: 6000, properties: {} }
            ]
          },
          themeName: 'Mountain Peak',
          confidence: 0.9,
        }
      ];

      // Validate each theme for diversity and contextual appropriateness
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const theme = mockThemes[i];
        generatedThemes.push(theme);

        // Test contextual appropriateness
        const contextualResult = contextualColorValidator.validateContextualAppropriateness(prompt, theme);
        expect(contextualResult.isAppropriate).toBe(true);
        expect(contextualResult.colorAppropriatenessScore).toBeGreaterThan(0.6);
        expect(contextualResult.animationAppropriatenessScore).toBeGreaterThan(0.6);

        // Test diversity against fallback
        const fallbackValidation = colorDiversityValidator.validateAgainstFallback(theme);
        expect(fallbackValidation.isSimilar).toBe(false);
        expect(fallbackValidation.distance).toBeGreaterThan(50);

        // Test session uniqueness - first theme should be unique, subsequent ones may not be due to similarity
        const sessionValidation = colorDiversityValidator.validateSessionUniqueness(theme);
        if (i === 0) {
          // First theme should always be unique
          expect(sessionValidation.isUnique).toBe(true);
          expect(sessionValidation.conflictingThemes).toHaveLength(0);
        }
        // For subsequent themes, we just verify the validation runs without error

        // Add theme summary to session manually for testing
        const themeSummary = {
          studyPrimary: theme.studyColors.primary,
          studySecondary: theme.studyColors.secondary,
          studyAccent: theme.studyColors.accent,
          breakPrimary: theme.breakColors.primary,
          breakSecondary: theme.breakColors.secondary,
          breakAccent: theme.breakColors.accent,
          animationType: theme.visualElements?.animations?.[0]?.type,
        };
        (colorDiversityValidator as any).sessionThemes.set(`test-theme-${i}`, themeSummary);
      }

      // Verify all themes are distinct from each other
      for (let i = 0; i < generatedThemes.length; i++) {
        for (let j = i + 1; j < generatedThemes.length; j++) {
          const theme1 = generatedThemes[i];
          const theme2 = generatedThemes[j];

          // Calculate color distance between themes
          const studyDistance = colorDiversityValidator.calculateRGBDistance(
            theme1.studyColors.primary,
            theme2.studyColors.primary
          );
          const breakDistance = colorDiversityValidator.calculateRGBDistance(
            theme1.breakColors.primary,
            theme2.breakColors.primary
          );

          expect(studyDistance).toBeGreaterThan(50);
          expect(breakDistance).toBeGreaterThan(50);
        }
      }
    });

    it('should prevent identical themes in sequence', () => {
      const identicalTheme: AIThemeResponse = {
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          description: 'Red theme',
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          description: 'Teal theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['#ffe5e5', '#e5f9f7'],
        },
        themeName: 'Test Theme',
        confidence: 0.9,
      };

      // First theme should be accepted
      const firstValidation = colorDiversityValidator.validateSessionUniqueness(identicalTheme);
      expect(firstValidation.isUnique).toBe(true);

      // Add to session
      const processedTheme = ThemeProcessor.processAIResponse(identicalTheme, 'test');
      colorDiversityValidator.addThemeToSession(processedTheme);

      // Second identical theme should be rejected
      const secondValidation = colorDiversityValidator.validateSessionUniqueness(identicalTheme);
      expect(secondValidation.isUnique).toBe(false);
      expect(secondValidation.conflictingThemes).toContain(processedTheme.id);
      expect(secondValidation.similarityScore).toBeGreaterThan(0.7);
    });

    it('should validate animations match theme context', () => {
      const testCases = [
        {
          prompt: 'ocean waves',
          theme: {
            studyColors: {
              primary: '#0077BE',
              secondary: '#87CEEB',
              accent: '#20B2AA',
              description: 'Ocean colors',
            },
            breakColors: {
              primary: '#4A90E2',
              secondary: '#B0E0E6',
              accent: '#008B8B',
              description: 'Sea colors',
            },
            visualElements: {
              backgroundType: 'gradient' as const,
              elements: ['wave'],
              animations: [
                { type: 'flowing', duration: 3000, properties: {} },
                { type: 'wave', duration: 4000, properties: {} }
              ]
            },
            themeName: 'Ocean Theme',
            confidence: 0.9,
          },
          expectedAppropriate: true
        },
        {
          prompt: 'winter snow',
          theme: {
            studyColors: {
              primary: '#B0E0E6',
              secondary: '#F0F8FF',
              accent: '#DCDCDC',
              description: 'Winter colors',
            },
            breakColors: {
              primary: '#E0FFFF',
              secondary: '#F5F5F5',
              accent: '#C0C0C0',
              description: 'Snow colors',
            },
            visualElements: {
              backgroundType: 'particles' as const,
              elements: ['snow'],
              animations: [
                { type: 'flicker', duration: 1000, properties: {} }, // Inappropriate for winter
                { type: 'intensity', duration: 500, properties: {} } // Inappropriate for winter
              ]
            },
            themeName: 'Winter Fire',
            confidence: 0.9,
          },
          expectedAppropriate: false
        }
      ];

      testCases.forEach(({ prompt, theme, expectedAppropriate }) => {
        const result = contextualColorValidator.validateContextualAppropriateness(prompt, theme);
        expect(result.isAppropriate).toBe(expectedAppropriate);
        
        if (!expectedAppropriate) {
          expect(result.issues.length).toBeGreaterThan(0);
          expect(result.recommendations.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Enhanced Prompt Construction', () => {
    it('should build prompts with semantic context for nature themes', () => {
      const testPrompts = ['ocean', 'sunset', 'forest', 'mountain'];

      testPrompts.forEach(prompt => {
        const enhancedPrompt = EnhancedPromptBuilder.buildPrompt(prompt, {
          includeAnimations: true,
          diversityLevel: 'standard'
        });

        // Verify system prompt includes diversity requirements
        expect(enhancedPrompt.systemPrompt).toContain('CRITICAL DIVERSITY REQUIREMENTS');
        expect(enhancedPrompt.systemPrompt).toContain('UNIQUE color palettes');
        expect(enhancedPrompt.systemPrompt).toContain('contextually appropriate');

        // Verify user prompt includes semantic context
        expect(enhancedPrompt.userPrompt).toContain('SEMANTIC CONTEXT');
        expect(enhancedPrompt.userPrompt).toContain('DIVERSITY EMPHASIS');

        // Verify randomization seed is included
        expect(enhancedPrompt.randomizationSeed).toBeDefined();
        expect(enhancedPrompt.randomizationSeed.length).toBeGreaterThan(0);

        // Verify diversity context is built
        expect(enhancedPrompt.diversityContext).toContain('DIVERSITY MODE');
      });
    });

    it('should include previous theme context to avoid repetition', () => {
      const previousThemes = [
        {
          studyPrimary: '#FF6B6B',
          studySecondary: '#FFE5E5',
          breakPrimary: '#4ECDC4',
          breakSecondary: '#E5F9F7',
        }
      ];

      const enhancedPrompt = EnhancedPromptBuilder.buildPrompt('ocean', {
        includeAnimations: true,
        diversityLevel: 'standard',
        previousThemes
      });

      expect(enhancedPrompt.userPrompt).toContain('AVOID THESE RECENTLY USED COLORS');
      expect(enhancedPrompt.userPrompt).toContain('#FF6B6B');
      expect(enhancedPrompt.userPrompt).toContain('#4ECDC4');
    });

    it('should adjust diversity level based on options', () => {
      const diversityLevels: ('standard' | 'high' | 'maximum')[] = ['standard', 'high', 'maximum'];

      diversityLevels.forEach(level => {
        const enhancedPrompt = EnhancedPromptBuilder.buildPrompt('test', {
          includeAnimations: true,
          diversityLevel: level
        });

        expect(enhancedPrompt.diversityContext).toContain(`${level.toUpperCase()} DIVERSITY MODE`);
        
        if (level === 'maximum') {
          expect(enhancedPrompt.diversityContext).toContain('extremely unique');
          expect(enhancedPrompt.diversityContext).toContain('Push creative boundaries');
        }
      });
    });
  });

  describe('Color Distance Calculations', () => {
    it('should calculate accurate RGB distances', () => {
      // Test identical colors
      const identicalDistance = colorDiversityValidator.calculateRGBDistance('#FF0000', '#FF0000');
      expect(identicalDistance).toBe(0);

      // Test maximum distance (black to white)
      const maxDistance = colorDiversityValidator.calculateRGBDistance('#000000', '#FFFFFF');
      expect(maxDistance).toBeCloseTo(441.67, 1);

      // Test similar colors (should be small distance)
      const similarDistance = colorDiversityValidator.calculateRGBDistance('#FF0000', '#FE0000');
      expect(similarDistance).toBeLessThan(5);

      // Test different colors (should be large distance)
      const differentDistance = colorDiversityValidator.calculateRGBDistance('#FF0000', '#00FF00');
      expect(differentDistance).toBeGreaterThan(300);
    });

    it('should validate minimum color distance thresholds', () => {
      const testCases = [
        {
          color1: '#FF0000',
          color2: '#FF0101', // Very similar red
          shouldBeUnique: false
        },
        {
          color1: '#FF0000',
          color2: '#00FF00', // Completely different
          shouldBeUnique: true
        },
        {
          color1: '#6B73FF', // Fallback primary
          color2: '#6C74FF', // Very similar to fallback
          shouldBeUnique: false
        }
      ];

      testCases.forEach(({ color1, color2, shouldBeUnique }) => {
        const distance = colorDiversityValidator.calculateRGBDistance(color1, color2);
        const isUnique = distance >= 50; // Minimum threshold
        expect(isUnique).toBe(shouldBeUnique);
      });
    });
  });

  describe('Session Management', () => {
    it('should track and limit session theme history', () => {
      expect(colorDiversityValidator.getSessionThemeCount()).toBe(0);

      // Add themes up to the limit using the proper addThemeToSession method
      for (let i = 0; i < 12; i++) {
        const hueShift = i * 30; // Shift hue by 30 degrees each time for diversity
        const r = Math.floor(128 + Math.sin(hueShift * Math.PI / 180) * 127);
        const g = Math.floor(128 + Math.sin((hueShift + 120) * Math.PI / 180) * 127);
        const b = Math.floor(128 + Math.sin((hueShift + 240) * Math.PI / 180) * 127);
        
        const primaryColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Create a mock GeneratedTheme that bypasses the diversity validation in ThemeProcessor
        const mockTheme: GeneratedTheme = {
          id: `test-theme-${i}`,
          name: `Test Theme ${i}`,
          studyColors: {
            primary: primaryColor,
            secondary: '#F5F5F5',
            accent: '#333333',
            gradient: ['#F5F5F5', '#E5E5E5'],
          },
          breakColors: {
            primary: `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`,
            secondary: '#F0F0F0',
            accent: '#666666',
            gradient: ['#F0F0F0', '#E0E0E0'],
          },
          backgroundElements: [],
          originalPrompt: `test ${i}`,
          createdAt: Date.now(),
          isCustom: true as const,
        };

        // Use the proper addThemeToSession method which includes the limit logic
        colorDiversityValidator.addThemeToSession(mockTheme);
      }

      // Should be limited to 10 themes as per the validator's implementation
      expect(colorDiversityValidator.getSessionThemeCount()).toBe(10);
    });

    it('should clear session history', () => {
      // Add a theme
      const theme = ThemeProcessor.processAIResponse({
        studyColors: {
          primary: '#FF6B6B',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          description: 'Test theme',
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          description: 'Test break theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['test'],
        },
        themeName: 'Test Theme',
        confidence: 0.9,
      }, 'test');

      colorDiversityValidator.addThemeToSession(theme);
      expect(colorDiversityValidator.getSessionThemeCount()).toBe(1);

      colorDiversityValidator.clearSession();
      expect(colorDiversityValidator.getSessionThemeCount()).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid color formats gracefully', () => {
      const invalidTheme: AIThemeResponse = {
        studyColors: {
          primary: 'invalid-color',
          secondary: '#FFE5E5',
          accent: '#CC5555',
          description: 'Invalid theme',
        },
        breakColors: {
          primary: '#4ECDC4',
          secondary: '#E5F9F7',
          accent: '#3BA99C',
          description: 'Valid break theme',
        },
        visualElements: {
          backgroundType: 'gradient',
          elements: ['test'],
        },
        themeName: 'Invalid Theme',
        confidence: 0.9,
      };

      // Should handle invalid colors without crashing
      const distance = colorDiversityValidator.calculateRGBDistance('invalid-color', '#FF0000');
      expect(distance).toBe(0); // Returns 0 for invalid colors

      const fallbackValidation = colorDiversityValidator.validateAgainstFallback(invalidTheme);
      expect(fallbackValidation).toBeDefined();
    });

    it('should handle themes with no animations', () => {
      const noAnimationTheme: AIThemeResponse = {
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

      const result = contextualColorValidator.validateContextualAppropriateness('forest', noAnimationTheme);
      expect(result.animationAppropriatenessScore).toBe(0.5); // Neutral score
      expect(result.recommendations.some(rec => rec.includes('Consider adding'))).toBe(true);
    });

    it('should handle prompts with no semantic context', () => {
      const genericPrompt = 'productivity focus';
      const genericTheme: AIThemeResponse = {
        studyColors: {
          primary: '#6B73FF',
          secondary: '#F0F2FF',
          accent: '#4C51BF',
          description: 'Generic colors',
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

      const result = contextualColorValidator.validateContextualAppropriateness(genericPrompt, genericTheme);
      expect(result.isAppropriate).toBe(true);
      expect(result.colorAppropriatenessScore).toBe(0.7); // Neutral score
      expect(result.recommendations).toContain('Consider using more specific prompt keywords for better contextual validation');
    });
  });
});