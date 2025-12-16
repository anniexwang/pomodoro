import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DURATION_LIMITS, TimerConfig } from '@/types/timer';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface DurationSettingsProps {
  visible: boolean;
  config: TimerConfig;
  onConfigChange: (config: TimerConfig) => void;
  onClose: () => void;
}

interface DurationInputProps {
  label: string;
  value: number; // in minutes
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const DurationInput: React.FC<DurationInputProps> = ({
  label,
  value,
  min,
  max,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const handleChangeText = (text: string) => {
    setInputValue(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Reset to current valid value if input is invalid
    if (isNaN(parseInt(inputValue, 10)) || parseInt(inputValue, 10) < min || parseInt(inputValue, 10) > max) {
      setInputValue(value.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Update input value when prop changes
  React.useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const isValid = !isNaN(parseInt(inputValue, 10)) && 
                  parseInt(inputValue, 10) >= min && 
                  parseInt(inputValue, 10) <= max;

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <ThemedText style={styles.inputLabel}>{label}</ThemedText>
        <ThemedText style={styles.inputRange}>({min}-{max} min)</ThemedText>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: isFocused ? primaryColor : (isValid ? borderColor : '#ff6b6b'),
              color: textColor 
            }
          ]}
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="numeric"
          placeholder={value.toString()}
          placeholderTextColor={`${textColor}60`}
        />
        <ThemedText style={styles.inputUnit}>minutes</ThemedText>
      </View>
      {!isValid && isFocused && (
        <ThemedText style={[styles.errorText, { color: '#ff6b6b' }]}>
          Must be between {min} and {max} minutes
        </ThemedText>
      )}
    </View>
  );
};

export const DurationSettings: React.FC<DurationSettingsProps> = ({
  visible,
  config,
  onConfigChange,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = useState<TimerConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  // Update local config when prop changes
  React.useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config, visible]);

  const handleStudyDurationChange = (minutes: number) => {
    const seconds = minutes * 60;
    setLocalConfig(prev => ({ ...prev, studyDuration: seconds }));
    setHasChanges(true);
  };

  const handleBreakDurationChange = (minutes: number) => {
    const seconds = minutes * 60;
    setLocalConfig(prev => ({ ...prev, breakDuration: seconds }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setHasChanges(false);
    onClose();
  };

  const isValidConfig = () => {
    const studyMinutes = localConfig.studyDuration / 60;
    const breakMinutes = localConfig.breakDuration / 60;
    
    return (
      studyMinutes >= DURATION_LIMITS.MIN_STUDY_DURATION / 60 &&
      studyMinutes <= DURATION_LIMITS.MAX_STUDY_DURATION / 60 &&
      breakMinutes >= DURATION_LIMITS.MIN_BREAK_DURATION / 60 &&
      breakMinutes <= DURATION_LIMITS.MAX_BREAK_DURATION / 60
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Duration Settings</ThemedText>
          <ThemedText style={styles.subtitle}>
            Customize your study and break durations
          </ThemedText>
        </View>

        <View style={styles.content}>
          <DurationInput
            label="Study Duration"
            value={localConfig.studyDuration / 60}
            min={DURATION_LIMITS.MIN_STUDY_DURATION / 60}
            max={DURATION_LIMITS.MAX_STUDY_DURATION / 60}
            onChange={handleStudyDurationChange}
          />

          <DurationInput
            label="Break Duration"
            value={localConfig.breakDuration / 60}
            min={DURATION_LIMITS.MIN_BREAK_DURATION / 60}
            max={DURATION_LIMITS.MAX_BREAK_DURATION / 60}
            onChange={handleBreakDurationChange}
          />

          {!isValidConfig() && (
            <ThemedView style={[styles.validationError, { borderColor: '#ff6b6b' }]}>
              <ThemedText style={[styles.errorText, { color: '#ff6b6b' }]}>
                Please ensure durations are within valid ranges
              </ThemedText>
            </ThemedView>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.cancelButton, { borderColor }]}
            onPress={handleCancel}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>
              Cancel
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: primaryColor },
              (!hasChanges || !isValidConfig()) && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || !isValidConfig()}
          >
            <ThemedText style={[styles.buttonText, { color: 'white' }]}>
              Save
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 40,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputRange: {
    fontSize: 14,
    opacity: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  validationError: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});