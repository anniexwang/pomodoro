/**
 * Color Diversity Validator - Validates theme diversity and uniqueness
 */

import { ThemeColors } from '@/types/timer';
import { AIThemeResponse } from './ai-theme-service';
import { GeneratedTheme } from './theme-processor';

// Color distance calculation result
export interface ColorDistance {
  distance: number;
  isSimilar: boolean;
}

// Theme color summary for comparison
export interface ThemeColorSummary {
  studyPrimary: string;
  studySecondary: string;
  studyAccent: string;
  breakPrimary: string;
  breakSecondary: string;
  breakAccent: string;
  animationType?: string;
}

// Diversity validation result
export interface DiversityValidationResult {
  isUnique: boolean;
  similarityScore: number;
  conflictingThemes: string[];
  recommendations: string[];
  colorDistances: {
    studyColors: number;
    breakColors: number;
    overall: number;
  };
}

// Diversity validation configuration
export interface DiversityConfig {
  minColorDistance: number;
  maxSimilarityScore: number;
  fallbackThemeColors: ThemeColorSummary;
}

// Default fallback theme colors (from theme-processor.ts)
const DEFAULT_FALLBACK_COLORS: ThemeColorSummary = {
  studyPrimary: '#6B73FF',
  studySecondary: '#F0F2FF',
  studyAccent: '#4C51BF',
  breakPrimary: '#48BB78',
  breakSecondary: '#F0FFF4',
  breakAccent: '#38A169',
};

// Default diversity configuration
const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  minColorDistance: 50, // Minimum RGB distance for uniqueness
  maxSimilarityScore: 0.7, // Maximum similarity score (0-1) - more lenient
  fallbackThemeColors: DEFAULT_FALLBACK_COLORS,
};

/**
 * Color Diversity Validator Class
 */
export class ColorDiversityValidator {
  private config: DiversityConfig;
  private sessionThemes: Map<string, ThemeColorSummary>;

  constructor(config: Partial<DiversityConfig> = {}) {
    this.config = { ...DEFAULT_DIVERSITY_CONFIG, ...config };
    this.sessionThemes = new Map();
  }

  /**
   * Calculate RGB distance between two hex colors
   */
  calculateRGBDistance(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return 0;
    }

