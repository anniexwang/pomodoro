/**
 * Contextual Color Validator - Validates theme appropriateness for specific prompts
 */

import { AIThemeResponse } from './ai-theme-service';

// Color family definitions for validation
export interface ColorFamily {
  name: string;
  hueRange: [number, number]; // HSL hue range (0-360)
  saturationRange: [number, number]; // HSL saturation range (0-100)
  lightnessRange: [number, number]; // HSL lightness range (0-100)
  expectedColors: string[]; // Example hex colors in this family
}

// Animation context mapping
export interface AnimationContext {
  appropriateTypes: string[];
  inappropriateTypes: string[];
  expectedMood: string[];
}

// Contextual validation result
export interface ContextualValidationResult {
  isAppropriate: boolean;
  colorAppropriatenessScore: number; // 0-1 scale
  animationAppropriatenessScore: number; // 0-1 scale
  overallScore: number; // 0-1 scale
  issues: string[];
  recommendations: string[];
}

// Semantic context mapping for prompts
export interface SemanticContext {
  keywords: string[];
  expectedColorFamilies: ColorFamily[];
  animationContext: AnimationContext;
  moodDescriptors: string[];
  visualMetaphors: string[];
}

/**
 * Contextual Color Validator Class
 */
export class ContextualColorValidator {
  private static readonly COLOR_FAMILIES: Record<string, ColorFamily> = {
    blues: {
      name: 'Blues',
      hueRange: [180, 240],
      saturationRange: [30, 100],
      lightnessRange: [20, 80],
      expectedColors: ['#0077BE', '#4A90E2', '#87CEEB', '#20B2AA', '#008B8B']
    },
    oranges: {
      name: 'Oranges/Reds',
      hueRange: [340, 60], // Wraparound range to include both reds (340-360) and oranges (0-60)
      saturationRange: [40, 100],
      lightnessRange: [30, 80],
      expectedColors: ['#FF6B35', '#F7931E', '#FFD23F', '#FF8C42', '#E74C3C']
    },
    greens: {
      name: 'Greens',
      hueRange: [80, 160],
      saturationRange: [30, 100],
      lightnessRange: [25, 75],
      expectedColors: ['#228B22', '#32CD32', '#90EE90', '#006400', '#8FBC8F']
    },
    purples: {
      name: 'Purples',
      hueRange: [240, 300],
      saturationRange: [30, 100],
      lightnessRange: [25, 75],
      expectedColors: ['#191970', '#4B0082', '#483D8B', '#6A5ACD', '#9370DB']
    },
    grays: {
      name: 'Grays/Blues',
      hueRange: [200, 240],
      saturationRange: [10, 50],
      lightnessRange: [40, 80],
      expectedColors: ['#708090', '#2F4F4F', '#B0C4DE', '#4682B4', '#5F9EA0']
    },
    pastels: {
      name: 'Pastels',
      hueRange: [0, 360],
      saturationRange: [20, 60],
      lightnessRange: [70, 90],
      expectedColors: ['#98FB98', '#FFB6C1', '#F0E68C', '#DDA0DD', '#87CEFA']
    },
    cool: {
      name: 'Cool Colors',
      hueRange: [180, 300],
      saturationRange: [20, 80],
      lightnessRange: [60, 90],
      expectedColors: ['#B0E0E6', '#E0FFFF', '#F0F8FF', '#DCDCDC', '#C0C0C0']
    }
  };

