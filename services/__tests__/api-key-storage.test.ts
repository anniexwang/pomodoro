/**
 * API Key Storage Service Tests
 */

import * as SecureStore from 'expo-secure-store';
import {
    getAPIKey,
    getAPIKeyConfig,
    hasAPIKey,
    removeAPIKey,
    saveAPIKey,
    validateAPIKeyFormat
} from '../api-key-storage';

// Import the mocked module
import * as apiKeyConfig from '../api-key-config';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock the api-key-config module
jest.mock('../api-key-config', () => ({
  getDevelopmentAPIKey: jest.fn(),
  validateDevelopmentAPIKey: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockApiKeyConfig = apiKeyConfig as jest.Mocked<typeof apiKeyConfig>;

describe('APIKeyStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations to ensure clean state
    mockSecureStore.getItemAsync.mockReset();
    mockSecureStore.setItemAsync.mockReset();
    mockSecureStore.deleteItemAsync.mockReset();
    mockApiKeyConfig.getDevelopmentAPIKey.mockReset();
    mockApiKeyConfig.validateDevelopmentAPIKey.mockReset();
  });

  describe('validateAPIKeyFormat', () => {
    it('should validate correct OpenAI API key format', () => {
      const result = validateAPIKeyFormat('sk-1234567890abcdef1234567890abcdef');
      expect(result.isValid).toBe(true);
      expect(result.keyPreview).toBe('sk-12345...');
    });

    it('should reject empty API key', () => {
      const result = validateAPIKeyFormat('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key cannot be empty');
    });

    it('should reject API key without sk- prefix', () => {
      const result = validateAPIKeyFormat('1234567890abcdef1234567890abcdef');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('OpenAI API keys must start with "sk-"');
    });

    it('should reject too short API key', () => {
      const result = validateAPIKeyFormat('sk-123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key appears to be too short');
    });

    it('should reject API key with invalid characters', () => {
      const result = validateAPIKeyFormat('sk-1234567890abcdef@#$%');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key contains invalid characters');
    });
  });

  describe('saveAPIKey', () => {
    it('should save valid API key', async () => {
      const apiKey = 'sk-1234567890abcdef1234567890abcdef';
      mockSecureStore.setItemAsync.mockResolvedValue();

      await saveAPIKey(apiKey);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('openai_api_key', apiKey);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'api_key_config',
        expect.stringContaining('"hasKey":true')
      );
    });

    it('should reject empty API key', async () => {
      await expect(saveAPIKey('')).rejects.toThrow('API key cannot be empty');
    });

    it('should handle storage errors', async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      await expect(saveAPIKey('sk-1234567890abcdef1234567890abcdef')).rejects.toThrow(
        'Failed to save API key: Storage error'
      );
    });
  });

  describe('getAPIKey', () => {
    it('should retrieve stored API key', async () => {
      const apiKey = 'sk-1234567890abcdef1234567890abcdef';
      mockSecureStore.getItemAsync.mockResolvedValue(apiKey);

      const result = await getAPIKey();

      expect(result).toBe(apiKey);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('openai_api_key');
    });

    it('should return null when no key is stored', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockApiKeyConfig.getDevelopmentAPIKey.mockReturnValue(null);

      const result = await getAPIKey();

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));
      mockApiKeyConfig.getDevelopmentAPIKey.mockReturnValue(null);

      const result = await getAPIKey();

      expect(result).toBeNull();
    });
  });

  describe('hasAPIKey', () => {
    it('should return true when API key is configured', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('{"hasKey":true,"keySetAt":1234567890}');

      const result = await hasAPIKey();

      expect(result).toBe(true);
    });

    it('should return false when no API key is configured', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockApiKeyConfig.getDevelopmentAPIKey.mockReturnValue(null);

      const result = await hasAPIKey();

      expect(result).toBe(false);
    });
  });

  describe('removeAPIKey', () => {
    it('should remove stored API key and config', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      await removeAPIKey();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('openai_api_key');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('api_key_config');
    });

    it('should handle deletion errors', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('Deletion error'));

      await expect(removeAPIKey()).rejects.toThrow('Failed to remove API key');
    });
  });

  describe('getAPIKeyConfig', () => {
    it('should return stored configuration', async () => {
      const config = { hasKey: true, keySetAt: 1234567890, isValid: true };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(config));

      const result = await getAPIKeyConfig();

      expect(result).toEqual(config);
    });

    it('should return default config when none exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getAPIKeyConfig();

      expect(result).toEqual({ hasKey: false, keySetAt: 0 });
    });
  });
});