/**
 * 🪷 KATHA RECORDER - Voice story recording
 */

import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, SacredText, SilkButton } from '../../components';
import { useAuthStore, useKathaStore } from '../../state';
import { VanshColors, VanshShadows, VanshSpacing } from '../../theme';

interface KathaRecorderProps {
  linkedMemoryId?: string;
  onComplete?: (audioUri: string, duration: number) => void;
  onCancel?: () => void;
}

export function KathaRecorder({ linkedMemoryId, onComplete, onCancel }: KathaRecorderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { startRecording, stopRecording, updateRecording, isRecording } = useKathaStore();
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  
  // Animated recording indicator
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(1);
    }
  }, [isRecording]);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to record your story.');
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setRecordedUri(null);
      setDuration(0);
      setWaveform([]);
      startRecording();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        // Simulate waveform data - update separately to avoid setState during render
        setWaveform(wave => {
          const newWave = [...wave, Math.random() * 0.8 + 0.2];
          return newWave;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, []);
  
  const handleStopRecording = useCallback(async () => {
    if (!recording) return;
    
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      stopRecording();
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [recording]);
  
  const handleSave = useCallback(() => {
    if (recordedUri && onComplete) {
      onComplete(recordedUri, duration);
    }
  }, [recordedUri, duration, onComplete]);
  
  const handleDiscard = useCallback(() => {
    setRecordedUri(null);
    setDuration(0);
    setWaveform([]);
  }, []);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="Cancel" onPress={onCancel} />
        <SacredText variant="title" color="primary">Record Story</SacredText>
        <View style={{ width: 70 }} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Instructions */}
        <HeritageCard variant="outlined" style={styles.instructionCard}>
          <SacredText variant="subhead" color="gold" align="center">
            🎙️ Share Your Story
          </SacredText>
          <SacredText variant="body" color="secondary" align="center" style={styles.instructions}>
            {linkedMemoryId
              ? "Tell us the story behind this memory. Who's in it? What was happening? What makes it special?"
              : "Record a family story, memory, or message for future generations."}
          </SacredText>
        </HeritageCard>
        
        {/* Timer */}
        <View style={styles.timerContainer}>
          <SacredText variant="displayLarge" color={isRecording ? 'vermilion' : 'primary'}>
            {formatTime(duration)}
          </SacredText>
          {isRecording && (
            <SacredText variant="caption" color="muted">Recording...</SacredText>
          )}
        </View>
        
        {/* Waveform Preview */}
        {waveform.length > 0 && (
          <View style={styles.waveformContainer}>
            {waveform.slice(-30).map((amplitude, index) => (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: 10 + amplitude * 40,
                    backgroundColor: isRecording
                      ? VanshColors.sindoor[500]
                      : VanshColors.suvarna[500],
                  },
                ]}
              />
            ))}
          </View>
        )}
        
        {/* Recording Button */}
        <View style={styles.buttonContainer}>
          {!recordedUri ? (
            <Pressable
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              style={styles.recordButton}
            >
              <Animated.View
                style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordingActive,
                  isRecording && pulseStyle,
                ]}
              >
                {isRecording ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <SacredText variant="hero" style={styles.micIcon}>🎙️</SacredText>
                )}
              </Animated.View>
            </Pressable>
          ) : (
            <View style={styles.postRecordActions}>
              <SilkButton
                variant="ghost"
                label="Discard"
                onPress={handleDiscard}
              />
              <SilkButton
                variant="primary"
                label="Save Story"
                onPress={handleSave}
              />
            </View>
          )}
        </View>
        
        {/* Tips */}
        <View style={styles.tips}>
          <SacredText variant="caption" color="muted" align="center">
            💡 Speak naturally, as if you're telling a loved one
          </SacredText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  content: {
    flex: 1,
    padding: VanshSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCard: {
    width: '100%',
    marginBottom: VanshSpacing.xl,
  },
  instructions: {
    marginTop: VanshSpacing.sm,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: VanshSpacing.xl,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: VanshSpacing.xl,
    gap: 3,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  buttonContainer: {
    marginBottom: VanshSpacing.xl,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: VanshColors.khadi[200],
    justifyContent: 'center',
    alignItems: 'center',
    ...VanshShadows.lg,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: VanshColors.suvarna[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: VanshColors.sindoor[600],
  },
  micIcon: {
    fontSize: 40,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: VanshColors.khadi[50],
  },
  postRecordActions: {
    flexDirection: 'row',
    gap: VanshSpacing.lg,
  },
  tips: {
    paddingHorizontal: VanshSpacing.xl,
  },
});
