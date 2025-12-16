/**
 * API Key Storage Service - Secure storage and management of API keys
 */

import * as SecureStore from 'expo-secure-store';
import { getDevelopmentAPIKey } from './api-key-config';

// Storage keys for secure storage
const API_KEY_STORAGE_KEY = 'openai_api_key';
const API_KEY_CONFIG_KEY = 'api_key_config';

// API key configuration interface
export interface APIKeyConfig {
  hasKey: boolean;
  keySetAt: number;
  lastValidated?: number;
  isValid?: boolean;
}

// API key validation result
export interface APIKeyValidationResult {
  isValid: boolean;
  error?: string;
  keyPreview?: string; // First 8 characters for display
}

// API key storage service
export class APIKeyStorageService {
  /**
   * Saves an API key securely
   */
  static async saveAPIKey(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    try {
      // Store the API key securely
      await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey.trim());
      
      // Update configuration
      const config: APIKeyConfig = {
        hasKey: true,
        keySetAt: Date.now(),
        lastValidated: undefined,
        isValid: undefined,
      };
      
      await SecureStore.setItemAsync(API_KEY_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      throw new Error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves the stored API key
   */
  static async getAPIKey(): Promise<string | null> {
    try {
      const storedKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
      if (storedKey) {
        return storedKey;
      }
    } catch (error) {
      console.error('Failed to retrieve API key from secure storage:', error);
    }
    
    // Fallback to development API key if secure storage fails
    const devKey = getDevelopmentAPIKey();
    if (devKey) {
      console.log('Using development API key as fallback');
      return devKey;
    }
    
    return null;
  }

  /**
   * Gets API key configuration without exposing the actual key
   */
  static async getAPIKeyConfig(): Promise<APIKeyConfig> {
    try {
      const configStr = await SecureStore.getItemAsync(API_KEY_CONFIG_KEY);
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (error) {
      console.error('Failed to retrieve API key config:', error);
    }

    // Return default config if none exists
    return {
      hasKey: false,
      keySetAt: 0,
    };
  }

  /**
   * Updates API key validation status
   */
  static async updateValidationStatus(isValid: boolean): Promise<void> {
    try {
      const config = await APIKeyStorageService.getAPIKeyConfig();
      config.lastValidated = Date.now();
      config.isValid = isValid;
      
      await SecureStore.setItemAsync(API_KEY_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to update validation status:', error);
    }
  }

  /**
   * Removes the stored API key
   */
  static async removeAPIKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
      await SecureStore.deleteItemAsync(API_KEY_CONFIG_KEY);
    } catch (error) {
      console.error('Failed to remove API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  /**
   * Validates API key format (basic validation)
   */
  static validateAPIKeyFormat(apiKey: string): APIKeyValidationResult {
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        isValid: false,
        error: 'API key cannot be empty',
      };
    }

    const trimmedKey = apiKey.trim();

    // Basic OpenAI API key format validation
    if (!trimmedKey.startsWith('sk-')) {
      return {
        isValid: false,
        error: 'OpenAI API keys must start with "sk-"',
      };
    }

    if (trimmedKey.length < 20) {
      return {
        isValid: false,
        error: 'API key appears to be too short',
      };
    }

    // Check for valid characters (alphanumeric and some special chars)
    const validKeyPattern = /^sk-[A-Za-z0-9\-_]+$/;
    if (!validKeyPattern.test(trimmedKey)) {
      return {
        isValid: false,
        error: 'API key contains invalid characters',
      };
    }

    return {
      isValid: true,
      keyPreview: trimmedKey.substring(0, 8) + '...',
    };
  }

  /**
   * Gets a preview of the stored API key (first 8 characters)
   */
  static async getAPIKeyPreview(): Promise<string | null> {
    try {
      const apiKey = await APIKeyStorageService.getAPIKey();
      if (apiKey && apiKey.length >= 8) {
        return apiKey.substring(0, 8) + '...';
      }
      return null;
    } catch (error) {
      console.error('Failed to get API key preview:', error);
      return null;
    }
  }

  /**
   * Checks if an API key is currently stored
   */
  static async hasAPIKey(): Promise<boolean> {
    try {
      const config = await APIKeyStorageService.getAPIKeyConfig();
      if (config.hasKey) {
        return true;
      }
    } catch (error) {
      console.error('Failed to check API key existence:', error);
    }
    
    // Check if development API key is available
    const devKey = getDevelopmentAPIKey();
    return devKey !== null;
  }
}

// Convenience functions for easier usage
export const saveAPIKey = APIKeyStorageService.saveAPIKey;
export const getAPIKey = APIKeyStorageService.getAPIKey;
export const getAPIKeyConfig = APIKeyStorageService.getAPIKeyConfig;
export const updateValidationStatus = APIKeyStorageService.updateValidationStatus;
export const removeAPIKey = APIKeyStorageService.removeAPIKey;
export const validateAPIKeyFormat = APIKeyStorageService.validateAPIKeyFormat;
export const getAPIKeyPreview = APIKeyStorageService.getAPIKeyPreview;
export const hasAPIKey = APIKeyStorageService.hasAPIKey;