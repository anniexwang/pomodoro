import { PersistedTimerState, TimerConfig, TimerState, synchronizeTimerState } from '@/types/timer';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

interface UseBackgroundTimerProps {
  timerState: TimerState;
  onStateUpdate: (newState: TimerState) => void;
  config: TimerConfig;
}

/**
 * Custom hook that handles background timer persistence across platforms
 * - Mobile: Uses AppState API to detect background/foreground transitions
 * - Web: Uses Page Visibility API to detect tab visibility changes
 * - Implements timestamp-based synchronization for accurate time tracking
 */
export const useBackgroundTimer = ({ timerState, onStateUpdate, config }: UseBackgroundTimerProps) => {
  const persistedStateRef = useRef<PersistedTimerState | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Update persisted state whenever timer state changes
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      persistedStateRef.current = {
        phase: timerState.phase,
        timeRemaining: timerState.timeRemaining,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        completedPomodoros: timerState.completedPomodoros,
        startTime: timerState.startTime || Date.now(),
        lastUpdateTime: Date.now(),
      };
    } else {
      // Timer is stopped or paused, update timestamps but keep state
      if (persistedStateRef.current) {
        persistedStateRef.current = {
          ...persistedStateRef.current,
          phase: timerState.phase,
          timeRemaining: timerState.timeRemaining,
          isRunning: timerState.isRunning,
          isPaused: timerState.isPaused,
          completedPomodoros: timerState.completedPomodoros,
          lastUpdateTime: Date.now(),
        };
      }
    }
  }, [timerState]);

  // Handle mobile platform background/foreground detection
  useEffect(() => {
    if (Platform.OS === 'web') {
      return; // Skip AppState handling on web
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App is coming to foreground from background
      if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
        if (persistedStateRef.current && persistedStateRef.current.isRunning && !persistedStateRef.current.isPaused) {
          // Synchronize timer state based on elapsed time
          const synchronizedState = synchronizeTimerState(persistedStateRef.current, config);
          onStateUpdate(synchronizedState);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [onStateUpdate]);

  // Handle web platform tab visibility detection
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return; // Skip visibility API handling on mobile
    }

    const handleVisibilityChange = () => {
      // Tab is becoming visible
      if (!document.hidden) {
        if (persistedStateRef.current && persistedStateRef.current.isRunning && !persistedStateRef.current.isPaused) {
          // Synchronize timer state based on elapsed time
          const synchronizedState = synchronizeTimerState(persistedStateRef.current, config);
          onStateUpdate(synchronizedState);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onStateUpdate]);

  // Return current persisted state for debugging/monitoring
  return {
    persistedState: persistedStateRef.current,
  };
};