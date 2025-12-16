/**
 * AI Theme Generator - Main service for AI-powered theme generation
 */

import {
    AIServiceConfig,
    AIServiceError,
    AIThemeEngine,
    AIThemeResponse,
    DEFAULT_AI_CONFIG,
    OpenAIThemeAdapter
} from './ai-theme-service';
import { getDevelopmentAPIKey } from './api-key-config';
import { getAPIKey } from './api-key-storage';
import { ContextualValidationResult } from './contextual-color-validator';
import { PromptOptions, ThemeColorSummary } from './enhanced-prompt-builder';
import { GeneratedTheme, ThemeProcessor } from './theme-processor';

// Theme generation options
export interface ThemeGenerationOptions {
  timeout?: number;
  retryAttempts?: number;
  fallbackOnError?: boolean;
  diversityLevel?: 'standard' | 'high' | 'maximum';
  previousThemes?: ThemeColorSummary[];
}

// Theme generation result
export interface ThemeGenerationResult {
  success: boolean;
  theme?: GeneratedTheme;
  error?: string;
  usedFallback?: boolean;
}

// Main AI Theme Generator class
export class AIThemeGenerator {
  private aiEngine: AIThemeEngine;
  private config: AIServiceConfig;
  private sessionThemes: Map<string, ThemeColorSummary> = new Map();

  constructor(apiKey?: string, customConfig?: Partial<AIServiceConfig>) {
    this.config = {
      ...DEFAULT_AI_CONFIG,
      ...customConfig,
      apiKey: apiKey || customConfig?.apiKey || '',
    };

    this.aiEngine = new OpenAIThemeAdapter(this.config);
  }

  /**
   * Initializes the AI engine with stored API key or development key
   */
  private async initializeWithStoredKey(): Promise<void> {
    if (!this.config.apiKey) {
      // Try to get stored key first
      let apiKey = await getAPIKey();
      
      // If no stored key, try development key
      if (!apiKey) {
        apiKey = getDevelopmentAPIKey();
        if (apiKey) {
          console.log('[AI Theme Generator] Using development API key');
        }
      }
      
      if (apiKey) {
        this.config.apiKey = apiKey;
        this.aiEngine = new OpenAIThemeAdapter(this.config);
      }
    }
  }

