/**
 * 🪷 VIDEO KATHA RECORDER - Record a video story using the device camera
 *
 * Features:
 * - Camera preview (front-facing by default for storytelling)
 * - Flip camera toggle
 * - Record/stop with live timer
 * - Preview recorded video before saving
 * - Returns video URI + duration for saving as a 'video' type katha
 */

import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
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
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoKathaRecorderProps {
  onComplete: (videoUri: string, duration: number) => void;
  onCancel: () => void;
}

export function VideoKathaRecorder({ onComplete, onCancel }: VideoKathaRecorderProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Pulsing record indicator
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    // Request permissions if needed
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to record video stories.');
        return;
      }
    }
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record video stories.');
        return;
      }
    }

    try {
      setIsRecording(true);
      setDuration(0);
      startTimeRef.current = Date.now();

      // Start pulsing animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Record
      const result = await cameraRef.current.recordAsync({
        maxDuration: 300, // 5 min max
      });

      // Recording finished (either by stop or max duration)
      if (result?.uri) {
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordedUri(result.uri);
        setDuration(finalDuration);
      }
    } catch (error) {
      console.error('Video recording failed:', error);
      Alert.alert('Error', 'Could not record video. Please try again.');
    } finally {
      setIsRecording(false);
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission, pulseScale]);

  const stopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

  const handleFlipCamera = useCallback(() => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const handleDiscard = useCallback(() => {
    setRecordedUri(null);
    setDuration(0);
  }, []);

  const handleSave = useCallback(() => {
    if (recordedUri) {
      onComplete(recordedUri, duration);
    }
  }, [recordedUri, duration, onComplete]);

  // ─── Preview recorded video ───────────────────────
  if (recordedUri) {
    return (
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: recordedUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          useNativeControls={false}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + VanshSpacing.sm }]}>
          <Text style={styles.previewTitle}>Video Story Preview</Text>
          <Text style={styles.previewDuration}>{formatTime(duration)}</Text>
        </View>

        {/* Bottom actions */}
        <View style={[styles.previewActions, { paddingBottom: insets.bottom + VanshSpacing.lg }]}>
          <Pressable style={styles.discardBtn} onPress={handleDiscard}>
            <MaterialIcons name="replay" size={24} color="#FFF" />
            <Text style={styles.actionLabel}>Re-record</Text>
          </Pressable>

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
              style={styles.saveBtnGradient}
            >
              <MaterialIcons name="check" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Save Story</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Camera recording UI ──────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* Top controls */}
      <View style={[styles.topBar, { paddingTop: insets.top + VanshSpacing.sm }]}>
        <Pressable onPress={onCancel} hitSlop={12} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#FFF" />
        </Pressable>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Animated.View style={[styles.recordingDot, pulseStyle]} />
            <Text style={styles.recordingTimer}>{formatTime(duration)}</Text>
          </View>
        )}

        <Pressable onPress={handleFlipCamera} hitSlop={12} style={styles.flipBtn}>
          <MaterialIcons name="flip-camera-ios" size={24} color="#FFF" />
        </Pressable>
      </View>

      {/* Header text */}
      {!isRecording && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            🎬 Record a Video Story
          </Text>
          <Text style={styles.instructionSubtext}>
            Share a family memory, a message, or a story for future generations
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + VanshSpacing.lg }]}>
        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.recordBtn}
        >
          <View style={styles.recordBtnOuter}>
            {isRecording ? (
              <Animated.View style={pulseStyle}>
                <View style={styles.stopIcon} />
              </Animated.View>
            ) : (
              <View style={styles.recordBtnInner} />
            )}
          </View>
        </Pressable>

        <Text style={styles.recordHint}>
          {isRecording ? 'Tap to stop' : 'Tap to record'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.lg,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: VanshRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: VanshColors.sindoor[500],
  },
  recordingTimer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },

  // Instruction banner
  instructionBanner: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.xl,
  },
  instructionText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructionSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: VanshSpacing.lg,
  },
  recordBtn: {
    marginBottom: VanshSpacing.sm,
  },
  recordBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: VanshColors.sindoor[500],
  },
  stopIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: VanshColors.sindoor[500],
  },
  recordHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // Preview mode
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  previewDuration: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.xl,
  },
  discardBtn: {
    alignItems: 'center',
    gap: 6,
  },
  saveBtn: {
    alignItems: 'center',
    gap: 6,
  },
  saveBtnGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...VanshShadows.lg,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});
