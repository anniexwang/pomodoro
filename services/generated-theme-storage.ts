/**
 * Generated Theme Storage - Handles persistence of AI-generated themes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedTheme } from './theme-processor';

// Storage keys
const GENERATED_THEMES_KEY = '@pomodoro_generated_themes';
const STORAGE_VERSION_KEY = '@pomodoro_themes_version';
const CURRENT_STORAGE_VERSION = 1;

// Storage schema
interface ThemeStorageSchema {
  version: number;
  generatedThemes: {
    [themeId: string]: GeneratedTheme;
  };
  metadata: {
    totalGenerated: number;
    lastCleanup: number;
  };
}

// Generated theme storage interface
export interface GeneratedThemeStorage {
  saveTheme(theme: GeneratedTheme): Promise<void>;
  loadThemes(): Promise<GeneratedTheme[]>;
  deleteTheme(themeId: string): Promise<void>;
  updateTheme(themeId: string, updates: Partial<GeneratedTheme>): Promise<void>;
  clearAllThemes(): Promise<void>;
  getThemeById(themeId: string): Promise<GeneratedTheme | null>;
}

// Implementation of generated theme storage
export class AsyncStorageThemeStorage implements GeneratedThemeStorage {
  /**
   * Saves a generated theme to storage
   */
  async saveTheme(theme: GeneratedTheme): Promise<void> {
    try {
      const storage = await this.loadStorage();
      
      // Add theme to storage
      storage.generatedThemes[theme.id] = theme;
      storage.metadata.totalGenerated = Object.keys(storage.generatedThemes).length;
      
      await this.saveStorage(storage);
      console.log(`Saved generated theme: ${theme.name} (${theme.id})`);
    } catch (error) {
      console.error('Failed to save generated theme:', error);
      throw new StorageError(`Failed to save theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads all generated themes from storage
   */
  async loadThemes(): Promise<GeneratedTheme[]> {
    try {
      const storage = await this.loadStorage();
      const themes = Object.values(storage.generatedThemes);
      
      // Sort by creation date (newest first)
      themes.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log(`Loaded ${themes.length} generated themes`);
      return themes;
    } catch (error) {
      console.error('Failed to load generated themes:', error);
      throw new StorageError(`Failed to load themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a generated theme from storage
   */
  async deleteTheme(themeId: string): Promise<void> {
    try {
      const storage = await this.loadStorage();
      
      if (!storage.generatedThemes[themeId]) {
        throw new Error(`Theme with ID ${themeId} not found`);
      }
      
      delete storage.generatedThemes[themeId];
      storage.metadata.totalGenerated = Object.keys(storage.generatedThemes).length;
      
      await this.saveStorage(storage);
      console.log(`Deleted generated theme: ${themeId}`);
    } catch (error) {
      console.error('Failed to delete generated theme:', error);
      throw new StorageError(`Failed to delete theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a generated theme in storage
   */
  async updateTheme(themeId: string, updates: Partial<GeneratedTheme>): Promise<void> {
    try {
      const storage = await this.loadStorage();
      
      const existingTheme = storage.generatedThemes[themeId];
      if (!existingTheme) {
        throw new Error(`Theme with ID ${themeId} not found`);
      }
      
      // Merge updates with existing theme
      storage.generatedThemes[themeId] = {
        ...existingTheme,
        ...updates,
        id: themeId, // Ensure ID cannot be changed
        isCustom: true, // Ensure this remains true
      };
      
      await this.saveStorage(storage);
      console.log(`Updated generated theme: ${themeId}`);
    } catch (error) {
      console.error('Failed to update generated theme:', error);
      throw new StorageError(`Failed to update theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clears all generated themes from storage
   */
  async clearAllThemes(): Promise<void> {
    try {
      const storage = await this.loadStorage();
      storage.generatedThemes = {};
      storage.metadata.totalGenerated = 0;
      storage.metadata.lastCleanup = Date.now();
      
      await this.saveStorage(storage);
      console.log('Cleared all generated themes');
    } catch (error) {
      console.error('Failed to clear generated themes:', error);
      throw new StorageError(`Failed to clear themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a specific theme by ID
   */
  async getThemeById(themeId: string): Promise<GeneratedTheme | null> {
    try {
      const storage = await this.loadStorage();
      return storage.generatedThemes[themeId] || null;
    } catch (error) {
      console.error('Failed to get theme by ID:', error);
      throw new StorageError(`Failed to get theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if a theme exists by ID
   */
  async themeExists(themeId: string): Promise<boolean> {
    try {
      const theme = await this.getThemeById(themeId);
      return theme !== null;
    } catch (error) {
      console.error('Failed to check theme existence:', error);
      return false;
    }
  }

  /**
   * Performs cleanup of old themes (optional maintenance)
   */
  async cleanupOldThemes(maxThemes: number = 50): Promise<number> {
    try {
      const storage = await this.loadStorage();
      const themes = Object.values(storage.generatedThemes);
      
      if (themes.length <= maxThemes) {
        return 0; // No cleanup needed
      }
      
      // Sort by creation date and keep only the newest themes
      themes.sort((a, b) => b.createdAt - a.createdAt);
      const themesToKeep = themes.slice(0, maxThemes);
      const themesToDelete = themes.slice(maxThemes);
      
      // Rebuild storage with only themes to keep
      const newGeneratedThemes: { [key: string]: GeneratedTheme } = {};
      themesToKeep.forEach(theme => {
        newGeneratedThemes[theme.id] = theme;
      });
      
      storage.generatedThemes = newGeneratedThemes;
      storage.metadata.totalGenerated = themesToKeep.length;
      storage.metadata.lastCleanup = Date.now();
      
      await this.saveStorage(storage);
      
      console.log(`Cleaned up ${themesToDelete.length} old themes, kept ${themesToKeep.length}`);
      return themesToDelete.length;
    } catch (error) {
      console.error('Failed to cleanup old themes:', error);
      throw new StorageError(`Failed to cleanup themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads storage schema from AsyncStorage
   */
  private async loadStorage(): Promise<ThemeStorageSchema> {
    try {
      // Check storage version
      const versionStr = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
      const version = versionStr ? parseInt(versionStr, 10) : 0;
      
      if (version < CURRENT_STORAGE_VERSION) {
        console.log(`Migrating storage from version ${version} to ${CURRENT_STORAGE_VERSION}`);
        return await this.migrateStorage(version);
      }
      
      // Load existing storage
      const storageStr = await AsyncStorage.getItem(GENERATED_THEMES_KEY);
      
      if (!storageStr) {
        // Return default storage schema
        return this.createDefaultStorage();
      }
      
      const storage = JSON.parse(storageStr) as ThemeStorageSchema;
      
      // Validate storage structure
      if (!storage.generatedThemes || !storage.metadata) {
        console.warn('Invalid storage structure, creating new storage');
        return this.createDefaultStorage();
      }
      
      return storage;
    } catch (error) {
      console.warn('Failed to load storage, creating new storage:', error);
      return this.createDefaultStorage();
    }
  }

  /**
   * Saves storage schema to AsyncStorage
   */
  private async saveStorage(storage: ThemeStorageSchema): Promise<void> {
    try {
      await AsyncStorage.setItem(GENERATED_THEMES_KEY, JSON.stringify(storage));
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION.toString());
    } catch (error) {
      throw new Error(`Failed to save storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates default storage schema
   */
  private createDefaultStorage(): ThemeStorageSchema {
    return {
      version: CURRENT_STORAGE_VERSION,
      generatedThemes: {},
      metadata: {
        totalGenerated: 0,
        lastCleanup: Date.now(),
      },
    };
  }

  /**
   * Migrates storage from older versions
   */
  private async migrateStorage(fromVersion: number): Promise<ThemeStorageSchema> {
    console.log(`Migrating theme storage from version ${fromVersion}`);
    
    // For now, just create new storage
    // In the future, add migration logic here
    const newStorage = this.createDefaultStorage();
    await this.saveStorage(newStorage);
    
    return newStorage;
  }
}

// Custom error class for storage errors
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Singleton instance
let storageInstance: GeneratedThemeStorage | null = null;

/**
 * Gets the singleton storage instance
 */
export function getGeneratedThemeStorage(): GeneratedThemeStorage {
  if (!storageInstance) {
    storageInstance = new AsyncStorageThemeStorage();
  }
  return storageInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetGeneratedThemeStorage(): void {
  storageInstance = null;
}