# Pomodoro Timer Design Document

## Overview

The Pomodoro Timer is a React Native component that implements the Pomodoro Technique with automatic phase transitions and customizable durations. It manages study sessions (default 25 minutes, configurable 1-60 minutes) and break periods (default 5 minutes, configurable 1-30 minutes) with persistent background operation and clear visual feedback. The timer integrates with the existing Expo Router tab navigation and follows the app's theming system.

## Architecture

The timer follows a state-driven architecture with cross-platform compatibility for web, iOS, and Android:

- **Timer State Manager**: Handles countdown logic and phase transitions using platform-agnostic JavaScript timers
- **Background Timer Service**: Maintains timer state when app is backgrounded (mobile) or tab is inactive (web)
- **Duration Settings Manager**: Handles user-configurable timer durations with validation and persistence
- **UI Components**: Display current time, phase, and controls using React Native components that work across all platforms
- **Theme System**: Manages visual themes with dynamic styling, background elements, and animations
- **Theme Persistence**: Stores user theme preferences using AsyncStorage for cross-session persistence
- **Platform Abstraction**: Handles platform-specific behaviors (background timers, notifications) through Expo APIs

## Components and Interfaces

### Visual Design Updates
The timer display has been updated to use a circular progress bar design:
- **Circular Progress Ring**: A circular outline that fills as time progresses, replacing the linear progress bar
- **Always Visible Outline**: The full circle outline remains visible even when progress is at 0%, providing clear visual boundaries
- **Smooth Progress Animation**: The progress ring fills smoothly as time decreases, with the filled portion representing elapsed time
- **Theme-Aware Colors**: The progress ring uses theme-specific colors for both the filled progress and the background outline

### PomodoroTimer Component
Main component that orchestrates the timer functionality:

```typescript
interface PomodoroTimerProps {
  onPhaseChange?: (phase: TimerPhase) => void;
  onComplete?: (completedPomodoros: number) => void;
}

interface TimerState {
  phase: TimerPhase;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  completedPomodoros: number;
  config: TimerConfig; // current duration settings
}

enum TimerPhase {
  STUDY = 'study',
  BREAK = 'break'
}
```

### Timer Service
Handles the core timing logic and background persistence:

```typescript
interface TimerService {
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  getState(): TimerState;
  updateConfig(config: Partial<TimerConfig>): Promise<void>;
  getConfig(): TimerConfig;
  subscribe(callback: (state: TimerState) => void): () => void;
}
```

### Duration Settings Service
Manages user-configurable timer durations:

```typescript
interface DurationSettingsService {
  getSettings(): Promise<TimerConfig>;
  updateSettings(config: Partial<TimerConfig>): Promise<void>;
  resetToDefaults(): Promise<void>;
  validateDuration(duration: number, type: 'study' | 'break'): boolean;
}
```

### Theme Service
Manages theme selection, persistence, and application:

```typescript
interface ThemeService {
  getCurrentTheme(): TimerTheme;
  setTheme(theme: TimerTheme): Promise<void>;
  getThemeConfig(theme: TimerTheme): ThemeConfig;
  subscribeToThemeChanges(callback: (theme: TimerTheme) => void): () => void;
}
```

### Background Element Renderer
Renders theme-specific background elements:

```typescript
interface BackgroundRenderer {
  renderCharacter(config: CharacterConfig): React.ReactNode;
  renderSnowflakes(config: SnowflakeConfig): React.ReactNode;
  renderHollyPattern(config: HollyConfig): React.ReactNode;
  renderPokeballs(config: PokeballConfig): React.ReactNode;
  renderSparkles(config: SparkleConfig): React.ReactNode;
}

interface CharacterConfig {
  studyCharacter: string;
  breakCharacter: string;
  position: 'left-side' | 'right-side' | 'center';
  scale: number;
}
```

### Timer Display Component
Renders the current time and phase information with circular progress visualization:

```typescript
interface TimerDisplayProps {
  timeRemaining: number;
  phase: TimerPhase;
  isRunning: boolean;
  theme: TimerTheme;
}

interface CircularProgressProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
}
```

### Duration Settings Component
Provides interface for customizing study and break durations:

```typescript
interface DurationSettingsProps {
  config: TimerConfig;
  onConfigChange: (config: TimerConfig) => void;
  onClose: () => void;
}

interface DurationSliderProps {
  label: string;
  value: number; // in minutes
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}
```

### Theme System
Manages visual themes for the timer interface:

```typescript
enum TimerTheme {
  DEFAULT = 'default',
  CHRISTMAS = 'christmas',
  POKEMON = 'pokemon'
}

interface ThemeConfig {
  name: string;
  studyColors: ThemeColors;
  breakColors: ThemeColors;
  backgroundElements?: BackgroundElement[];
  animations?: ThemeAnimations;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string[];
  background?: string;
}

interface BackgroundElement {
  type: 'pattern' | 'image' | 'gradient' | 'particles';
  config: Record<string, any>;
}
```

