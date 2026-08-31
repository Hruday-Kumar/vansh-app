/**
 * 🪷 TRANSCRIPTION PANEL - Auto-transcribe katha recordings
 *
 * Shows after recording a voice katha. Offers to auto-transcribe
 * the audio using the Whisper API. Displays progress, result text,
 * and allows editing the transcript before saving.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import {
    type TranscriptionLanguage,
    type TranscriptionProgress,
    type TranscriptionResult,
    formatTranscriptionForDisplay,
    generateKathaPrompt,
    isTranscriptionAvailable,
    transcribeAudio,
} from '../../services/transcription';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';

interface TranscriptionPanelProps {
  audioUri: string;
  duration: number;
  narratorName?: string;
  familyName?: string;
  onTranscriptionComplete: (text: string, segments?: any[]) => void;
  onSkip: () => void;
}

type PanelState = 'prompt' | 'language' | 'transcribing' | 'result' | 'error';

const LANGUAGES: { code: TranscriptionLanguage; label: string; icon: string }[] = [
  { code: 'auto', label: 'Auto-detect', icon: '🌐' },
  { code: 'en', label: 'English', icon: '🇬🇧' },
  { code: 'hi', label: 'Hindi', icon: '🇮🇳' },
  { code: 'te', label: 'Telugu', icon: '🇮🇳' },
];

export function TranscriptionPanel({
  audioUri,
  duration,
  narratorName,
  familyName,
  onTranscriptionComplete,
  onSkip,
}: TranscriptionPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>('prompt');
  const [selectedLanguage, setSelectedLanguage] = useState<TranscriptionLanguage>('auto');
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const available = isTranscriptionAvailable();

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Shimmer animation for transcribing state
  const shimmer = useSharedValue(0);
  useEffect(() => {
    if (panelState === 'transcribing') {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true,
      );
    }
  }, [panelState, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmer.value * 0.5,
  }));

  const handleProgressUpdate = useCallback((p: TranscriptionProgress) => {
    setProgress(p);
    progressWidth.value = withTiming(p.progress, { duration: 300 });
  }, [progressWidth]);

  const startTranscription = useCallback(async () => {
    setPanelState('transcribing');
    setProgress({
      status: 'preparing',
      progress: 0,
      message: 'Preparing audio...',
    });

    try {
      const prompt = generateKathaPrompt({
        narratorName,
        familyName,
        language: selectedLanguage,
      });

      const transcriptionResult = await transcribeAudio(audioUri, {
        language: selectedLanguage,
        prompt,
        timestamps: true,
        onProgress: handleProgressUpdate,
      });

      const formattedText = formatTranscriptionForDisplay(transcriptionResult);
      setResult(transcriptionResult);
      setEditedText(formattedText);
      setPanelState('result');
    } catch (error) {
      console.error('[Transcription] Failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Transcription failed',
      );
      setPanelState('error');
    }
  }, [audioUri, selectedLanguage, narratorName, familyName, handleProgressUpdate]);

  const handleSave = useCallback(() => {
    onTranscriptionComplete(editedText, result?.segments);
  }, [editedText, result, onTranscriptionComplete]);

  const handleRetry = useCallback(() => {
    setPanelState('language');
    setProgress(null);
    setResult(null);
    setErrorMessage('');
  }, []);

  // ─── Prompt State ───
  if (panelState === 'prompt') {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
        <View style={styles.promptCard}>
          <View style={styles.promptIconContainer}>
            <LinearGradient
              colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
              style={styles.promptIconBg}
            >
              <MaterialIcons name="auto-fix-high" size={28} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.promptTitle}>Auto-Transcribe?</Text>
          <Text style={styles.promptSubtitle}>
            Convert your {formatDuration(duration)} recording to text.
            {'\n'}Perfect for preserving stories in written form.
          </Text>

          {!available && (
            <View style={styles.unavailableBanner}>
              <MaterialIcons name="info-outline" size={16} color={VanshColors.sindoor[500]} />
              <Text style={styles.unavailableText}>
                Transcription service not configured. Set your API key in Settings.
              </Text>
            </View>
          )}

          <View style={styles.promptActions}>
            <Pressable
              style={styles.transcribeBtn}
              onPress={() => setPanelState('language')}
              disabled={!available}
            >
              <LinearGradient
                colors={
                  available
                    ? [VanshColors.suvarna[400], VanshColors.suvarna[600]]
                    : [VanshColors.masi[300], VanshColors.masi[400]]
                }
                style={styles.transcribeBtnGradient}
              >
                <MaterialIcons name="mic" size={18} color="#FFF" />
                <Text style={styles.transcribeBtnText}>Transcribe</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ─── Language Selection ───
  if (panelState === 'language') {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
        <View style={styles.promptCard}>
          <Text style={styles.sectionTitle}>Select Language</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the primary language of the recording
          </Text>

          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageChip,
                  selectedLanguage === lang.code && styles.languageChipActive,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <Text style={styles.languageIcon}>{lang.icon}</Text>
                <Text
                  style={[
                    styles.languageLabel,
                    selectedLanguage === lang.code && styles.languageLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
                {selectedLanguage === lang.code && (
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color={VanshColors.suvarna[600]}
                  />
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.promptActions}>
            <Pressable style={styles.transcribeBtn} onPress={startTranscription}>
              <LinearGradient
                colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
                style={styles.transcribeBtnGradient}
              >
                <MaterialIcons name="auto-fix-high" size={18} color="#FFF" />
                <Text style={styles.transcribeBtnText}>Start Transcription</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={() => setPanelState('prompt')}>
              <Text style={styles.skipBtnText}>Back</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ─── Transcribing State ───
  if (panelState === 'transcribing') {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
        <View style={styles.promptCard}>
          <Animated.View style={[styles.transcribingIcon, shimmerStyle]}>
            <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
          </Animated.View>

          <Text style={styles.transcribingTitle}>
            {progress?.message || 'Transcribing...'}
          </Text>
          <Text style={styles.transcribingSubtitle}>
            This may take a moment depending on recording length
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Text style={styles.progressPercent}>
            {progress?.progress || 0}%
          </Text>

          {/* Status steps */}
          <View style={styles.statusSteps}>
            {['preparing', 'uploading', 'transcribing', 'processing', 'complete'].map(
              (step, i) => {
                const isDone =
                  progress &&
                  ['preparing', 'uploading', 'transcribing', 'processing', 'complete'].indexOf(
                    progress.status,
                  ) > i;
                const isCurrent = progress?.status === step;
                return (
                  <View key={step} style={styles.statusStep}>
                    <MaterialIcons
                      name={
                        isDone
                          ? 'check-circle'
                          : isCurrent
                          ? 'radio-button-checked'
                          : 'radio-button-unchecked'
                      }
                      size={14}
                      color={
                        isDone || isCurrent
                          ? VanshColors.suvarna[500]
                          : VanshColors.masi[300]
                      }
                    />
                    <Text
                      style={[
                        styles.statusStepText,
                        (isDone || isCurrent) && styles.statusStepTextActive,
                      ]}
                    >
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>
      </Animated.View>
    );
  }

  // ─── Error State ───
  if (panelState === 'error') {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
        <View style={styles.promptCard}>
          <View style={styles.errorIcon}>
            <MaterialIcons name="error-outline" size={36} color={VanshColors.sindoor[500]} />
          </View>
          <Text style={styles.errorTitle}>Transcription Failed</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>

          <View style={styles.promptActions}>
            <Pressable style={styles.transcribeBtn} onPress={handleRetry}>
              <LinearGradient
                colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
                style={styles.transcribeBtnGradient}
              >
                <MaterialIcons name="refresh" size={18} color="#FFF" />
                <Text style={styles.transcribeBtnText}>Try Again</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ─── Result State ───
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.container}>
      <View style={styles.resultCard}>
        {/* Header */}
        <View style={styles.resultHeader}>
          <MaterialIcons name="check-circle" size={20} color={VanshColors.suvarna[600]} />
          <Text style={styles.resultTitle}>Transcription Complete</Text>
          {result?.language && (
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>
                {result.language.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Editable transcript */}
        <View style={styles.transcriptContainer}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptLabel}>Transcript</Text>
            <Pressable
              style={styles.editToggle}
              onPress={() => setIsEditing(!isEditing)}
            >
              <MaterialIcons
                name={isEditing ? 'check' : 'edit'}
                size={16}
                color={VanshColors.suvarna[600]}
              />
              <Text style={styles.editToggleText}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.transcriptInput}
              value={editedText}
              onChangeText={setEditedText}
              multiline
              textAlignVertical="top"
              placeholder="Edit transcript..."
              placeholderTextColor={VanshColors.masi[300]}
            />
          ) : (
            <ScrollView style={styles.transcriptScroll} nestedScrollEnabled>
              <Text style={styles.transcriptText}>{editedText}</Text>
            </ScrollView>
          )}
        </View>

        {/* Word count */}
        <Text style={styles.wordCount}>
          {editedText.split(/\s+/).filter(Boolean).length} words ·{' '}
          {formatDuration(duration)} audio
        </Text>

        {/* Actions */}
        <View style={styles.resultActions}>
          <Pressable style={styles.transcribeBtn} onPress={handleSave}>
            <LinearGradient
              colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
              style={styles.transcribeBtnGradient}
            >
              <MaterialIcons name="save" size={18} color="#FFF" />
              <Text style={styles.transcribeBtnText}>Save with Transcript</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Save without Transcript</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
  },

  // Prompt card
  promptCard: {
    backgroundColor: '#FFF',
    borderRadius: VanshRadius.xl,
    padding: VanshSpacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  promptIconContainer: {
    marginBottom: VanshSpacing.md,
  },
  promptIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: 6,
  },
  promptSubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: VanshSpacing.md,
  },
  promptActions: {
    width: '100%',
    gap: VanshSpacing.sm,
    marginTop: VanshSpacing.sm,
  },

  // Unavailable banner
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VanshColors.sindoor[50],
    borderRadius: VanshRadius.md,
    padding: VanshSpacing.sm,
    marginBottom: VanshSpacing.sm,
  },
  unavailableText: {
    fontSize: 12,
    color: VanshColors.sindoor[600],
    flex: 1,
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: VanshColors.masi[400],
    marginBottom: VanshSpacing.md,
  },

  // Language grid
  languageGrid: {
    width: '100%',
    gap: VanshSpacing.xs,
    marginBottom: VanshSpacing.sm,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: VanshRadius.lg,
    borderWidth: 1.5,
    borderColor: VanshColors.khadi[200],
    backgroundColor: '#FFF',
  },
  languageChipActive: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  languageIcon: {
    fontSize: 18,
  },
  languageLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: VanshColors.masi[600],
  },
  languageLabelActive: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },

  // Buttons
  transcribeBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  transcribeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  transcribeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: VanshColors.masi[400],
  },

  // Transcribing state
  transcribingIcon: {
    marginBottom: VanshSpacing.md,
  },
  transcribingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.masi[800],
    marginBottom: 4,
  },
  transcribingSubtitle: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginBottom: VanshSpacing.md,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: VanshColors.khadi[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: VanshColors.suvarna[500],
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
    marginBottom: VanshSpacing.md,
  },
  statusSteps: {
    width: '100%',
    gap: 6,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusStepText: {
    fontSize: 12,
    color: VanshColors.masi[300],
  },
  statusStepTextActive: {
    color: VanshColors.masi[600],
    fontWeight: '500',
  },

  // Error state
  errorIcon: {
    marginBottom: VanshSpacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.sindoor[600],
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: VanshColors.masi[500],
    textAlign: 'center',
    marginBottom: VanshSpacing.md,
  },

  // Result card
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: VanshRadius.xl,
    padding: VanshSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: VanshSpacing.md,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[800],
    flex: 1,
  },
  langBadge: {
    backgroundColor: VanshColors.suvarna[100],
    borderRadius: VanshRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
  },

  // Transcript
  transcriptContainer: {
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
    borderRadius: VanshRadius.lg,
    marginBottom: VanshSpacing.sm,
    overflow: 'hidden',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: VanshColors.khadi[100],
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: VanshColors.masi[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },
  transcriptScroll: {
    maxHeight: 160,
    padding: 14,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 22,
    color: VanshColors.masi[700],
  },
  transcriptInput: {
    maxHeight: 160,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    color: VanshColors.masi[700],
  },

  // Word count
  wordCount: {
    fontSize: 11,
    color: VanshColors.masi[400],
    marginBottom: VanshSpacing.md,
  },

  // Result actions
  resultActions: {
    gap: VanshSpacing.sm,
  },
});
