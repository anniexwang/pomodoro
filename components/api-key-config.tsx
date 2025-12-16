/**
 * API Key Configuration Component - UI for managing OpenAI API key
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAIThemeGenerator } from '@/services/ai-theme-generator';
import {
    APIKeyConfig,
    getAPIKeyConfig,
    getAPIKeyPreview,
    hasAPIKey,
    removeAPIKey,
    saveAPIKey,
    updateValidationStatus,
    validateAPIKeyFormat,
} from '@/services/api-key-storage';

interface APIKeyConfigProps {
  visible: boolean;
  onClose: () => void;
  onKeyConfigured?: (hasKey: boolean) => void;
}

export const APIKeyConfigModal: React.FC<APIKeyConfigProps> = ({
  visible,
  onClose,
  onKeyConfigured,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [keyConfig, setKeyConfig] = useState<APIKeyConfig>({ hasKey: false, keySetAt: 0 });
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Animation values
  const fadeValue = useSharedValue(0);
  const slideValue = useSharedValue(50);

  // Load existing configuration when modal opens
  useEffect(() => {
    if (visible) {
      loadKeyConfiguration();
      fadeValue.value = withTiming(1, { duration: 300 });
      slideValue.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      fadeValue.value = withTiming(0, { duration: 200 });
      slideValue.value = withTiming(50, { duration: 200 });
    }
  }, [visible, fadeValue, slideValue]);

  const loadKeyConfiguration = async () => {
    setIsLoading(true);
    try {
      const [config, preview, hasStoredKey] = await Promise.all([
        getAPIKeyConfig(),
        getAPIKeyPreview(),
        hasAPIKey(),
      ]);

      setKeyConfig(config);
      setKeyPreview(preview);
      setShowKeyInput(!hasStoredKey);
    } catch (error) {
      console.error('Failed to load key configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setValidationError('Please enter an API key');
      return;
    }

    // Validate key format
    const validation = validateAPIKeyFormat(apiKey);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid API key format');
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      // Save the API key
      await saveAPIKey(apiKey);
      
      // Reload configuration
      await loadKeyConfiguration();
      
      // Clear input and hide form
      setApiKey('');
      setShowKeyInput(false);
      
      // Notify parent component
      onKeyConfigured?.(true);
      
      Alert.alert('Success', 'API key has been saved securely!');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setValidationError('');

    try {
      // Get the AI theme generator with current API key
      const generator = getAIThemeGenerator();
      
      // Test the connection
      const result = await generator.testConnection();
      
      if (result.success) {
        await updateValidationStatus(true);
        await loadKeyConfiguration();
        Alert.alert('Success', 'API key is valid and connection successful!');
      } else {
        await updateValidationStatus(false);
        await loadKeyConfiguration();
        Alert.alert('Connection Failed', result.error || 'Failed to connect to OpenAI API');
      }
    } catch (error) {
      await updateValidationStatus(false);
      await loadKeyConfiguration();
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to test connection'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your API key? You will need to enter it again to use AI theme generation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAPIKey();
              await loadKeyConfiguration();
              setShowKeyInput(true);
              onKeyConfigured?.(false);
              Alert.alert('Removed', 'API key has been removed');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove API key');
            }
          },
        },
      ]
    );
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: slideValue.value }],
  }));

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };

  const getValidationStatusColor = () => {
    if (keyConfig.isValid === true) return '#4CAF50';
    if (keyConfig.isValid === false) return '#FF3B30';
    return '#999';
  };

  const getValidationStatusText = () => {
    if (keyConfig.isValid === true) return 'Valid';
    if (keyConfig.isValid === false) return 'Invalid';
    return 'Not tested';
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
          <ThemedText style={styles.title}>API Key Configuration</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Done</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={animatedContentStyle}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={styles.loadingText}>Loading configuration...</ThemedText>
              </View>
            ) : (
              <>
                {/* Information Section */}
                <View style={styles.infoSection}>
                  <ThemedText style={styles.sectionTitle}>OpenAI API Key</ThemedText>
                  <ThemedText style={styles.infoText}>
                    To use AI theme generation, you need to provide your OpenAI API key. 
                    Your key is stored securely on your device and never shared.
                  </ThemedText>
                  
                  <View style={styles.instructionsContainer}>
                    <ThemedText style={styles.instructionsTitle}>How to get your API key:</ThemedText>
                    <ThemedText style={styles.instructionStep}>1. Visit platform.openai.com</ThemedText>
                    <ThemedText style={styles.instructionStep}>2. Sign in to your account</ThemedText>
                    <ThemedText style={styles.instructionStep}>3. Go to API Keys section</ThemedText>
                    <ThemedText style={styles.instructionStep}>4. Create a new secret key</ThemedText>
                    <ThemedText style={styles.instructionStep}>5. Copy and paste it below</ThemedText>
                  </View>
                </View>

                {/* Current Key Status */}
                {keyConfig.hasKey && (
                  <View style={styles.statusSection}>
                    <ThemedText style={styles.sectionTitle}>Current Status</ThemedText>
                    
                    <View style={styles.statusRow}>
                      <ThemedText style={styles.statusLabel}>API Key:</ThemedText>
                      <ThemedText style={styles.statusValue}>
                        {keyPreview || 'Hidden'}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.statusRow}>
                      <ThemedText style={styles.statusLabel}>Added:</ThemedText>
                      <ThemedText style={styles.statusValue}>
                        {formatDate(keyConfig.keySetAt)}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.statusRow}>
                      <ThemedText style={styles.statusLabel}>Last Tested:</ThemedText>
                      <ThemedText style={styles.statusValue}>
                        {formatDate(keyConfig.lastValidated || 0)}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.statusRow}>
                      <ThemedText style={styles.statusLabel}>Status:</ThemedText>
                      <ThemedText style={[
                        styles.statusValue,
                        { color: getValidationStatusColor() }
                      ]}>
                        {getValidationStatusText()}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Key Input Section */}
                {showKeyInput && (
                  <View style={styles.inputSection}>
                    <ThemedText style={styles.sectionTitle}>
                      {keyConfig.hasKey ? 'Update API Key' : 'Enter API Key'}
                    </ThemedText>
                    
                    <TextInput
                      style={styles.keyInput}
                      placeholder="sk-..."
                      placeholderTextColor="#999"
                      value={apiKey}
                      onChangeText={(text) => {
                        setApiKey(text);
                        if (validationError) setValidationError('');
                      }}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    
                    {validationError ? (
                      <ThemedText style={styles.errorText}>{validationError}</ThemedText>
                    ) : null}
                    
                    <View style={styles.buttonRow}>
                      <Pressable
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSaveKey}
                        disabled={isLoading}
                      >
                        <ThemedText style={styles.saveButtonText}>
                          {isLoading ? 'Saving...' : 'Save Key'}
                        </ThemedText>
                      </Pressable>
                      
                      {keyConfig.hasKey && (
                        <Pressable
                          style={[styles.button, styles.cancelButton]}
                          onPress={() => {
                            setShowKeyInput(false);
                            setApiKey('');
                            setValidationError('');
                          }}
                        >
                          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                {keyConfig.hasKey && !showKeyInput && (
                  <View style={styles.actionsSection}>
                    <Pressable
                      style={[styles.button, styles.testButton]}
                      onPress={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <ThemedText style={styles.testButtonText}>Test Connection</ThemedText>
                      )}
                    </Pressable>
                    
                    <Pressable
                      style={[styles.button, styles.updateButton]}
                      onPress={() => setShowKeyInput(true)}
                    >
                      <ThemedText style={styles.updateButtonText}>Update Key</ThemedText>
                    </Pressable>
                    
                    <Pressable
                      style={[styles.button, styles.removeButton]}
                      onPress={handleRemoveKey}
                    >
                      <ThemedText style={styles.removeButtonText}>Remove Key</ThemedText>
                    </Pressable>
                  </View>
                )}

                {/* Show input form if no key exists */}
                {!keyConfig.hasKey && !showKeyInput && (
                  <View style={styles.noKeySection}>
                    <ThemedText style={styles.noKeyText}>No API key configured</ThemedText>
                    <Pressable
                      style={[styles.button, styles.addButton]}
                      onPress={() => setShowKeyInput(true)}
                    >
                      <ThemedText style={styles.addButtonText}>Add API Key</ThemedText>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </Animated.View>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    shadowOffset: { width: 0, height: 2 },
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
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  statusSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'monospace',
  },
  inputSection: {
    marginBottom: 24,
  },
  keyInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noKeySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noKeyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});