## Data Models

### Timer Configuration
```typescript
const DEFAULT_TIMER_CONFIG = {
  STUDY_DURATION: 25 * 60, // 25 minutes in seconds
  BREAK_DURATION: 5 * 60,  // 5 minutes in seconds
  MIN_STUDY_DURATION: 1 * 60,  // 1 minute minimum
  MAX_STUDY_DURATION: 60 * 60, // 60 minutes maximum
  MIN_BREAK_DURATION: 1 * 60,  // 1 minute minimum
  MAX_BREAK_DURATION: 30 * 60, // 30 minutes maximum
} as const;

interface TimerConfig {
  studyDuration: number; // in seconds
  breakDuration: number; // in seconds
}
```

### Theme Configurations
```typescript
const THEME_CONFIGS: Record<TimerTheme, ThemeConfig> = {
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
        type: 'character', 
        config: { 
          studyCharacter: 'pumpkin-reader',  // Character in pumpkin reading
          breakCharacter: 'laptop-person',   // Person with laptop and cat
          position: 'left-side',
          scale: 0.8
        } 
      },
    ],
  },
  [TimerTheme.CHRISTMAS]: {
    name: 'Christmas',
    studyColors: {
      primary: '#FFD700',      // Gold timer ring
      secondary: '#F0F8FF',    // Alice blue background
      accent: '#8B0000',       // Dark red accent
      gradient: ['#F0F8FF', '#E6F3FF'],
      background: '#F0F8FF',   // Soft winter blue
    },
    breakColors: {
      primary: '#32CD32',      // Lime green timer ring
      secondary: '#FFF0F5',    // Lavender blush background
      accent: '#006400',       // Dark green accent
      gradient: ['#FFF0F5', '#FFE4E6'],
      background: '#FFF0F5',   // Warm winter pink
    },
    backgroundElements: [
      { 
        type: 'character', 
        config: { 
          studyCharacter: 'winter-reader',     // Character in winter clothes reading
          breakCharacter: 'christmas-relax',   // Character with hot cocoa and Christmas tree
          position: 'left-side',
          scale: 0.8
        } 
      },
      { 
        type: 'pattern', 
        config: { 
          pattern: 'snowflakes',
          count: 15,
          animationDuration: 8000,
          opacity: 0.4
        } 
      },
    ],
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
        type: 'character', 
        config: { 
          studyCharacter: 'trainer-studying',  // Pokemon trainer reading with Pikachu
          breakCharacter: 'pokemon-nap',       // Character napping with Pokemon friends
          position: 'left-side',
          scale: 0.8
        } 
      },
      { 
        type: 'pattern', 
        config: { 
          pattern: 'pokeballs',
          count: 6,
          positions: 'scattered',
          scale: 0.5,
          opacity: 0.3
        } 
      },
    ],
  },
} as const;
```

