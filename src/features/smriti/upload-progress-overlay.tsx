/**
 * 🪷 UPLOAD PROGRESS OVERLAY - Floating upload queue indicator
 *
 * Shows a compact floating pill at the bottom of the screen when uploads
 * are in progress. Expands to show individual file progress bars.
 * Auto-hides when the queue is empty.
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemoryStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';

interface UploadProgressOverlayProps {
  /** Additional bottom offset (e.g. for tab bar) */
  bottomOffset?: number;
}

export function UploadProgressOverlay({ bottomOffset = 80 }: UploadProgressOverlayProps) {
  const insets = useSafeAreaInsets();
  const { uploadQueue, isUploading } = useMemoryStore();
  const [expanded, setExpanded] = useState(false);

  // Pulsing animation for the spinner
  const spinPulse = useSharedValue(1);

  useEffect(() => {
    if (isUploading) {
      spinPulse.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        false,
      );
    } else {
      spinPulse.value = withTiming(1);
    }
  }, [isUploading, spinPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: spinPulse.value,
  }));

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (!isUploading && uploadQueue.length === 0) return null;

  const completedCount = uploadQueue.filter((u) => u.progress >= 100).length;
  const totalCount = uploadQueue.length;
  const overallProgress =
    totalCount > 0
      ? Math.round(uploadQueue.reduce((sum, u) => sum + u.progress, 0) / totalCount)
      : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={[
        styles.container,
        { bottom: insets.bottom + bottomOffset },
      ]}
    >
      {/* Compact pill */}
      <Pressable onPress={toggleExpand} style={styles.pill}>
        <Animated.View style={[styles.pillIcon, pulseStyle]}>
          <MaterialIcons
            name={overallProgress >= 100 ? 'check-circle' : 'cloud-upload'}
            size={20}
            color={overallProgress >= 100 ? VanshColors.suvarna[600] : '#FFF'}
          />
        </Animated.View>

        <View style={styles.pillContent}>
          <Text style={styles.pillText}>
            {overallProgress >= 100
              ? `${completedCount} uploaded`
              : `Uploading ${completedCount}/${totalCount}...`}
          </Text>
          {/* Mini progress bar */}
          <View style={styles.miniProgressTrack}>
            <View
              style={[
                styles.miniProgressFill,
                { width: `${Math.min(overallProgress, 100)}%` },
              ]}
            />
          </View>
        </View>

        <MaterialIcons
          name={expanded ? 'expand-more' : 'expand-less'}
          size={20}
          color="rgba(255,255,255,0.7)"
        />
      </Pressable>

      {/* Expanded detail list */}
      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={styles.detail}
        >
          {uploadQueue.map((item) => (
            <View key={item.id} style={styles.detailRow}>
              <MaterialIcons
                name={
                  item.progress >= 100
                    ? 'check-circle'
                    : item.progress > 0
                    ? 'cloud-upload'
                    : 'hourglass-empty'
                }
                size={16}
                color={
                  item.progress >= 100
                    ? VanshColors.suvarna[500]
                    : VanshColors.masi[400]
                }
              />
              <View style={styles.detailBarContainer}>
                <View style={styles.detailBarTrack}>
                  <View
                    style={[
                      styles.detailBarFill,
                      { width: `${Math.min(item.progress, 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.detailPercent}>
                {Math.round(item.progress)}%
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: VanshSpacing.lg,
    right: VanshSpacing.lg,
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VanshColors.masi[800],
    borderRadius: VanshRadius.xl,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: VanshColors.suvarna[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContent: {
    flex: 1,
    gap: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  miniProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: VanshColors.suvarna[400],
    borderRadius: 1.5,
  },
  detail: {
    backgroundColor: VanshColors.masi[700],
    borderBottomLeftRadius: VanshRadius.lg,
    borderBottomRightRadius: VanshRadius.lg,
    marginTop: -VanshRadius.xl,
    paddingTop: VanshRadius.xl + 4,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  detailBarContainer: {
    flex: 1,
  },
  detailBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  detailBarFill: {
    height: '100%',
    backgroundColor: VanshColors.suvarna[400],
    borderRadius: 2,
  },
  detailPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    width: 32,
    textAlign: 'right',
  },
});
