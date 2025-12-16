/**
 * Basic tests for AI Theme Service functionality
 */

import { DEFAULT_AI_CONFIG, OpenAIThemeAdapter } from '../ai-theme-service';
import { colorDiversityValidator } from '../color-diversity-validator';
import { ThemeProcessor } from '../theme-processor';

describe('AI Theme Service', () => {
  describe('OpenAIThemeAdapter', () => {
    let adapter: OpenAIThemeAdapter;

    beforeEach(() => {
      adapter = new OpenAIThemeAdapter({
        ...DEFAULT_AI_CONFIG,
        apiKey: 'test-key',
      });
    });

    describe('validatePrompt', () => {
      it('should accept valid prompts', () => {
        const result = adapter.validatePrompt('ocean sunset');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.sanitizedPrompt).toBe('ocean sunset');
      });

      it('should reject empty prompts', () => {
        const result = adapter.validatePrompt('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Prompt cannot be empty');
      });

      it('should reject prompts that are too long', () => {
        const longPrompt = 'a'.repeat(51);
        const result = adapter.validatePrompt(longPrompt);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Prompt must be 50 characters or less');
      });

      it('should reject inappropriate content', () => {
        const result = adapter.validatePrompt('hate theme');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Prompt contains inappropriate content');
      });

      it('should sanitize prompts by removing dangerous characters', () => {
        const result = adapter.validatePrompt('ocean<script>alert()</script>');
        expect(result.isValid).toBe(true);
        expect(result.sanitizedPrompt).toBe('oceanscriptalert()/script');
      });
    });
  });

  describe('ThemeProcessor', () => {
    beforeEach(() => {
      // Clear session before each test
      colorDiversityValidator.clearSession();
    });

    describe('processAIResponse', () => {
      it('should process valid AI response correctly with diversity validation', () => {
        const mockAIResponse = {
          studyColors: {
            primary: '#FF6B6B',
            secondary: '#FFE5E5',
            accent: '#CC5555',
            description: 'Warm red tones for focus',
          },
          breakColors: {
            primary: '#4ECDC4',
            secondary: '#E5F9F7',
            accent: '#3BA99C',
            description: 'Cool teal tones for relaxation',
          },
          visualElements: {
            backgroundType: 'gradient' as const,
            elements: ['#FFE5E5', '#E5F9F7'],
          },
          themeName: 'Ocean Sunset',
          confidence: 0.9,
        };

        const result = ThemeProcessor.processAIResponse(mockAIResponse, 'ocean sunset');

        expect(result.name).toBe('Ocean Sunset');
        expect(result.originalPrompt).toBe('ocean sunset');
        expect(result.isCustom).toBe(true);
        expect(result.studyColors.primary).toBe('#FF6B6B');
        expect(result.breakColors.primary).toBe('#4ECDC4');
        expect(result.id).toMatch(/^ai-theme-/);
        expect(result.createdAt).toBeGreaterThan(0);
        expect(result.diversityValidation).toBeDefined();
        expect(result.diversityValidation?.isUnique).toBe(true);
      });

      it('should reject theme too similar to fallback', () => {
        const mockAIResponse = {
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
            backgroundType: 'gradient' as const,
            elements: ['#f0f2ff', '#e6e8ff'],
          },
          themeName: 'Fallback Test',
          confidence: 0.9,
        };

        expect(() => {
          ThemeProcessor.processAIResponse(mockAIResponse, 'fallback test');
        }).toThrow('Generated colors are too similar to default fallback theme');
      });

      it('should apply fallback theme when processing fails', () => {
        const result = ThemeProcessor.applyFallbackTheme('test prompt');

        expect(result.name).toBe('Test prompt');
        expect(result.originalPrompt).toBe('test prompt');
        expect(result.isCustom).toBe(true);
        expect(result.studyColors.primary).toBe('#6B73FF');
        expect(result.breakColors.primary).toBe('#48BB78');
        expect(result.aiConfidence).toBe(0.5);
        expect(result.diversityValidation).toBeDefined();
        expect(result.diversityValidation?.isUnique).toBe(false);
      });
    });

    describe('validateAgainstFallback', () => {
      it('should validate theme against fallback colors', () => {
        const uniqueResponse = {
          studyColors: {
            primary: '#FF6B6B',
            secondary: '#FFE5E5',
            accent: '#CC5555',
            description: 'Unique theme',
          },
          breakColors: {
            primary: '#4ECDC4',
            secondary: '#E5F9F7',
            accent: '#3BA99C',
            description: 'Unique break theme',
          },
          visualElements: {
            backgroundType: 'gradient' as const,
            elements: ['#ffe5e5', '#e5f9f7'],
          },
          themeName: 'Unique Theme',
          confidence: 0.9,
        };

        const isUnique = ThemeProcessor.validateAgainstFallback(uniqueResponse);
        expect(isUnique).toBe(true);
      });

      it('should detect similarity to fallback colors', () => {
        const fallbackLikeResponse = {
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
            backgroundType: 'gradient' as const,
            elements: ['#f0f2ff', '#e6e8ff'],
          },
          themeName: 'Fallback Test',
          confidence: 0.9,
        };

        const isUnique = ThemeProcessor.validateAgainstFallback(fallbackLikeResponse);
        expect(isUnique).toBe(false);
      });
    });
  });
});