  private static readonly SEMANTIC_CONTEXTS: Record<string, SemanticContext> = {
    ocean: {
      keywords: ['ocean', 'sea', 'water', 'wave', 'marine', 'aquatic', 'blue', 'deep'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.blues,
        ContextualColorValidator.COLOR_FAMILIES.cool
      ],
      animationContext: {
        appropriateTypes: ['flowing', 'wave', 'ripple', 'drift', 'gentle', 'fluid'],
        inappropriateTypes: ['flicker', 'dance', 'intensity', 'sharp', 'angular'],
        expectedMood: ['calm', 'flowing', 'deep', 'refreshing', 'serene']
      },
      moodDescriptors: ['calm', 'flowing', 'deep', 'refreshing'],
      visualMetaphors: ['waves', 'currents', 'depths', 'tides']
    },
    sunset: {
      keywords: ['sunset', 'sunrise', 'golden', 'warm', 'evening', 'dusk', 'orange', 'red'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.oranges
      ],
      animationContext: {
        appropriateTypes: ['fade', 'glow', 'gradient-shift', 'gentle', 'warm', 'soft'],
        inappropriateTypes: ['sharp', 'cold', 'crystalline', 'harsh'],
        expectedMood: ['warm', 'peaceful', 'golden', 'serene']
      },
      moodDescriptors: ['warm', 'peaceful', 'golden', 'serene'],
      visualMetaphors: ['horizon', 'golden hour', 'warm glow', 'evening sky']
    },
    forest: {
      keywords: ['forest', 'tree', 'nature', 'green', 'woods', 'natural', 'leaf', 'plant'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.greens
      ],
      animationContext: {
        appropriateTypes: ['gentle-sway', 'organic', 'natural', 'growth', 'rustle'],
        inappropriateTypes: ['mechanical', 'artificial', 'harsh', 'metallic'],
        expectedMood: ['natural', 'grounded', 'fresh', 'alive']
      },
      moodDescriptors: ['natural', 'grounded', 'fresh', 'alive'],
      visualMetaphors: ['leaves', 'branches', 'canopy', 'growth']
    },
    mountain: {
      keywords: ['mountain', 'peak', 'stone', 'rock', 'elevation', 'high', 'summit'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.grays,
        ContextualColorValidator.COLOR_FAMILIES.blues
      ],
      animationContext: {
        appropriateTypes: ['steady', 'solid', 'majestic', 'strong', 'stable'],
        inappropriateTypes: ['fluid', 'flowing', 'soft', 'delicate'],
        expectedMood: ['strong', 'stable', 'elevated', 'enduring']
      },
      moodDescriptors: ['strong', 'stable', 'elevated', 'enduring'],
      visualMetaphors: ['peaks', 'stone', 'elevation', 'strength']
    },
    fire: {
      keywords: ['fire', 'flame', 'heat', 'energy', 'red', 'orange', 'burn', 'hot'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.oranges
      ],
      animationContext: {
        appropriateTypes: ['flicker', 'dance', 'intensity', 'dynamic', 'energetic'],
        inappropriateTypes: ['calm', 'still', 'cold', 'frozen', 'crystalline'],
        expectedMood: ['energetic', 'passionate', 'dynamic', 'intense']
      },
      moodDescriptors: ['energetic', 'passionate', 'dynamic', 'intense'],
      visualMetaphors: ['flames', 'ember', 'heat', 'energy']
    },
    space: {
      keywords: ['space', 'cosmic', 'star', 'galaxy', 'universe', 'nebula', 'dark', 'void'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.purples,
        ContextualColorValidator.COLOR_FAMILIES.blues
      ],
      animationContext: {
        appropriateTypes: ['drift', 'cosmic', 'stellar', 'mysterious', 'floating'],
        inappropriateTypes: ['earthly', 'grounded', 'natural', 'organic'],
        expectedMood: ['mysterious', 'vast', 'contemplative', 'infinite']
      },
      moodDescriptors: ['mysterious', 'vast', 'contemplative', 'infinite'],
      visualMetaphors: ['stars', 'nebula', 'cosmos', 'infinity']
    },
    spring: {
      keywords: ['spring', 'bloom', 'fresh', 'new', 'growth', 'renewal', 'pastel', 'light'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.pastels,
        ContextualColorValidator.COLOR_FAMILIES.greens
      ],
      animationContext: {
        appropriateTypes: ['bloom', 'gentle', 'fresh', 'growth', 'renewal'],
        inappropriateTypes: ['harsh', 'dark', 'heavy', 'winter'],
        expectedMood: ['fresh', 'hopeful', 'vibrant', 'renewing']
      },
      moodDescriptors: ['fresh', 'hopeful', 'vibrant', 'renewing'],
      visualMetaphors: ['blossoms', 'renewal', 'growth', 'awakening']
    },
    winter: {
      keywords: ['winter', 'snow', 'ice', 'cold', 'frost', 'white', 'crystal', 'frozen'],
      expectedColorFamilies: [
        ContextualColorValidator.COLOR_FAMILIES.cool,
        ContextualColorValidator.COLOR_FAMILIES.grays
      ],
      animationContext: {
        appropriateTypes: ['crystalline', 'crisp', 'serene', 'gentle', 'floating'],
        inappropriateTypes: ['warm', 'hot', 'fiery', 'intense', 'flicker'],
        expectedMood: ['crisp', 'clean', 'peaceful', 'pure']
      },
      moodDescriptors: ['crisp', 'clean', 'peaceful', 'pure'],
      visualMetaphors: ['snow', 'ice', 'frost', 'clarity']
    }
  };

