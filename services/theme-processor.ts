/**
 * Theme Processor - Converts AI responses to ThemeConfig format
 */

import { BackgroundElement, ThemeAnimations, ThemeColors, ThemeConfig } from '@/types/timer';
import { AIThemeResponse, AnimationSuggestion } from './ai-theme-service';
import { colorDiversityValidator, DiversityValidationResult } from './color-diversity-validator';

// Generated theme with metadata
export interface GeneratedTheme extends ThemeConfig {
  id: string;
  originalPrompt: string;
  createdAt: number;
  isCustom: true;
  aiConfidence?: number;
  diversityValidation?: DiversityValidationResult;
}

// Theme processor class
export class ThemeProcessor {
  /**
   * Converts AI response to ThemeConfig format with diversity validation
   */
  static processAIResponse(
    aiResponse: AIThemeResponse, 
    originalPrompt: string
  ): GeneratedTheme {
    try {
      // Validate AI response
      this.validateAIResponse(aiResponse);

      // Perform comprehensive diversity validation
      const diversityValidation = colorDiversityValidator.validateSessionUniqueness(aiResponse);
      
      // Check if theme is too similar to defaults or previous themes
      if (!diversityValidation.isUnique) {
        const similarity = (diversityValidation.similarityScore * 100).toFixed(1);
        const conflictCount = diversityValidation.conflictingThemes.length;
        throw new ThemeProcessingError(
          `Generated theme is too similar to ${conflictCount} existing theme(s) (${similarity}% similarity). ${diversityValidation.recommendations.join('. ')}`,
          { diversityValidation }
        );
      }

      // Additional fallback validation
      const fallbackValidation = colorDiversityValidator.validateAgainstFallback(aiResponse);
      if (fallbackValidation.isSimilar) {
        throw new ThemeProcessingError(
          `Generated theme is too similar to fallback theme (distance: ${fallbackValidation.distance.toFixed(2)}). Try a more creative prompt.`,
          { fallbackValidation }
        );
      }

      // Convert colors
      const studyColors = this.convertToThemeColors(aiResponse.studyColors);
      const breakColors = this.convertToThemeColors(aiResponse.breakColors);

      // Process background elements
      const backgroundElements = this.processBackgroundElements(aiResponse.visualElements);

      // Process animations
      const animations = this.processAnimations(aiResponse.visualElements.animations);

      // Generate unique ID
      const id = this.generateThemeId(originalPrompt);

      // Create generated theme
      const generatedTheme: GeneratedTheme = {
        id,
        name: aiResponse.themeName || this.generateThemeName(originalPrompt),
        studyColors,
        breakColors,
        backgroundElements,
        animations,
        originalPrompt,
        createdAt: Date.now(),
        isCustom: true,
        aiConfidence: aiResponse.confidence,
        diversityValidation,
      };

      // Validate final theme
      this.validateGeneratedTheme(generatedTheme);

      // Add theme to session tracking for future diversity checks
      colorDiversityValidator.addThemeToSession(generatedTheme);

      return generatedTheme;
    } catch (error) {
      throw new ThemeProcessingError(
        `Failed to process AI theme response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Validates AI response structure
   */
  private static validateAIResponse(response: AIThemeResponse): void {
    if (!response.studyColors || !response.breakColors) {
      throw new Error('Missing color information in AI response');
    }

    if (!response.visualElements) {
      throw new Error('Missing visual elements in AI response');
    }

    // Validate color objects
    this.validateColorObject(response.studyColors, 'studyColors');
    this.validateColorObject(response.breakColors, 'breakColors');
  }

  /**
   * Validates color object structure
   */
  private static validateColorObject(colors: any, context: string): void {
    const requiredFields = ['primary', 'secondary', 'accent'];
    for (const field of requiredFields) {
      if (!colors[field]) {
        throw new Error(`Missing ${field} color in ${context}`);
      }
      if (!this.isValidHexColor(colors[field])) {
        throw new Error(`Invalid hex color format for ${field} in ${context}: ${colors[field]}`);
      }
    }
  }

  /**
   * Converts AI color format to ThemeColors
   */
  private static convertToThemeColors(aiColors: any): ThemeColors {
    // Create gradient from primary and secondary colors
    const gradient = [aiColors.secondary, aiColors.primary];

    return {
      primary: aiColors.primary,
      secondary: aiColors.secondary,
      accent: aiColors.accent,
      gradient,
      background: aiColors.secondary, // Use secondary as background
    };
  }

  /**
   * Processes background elements from AI response
   */
  private static processBackgroundElements(visualElements: any): BackgroundElement[] {
    const elements: BackgroundElement[] = [];

    if (visualElements.backgroundType === 'particles' && visualElements.elements?.length > 0) {
      elements.push({
        type: 'particles',
        config: {
          pattern: visualElements.elements[0] || 'default',
          count: Math.min(15, Math.max(5, visualElements.elements.length * 3)),
          animationDuration: 6000,
          opacity: 0.4,
        },
      });
    } else if (visualElements.backgroundType === 'pattern' && visualElements.elements?.length > 0) {
      elements.push({
        type: 'pattern',
        config: {
          studyCharacter: visualElements.elements[0] || 'default-study',
          breakCharacter: visualElements.elements[1] || 'default-break',
          position: 'left-side',
          scale: 0.8,
        },
      });
    } else if (visualElements.backgroundType === 'gradient') {
      elements.push({
        type: 'gradient',
        config: {
          colors: visualElements.elements || ['#f0f0f0', '#e0e0e0'],
          direction: 'vertical',
        },
      });
    }

    return elements;
  }

  /**
   * Processes animations from AI response
   */
  private static processAnimations(animationSuggestions?: AnimationSuggestion[]): ThemeAnimations | undefined {
    if (!animationSuggestions || animationSuggestions.length === 0) {
      return {
        duration: 6000,
        easing: 'ease-in-out',
        particles: {
          count: 8,
          speed: 1,
          opacity: 0.4,
        },
      };
    }

    const firstAnimation = animationSuggestions[0];
    return {
      duration: Math.min(10000, Math.max(3000, firstAnimation.duration || 6000)),
      easing: 'ease-in-out',
      particles: {
        count: 8,
        speed: 1,
        opacity: 0.4,
      },
    };
  }

  /**
   * Generates unique theme ID
   */
  private static generateThemeId(prompt: string): string {
    const timestamp = Date.now();
    const promptHash = this.simpleHash(prompt);
    return `ai-theme-${promptHash}-${timestamp}`;
  }

  /**
   * Generates theme name from prompt
   */
  private static generateThemeName(prompt: string): string {
    // Capitalize first letter and limit length
    const cleaned = prompt.trim().toLowerCase();
    const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return capitalized.length > 20 ? capitalized.substring(0, 20) + '...' : capitalized;
  }

  /**
   * Simple hash function for generating IDs
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validates hex color format
   */
  private static isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Validates the final generated theme
   */
  private static validateGeneratedTheme(theme: GeneratedTheme): void {
    if (!theme.name || theme.name.trim().length === 0) {
      throw new Error('Generated theme must have a name');
    }

    if (!theme.studyColors || !theme.breakColors) {
      throw new Error('Generated theme must have both study and break colors');
    }

    if (!theme.id || !theme.originalPrompt) {
      throw new Error('Generated theme must have ID and original prompt');
    }

    // Validate accessibility (basic contrast check)
    this.validateAccessibility(theme.studyColors);
    this.validateAccessibility(theme.breakColors);
  }

  /**
   * Basic accessibility validation for color contrast
   */
  private static validateAccessibility(colors: ThemeColors): void {
    // This is a simplified check - in a real implementation, you'd use a proper contrast ratio calculator
    const primaryBrightness = this.getColorBrightness(colors.primary);
    const secondaryBrightness = this.getColorBrightness(colors.secondary);
    
    // Ensure there's sufficient contrast between primary and secondary colors
    const contrastRatio = Math.abs(primaryBrightness - secondaryBrightness);
    if (contrastRatio < 0.3) {
      console.warn('Generated theme may not meet accessibility contrast requirements');
    }
  }

  /**
   * Calculate relative brightness of a hex color (simplified)
   */
  private static getColorBrightness(hexColor: string): number {
    // Remove # and convert to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Calculate relative luminance (simplified)
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /**
   * Validates AI response against fallback theme for diversity
   */
  static validateAgainstFallback(aiResponse: AIThemeResponse): boolean {
    const fallbackValidation = colorDiversityValidator.validateAgainstFallback(aiResponse);
    return !fallbackValidation.isSimilar;
  }

  /**
   * Applies fallback colors if AI generation produces invalid results
   */
  static applyFallbackTheme(originalPrompt: string): GeneratedTheme {
    const fallbackColors: ThemeColors = {
      primary: '#6B73FF',
      secondary: '#F0F2FF',
      accent: '#4C51BF',
      gradient: ['#F0F2FF', '#E6E8FF'],
      background: '#F0F2FF',
    };

    const fallbackBreakColors: ThemeColors = {
      primary: '#48BB78',
      secondary: '#F0FFF4',
      accent: '#38A169',
      gradient: ['#F0FFF4', '#E6FFFA'],
      background: '#F0FFF4',
    };

    const fallbackTheme: GeneratedTheme = {
      id: this.generateThemeId(originalPrompt),
      name: this.generateThemeName(originalPrompt),
      studyColors: fallbackColors,
      breakColors: fallbackBreakColors,
      backgroundElements: [{
        type: 'gradient',
        config: {
          colors: ['#f8f9fa', '#e9ecef'],
          direction: 'vertical',
        },
      }],
      animations: {
        duration: 6000,
        easing: 'ease-in-out',
        particles: {
          count: 6,
          speed: 1,
          opacity: 0.3,
        },
      },
      originalPrompt,
      createdAt: Date.now(),
      isCustom: true,
      aiConfidence: 0.5,
      diversityValidation: {
        isUnique: false, // Fallback themes are not unique by definition
        similarityScore: 1.0,
        conflictingThemes: ['fallback'],
        recommendations: ['This is a fallback theme with default colors'],
        colorDistances: {
          studyColors: 0,
          breakColors: 0,
          overall: 0,
        },
      },
    };

    // Add fallback theme to session tracking
    colorDiversityValidator.addThemeToSession(fallbackTheme);

    return fallbackTheme;
  }
}

// Custom error class for theme processing errors
export class ThemeProcessingError extends Error {
  public readonly originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'ThemeProcessingError';
    this.originalError = originalError;
  }
}