  /**
   * Generates a theme from a text prompt with enhanced diversity
   */
  async generateTheme(
    prompt: string, 
    options: ThemeGenerationOptions = {}
  ): Promise<ThemeGenerationResult> {
    const {
      retryAttempts = Math.min(this.config.retryAttempts, 2), // Limit to max 2 attempts as per requirements
      fallbackOnError = true,
      diversityLevel = 'standard',
      previousThemes
    } = options;

    // Initialize with stored API key if needed
    await this.initializeWithStoredKey();

    // Check if API key is available
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'No API key configured. Please add your OpenAI API key in settings.',
      };
    }

    // Validate prompt first
    const validation = this.aiEngine.validatePrompt(prompt);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid prompt: ${validation.errors.join(', ')}`,
      };
    }

    // Prepare diversity options with session themes
    const sessionThemesList = Array.from(this.sessionThemes.values());
    const allPreviousThemes = [...sessionThemesList, ...(previousThemes || [])];
    
    const promptOptions: PromptOptions = {
      includeAnimations: true,
      diversityLevel,
      previousThemes: allPreviousThemes,
      sessionId: Date.now().toString()
    };

    let lastError: Error | null = null;
    let diversityFailures = 0;

    // Enhanced retry logic with diversity-focused variations
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`[AI Theme Generator] Generating theme for prompt: "${prompt}" (attempt ${attempt}/${retryAttempts}, diversity: ${promptOptions.diversityLevel})`);
        
        // Escalate diversity level on retries to encourage different results
        if (attempt > 1) {
          promptOptions.diversityLevel = attempt === 2 ? 'high' : 'maximum';
          console.log(`[AI Theme Generator] Escalating diversity level to: ${promptOptions.diversityLevel}`);
        }
        
        // Generate theme with AI using enhanced prompts and diversity validation
        const aiResponse = await this.aiEngine.generateTheme(prompt, promptOptions);
        
        // Additional diversity validation before processing
        const diversityCheck = await this.validateThemeDiversity(aiResponse, prompt, allPreviousThemes);
        if (!diversityCheck.isValid) {
          diversityFailures++;
          throw new Error(`Diversity validation failed: ${diversityCheck.reason}. ${diversityCheck.suggestions.join(' ')}`);
        }
        
        // Process AI response to ThemeConfig format (includes built-in diversity validation)
        const generatedTheme = ThemeProcessor.processAIResponse(aiResponse, prompt);
        
        // Verify contextual appropriateness
        const contextualCheck = await this.validateContextualAppropriateness(prompt, aiResponse);
        if (!contextualCheck.isAppropriate) {
          throw new Error(`Theme not contextually appropriate: ${contextualCheck.issues.join('. ')} ${contextualCheck.recommendations.join(' ')}`);
        }
        
        // Track this theme for future diversity checking
        this.addToSessionThemes(generatedTheme);
        
        console.log(`[AI Theme Generator] Successfully generated diverse theme: ${generatedTheme.name} (diversity score: ${contextualCheck.overallScore.toFixed(2)})`);
        
        return {
          success: true,
          theme: generatedTheme,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[AI Theme Generator] Attempt ${attempt} failed:`, lastError.message);
        
        // Check if this is a diversity-related failure
        if (lastError.message.includes('diversity') || lastError.message.includes('similar')) {
          diversityFailures++;
          console.log(`[AI Theme Generator] Diversity failure count: ${diversityFailures}`);
        }
        
        // If this is the last attempt or a non-retryable error, break
        if (attempt === retryAttempts || this.isNonRetryableError(error)) {
          break;
        }
        
        // Add randomization to prompt options for next attempt
        promptOptions.sessionId = `${Date.now()}-retry-${attempt}`;
        
        // Wait before retrying (shorter delay for diversity failures)
        const delay = lastError.message.includes('diversity') ? 500 : Math.pow(2, attempt - 1) * 1000;
        await this.delay(delay);
      }
    }

    // Enhanced error reporting for diversity failures
    let errorMessage = lastError?.message || 'Theme generation failed after all retry attempts';
    if (diversityFailures > 0) {
      errorMessage += ` (${diversityFailures} diversity validation failures)`;
    }

    // If all attempts failed, try fallback if enabled
    if (fallbackOnError) {
      try {
        console.log('[AI Theme Generator] Applying fallback theme due to generation failure');
        const fallbackTheme = ThemeProcessor.applyFallbackTheme(prompt);
        
        return {
          success: true,
          theme: fallbackTheme,
          error: `AI generation failed: ${errorMessage}. Using fallback theme.`,
          usedFallback: true,
        };
      } catch {
        return {
          success: false,
          error: `Both AI generation and fallback failed: ${errorMessage}`,
        };
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Validates if the service is properly configured
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey || this.config.apiKey.trim().length === 0) {
      errors.push('API key is required');
    }

    if (!this.config.endpoint || !this.isValidUrl(this.config.endpoint)) {
      errors.push('Valid API endpoint is required');
    }

    if (this.config.timeout <= 0) {
      errors.push('Timeout must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Updates the API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.aiEngine = new OpenAIThemeAdapter(this.config);
  }

  /**
   * Gets current configuration (without exposing API key)
   */
  getConfiguration(): Omit<AIServiceConfig, 'apiKey'> {
    return {
      endpoint: this.config.endpoint,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts,
    };
  }

  /**
   * Tests the AI service connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Initialize with stored API key if needed
      await this.initializeWithStoredKey();

      // Check if API key is available
      if (!this.config.apiKey) {
        return { success: false, error: 'No API key configured' };
      }

      // Use a simple test prompt
      const testPrompt = 'ocean';
      const validation = this.aiEngine.validatePrompt(testPrompt);
      
      if (!validation.isValid) {
        return { success: false, error: 'Prompt validation failed' };
      }

      // Try to generate a theme with a short timeout
      const testConfig = { ...this.config, timeout: 5000 };
      const testEngine = new OpenAIThemeAdapter(testConfig);
      
      await testEngine.generateTheme(testPrompt, {
        includeAnimations: true,
        diversityLevel: 'standard'
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Determines if an error is retryable
   */
  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof AIServiceError || error instanceof Error) {
      const message = error.message.toLowerCase();
      // Don't retry on authentication, invalid prompt, parsing errors, or forbidden access
      return message.includes('invalid api key') || 
             message.includes('invalid prompt') || 
             message.includes('failed to parse') ||
             message.includes('forbidden') ||
             message.includes('invalid response from ai service');
    }
    return false;
  }

  /**
   * Validates URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Adds a generated theme to session tracking for diversity checking
   */
  private addToSessionThemes(theme: GeneratedTheme): void {
    const themeId = `${theme.originalPrompt}-${theme.createdAt}`;
    const colorSummary: ThemeColorSummary = {
      studyPrimary: theme.studyColors.primary,
      studySecondary: theme.studyColors.secondary,
      breakPrimary: theme.breakColors.primary,
      breakSecondary: theme.breakColors.secondary,
      animationType: theme.animations?.particles ? 'particles' : 'gradient'
    };
    
    this.sessionThemes.set(themeId, colorSummary);
    
    // Keep only last 10 themes to prevent memory bloat
    if (this.sessionThemes.size > 10) {
      const firstKey = this.sessionThemes.keys().next().value;
      if (firstKey) {
        this.sessionThemes.delete(firstKey);
      }
    }
  }

  /**
   * Gets current session themes for diversity checking
   */
  getSessionThemes(): ThemeColorSummary[] {
    return Array.from(this.sessionThemes.values());
  }

  /**
   * Clears session theme history
   */
  clearSessionThemes(): void {
    this.sessionThemes.clear();
  }

  /**
   * Validates theme diversity against session themes and fallback
   */
  private async validateThemeDiversity(
    aiResponse: AIThemeResponse, 
    originalPrompt: string, 
    previousThemes: ThemeColorSummary[]
  ): Promise<{ isValid: boolean; reason: string; suggestions: string[] }> {
    try {
      // Import validators to avoid circular dependency
      const { colorDiversityValidator } = await import('./color-diversity-validator');
      
      // Check against fallback theme
      const fallbackValidation = colorDiversityValidator.validateAgainstFallback(aiResponse);
      if (fallbackValidation.isSimilar) {
        return {
          isValid: false,
          reason: `Theme too similar to fallback (distance: ${fallbackValidation.distance.toFixed(2)})`,
          suggestions: ['Try a more specific or creative prompt', 'Use different color keywords']
        };
      }

      // Check session uniqueness
      const sessionValidation = colorDiversityValidator.validateSessionUniqueness(aiResponse);
      if (!sessionValidation.isUnique) {
        return {
          isValid: false,
          reason: `Theme too similar to recent themes (similarity: ${sessionValidation.similarityScore.toFixed(2)})`,
          suggestions: sessionValidation.recommendations
        };
      }

      return { isValid: true, reason: 'Theme passes diversity validation', suggestions: [] };
    } catch (error) {
      console.warn('[AI Theme Generator] Diversity validation error:', error);
      return { isValid: true, reason: 'Diversity validation skipped due to error', suggestions: [] };
    }
  }

  /**
   * Validates contextual appropriateness of theme for prompt
   */
  private async validateContextualAppropriateness(
    prompt: string, 
    aiResponse: AIThemeResponse
  ): Promise<ContextualValidationResult> {
    try {
      // Import validator to avoid circular dependency
      const { contextualColorValidator } = await import('./contextual-color-validator');
      
      return contextualColorValidator.validateContextualAppropriateness(prompt, aiResponse);
    } catch (error) {
      console.warn('[AI Theme Generator] Contextual validation error:', error);
      // Return neutral validation if validator fails
      return {
        isAppropriate: true,
        colorAppropriatenessScore: 0.7,
        animationAppropriatenessScore: 0.7,
        overallScore: 0.7,
        issues: [],
        recommendations: []
      };
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for app-wide use
let aiThemeGeneratorInstance: AIThemeGenerator | null = null;

/**
 * Gets or creates the singleton AI theme generator instance
 */
export function getAIThemeGenerator(apiKey?: string): AIThemeGenerator {
  if (!aiThemeGeneratorInstance) {
    aiThemeGeneratorInstance = new AIThemeGenerator(apiKey);
  } else if (apiKey && apiKey !== '') {
    // Update existing instance with new API key
    aiThemeGeneratorInstance.updateApiKey(apiKey);
  }
  return aiThemeGeneratorInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetAIThemeGenerator(): void {
  aiThemeGeneratorInstance = null;
}