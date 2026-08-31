/**
 * 🪷 PHOTO STORY RECORDER - Record voice over a sequence of photos
 *
 * The user selects photos, then records audio while tapping through them.
 * Each tap creates a VoiceSyncPoint linking the audio timestamp to the photo.
 * The result is a katha with syncPoints for voice-photo stitching playback.
 *
 * Flow:
 * 1. Pick photos from gallery (or use pre-selected ones)
 * 2. Tap record → audio starts
 * 3. Tap a photo → creates sync point at current audio time
 * 4. Stop recording → preview with synced playback
 * 5. Save → returns audioUri, duration, syncPoints[], linkedMedia[]
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { RecordingStatus } from 'expo-av/build/Audio/Recording.types';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    cancelAnimation,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemoryStore } from '../../state';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import type { MemoryId, VoiceSyncPoint } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = 72;

type RecorderPhase = 'select' | 'record' | 'review';

interface PhotoStoryRecorderProps {
  /** Pre-selected memory IDs (e.g. from an event album) */
  preselectedMemoryIds?: string[];
  onComplete: (data: {
    audioUri: string;
    duration: number;
    syncPoints: VoiceSyncPoint[];
    linkedMedia: string[];
    waveform: number[];
  }) => void;
  onCancel: () => void;
}

interface SelectedPhoto {
  id: string;
  uri: string;
  isFromLibrary: boolean; // true = picked from device, false = from app memories
}

