/**
 * AI Theme Services - Main exports for AI theme generation functionality
 */

// Core services
export { AIThemeGenerator, getAIThemeGenerator, resetAIThemeGenerator } from './ai-theme-generator';
export {
    AIServiceError,
    DEFAULT_AI_CONFIG, OpenAIThemeAdapter, type AIServiceConfig, type AIThemeEngine,
    type AIThemeResponse, type PromptValidationResult
} from './ai-theme-service';
export {
    APIKeyStorageService,
    getAPIKey,
    getAPIKeyConfig,
    getAPIKeyPreview,
    hasAPIKey,
    removeAPIKey,
    saveAPIKey,
    updateValidationStatus,
    validateAPIKeyFormat,
    type APIKeyConfig,
    type APIKeyValidationResult
} from './api-key-storage';
export {
    AsyncStorageThemeStorage, getGeneratedThemeStorage,
    resetGeneratedThemeStorage, StorageError, type GeneratedThemeStorage
} from './generated-theme-storage';
export { ThemeProcessingError, ThemeProcessor, type GeneratedTheme } from './theme-processor';

// Validation services
export {
    ColorDiversityValidator,
    colorDiversityValidator,
    type ColorDistance,
    type DiversityConfig,
    type DiversityValidationResult,
    type ThemeColorSummary
} from './color-diversity-validator';
export {
    ContextualColorValidator,
    contextualColorValidator,
    type ColorFamily,
    type ContextualValidationResult,
    type SemanticContext
} from './contextual-color-validator';
export {
    EnhancedPromptBuilder,
    type EnhancedPrompt,
    type PromptOptions,
    type SemanticContextMap
} from './enhanced-prompt-builder';

// Types
export type { ThemeGenerationOptions, ThemeGenerationResult } from './ai-theme-generator';

// Utility functions
export const validateThemePrompt = (prompt: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!prompt || prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  } else if (prompt.trim().length > 50) {
    errors.push('Prompt must be 50 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

import type { GeneratedTheme } from './theme-processor';

export const isGeneratedTheme = (theme: any): theme is GeneratedTheme => {
  return theme && typeof theme === 'object' && theme.isCustom === true && theme.id && theme.originalPrompt;
};