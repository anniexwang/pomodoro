/**
 * AI Theme Service - Handles AI-powered theme generation
 */

import { EnhancedPromptBuilder, PromptOptions } from './enhanced-prompt-builder';

// AI Service Configuration
export interface AIServiceConfig {
  endpoint: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

// AI Theme Response from external service
export interface AIThemeResponse {
  studyColors: {
    primary: string;
    secondary: string;
    accent: string;
    description: string;
  };
  breakColors: {
    primary: string;
    secondary: string;
    accent: string;
    description: string;
  };
  visualElements: {
    backgroundType: 'pattern' | 'particles' | 'gradient';
    elements: string[];
    animations?: AnimationSuggestion[];
  };
  themeName: string;
  confidence: number;
}

export interface AnimationSuggestion {
  type: string;
  duration: number;
  properties: Record<string, any>;
}

// Prompt validation result
export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedPrompt?: string;
}

// AI Theme Engine Interface
export interface AIThemeEngine {
  generateTheme(prompt: string, options?: PromptOptions): Promise<AIThemeResponse>;
  validatePrompt(prompt: string): PromptValidationResult;
}

// OpenAI Service Adapter
export class OpenAIThemeAdapter implements AIThemeEngine {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Validates user prompt for theme generation
   */
  validatePrompt(prompt: string): PromptValidationResult {
    const errors: string[] = [];
    
    // Check length constraints (1-50 characters)
    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    } else if (prompt.trim().length > 50) {
      errors.push('Prompt must be 50 characters or less');
    }
    
    // Basic content filtering
    const inappropriateWords = ['hate', 'violence', 'explicit'];
    const lowerPrompt = prompt.toLowerCase();
    if (inappropriateWords.some(word => lowerPrompt.includes(word))) {
      errors.push('Prompt contains inappropriate content');
    }
    
    // Sanitize prompt
    const sanitizedPrompt = prompt.trim().replace(/[<>]/g, '');
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedPrompt: errors.length === 0 ? sanitizedPrompt : undefined,
    };
  }

  /**
   * Generates theme using OpenAI API with enhanced diversity prompts
   */
  async generateTheme(prompt: string, options?: PromptOptions): Promise<AIThemeResponse> {
    const validation = this.validatePrompt(prompt);
    if (!validation.isValid) {
      throw new Error(`Invalid prompt: ${validation.errors.join(', ')}`);
    }

    // Use enhanced prompt builder for diversity
    const promptOptions: PromptOptions = {
      includeAnimations: true,
      diversityLevel: 'standard',
      ...options
    };

    const enhancedPrompt = EnhancedPromptBuilder.buildPrompt(validation.sanitizedPrompt!, promptOptions);

    try {
      const response = await this.makeAPICall(enhancedPrompt.systemPrompt, enhancedPrompt.userPrompt);
      const aiResponse = this.parseAIResponse(response);
      
      // Validate diversity and contextual appropriateness before returning
      await this.validateThemeDiversity(aiResponse, validation.sanitizedPrompt);
      
      return aiResponse;
    } catch (error) {
      throw new AIServiceError(`Failed to generate theme: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }
  }

  /**
   * Validates theme diversity against fallback and session themes with enhanced error reporting
   */
  private async validateThemeDiversity(aiResponse: AIThemeResponse, originalPrompt?: string): Promise<void> {
    // Import here to avoid circular dependency
    const { colorDiversityValidator } = await import('./color-diversity-validator');
    const { contextualColorValidator } = await import('./contextual-color-validator');
    
    // Check against fallback theme with detailed reporting
    const fallbackValidation = colorDiversityValidator.validateAgainstFallback(aiResponse);
    if (fallbackValidation.isSimilar) {
      const distance = fallbackValidation.distance.toFixed(2);
      throw new Error(`Generated theme is too similar to fallback theme (distance: ${distance}, threshold: 50). Try a more specific or creative prompt.`);
    }

    // Check against session themes with enhanced feedback
    const sessionValidation = colorDiversityValidator.validateSessionUniqueness(aiResponse);
    if (!sessionValidation.isUnique) {
      const similarity = (sessionValidation.similarityScore * 100).toFixed(1);
      const conflictCount = sessionValidation.conflictingThemes.length;
      throw new Error(`Generated theme is too similar to ${conflictCount} recent theme(s) (${similarity}% similarity). ${sessionValidation.recommendations.join('. ')}`);
    }

    // Check contextual appropriateness with detailed scoring
    if (originalPrompt) {
      const contextualValidation = contextualColorValidator.validateContextualAppropriateness(originalPrompt, aiResponse);
      if (!contextualValidation.isAppropriate) {
        const colorScore = (contextualValidation.colorAppropriatenessScore * 100).toFixed(1);
        const animationScore = (contextualValidation.animationAppropriatenessScore * 100).toFixed(1);
        const issues = contextualValidation.issues.join('. ');
        const recommendations = contextualValidation.recommendations.join('. ');
        throw new Error(`Generated theme is not contextually appropriate for "${originalPrompt}" (color: ${colorScore}%, animation: ${animationScore}%). ${issues} ${recommendations}`);
      }
    }
  }

  /**
   * Makes the actual API call to OpenAI
   */
  private async makeAPICall(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
        } else if (response.status === 403) {
          throw new Error('API access forbidden. Please check your OpenAI account permissions.');
        } else if (response.status >= 500) {
          throw new Error('OpenAI service temporarily unavailable. Please try again later.');
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid JSON response from AI service');
      }
      
      // Validate response structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('Invalid API response: no choices returned');
      }
      
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid API response: no content in message');
      }
      
      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        } else if (error.message.includes('fetch')) {
          throw new Error('Network error - please check your internet connection');
        } else if (error.message.includes('JSON')) {
          throw new Error('Invalid response from AI service - please try again');
        }
      }
      
      throw error;
    }
  }

  /**
   * Parses and validates AI response
   */
  private parseAIResponse(response: string): AIThemeResponse {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      if (!parsed.studyColors || !parsed.breakColors || !parsed.themeName) {
        throw new Error('Invalid response format: missing required fields');
      }

      // Validate color format
      this.validateColorFormat(parsed.studyColors);
      this.validateColorFormat(parsed.breakColors);

      return parsed as AIThemeResponse;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Validates color format and accessibility
   */
  private validateColorFormat(colors: any): void {
    const requiredFields = ['primary', 'secondary', 'accent'];
    for (const field of requiredFields) {
      if (!colors[field] || !this.isValidHexColor(colors[field])) {
        throw new Error(`Invalid color format for ${field}: ${colors[field]}`);
      }
    }
  }

  /**
   * Validates hex color format
   */
  private isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }
}

// Custom error class for AI service errors
export class AIServiceError extends Error {
  public readonly originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'AIServiceError';
    this.originalError = originalError;
  }
}

// Default configuration for OpenAI
export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '', // Will be set from environment or user input
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
};