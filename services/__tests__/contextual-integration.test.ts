/**
 * Integration tests for contextual color validation with AI theme service
 */

import { AIServiceConfig, OpenAIThemeAdapter } from '../ai-theme-service';
import { contextualColorValidator } from '../contextual-color-validator';

describe('Contextual Integration Tests', () => {
  let mockAdapter: OpenAIThemeAdapter;

  beforeEach(() => {
    const mockConfig: AIServiceConfig = {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'test-key',
      timeout: 10000,
      retryAttempts: 3,
    };
    mockAdapter = new OpenAIThemeAdapter(mockConfig);
  });

  describe('contextual validation integration', () => {
    it('should validate ocean theme appropriateness', () => {
      const oceanTheme = {
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
          backgroundType: 'gradient' as const,
          elements: ['wave', 'ripple'],
          animations: [
            { type: 'flowing', duration: 3000, properties: {} },
            { type: 'wave', duration: 4000, properties: {} }
          ]
        },
        themeName: 'Ocean Theme',
        confidence: 0.9,
      };

      const result = contextualColorValidator.validateContextualAppropriateness('ocean waves', oceanTheme);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0.6);
    });

    it('should detect inappropriate fire colors for ocean theme', () => {
      const fireThemeForOcean = {
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
          backgroundType: 'gradient' as const,
          elements: ['flame', 'fire'],
          animations: [
            { type: 'flicker', duration: 1000, properties: {} },
            { type: 'dance', duration: 2000, properties: {} }
          ]
        },
        themeName: 'Fire Ocean',
        confidence: 0.9,
      };

      const result = contextualColorValidator.validateContextualAppropriateness('ocean waves', fireThemeForOcean);
      
      expect(result.isAppropriate).toBe(false);
      expect(result.overallScore).toBeLessThan(0.6);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should validate sunset theme appropriateness', () => {
      const sunsetTheme = {
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
          backgroundType: 'gradient' as const,
          elements: ['horizon', 'glow'],
          animations: [
            { type: 'fade', duration: 5000, properties: {} },
            { type: 'glow', duration: 3000, properties: {} }
          ]
        },
        themeName: 'Sunset Theme',
        confidence: 0.9,
      };

      const result = contextualColorValidator.validateContextualAppropriateness('sunset evening', sunsetTheme);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0.6);
    });

    it('should validate forest theme appropriateness', () => {
      const forestTheme = {
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
          backgroundType: 'pattern' as const,
          elements: ['leaves', 'branches'],
          animations: [
            { type: 'gentle-sway', duration: 4000, properties: {} },
            { type: 'organic', duration: 6000, properties: {} }
          ]
        },
        themeName: 'Forest Theme',
        confidence: 0.9,
      };

      const result = contextualColorValidator.validateContextualAppropriateness('forest nature', forestTheme);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0.6);
    });

    it('should handle generic prompts with neutral validation', () => {
      const genericTheme = {
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
          backgroundType: 'gradient' as const,
          elements: ['simple'],
          animations: [
            { type: 'gentle', duration: 3000, properties: {} }
          ]
        },
        themeName: 'Generic Theme',
        confidence: 0.9,
      };

      const result = contextualColorValidator.validateContextualAppropriateness('productivity focus', genericTheme);
      
      expect(result.isAppropriate).toBe(true);
      expect(result.overallScore).toBe(0.7); // Neutral score
    });
  });

  describe('prompt validation', () => {
    it('should validate valid prompts', () => {
      const validPrompts = ['ocean', 'sunset', 'forest', 'mountain', 'space'];
      
      for (const prompt of validPrompts) {
        const validation = mockAdapter.validatePrompt(prompt);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.sanitizedPrompt).toBe(prompt);
      }
    });

    it('should reject empty prompts', () => {
      const validation = mockAdapter.validatePrompt('');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Prompt cannot be empty');
    });

    it('should reject overly long prompts', () => {
      const longPrompt = 'a'.repeat(51);
      const validation = mockAdapter.validatePrompt(longPrompt);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Prompt must be 50 characters or less');
    });

    it('should sanitize prompts with special characters', () => {
      const validation = mockAdapter.validatePrompt('ocean<script>alert("test")</script>');
      expect(validation.isValid).toBe(true);
      expect(validation.sanitizedPrompt).toBe('oceanscriptalert("test")/script');
    });
  });
});