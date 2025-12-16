import React, { useEffect } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { applyThemeWithValidation } from '@/services/theme-utils';
import { THEME_CONFIGS, ThemeConfig, TimerTheme } from '@/types/timer';



interface ThemePickerProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: TimerTheme;
  onThemeSelect: (theme: TimerTheme) => void;
}

interface ThemePreviewProps {
  theme: TimerTheme;
  config: ThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ config, isSelected, onSelect }) => {
  const scaleValue = useSharedValue(1);
  const selectionValue = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectionValue.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isSelected, selectionValue]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      selectionValue.value,
      [0, 1],
      ['rgba(0,0,0,0.1)', config.studyColors.primary]
    );
    
    const shadowOpacity = 0.1 + selectionValue.value * 0.15;
    const elevation = 2 + selectionValue.value * 4;
    
    return {
      borderColor,
      borderWidth: 2,
      transform: [{ scale: scaleValue.value }],
      shadowOpacity,
      elevation,
    };
  });

  const animatedSelectedStyle = useAnimatedStyle(() => {
    const opacity = selectionValue.value;
    const scale = 0.8 + selectionValue.value * 0.2;
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    scaleValue.value = withTiming(0.96, { duration: 150 });
  };

  const handlePressOut = () => {
    scaleValue.value = withTiming(1, { duration: 150 });
  };



  return (
    <Pressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.themePreviewContainer}
    >
      <Animated.View style={[styles.themePreview, animatedContainerStyle]}>
        {/* Color palette preview */}
        <View style={styles.colorPalette}>
          <View style={[styles.colorCircle, styles.largeCircle, { backgroundColor: config.studyColors.primary }]} />
          <View style={[styles.colorCircle, styles.mediumCircle, { backgroundColor: config.studyColors.accent }]} />
          <View style={[styles.colorCircle, styles.smallCircle, { backgroundColor: config.breakColors.primary }]} />
          <View style={[styles.colorCircle, styles.smallCircle, { backgroundColor: config.breakColors.accent }]} />
        </View>
        
        {/* Theme name */}
        <View style={styles.themeNameContainer}>
          <ThemedText style={styles.themeName}>
            {config.name}
          </ThemedText>
        </View>
        
        {/* Color bars showing study/break phases */}
        <View style={styles.colorBars}>
          <View style={[styles.colorBar, { backgroundColor: config.studyColors.secondary }]}>
            <ThemedText style={[styles.phaseLabel, { color: config.studyColors.accent }]}>
              Study
            </ThemedText>
          </View>
          <View style={[styles.colorBar, { backgroundColor: config.breakColors.secondary }]}>
            <ThemedText style={[styles.phaseLabel, { color: config.breakColors.accent }]}>
              Break
            </ThemedText>
          </View>
        </View>
        
        {/* Selection indicator */}
        <Animated.View style={[styles.selectedIndicator, animatedSelectedStyle]}>
          <ThemedText style={styles.selectedText}>✓</ThemedText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const ThemePicker: React.FC<ThemePickerProps> = ({
  visible,
  onClose,
  currentTheme,
  onThemeSelect,
}) => {

  const handleThemeSelect = async (theme: TimerTheme) => {
    try {
      // Apply theme with validation
      const success = await applyThemeWithValidation(theme, onThemeSelect);
      if (success) {
        onClose();
      } else {
        Alert.alert(
          'Theme Error',
          'Failed to apply the selected theme. Please try another theme.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Theme selection error:', error);
      Alert.alert(
        'Theme Error',
        'An error occurred while applying the theme.',
        [{ text: 'OK' }]
      );
    }
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Choose Theme</ThemedText>
          <View style={styles.headerButtons}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>

        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Predefined Themes */}
          <ThemedText style={styles.sectionTitle}>Predefined Themes</ThemedText>
          {Object.entries(THEME_CONFIGS).map(([themeKey, config]) => (
            <ThemePreview
              key={themeKey}
              theme={themeKey as TimerTheme}
              config={config}
              isSelected={currentTheme === themeKey}
              onSelect={() => handleThemeSelect(themeKey as TimerTheme)}
            />
          ))}


        </ScrollView>


      </ThemedView>
    </Modal>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  themePreviewContainer: {
    alignItems: 'center',
  },
  themePreview: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  colorPalette: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  colorCircle: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  largeCircle: {
    width: 32,
    height: 32,
  },
  mediumCircle: {
    width: 24,
    height: 24,
  },
  smallCircle: {
    width: 18,
    height: 18,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  colorBars: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    height: 40,
  },
  colorBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },

  themeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },

});