  /**
   * Validates contextual appropriateness of a theme for a given prompt
   */
  validateContextualAppropriateness(
    prompt: string, 
    aiResponse: AIThemeResponse
  ): ContextualValidationResult {
    const context = this.identifySemanticContext(prompt);
    
    if (!context) {
      // No specific context identified, return neutral validation
      return {
        isAppropriate: true,
        colorAppropriatenessScore: 0.7, // Neutral score
        animationAppropriatenessScore: 0.7,
        overallScore: 0.7,
        issues: [],
        recommendations: ['Consider using more specific prompt keywords for better contextual validation']
      };
    }

    const colorScore = this.validateColorAppropriateness(aiResponse, context);
    const animationScore = this.validateAnimationAppropriateness(aiResponse, context);
    const overallScore = (colorScore.score + animationScore.score) / 2;

    const issues: string[] = [...colorScore.issues, ...animationScore.issues];
    const recommendations: string[] = [...colorScore.recommendations, ...animationScore.recommendations];

    return {
      isAppropriate: overallScore >= 0.6, // Threshold for appropriateness
      colorAppropriatenessScore: colorScore.score,
      animationAppropriatenessScore: animationScore.score,
      overallScore,
      issues,
      recommendations
    };
  }

  /**
   * Identifies semantic context from prompt
   */
  private identifySemanticContext(prompt: string): SemanticContext | null {
    const lowerPrompt = prompt.toLowerCase();
    
    // Find the best matching context based on keyword overlap
    let bestMatch: SemanticContext | null = null;
    let maxMatches = 0;

    for (const context of Object.values(ContextualColorValidator.SEMANTIC_CONTEXTS)) {
      const matches = context.keywords.filter(keyword => 
        lowerPrompt.includes(keyword)
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = context;
      }
    }

    return maxMatches > 0 ? bestMatch : null;
  }

  /**
   * Validates color appropriateness for the context
   */
  private validateColorAppropriateness(
    aiResponse: AIThemeResponse, 
    context: SemanticContext
  ): { score: number; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check study colors
    const studyColorScore = this.calculateColorFamilyMatch(
      [aiResponse.studyColors.primary, aiResponse.studyColors.secondary, aiResponse.studyColors.accent],
      context.expectedColorFamilies
    );

    // Check break colors
    const breakColorScore = this.calculateColorFamilyMatch(
      [aiResponse.breakColors.primary, aiResponse.breakColors.secondary, aiResponse.breakColors.accent],
      context.expectedColorFamilies
    );

    const averageScore = (studyColorScore + breakColorScore) / 2;

    if (studyColorScore < 0.4) {
      issues.push('Study colors do not match expected color families for this prompt');
      recommendations.push(`Consider using colors from: ${context.expectedColorFamilies.map(f => f.name).join(', ')}`);
    }

    if (breakColorScore < 0.4) {
      issues.push('Break colors do not match expected color families for this prompt');
      recommendations.push(`Consider using colors from: ${context.expectedColorFamilies.map(f => f.name).join(', ')}`);
    }

    return {
      score: averageScore,
      issues,
      recommendations
    };
  }

  /**
   * Validates animation appropriateness for the context
   */
  private validateAnimationAppropriateness(
    aiResponse: AIThemeResponse, 
    context: SemanticContext
  ): { score: number; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!aiResponse.visualElements?.animations || aiResponse.visualElements.animations.length === 0) {
      return {
        score: 0.5, // Neutral score for no animations
        issues: ['No animations specified'],
        recommendations: [`Consider adding ${context.animationContext.appropriateTypes.join(' or ')} animations`]
      };
    }

    let appropriateCount = 0;
    let inappropriateCount = 0;
    const totalAnimations = aiResponse.visualElements.animations.length;

    for (const animation of aiResponse.visualElements.animations) {
      const animationType = animation.type.toLowerCase();
      
      // Check if animation type matches appropriate types
      const isAppropriate = context.animationContext.appropriateTypes.some(type => 
        animationType.includes(type.toLowerCase()) || type.toLowerCase().includes(animationType)
      );
      
      const isInappropriate = context.animationContext.inappropriateTypes.some(type => 
        animationType.includes(type.toLowerCase()) || type.toLowerCase().includes(animationType)
      );

      if (isAppropriate) {
        appropriateCount++;
      } else if (isInappropriate) {
        inappropriateCount++;
        issues.push(`Animation type "${animation.type}" is inappropriate for this context`);
      }
    }

    if (inappropriateCount > 0) {
      recommendations.push(`Use ${context.animationContext.appropriateTypes.join(', ')} animations instead`);
    }

