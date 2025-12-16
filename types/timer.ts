/**
 * Timer types and configuration for the Pomodoro Timer
 */

export enum TimerPhase {
  STUDY = 'study',
  BREAK = 'break'
}

export interface TimerState {
  phase: TimerPhase;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  completedPomodoros: number;
  startTime?: number; // timestamp when timer started
  lastUpdateTime?: number; // timestamp of last state update
}

export interface TimerConfig {
  studyDuration: number; // in seconds
  breakDuration: number; // in seconds
}

// Default timer configuration constants (25min study, 5min break)
export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  studyDuration: 25 * 60, // 25 minutes in seconds
  breakDuration: 5 * 60,  // 5 minutes in seconds
} as const;

// Duration validation constants
export const DURATION_LIMITS = {
  MIN_STUDY_DURATION: 1 * 60,  // 1 minute minimum
  MAX_STUDY_DURATION: 60 * 60, // 60 minutes maximum
  MIN_BREAK_DURATION: 1 * 60,  // 1 minute minimum
  MAX_BREAK_DURATION: 30 * 60, // 30 minutes maximum
} as const;

// Initial timer state factory function
export const createInitialTimerState = (config: TimerConfig = DEFAULT_TIMER_CONFIG): TimerState => ({
  phase: TimerPhase.STUDY,
  timeRemaining: config.studyDuration,
  isRunning: false,
  isPaused: false,
  completedPomodoros: 0,
  startTime: undefined,
  lastUpdateTime: undefined,
});

// Helper function to format time as MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to get phase display name
export const getPhaseDisplayName = (phase: TimerPhase): string => {
  return phase === TimerPhase.STUDY ? 'Study' : 'Break';
};

// Interface for persisted timer state
export interface PersistedTimerState {
  phase: TimerPhase;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  completedPomodoros: number;
  startTime: number; // timestamp when timer started
  lastUpdateTime: number; // timestamp of last state update
}

// Interface for persisted duration settings
export interface PersistedDurationSettings {
  studyDuration: number; // in seconds
  breakDuration: number; // in seconds
  lastUpdated: number; // timestamp of last settings change
}

// Duration settings service interface
export interface DurationSettingsService {
  getSettings(): Promise<TimerConfig>;
  updateSettings(config: Partial<TimerConfig>): Promise<void>;
  resetToDefaults(): Promise<void>;
  validateDuration(duration: number, type: 'study' | 'break'): boolean;
}

// Helper function to calculate elapsed time and synchronize timer state
export const synchronizeTimerState = (persistedState: PersistedTimerState, config: TimerConfig = DEFAULT_TIMER_CONFIG): TimerState => {
  if (!persistedState.isRunning || persistedState.isPaused) {
    // Timer is not running or is paused, return as-is
    return {
      ...persistedState,
      startTime: persistedState.startTime,
      lastUpdateTime: persistedState.lastUpdateTime,
    };
  }

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - persistedState.lastUpdateTime) / 1000);
  let newTimeRemaining = persistedState.timeRemaining - elapsedSeconds;
  let newPhase = persistedState.phase;
  let newCompletedPomodoros = persistedState.completedPomodoros;

  // Handle phase transitions that may have occurred while in background
  while (newTimeRemaining <= 0) {
    if (newPhase === TimerPhase.STUDY) {
      // Study session completed, transition to break
      newPhase = TimerPhase.BREAK;
      newTimeRemaining = config.breakDuration + newTimeRemaining; // Add remaining negative time
      newCompletedPomodoros += 1;
    } else {
      // Break completed, transition to study
      newPhase = TimerPhase.STUDY;
      newTimeRemaining = config.studyDuration + newTimeRemaining; // Add remaining negative time
    }
  }

  return {
    phase: newPhase,
    timeRemaining: Math.max(0, newTimeRemaining),
    isRunning: persistedState.isRunning,
    isPaused: persistedState.isPaused,
    completedPomodoros: newCompletedPomodoros,
    startTime: persistedState.startTime,
    lastUpdateTime: now,
  };
};

// Theme System Types and Configuration

export enum TimerTheme {
  DEFAULT = 'default',
  SNOW = 'snow',
  CHRISTMAS = 'christmas',
  POKEMON = 'pokemon'
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string[];
  background?: string;
}

export interface BackgroundElement {
  type: 'pattern' | 'image' | 'gradient' | 'particles';
  config: Record<string, any>;
}

export interface CharacterConfig {
  studyCharacter: string;
  breakCharacter: string;
  position: 'left-side' | 'right-side' | 'center';
  scale: number;
}

export interface ThemeAnimations {
  duration?: number;
  easing?: string;
  particles?: {
    count: number;
    speed: number;
    opacity: number;
  };
}

export interface ThemeConfig {
  name: string;
  studyColors: ThemeColors;
  breakColors: ThemeColors;
  backgroundElements?: BackgroundElement[];
  animations?: ThemeAnimations;
}

