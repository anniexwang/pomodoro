import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { APIKeyConfigModal } from '@/components/api-key-config';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAIThemeGenerator } from '@/services/ai-theme-generator';
import { hasAPIKey } from '@/services/api-key-storage';
import { getGeneratedThemeStorage } from '@/services/generated-theme-storage';
import { GeneratedTheme } from '@/services/theme-processor';
import { applyThemeWithValidation } from '@/services/theme-utils';
import { THEME_CONFIGS, ThemeConfig, TimerTheme } from '@/types/timer';



interface ThemePickerProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: TimerTheme | string;
  onThemeSelect: (theme: TimerTheme | string) => void;
}

interface ThemePreviewProps {
  theme: TimerTheme | string;
  config: ThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  isGenerated?: boolean;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, config, isSelected, onSelect, onDelete, isGenerated = false }) => {
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

  const handleLongPress = () => {
    if (isGenerated && onDelete) {
      Alert.alert(
        'Delete Theme',
        `Are you sure you want to delete "${config.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]
      );
    }
  };

  return (
    <Pressable
      onPress={onSelect}
      onLongPress={handleLongPress}
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
          {isGenerated && (
            <ThemedText style={styles.generatedLabel}>AI</ThemedText>
          )}
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
  const [generatedThemes, setGeneratedThemes] = useState<GeneratedTheme[]>([]);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptError, setPromptError] = useState('');
  const [showAPIKeyConfig, setShowAPIKeyConfig] = useState(false);
  const [hasConfiguredAPIKey, setHasConfiguredAPIKey] = useState(false);

  // Load generated themes and API key status when modal opens
  useEffect(() => {
    if (visible) {
      loadGeneratedThemes();
      checkAPIKeyStatus();
    }
  }, [visible]);

  const loadGeneratedThemes = async () => {
    try {
      const storage = getGeneratedThemeStorage();
      const themes = await storage.loadThemes();
      setGeneratedThemes(themes);
    } catch (error) {
      console.error('Failed to load generated themes:', error);
    }
  };

  const checkAPIKeyStatus = async () => {
    try {
      const hasKey = await hasAPIKey();
      setHasConfiguredAPIKey(hasKey);
    } catch (error) {
      console.error('Failed to check API key status:', error);
      setHasConfiguredAPIKey(false);
    }
  };

  const handleThemeSelect = async (theme: TimerTheme | string) => {
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

  const handleGenerateTheme = async () => {
    if (!promptText.trim()) {
      setPromptError('Please enter a theme description');
      return;
    }

    if (promptText.trim().length > 50) {
      setPromptError('Theme description must be 50 characters or less');
      return;
    }

    // Check if API key is configured
    if (!hasConfiguredAPIKey) {
      Alert.alert(
        'API Key Required',
        'You need to configure your OpenAI API key to generate themes. Would you like to add it now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add API Key', onPress: () => setShowAPIKeyConfig(true) },
        ]
      );
      return;
    }

    setPromptError('');
    setIsGenerating(true);

    try {
      // Use the AI theme generator with stored API key
      const generator = getAIThemeGenerator();
      const result = await generator.generateTheme(promptText.trim());

      if (result.success && result.theme) {
        // Save the theme
        const storage = getGeneratedThemeStorage();
        await storage.saveTheme(result.theme);

        // Reload themes and clear input
        await loadGeneratedThemes();
        setPromptText('');
        
        if (result.usedFallback) {
          Alert.alert(
            'Theme Generated',
            `Theme "${result.theme.name}" has been generated using fallback colors due to AI service issues.`
          );
        } else {
          Alert.alert('Success', `Theme "${result.theme.name}" has been generated!`);
        }
      } else {
        Alert.alert(
          'Generation Failed',
          result.error || 'Failed to generate theme. Please try again.'
        );
      }
    } catch (error) {
      console.error('Theme generation failed:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate theme. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      const storage = getGeneratedThemeStorage();
      await storage.deleteTheme(themeId);
      await loadGeneratedThemes();
    } catch (error) {
      console.error('Failed to delete theme:', error);
      Alert.alert('Error', 'Failed to delete theme. Please try again.');
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
            {/* <Pressable 
              onPress={() => setShowAPIKeyConfig(true)} 
              style={[styles.apiKeyButton, !hasConfiguredAPIKey && styles.apiKeyButtonWarning]}
            >
              <ThemedText style={[
                styles.apiKeyButtonText,
                !hasConfiguredAPIKey && styles.apiKeyButtonTextWarning
              ]}>
                {hasConfiguredAPIKey ? '🔑' : '⚠️'}
              </ThemedText>
            </Pressable> */}
            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
        
        {/* AI Theme Generation Section */}
        {/* <View style={styles.generationSection}>
          <View style={styles.generationHeader}>
            <ThemedText style={styles.sectionTitle}>Generate Custom Theme</ThemedText>
            {!hasConfiguredAPIKey && (
              <Pressable 
                onPress={() => setShowAPIKeyConfig(true)}
                style={styles.configureKeyButton}
              >
                <ThemedText style={styles.configureKeyText}>Configure API Key</ThemedText>
              </Pressable>
            )}
          </View>
          
          {hasConfiguredAPIKey ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Describe your theme (e.g., ocean, sunset, forest)"
                  placeholderTextColor="#999"
                  value={promptText}
                  onChangeText={(text) => {
                    setPromptText(text);
                    if (promptError) setPromptError('');
                  }}
                  maxLength={50}
                  editable={!isGenerating}
                />
                <Pressable
                  style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                  onPress={handleGenerateTheme}
                  disabled={isGenerating}
                >
                  <ThemedText style={styles.generateButtonText}>
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </ThemedText>
                </Pressable>
              </View>
              {promptError ? (
                <ThemedText style={styles.errorText}>{promptError}</ThemedText>
              ) : null}
              <ThemedText style={styles.characterCount}>
                {promptText.length}/50 characters
              </ThemedText>
            </>
          ) : (
            <View style={styles.noApiKeyContainer}>
              <ThemedText style={styles.noApiKeyText}>
                Configure your OpenAI API key to generate custom themes
              </ThemedText>
              <Pressable 
                onPress={() => setShowAPIKeyConfig(true)}
                style={styles.setupButton}
              >
                <ThemedText style={styles.setupButtonText}>Set Up API Key</ThemedText>
              </Pressable>
            </View>
          )}
        </View> */}
        
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
              isGenerated={false}
            />
          ))}

          {/* Generated Themes */}
          {generatedThemes.length > 0 && (
            <>
              <ThemedText style={[styles.sectionTitle, styles.generatedSectionTitle]}>
                Your Generated Themes
              </ThemedText>
              {generatedThemes.map((theme) => (
                <ThemePreview
                  key={theme.id}
                  theme={theme.id}
                  config={theme}
                  isSelected={currentTheme === theme.id}
                  onSelect={() => handleThemeSelect(theme.id)}
                  onDelete={() => handleDeleteTheme(theme.id)}
                  isGenerated={true}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* API Key Configuration Modal */}
        <APIKeyConfigModal
          visible={showAPIKeyConfig}
          onClose={() => setShowAPIKeyConfig(false)}
          onKeyConfigured={(hasKey) => {
            setHasConfiguredAPIKey(hasKey);
            if (hasKey) {
              // Refresh the AI theme generator instance
              getAIThemeGenerator();
            }
          }}
        />
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
  apiKeyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  apiKeyButtonWarning: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
  },
  apiKeyButtonText: {
    fontSize: 18,
  },
  apiKeyButtonTextWarning: {
    fontSize: 16,
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
  generationSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  generationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configureKeyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF9500',
    borderRadius: 8,
  },
  configureKeyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noApiKeyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noApiKeyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  setupButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  generatedSectionTitle: {
    marginTop: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  promptInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333',
    minHeight: 48,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  themeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  generatedLabel: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});