export function PhotoStoryRecorder({
  preselectedMemoryIds,
  onComplete,
  onCancel,
}: PhotoStoryRecorderProps) {
  const insets = useSafeAreaInsets();
  const { recentMemories } = useMemoryStore();

  const [phase, setPhase] = useState<RecorderPhase>(
    preselectedMemoryIds && preselectedMemoryIds.length > 0 ? 'record' : 'select'
  );
  const [photos, setPhotos] = useState<SelectedPhoto[]>(() => {
    if (preselectedMemoryIds) {
      return preselectedMemoryIds
        .map((id) => {
          const mem = recentMemories.find((m) => m.id === id);
          return mem ? { id: mem.id, uri: mem.uri, isFromLibrary: false } : null;
        })
        .filter(Boolean) as SelectedPhoto[];
    }
    return [];
  });

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [syncPoints, setSyncPoints] = useState<VoiceSyncPoint[]>([]);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);

  const startTimeRef = useRef<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Cleanup recording on unmount to prevent native resource leak
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  // Pulsing animation
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const dbToAmplitude = (db: number): number => {
    const minDb = -60;
    const clamped = Math.max(minDb, Math.min(0, db));
    return (clamped - minDb) / (0 - minDb);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Phase 1: Select Photos ──────────────────────

  const pickPhotos = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 20,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos: SelectedPhoto[] = result.assets.map((asset, i) => ({
        id: `picked-${Date.now()}-${i}`,
        uri: asset.uri,
        isFromLibrary: true,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  }, []);

  const addFromMemories = useCallback(() => {
    // Add recent memories that aren't already selected
    const existing = new Set(photos.map((p) => p.id));
    const available = recentMemories
      .filter((m) => m.type === 'photo' && !existing.has(m.id))
      .slice(0, 10);

    if (available.length === 0) {
      Alert.alert('No Photos', 'No additional photos available. Try picking from your gallery.');
      return;
    }

    const newPhotos: SelectedPhoto[] = available.map((m) => ({
      id: m.id,
      uri: m.thumbnailUri || m.uri,
      isFromLibrary: false,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, [photos, recentMemories]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const proceedToRecord = useCallback(() => {
    if (photos.length < 2) {
      Alert.alert('Need More Photos', 'Please select at least 2 photos for the story.');
      return;
    }
    setActivePhotoIndex(0);
    setPhase('record');
  }, [photos]);

  // ─── Phase 2: Record Audio + Tap Sync ─────────────

  const onRecordingStatusUpdate = useCallback((status: RecordingStatus) => {
    if (!status.isRecording) return;
    const durationSec = Math.floor(status.durationMillis / 1000);
    setDuration(durationSec);

    if (status.metering !== undefined) {
      const amplitude = dbToAmplitude(status.metering);
      setCurrentLevel(amplitude);
      setWaveform((prev) => [...prev, amplitude]);
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record your story.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      newRecording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
      newRecording.setProgressUpdateInterval(100);

      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecording(true);
      setDuration(0);
      setWaveform([]);
      setSyncPoints([]);
      setCurrentLevel(0);
      startTimeRef.current = Date.now();

      // Create initial sync point for the first photo
      setSyncPoints([{
        audioTime: 0,
        mediaId: photos[0].id as MemoryId,
        action: 'show',
      }]);

      // Start pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, [photos, onRecordingStatusUpdate, pulseScale]);

  const handlePhotoTap = useCallback(
    (index: number) => {
      if (!isRecording || index === activePhotoIndex) return;

      const audioTime = (Date.now() - startTimeRef.current) / 1000;

      // Create sync point
      const newSyncPoint: VoiceSyncPoint = {
        audioTime,
        mediaId: photos[index].id as MemoryId,
        action: 'show',
      };

      setSyncPoints((prev) => [...prev, newSyncPoint]);
      setActivePhotoIndex(index);

      // Scroll thumbnail strip to show active
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    },
    [isRecording, activePhotoIndex, photos]
  );

  const handleStopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1);
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
      recordingRef.current = null;
      setCurrentLevel(0);
      setPhase('review');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [recording, pulseScale]);

  // ─── Phase 3: Review & Save ───────────────────────

  const handleSave = useCallback(() => {
    if (!recordedUri) return;

    onComplete({
      audioUri: recordedUri,
      duration,
      syncPoints,
      linkedMedia: photos.map((p) => p.id),
      waveform,
    });
  }, [recordedUri, duration, syncPoints, photos, waveform, onComplete]);

  const handleReRecord = useCallback(() => {
    setRecordedUri(null);
    setDuration(0);
    setWaveform([]);
    setSyncPoints([]);
    setActivePhotoIndex(0);
    setPhase('record');
  }, []);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  // ─── Phase: Select Photos ─────────────────────────
  if (phase === 'select') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={VanshColors.masi[600]} />
          </Pressable>
          <Text style={styles.headerTitle}>Choose Photos</Text>
          <Pressable
            onPress={proceedToRecord}
            disabled={photos.length < 2}
            hitSlop={12}
          >
            <Text
              style={[
                styles.nextBtn,
                photos.length < 2 && { opacity: 0.4 },
              ]}
            >
              Next →
            </Text>
          </Pressable>
        </View>

        <Text style={styles.selectSubtitle}>
          Select the photos you want to narrate over ({photos.length} selected)
        </Text>

        {/* Selected photos grid */}
        <ScrollView contentContainerStyle={styles.photoGrid} showsVerticalScrollIndicator={false}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoGridItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoGridImage} contentFit="cover" />
              <Pressable
                style={styles.photoRemoveBtn}
                onPress={() => removePhoto(photo.id)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={14} color="#FFF" />
              </Pressable>
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add photo buttons */}
          <Pressable style={styles.addPhotoBtn} onPress={pickPhotos}>
            <MaterialIcons name="add-photo-alternate" size={28} color={VanshColors.suvarna[500]} />
            <Text style={styles.addPhotoLabel}>Gallery</Text>
          </Pressable>

          <Pressable style={styles.addPhotoBtn} onPress={addFromMemories}>
            <MaterialIcons name="collections" size={28} color={VanshColors.suvarna[500]} />
            <Text style={styles.addPhotoLabel}>Memories</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ─── Phase: Record ────────────────────────────────
  if (phase === 'record') {
    return (
      <View style={styles.container}>
        {/* Active photo (full screen) */}
        <Image
          source={{ uri: photos[activePhotoIndex]?.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top bar */}
        <View style={[styles.recordTopBar, { paddingTop: insets.top + VanshSpacing.sm }]}>
          <Pressable onPress={onCancel} hitSlop={12} style={styles.topBtn}>
            <MaterialIcons name="close" size={22} color="#FFF" />
          </Pressable>

          {isRecording && (
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.liveTimer}>{formatTime(duration)}</Text>
            </View>
          )}

          <View style={{ width: 40 }} />
        </View>

        {/* Instructions */}
        {!isRecording && (
          <Animated.View entering={FadeIn} style={styles.recordInstructions}>
            <Text style={styles.recordInstructionTitle}>📸 Photo Story</Text>
            <Text style={styles.recordInstructionText}>
              Tap record, then tap photos below{'\n'}to sync them with your narration
            </Text>
          </Animated.View>
        )}

        {/* Audio level meter */}
        {isRecording && (
          <View style={styles.meterContainer}>
            <View
              style={[
                styles.meterBar,
                { width: `${Math.max(5, currentLevel * 100)}%` },
              ]}
            />
          </View>
        )}

        {/* Sync point indicator */}
        {isRecording && (
          <View style={styles.syncInfo}>
            <Text style={styles.syncInfoText}>
              {syncPoints.length} sync {syncPoints.length === 1 ? 'point' : 'points'} · Tap a photo to sync
            </Text>
          </View>
        )}

        {/* Photo thumbnail strip */}
        <View style={[styles.thumbStrip, { paddingBottom: insets.bottom + 100 }]}>
          <FlatList
            ref={flatListRef}
            data={photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStripContent}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handlePhotoTap(index)}
                style={[
                  styles.thumbItem,
                  index === activePhotoIndex && styles.thumbItemActive,
                ]}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbImage}
                  contentFit="cover"
                />
                {/* Sync point badge */}
                {syncPoints.some((sp) => sp.mediaId === item.id) && (
                  <View style={styles.syncBadge}>
                    <MaterialIcons name="mic" size={10} color="#FFF" />
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>

        {/* Record button */}
        <View style={[styles.recordBtnBar, { bottom: insets.bottom + VanshSpacing.lg }]}>
          <Pressable
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={styles.mainRecordBtn}
          >
            <View style={styles.recordBtnOuter}>
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <View style={styles.recordBtnInner} />
              )}
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Phase: Review ────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleReRecord} hitSlop={12}>
          <MaterialIcons name="replay" size={22} color={VanshColors.masi[600]} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Story</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.reviewContent}>
        {/* Preview of active photo */}
        <View style={styles.reviewPhotoContainer}>
          <Image
            source={{ uri: photos[activePhotoIndex]?.uri }}
            style={styles.reviewPhoto}
            contentFit="cover"
          />
        </View>

        {/* Sync timeline */}
        <View style={styles.syncTimeline}>
          <Text style={styles.syncTimelineTitle}>
            ⏱️ {syncPoints.length} sync points · {formatTime(duration)} recording
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {syncPoints.map((sp, i) => (
              <Pressable
                key={i}
                style={styles.syncTimelineItem}
                onPress={() => {
                  const idx = photos.findIndex((p) => p.id === sp.mediaId);
                  if (idx !== -1) setActivePhotoIndex(idx);
                }}
              >
                <Image
                  source={{ uri: photos.find((p) => p.id === sp.mediaId)?.uri }}
                  style={styles.syncTimelineThumb}
                  contentFit="cover"
                />
                <Text style={styles.syncTimelineTime}>{formatTime(sp.audioTime)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Waveform preview */}
        <View style={styles.waveformPreview}>
          {waveform.slice(0, 60).map((amp, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 4 + amp * 30,
                  backgroundColor: VanshColors.suvarna[400 + ((i % 2) * 100) as 400 | 500],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Save button */}
      <View style={[styles.reviewFooter, { paddingBottom: insets.bottom + VanshSpacing.lg }]}>
        <Pressable onPress={handleReRecord} style={styles.reRecordBtn}>
          <MaterialIcons name="replay" size={18} color={VanshColors.masi[600]} />
          <Text style={styles.reRecordLabel}>Re-record</Text>
        </Pressable>

        <Pressable onPress={handleSave} style={styles.saveStoryBtn}>
          <LinearGradient
            colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveStoryGradient}
          >
            <MaterialIcons name="check" size={20} color="#FFF" />
            <Text style={styles.saveStoryText}>Save Photo Story</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  nextBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: VanshColors.suvarna[600],
  },

  // Select phase
  selectSubtitle: {
    fontSize: 13,
    color: VanshColors.masi[400],
    textAlign: 'center',
    paddingVertical: VanshSpacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: VanshSpacing.md,
    gap: VanshSpacing.sm,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - VanshSpacing.md * 2 - VanshSpacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: VanshRadius.md,
    overflow: 'hidden',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndex: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: VanshColors.suvarna[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndexText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  addPhotoBtn: {
    width: (SCREEN_WIDTH - VanshSpacing.md * 2 - VanshSpacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: VanshRadius.md,
    borderWidth: 2,
    borderColor: VanshColors.suvarna[200],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.suvarna[50],
    gap: 4,
  },
  addPhotoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },

  // Record phase
  recordTopBar: {
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
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: VanshRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: VanshColors.sindoor[500],
  },
  liveTimer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  recordInstructions: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.xl,
  },
  recordInstructionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  recordInstructionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 20,
  },

  // Audio level meter
  meterContainer: {
    position: 'absolute',
    top: '15%',
    left: VanshSpacing.xl,
    right: VanshSpacing.xl,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  meterBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: VanshColors.suvarna[400],
  },

  // Sync info
  syncInfo: {
    position: 'absolute',
    bottom: 190,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  syncInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: VanshRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  // Thumb strip
  thumbStrip: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
  thumbStripContent: {
    paddingHorizontal: VanshSpacing.lg,
    gap: VanshSpacing.sm,
  },
  thumbItem: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: VanshRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  thumbItemActive: {
    borderColor: VanshColors.suvarna[400],
    borderWidth: 3,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  syncBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: VanshColors.sindoor[500],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Record button
  recordBtnBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mainRecordBtn: {},
  recordBtnOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: VanshColors.sindoor[500],
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: VanshColors.sindoor[500],
  },

  // Review phase
  reviewContent: {
    flex: 1,
    padding: VanshSpacing.lg,
  },
  reviewPhotoContainer: {
    height: 220,
    borderRadius: VanshRadius.lg,
    overflow: 'hidden',
    marginBottom: VanshSpacing.lg,
    ...VanshShadows.md,
  },
  reviewPhoto: {
    width: '100%',
    height: '100%',
  },
  syncTimeline: {
    marginBottom: VanshSpacing.lg,
  },
  syncTimelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[600],
    marginBottom: VanshSpacing.sm,
  },
  syncTimelineItem: {
    alignItems: 'center',
    marginRight: VanshSpacing.md,
  },
  syncTimelineThumb: {
    width: 56,
    height: 56,
    borderRadius: VanshRadius.md,
    marginBottom: 4,
  },
  syncTimelineTime: {
    fontSize: 10,
    fontWeight: '600',
    color: VanshColors.masi[400],
  },
  waveformPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },

  // Review footer
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.lg,
    gap: VanshSpacing.md,
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: VanshRadius.full,
    backgroundColor: VanshColors.khadi[200],
  },
  reRecordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[600],
  },
  saveStoryBtn: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    ...VanshShadows.md,
  },
  saveStoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveStoryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