    if (appropriateCount === 0 && totalAnimations > 0) {
      recommendations.push(`Consider using contextually appropriate animations: ${context.animationContext.appropriateTypes.join(', ')}`);
    }

    // Calculate score based on appropriate vs inappropriate animations
    const score = totalAnimations > 0 
      ? Math.max(0, (appropriateCount - inappropriateCount) / totalAnimations)
      : 0.5;

    return {
      score: Math.max(0, Math.min(1, score)), // Clamp between 0 and 1
      issues,
      recommendations
    };
  }

  /**
   * Calculates how well colors match expected color families
   */
  private calculateColorFamilyMatch(colors: string[], expectedFamilies: ColorFamily[]): number {
    if (expectedFamilies.length === 0) return 0.5; // Neutral score if no expectations

    let totalScore = 0;
    let validColors = 0;

    for (const color of colors) {
      const hsl = this.hexToHsl(color);
      if (!hsl) continue;

      validColors++;
      let bestFamilyScore = 0;

      for (const family of expectedFamilies) {
        const familyScore = this.calculateColorFamilyScore(hsl, family);
        bestFamilyScore = Math.max(bestFamilyScore, familyScore);
      }

      totalScore += bestFamilyScore;
    }

    return validColors > 0 ? totalScore / validColors : 0;
  }

  /**
   * Calculates how well a color fits within a color family
   */
  private calculateColorFamilyScore(
    hsl: { h: number; s: number; l: number }, 
    family: ColorFamily
  ): number {
    // Check hue range (with wraparound for red colors)
    let hueScore = 0;
    const [minHue, maxHue] = family.hueRange;
    
    if (minHue <= maxHue) {
      // Normal range
      hueScore = (hsl.h >= minHue && hsl.h <= maxHue) ? 1 : 0;
    } else {
      // Wraparound range (e.g., 350-30 for reds)
      hueScore = (hsl.h >= minHue || hsl.h <= maxHue) ? 1 : 0;
    }

    // If hue doesn't match at all, return very low score
    if (hueScore === 0) {
      // Calculate distance from nearest hue boundary
      let hueDistance = 0;
      if (minHue <= maxHue) {
        hueDistance = Math.min(
          Math.abs(hsl.h - minHue),
          Math.abs(hsl.h - maxHue)
        );
      } else {
        // Wraparound case
        const distToMin = Math.min(Math.abs(hsl.h - minHue), 360 - Math.abs(hsl.h - minHue));
        const distToMax = Math.min(Math.abs(hsl.h - maxHue), 360 - Math.abs(hsl.h - maxHue));
        hueDistance = Math.min(distToMin, distToMax);
      }
      
      // Very harsh penalty for wrong hue family
      hueScore = Math.max(0, 1 - hueDistance / 60); // Penalty increases with hue distance
      if (hueDistance > 60) hueScore = 0; // Complete mismatch for distant hues
    }

    // Check saturation range
    const [minSat, maxSat] = family.saturationRange;
    const satScore = (hsl.s >= minSat && hsl.s <= maxSat) ? 1 : 
      Math.max(0, 1 - Math.abs(hsl.s - (minSat + maxSat) / 2) / 50);

    // Check lightness range
    const [minLight, maxLight] = family.lightnessRange;
    const lightScore = (hsl.l >= minLight && hsl.l <= maxLight) ? 1 : 
      Math.max(0, 1 - Math.abs(hsl.l - (minLight + maxLight) / 2) / 50);

    // Weighted average (hue is most important for family matching)
    return (hueScore * 0.7 + satScore * 0.2 + lightScore * 0.1);
  }

  /**
   * Converts hex color to HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Converts hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }

  /**
   * Gets available semantic contexts for reference
   */
  static getAvailableContexts(): string[] {
    return Object.keys(ContextualColorValidator.SEMANTIC_CONTEXTS);
  }

  /**
   * Gets expected color families for a specific context
   */
  static getExpectedColorFamilies(contextName: string): ColorFamily[] {
    const context = ContextualColorValidator.SEMANTIC_CONTEXTS[contextName];
    return context ? context.expectedColorFamilies : [];
  }

  /**
   * Gets expected animation types for a specific context
   */
  static getExpectedAnimations(contextName: string): string[] {
    const context = ContextualColorValidator.SEMANTIC_CONTEXTS[contextName];
    return context ? context.animationContext.appropriateTypes : [];
  }
}

// Export singleton instance for global use
export const contextualColorValidator = new ContextualColorValidator();