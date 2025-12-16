import { BackgroundElements } from '@/components/background-elements';
import { CircularProgress } from '@/components/circular-progress';
import { DurationSettings } from '@/components/duration-settings';
import { ThemePicker } from '@/components/theme-picker';
import { useBackgroundTimer } from '@/hooks/use-background-timer';
import { useEnhancedTheme } from '@/hooks/use-enhanced-theme';
import { durationSettingsService } from '@/services/duration-settings-service';
import { createInitialTimerState, formatTime, getPhaseDisplayName, TimerConfig, TimerPhase, TimerState } from '@/types/timer';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';


export default function TimerScreen() {
  // Duration configuration state
  const [config, setConfig] = useState<TimerConfig | null>(null);
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showDurationSettings, setShowDurationSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Theme integration
  const { currentTheme, themeConfig, setTheme, isLoading } = useEnhancedTheme();

  // Initialize duration settings and timer state
  useEffect(() => {
    const initializeTimer = async () => {
      try {
        const durationConfig = await durationSettingsService.getSettings();
        setConfig(durationConfig);
        setTimerState(createInitialTimerState(durationConfig));
      } catch (error) {
        console.error('Failed to load duration settings:', error);
        // Fallback to default config
        const defaultConfig = await durationSettingsService.getSettings();
        setConfig(defaultConfig);
        setTimerState(createInitialTimerState(defaultConfig));
      }
    };

    initializeTimer();
  }, []);

  // Background timer integration
  useBackgroundTimer({
    timerState: timerState || createInitialTimerState(),
    onStateUpdate: setTimerState,
    config: config || { studyDuration: 25 * 60, breakDuration: 5 * 60 },
  });

  // Get current phase colors
  const currentColors = timerState?.phase === TimerPhase.STUDY 
    ? themeConfig.studyColors 
    : themeConfig.breakColors;

  const handleStart = () => {
    setTimerState(prev => prev ? { ...prev, isRunning: true, isPaused: false } : prev);
  };

  const handlePause = () => {
    setTimerState(prev => prev ? { ...prev, isRunning: false, isPaused: true } : prev);
  };

  const handleReset = () => {
    if (config) {
      setTimerState(createInitialTimerState(config));
    }
  };

  const handleThemePress = () => {
    setShowThemePicker(true);
  };

  const handleThemeSelect = async (theme: any) => {
    try {
      await setTheme(theme);
      setShowThemePicker(false);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const handleSettingsPress = () => {
    setShowDurationSettings(true);
  };

  const handleDurationConfigChange = async (newConfig: TimerConfig) => {
    try {
      await durationSettingsService.updateSettings(newConfig);
      setConfig(newConfig);
      
      // If timer is not running, update the current time remaining to match new config
      if (timerState && !timerState.isRunning) {
        const newTimeRemaining = timerState.phase === TimerPhase.STUDY 
          ? newConfig.studyDuration 
          : newConfig.breakDuration;
        
        setTimerState(prev => prev ? { ...prev, timeRemaining: newTimeRemaining } : prev);
      }
    } catch (error) {
      console.error('Failed to update duration settings:', error);
    }
  };

  // Countdown logic with phase transitions
  useEffect(() => {
    if (timerState?.isRunning && timerState.timeRemaining > 0 && config) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (!prev) return prev;
          
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            // Phase transition
            if (prev.phase === TimerPhase.STUDY) {
              // Study completed, switch to break
              return {
                ...prev,
                phase: TimerPhase.BREAK,
                timeRemaining: config.breakDuration,
                completedPomodoros: prev.completedPomodoros + 1,
              };
            } else {
              // Break completed, switch to study
              return {
                ...prev,
                phase: TimerPhase.STUDY,
                timeRemaining: config.studyDuration,
              };
            }
          }
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState?.isRunning, timerState?.timeRemaining, config]);

  // Calculate progress based on current phase (starts full and decreases)
  const totalDuration = timerState?.phase === TimerPhase.STUDY 
    ? config?.studyDuration || 25 * 60
    : config?.breakDuration || 5 * 60;
  const progress = timerState ? timerState.timeRemaining / totalDuration : 1;

  // Dynamic styles based on current theme and phase
  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: currentColors.background || currentColors.secondary,
    },
    timerContainer: {
      ...styles.timerContainer,
      backgroundColor: currentColors.secondary,
    },
    title: {
      ...styles.title,
      color: currentColors.accent,
    },
    timerText: {
      ...styles.timerText,
      color: currentColors.accent,
    },
    primaryButton: {
      ...styles.primaryButton,
      backgroundColor: currentColors.primary,
    },
    secondaryButton: {
      ...styles.secondaryButton,
      borderColor: currentColors.primary,
    },
    secondaryButtonText: {
      ...styles.secondaryButtonText,
      color: currentColors.primary,
    },
  };

  if (isLoading || !timerState || !config) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Background Elements */}
      <BackgroundElements theme={currentTheme} phase={timerState.phase} />
      
      {/* Theme button */}
      <Pressable style={styles.themeButton} onPress={handleThemePress}>
        <Text style={styles.themeButtonText}>☰</Text>
      </Pressable>

      {/* Settings button */}
      <Pressable style={styles.settingsButton} onPress={handleSettingsPress}>
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </Pressable>

      <Text style={dynamicStyles.title}>Pomodoro Timer</Text>
      
      {/* Phase indicator */}
      <Text style={[styles.phaseText, { color: currentColors.primary }]}>
        {getPhaseDisplayName(timerState.phase)}
      </Text>
      
      <View style={dynamicStyles.timerContainer}>
        <CircularProgress
          progress={progress}
          size={200}
          strokeWidth={12}
          color={currentColors.primary}
          backgroundColor={currentColors.secondary}
        />
        <Text style={dynamicStyles.timerText}>
          {formatTime(timerState.timeRemaining)}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        {!timerState.isRunning ? (
          <Pressable style={[styles.button, dynamicStyles.primaryButton]} onPress={handleStart}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {timerState.isPaused ? 'Resume' : 'Start'}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.button, dynamicStyles.primaryButton]} onPress={handlePause}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Pause</Text>
          </Pressable>
        )}

        <Pressable style={[styles.button, dynamicStyles.secondaryButton]} onPress={handleReset}>
          <Text style={[styles.buttonText, dynamicStyles.secondaryButtonText]}>Reset</Text>
        </Pressable>
      </View>

      {/* Pomodoro counter */}
      {timerState.completedPomodoros > 0 && (
        <Text style={[styles.pomodoroCounter, { color: currentColors.accent }]}>
          Completed: {timerState.completedPomodoros} 🍅
        </Text>
      )}

      {/* Theme picker modal */}
      <ThemePicker
        visible={showThemePicker}
        onClose={() => setShowThemePicker(false)}
        currentTheme={currentTheme}
        onThemeSelect={handleThemeSelect}
      />

      {/* Duration settings modal */}
      <DurationSettings
        visible={showDurationSettings}
        config={config}
        onConfigChange={handleDurationConfigChange}
        onClose={() => setShowDurationSettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  themeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeButtonText: {
    fontSize: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timerContainer: {
    borderRadius: 20,
    padding: 40,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 0,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'monospace',
    textAlign: 'center',
    position: 'absolute',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    // backgroundColor will be set dynamically
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    // borderColor will be set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    // color will be set dynamically
  },
  pomodoroCounter: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
});