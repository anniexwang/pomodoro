import {
    DEFAULT_TIMER_CONFIG,
    DURATION_LIMITS,
    DurationSettingsService as IDurationSettingsService,
    PersistedDurationSettings,
    TimerConfig
} from '@/types/timer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DURATION_SETTINGS_KEY = '@pomodoro_duration_settings';

/**
 * Service for managing user-configurable timer durations with validation and persistence
 */
export class DurationSettingsService implements IDurationSettingsService {
  private static instance: DurationSettingsService;
  private cachedSettings: TimerConfig | null = null;

  private constructor() {}

  public static getInstance(): DurationSettingsService {
    if (!DurationSettingsService.instance) {
      DurationSettingsService.instance = new DurationSettingsService();
    }
    return DurationSettingsService.instance;
  }

  /**
   * Get current duration settings, loading from storage if needed
   */
  public async getSettings(): Promise<TimerConfig> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      const stored = await AsyncStorage.getItem(DURATION_SETTINGS_KEY);
      if (stored) {
        const parsed: PersistedDurationSettings = JSON.parse(stored);
        this.cachedSettings = {
          studyDuration: parsed.studyDuration,
          breakDuration: parsed.breakDuration,
        };
        return this.cachedSettings;
      }
    } catch (error) {
      console.warn('Failed to load duration settings:', error);
    }

    // Return defaults if no stored settings or error occurred
    this.cachedSettings = { ...DEFAULT_TIMER_CONFIG };
    return this.cachedSettings;
  }

  /**
   * Update duration settings with validation and persistence
   */
  public async updateSettings(config: Partial<TimerConfig>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings: TimerConfig = {
      studyDuration: config.studyDuration ?? currentSettings.studyDuration,
      breakDuration: config.breakDuration ?? currentSettings.breakDuration,
    };

    // Validate new settings
    if (config.studyDuration !== undefined && !this.validateDuration(config.studyDuration, 'study')) {
      throw new Error(`Study duration must be between ${DURATION_LIMITS.MIN_STUDY_DURATION / 60} and ${DURATION_LIMITS.MAX_STUDY_DURATION / 60} minutes`);
    }

    if (config.breakDuration !== undefined && !this.validateDuration(config.breakDuration, 'break')) {
      throw new Error(`Break duration must be between ${DURATION_LIMITS.MIN_BREAK_DURATION / 60} and ${DURATION_LIMITS.MAX_BREAK_DURATION / 60} minutes`);
    }

    try {
      const persistedSettings: PersistedDurationSettings = {
        studyDuration: newSettings.studyDuration,
        breakDuration: newSettings.breakDuration,
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem(DURATION_SETTINGS_KEY, JSON.stringify(persistedSettings));
      this.cachedSettings = newSettings;
    } catch (error) {
      console.error('Failed to save duration settings:', error);
      throw new Error('Failed to save duration settings');
    }
  }

  /**
   * Reset duration settings to default values
   */
  public async resetToDefaults(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DURATION_SETTINGS_KEY);
      this.cachedSettings = { ...DEFAULT_TIMER_CONFIG };
    } catch (error) {
      console.error('Failed to reset duration settings:', error);
      throw new Error('Failed to reset duration settings');
    }
  }

  /**
   * Validate duration value against type-specific limits
   */
  public validateDuration(duration: number, type: 'study' | 'break'): boolean {
    if (typeof duration !== 'number' || !isFinite(duration) || duration <= 0) {
      return false;
    }

    if (type === 'study') {
      return duration >= DURATION_LIMITS.MIN_STUDY_DURATION && 
             duration <= DURATION_LIMITS.MAX_STUDY_DURATION;
    } else {
      return duration >= DURATION_LIMITS.MIN_BREAK_DURATION && 
             duration <= DURATION_LIMITS.MAX_BREAK_DURATION;
    }
  }

  /**
   * Clear cached settings (useful for testing)
   */
  public clearCache(): void {
    this.cachedSettings = null;
  }
}

// Export singleton instance
export const durationSettingsService = DurationSettingsService.getInstance();