// Theme configuration objects for Default, Snow, Christmas, and Pokemon themes
export const THEME_CONFIGS: Record<TimerTheme, ThemeConfig> = {
  [TimerTheme.DEFAULT]: {
    name: 'Default',
    studyColors: {
      primary: '#F4D03F',      // Warm yellow (timer ring)
      secondary: '#F5E6D3',    // Cream/beige background
      accent: '#8B4513',       // Brown accent
      gradient: ['#F5E6D3', '#F0D0A0'],
      background: '#F5E6D3',   // Warm cream
    },
    breakColors: {
      primary: '#9B7EDE',      // Soft purple (timer ring)
      secondary: '#E8E0F5',    // Light lavender background
      accent: '#6A4C93',       // Deep purple accent
      gradient: ['#E8E0F5', '#D4C5F0'],
      background: '#E8E0F5',   // Light lavender
    },
    backgroundElements: [
      { 
        type: 'pattern', 
        config: { 
          studyCharacter: 'pumpkin-reader',  // Character in pumpkin reading
          breakCharacter: 'laptop-person',   // Person with laptop and cat
          position: 'left-side',
          scale: 0.8
        } 
      },
    ],
  },
  [TimerTheme.SNOW]: {
    name: 'Snow',
    studyColors: {
      primary: '#87CEEB',      // Sky blue timer ring
      secondary: '#F0F8FF',    // Alice blue background
      accent: '#4682B4',       // Steel blue accent
      gradient: ['#F0F8FF', '#E6F3FF'],
      background: '#F0F8FF',   // Soft winter blue
    },
    breakColors: {
      primary: '#B0E0E6',      // Powder blue timer ring
      secondary: '#F5F5F5',    // White smoke background
      accent: '#708090',       // Slate gray accent
      gradient: ['#F5F5F5', '#E8E8E8'],
      background: '#F5F5F5',   // Light winter gray
    },
    backgroundElements: [
      { 
        type: 'particles', 
        config: { 
          pattern: 'snowflakes',
          count: 15,
          animationDuration: 8000,
          opacity: 0.4
        } 
      },
    ],
    animations: {
      duration: 8000,
      particles: {
        count: 15,
        speed: 1,
        opacity: 0.4
      }
    }
  },
  [TimerTheme.CHRISTMAS]: {
    name: 'Christmas',
    studyColors: {
      primary: '#DC143C',      // Crimson red timer ring
      secondary: '#FFF8DC',    // Cornsilk background
      accent: '#8B0000',       // Dark red accent
      gradient: ['#FFF8DC', '#F5DEB3'],
      background: '#FFF8DC',   // Warm Christmas cream
    },
    breakColors: {
      primary: '#228B22',      // Forest green timer ring
      secondary: '#F0FFF0',    // Honeydew background
      accent: '#006400',       // Dark green accent
      gradient: ['#F0FFF0', '#E6FFE6'],
      background: '#F0FFF0',   // Light Christmas green
    },
    backgroundElements: [
      { 
        type: 'particles', 
        config: { 
          pattern: 'christmas-ornaments',
          count: 8,
          animationDuration: 6000,
          opacity: 0.6
        } 
      },
      { 
        type: 'particles', 
        config: { 
          pattern: 'christmas-lights',
          count: 12,
          animationDuration: 4000,
          opacity: 0.8
        } 
      },
    ],
    animations: {
      duration: 6000,
      particles: {
        count: 8,
        speed: 0.5,
        opacity: 0.6
      }
    }
  },
  [TimerTheme.POKEMON]: {
    name: 'Pokemon',
    studyColors: {
      primary: '#FFCB05',      // Pikachu yellow timer ring
      secondary: '#E6F3FF',    // Light sky blue background
      accent: '#CC9900',       // Dark yellow accent
      gradient: ['#E6F3FF', '#CCE7FF'],
      background: '#E6F3FF',   // Soft Pokemon blue
    },
    breakColors: {
      primary: '#FF6B6B',      // Pokeball red timer ring
      secondary: '#F0FFF0',    // Honeydew background
      accent: '#E55555',       // Dark red accent
      gradient: ['#F0FFF0', '#E6FFE6'],
      background: '#F0FFF0',   // Light Pokemon green
    },
    backgroundElements: [
      { 
        type: 'pattern', 
        config: { 
          studyCharacter: 'trainer-studying',  // Pokemon trainer reading with Pikachu
          breakCharacter: 'pokemon-nap',       // Character napping with Pokemon friends
          position: 'left-side',
          scale: 0.8
        } 
      },
      { 
        type: 'particles', 
        config: { 
          pattern: 'pokeballs',
          count: 6,
          positions: 'scattered',
          scale: 0.5,
          opacity: 0.3
        } 
      },
    ],
    animations: {
      duration: 6000,
      particles: {
        count: 6,
        speed: 0.8,
        opacity: 0.3
      }
    }
  },
} as const;

// Default theme
export const DEFAULT_THEME = TimerTheme.DEFAULT;