    // Calculate Euclidean distance in RGB space
    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;

    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }

  /**
   * Calculate color distance between two theme color sets
   */
  calculateThemeColorDistance(colors1: ThemeColors, colors2: ThemeColors): number {
    const primaryDistance = this.calculateRGBDistance(colors1.primary, colors2.primary);
    const secondaryDistance = this.calculateRGBDistance(colors1.secondary, colors2.secondary);
    const accentDistance = this.calculateRGBDistance(colors1.accent, colors2.accent);

    // Weighted average (primary color has more weight)
    return (primaryDistance * 0.5 + secondaryDistance * 0.3 + accentDistance * 0.2);
  }

  /**
   * Check if generated colors differ from fallback theme
   */
  validateAgainstFallback(aiResponse: AIThemeResponse): ColorDistance {
    const fallbackStudyColors: ThemeColors = {
      primary: this.config.fallbackThemeColors.studyPrimary,
      secondary: this.config.fallbackThemeColors.studySecondary,
      accent: this.config.fallbackThemeColors.studyAccent,
      gradient: [],
    };

    const fallbackBreakColors: ThemeColors = {
      primary: this.config.fallbackThemeColors.breakPrimary,
      secondary: this.config.fallbackThemeColors.breakSecondary,
      accent: this.config.fallbackThemeColors.breakAccent,
      gradient: [],
    };

    const generatedStudyColors: ThemeColors = {
      primary: aiResponse.studyColors.primary,
      secondary: aiResponse.studyColors.secondary,
      accent: aiResponse.studyColors.accent,
      gradient: [],
    };

    const generatedBreakColors: ThemeColors = {
      primary: aiResponse.breakColors.primary,
      secondary: aiResponse.breakColors.secondary,
      accent: aiResponse.breakColors.accent,
      gradient: [],
    };

    const studyDistance = this.calculateThemeColorDistance(generatedStudyColors, fallbackStudyColors);
    const breakDistance = this.calculateThemeColorDistance(generatedBreakColors, fallbackBreakColors);
    const averageDistance = (studyDistance + breakDistance) / 2;

    return {
      distance: averageDistance,
      isSimilar: averageDistance < this.config.minColorDistance,
    };
  }

  /**
   * Check uniqueness against previous themes in session
   */
  validateSessionUniqueness(aiResponse: AIThemeResponse): DiversityValidationResult {
    const newThemeSummary = this.createThemeColorSummary(aiResponse);
    const conflictingThemes: string[] = [];
    let minDistance = Infinity;
    let maxSimilarity = 0;

    // Check against all session themes
    for (const [themeId, existingTheme] of this.sessionThemes) {
      const similarity = this.calculateThemeSimilarity(newThemeSummary, existingTheme);
      const distance = this.calculateSummaryDistance(newThemeSummary, existingTheme);

      if (similarity > this.config.maxSimilarityScore) {
        conflictingThemes.push(themeId);
      }

      minDistance = Math.min(minDistance, distance);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Calculate color distances for detailed reporting
    const studyColors: ThemeColors = {
      primary: aiResponse.studyColors.primary,
      secondary: aiResponse.studyColors.secondary,
      accent: aiResponse.studyColors.accent,
      gradient: [],
    };

    const breakColors: ThemeColors = {
      primary: aiResponse.breakColors.primary,
      secondary: aiResponse.breakColors.secondary,
      accent: aiResponse.breakColors.accent,
      gradient: [],
    };

    const fallbackStudyColors: ThemeColors = {
      primary: this.config.fallbackThemeColors.studyPrimary,
      secondary: this.config.fallbackThemeColors.studySecondary,
      accent: this.config.fallbackThemeColors.studyAccent,
      gradient: [],
    };

    const fallbackBreakColors: ThemeColors = {
      primary: this.config.fallbackThemeColors.breakPrimary,
      secondary: this.config.fallbackThemeColors.breakSecondary,
      accent: this.config.fallbackThemeColors.breakAccent,
      gradient: [],
    };

    const studyDistance = this.calculateThemeColorDistance(studyColors, fallbackStudyColors);
    const breakDistance = this.calculateThemeColorDistance(breakColors, fallbackBreakColors);
    const overallDistance = (studyDistance + breakDistance) / 2;

    const recommendations: string[] = [];
    if (conflictingThemes.length > 0) {
      recommendations.push('Try a different color palette to avoid similarity with recent themes');
    }
    if (overallDistance < this.config.minColorDistance) {
      recommendations.push('Generated colors are too similar to default fallback theme');
    }

    return {
      isUnique: conflictingThemes.length === 0 && overallDistance >= this.config.minColorDistance,
      similarityScore: maxSimilarity,
      conflictingThemes,
      recommendations,
      colorDistances: {
        studyColors: studyDistance,
        breakColors: breakDistance,
        overall: overallDistance,
      },
    };
  }

  /**
   * Add theme to session tracking
   */
  addThemeToSession(theme: GeneratedTheme): void {
    const summary = this.createThemeColorSummaryFromGenerated(theme);
    this.sessionThemes.set(theme.id, summary);

    // Limit session history to prevent memory bloat (keep last 10 themes)
    if (this.sessionThemes.size > 10) {
      const firstKey = this.sessionThemes.keys().next().value;
      if (firstKey) {
        this.sessionThemes.delete(firstKey);
      }
    }
  }

  /**
   * Clear session theme history
   */
  clearSession(): void {
    this.sessionThemes.clear();
  }

  /**
   * Get current session theme count
   */
  getSessionThemeCount(): number {
    return this.sessionThemes.size;
  }

  /**
   * Create theme color summary from AI response
   */
  private createThemeColorSummary(aiResponse: AIThemeResponse): ThemeColorSummary {
    return {
      studyPrimary: aiResponse.studyColors.primary,
      studySecondary: aiResponse.studyColors.secondary,
      studyAccent: aiResponse.studyColors.accent,
      breakPrimary: aiResponse.breakColors.primary,
      breakSecondary: aiResponse.breakColors.secondary,
      breakAccent: aiResponse.breakColors.accent,
      animationType: aiResponse.visualElements?.animations?.[0]?.type,
    };
  }

  /**
   * Create theme color summary from generated theme
   */
  private createThemeColorSummaryFromGenerated(theme: GeneratedTheme): ThemeColorSummary {
    return {
      studyPrimary: theme.studyColors.primary,
      studySecondary: theme.studyColors.secondary,
      studyAccent: theme.studyColors.accent,
      breakPrimary: theme.breakColors.primary,
      breakSecondary: theme.breakColors.secondary,
      breakAccent: theme.breakColors.accent,
      animationType: theme.animations?.particles ? 'particles' : undefined,
    };
  }

  /**
   * Calculate similarity between two theme summaries
   */
  private calculateThemeSimilarity(theme1: ThemeColorSummary, theme2: ThemeColorSummary): number {
    const studyPrimaryDist = this.calculateRGBDistance(theme1.studyPrimary, theme2.studyPrimary);
    const studySecondaryDist = this.calculateRGBDistance(theme1.studySecondary, theme2.studySecondary);
    const studyAccentDist = this.calculateRGBDistance(theme1.studyAccent, theme2.studyAccent);
    const breakPrimaryDist = this.calculateRGBDistance(theme1.breakPrimary, theme2.breakPrimary);
    const breakSecondaryDist = this.calculateRGBDistance(theme1.breakSecondary, theme2.breakSecondary);
    const breakAccentDist = this.calculateRGBDistance(theme1.breakAccent, theme2.breakAccent);

    // Calculate average distance
    const avgDistance = (studyPrimaryDist + studySecondaryDist + studyAccentDist + 
                        breakPrimaryDist + breakSecondaryDist + breakAccentDist) / 6;

    // Convert distance to similarity score (0-1, where 1 is identical)
    const maxDistance = 441.67; // Maximum possible RGB distance (sqrt(255^2 + 255^2 + 255^2))
    return 1 - (avgDistance / maxDistance);
  }

  /**
   * Calculate distance between two theme summaries
   */
  private calculateSummaryDistance(theme1: ThemeColorSummary, theme2: ThemeColorSummary): number {
    const studyPrimaryDist = this.calculateRGBDistance(theme1.studyPrimary, theme2.studyPrimary);
    const studySecondaryDist = this.calculateRGBDistance(theme1.studySecondary, theme2.studySecondary);
    const studyAccentDist = this.calculateRGBDistance(theme1.studyAccent, theme2.studyAccent);
    const breakPrimaryDist = this.calculateRGBDistance(theme1.breakPrimary, theme2.breakPrimary);
    const breakSecondaryDist = this.calculateRGBDistance(theme1.breakSecondary, theme2.breakSecondary);
    const breakAccentDist = this.calculateRGBDistance(theme1.breakAccent, theme2.breakAccent);

    // Return average distance
    return (studyPrimaryDist + studySecondaryDist + studyAccentDist + 
            breakPrimaryDist + breakSecondaryDist + breakAccentDist) / 6;
  }

  /**
   * Convert hex color to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }
}

// Export singleton instance for global use
export const colorDiversityValidator = new ColorDiversityValidator();