### Timer State Persistence
```typescript
interface PersistedTimerState {
  phase: TimerPhase;
  timeRemaining: number;
  isRunning: boolean;
  startTime: number; // timestamp when timer started
  lastUpdateTime: number; // timestamp of last state update
  config: TimerConfig; // current duration settings
}

interface PersistedDurationSettings {
  studyDuration: number; // in seconds
  breakDuration: number; // in seconds
  lastUpdated: number; // timestamp of last settings change
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Start action activates timer
*For any* timer in stopped state, pressing start should change the timer to running state and begin countdown
**Validates: Requirements 1.2**

Property 2: Study session countdown behavior
*For any* active study session, advancing time by N seconds should decrease the remaining time by exactly N seconds until reaching zero
**Validates: Requirements 1.3**

Property 3: Time formatting consistency
*For any* time value in seconds, the formatted display should follow MM:SS pattern with proper zero-padding
**Validates: Requirements 1.4**

Property 4: Study to break transition
*For any* study session that reaches zero time remaining, the timer should automatically transition to break phase with 5 minutes remaining
**Validates: Requirements 1.5, 2.1**

Property 5: Break session countdown behavior
*For any* active break session, advancing time by N seconds should decrease the remaining time by exactly N seconds until reaching zero
**Validates: Requirements 2.3**

Property 6: Break to study transition
*For any* break session that reaches zero time remaining, the timer should automatically transition to study phase with 25 minutes remaining
**Validates: Requirements 2.4**

Property 7: Automatic phase transitions
*For any* timer state, phase transitions should occur without requiring user input when time reaches zero
**Validates: Requirements 2.5**

Property 8: Phase display accuracy
*For any* timer state, the displayed phase should match the internal timer phase (study or break)
**Validates: Requirements 3.1**

Property 9: Display update frequency
*For any* running timer, the display should update at regular one-second intervals
**Validates: Requirements 3.4**

Property 10: Phase change reflection
*For any* phase transition, the visual indicators should update immediately to reflect the new phase
**Validates: Requirements 3.5**

Property 11: Reset functionality
*For any* timer state, triggering reset should return the timer to initial state (25-minute study session, stopped)
**Validates: Requirements 4.4**

Property 12: Pause state preservation
*For any* timer that is paused, the time remaining and phase should be preserved until resumed
**Validates: Requirements 4.5**

Property 13: Foreground synchronization
*For any* timer running in background, returning to foreground should display time that accurately reflects elapsed time
**Validates: Requirements 5.5**

Property 14: Theme application
*For any* selected theme, the timer interface should display the visual styling associated with that theme
**Validates: Requirements 6.2**

Property 15: Theme state preservation
*For any* theme change, the current timer state (time remaining, phase, running status) should remain unchanged
**Validates: Requirements 6.5**

Property 16: Study duration validation and storage
*For any* study duration value between 1 and 60 minutes, the system should accept and store the value, and for any value outside this range, the system should reject it
**Validates: Requirements 7.2**

Property 17: Break duration validation and storage
*For any* break duration value between 1 and 30 minutes, the system should accept and store the value, and for any value outside this range, the system should reject it
**Validates: Requirements 7.3**

Property 18: Custom duration application
*For any* custom duration settings, new timer cycles should use these values instead of the default 25/5 minute configuration
**Validates: Requirements 7.4**

Property 19: Settings persistence with state preservation
*For any* duration settings change during a running timer, the system should persist the new values for future sessions while preserving the current timer state unchanged
**Validates: Requirements 7.5**

## Error Handling

### Timer State Validation
- Validate time remaining is never negative
- Ensure phase transitions only occur at appropriate times
- Handle edge cases where timer reaches exactly zero

### Background State Recovery
- Implement fallback mechanisms if background timer fails
- Validate calculated elapsed time against reasonable bounds
- Handle clock changes or system sleep scenarios
- Use platform-appropriate background handling (AppState for mobile, Page Visibility API for web)

### User Input Validation
- Prevent multiple simultaneous start/pause actions
- Ensure reset can be called from any state safely
- Handle rapid button presses gracefully

## Testing Strategy

### Unit Testing Approach
The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing Requirements
- Use **fast-check** library for property-based testing in TypeScript/React Native
- Configure each property-based test to run a minimum of 100 iterations
- Tag each property-based test with format: **Feature: pomodoro-timer, Property {number}: {property_text}**
- Each correctness property must be implemented by a single property-based test

### Unit Testing Coverage
- Timer state transitions and edge cases
- Time formatting with boundary values
- Button state management
- Background/foreground synchronization logic

### Integration Testing
- Full timer cycles (study → break → study)
- App lifecycle events (background/foreground on mobile, tab visibility on web)
- Navigation persistence across all platforms
- Theme integration with automatic dark/light mode
- Cross-platform timer accuracy and synchronization

## Theme Implementation Details

### Theme Selection Interface
- **Theme Picker Modal**: Accessible via settings button or long-press on timer
- **Visual Previews**: Each theme shows a miniature preview of its styling
- **Smooth Transitions**: Theme changes animate smoothly without disrupting timer state
- **Persistence**: Selected theme is saved to AsyncStorage and restored on app launch

### Background Element Rendering
- **Characters**: Cute illustrated characters that change based on study/break phase
- **Snowflakes**: Animated falling particles with varying sizes and speeds (Christmas theme)
- **Holly Patterns**: Static decorative elements positioned at screen corners (Christmas theme)
- **Pokeballs**: Scattered circular patterns with Pokemon-style design (Pokemon theme)
- **Sparkles**: Animated particle effects with color variations and twinkling (Pokemon theme)

### Performance Considerations
- **Lazy Loading**: Background elements are rendered only when theme is active
- **Animation Optimization**: Use React Native Reanimated for smooth 60fps animations
- **Memory Management**: Dispose of unused theme resources when switching themes
- **Platform Adaptation**: Adjust animation complexity based on device capabilities

## Cross-Platform Considerations

### Web Platform
- Use `document.visibilityState` to detect tab visibility changes
- Implement web-specific timer synchronization when tab becomes visible
- Handle browser tab sleep/wake cycles
- Ensure timer continues running when tab is in background

### iOS Platform
- Utilize `AppState` API for background/foreground detection
- Handle iOS app lifecycle events properly
- Ensure timer accuracy when app is backgrounded
- Support both iPhone and iPad layouts

### Android Platform
- Use `AppState` API for background/foreground detection
- Handle Android app lifecycle and memory management
- Ensure timer continues during device sleep
- Support adaptive icons and edge-to-edge display

### Shared Implementation
- Use React Native's built-in `setInterval` for cross-platform timer functionality
- Leverage Expo Router for consistent navigation across platforms
- Apply themed components that adapt to each platform's design guidelines
- Implement timestamp-based calculations for accurate time tracking across platform sleep/wake cycles