/**
 * 🪷 VIDEO PLAYER - Inline & fullscreen video playback for memories
 */

import { MaterialIcons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { SacredText } from '../../components';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  /** Poster / thumbnail image to show before playback */
  posterUri?: string;
  /** 'inline' for grid/card usage, 'fullscreen' for the memory viewer */
  mode?: 'inline' | 'fullscreen';
  /** Auto-start playback */
  autoPlay?: boolean;
  /** Fixed width (defaults to screen width) */
  width?: number;
  /** Fixed height */
  height?: number;
  style?: any;
}

export function VideoPlayer({
  uri,
  posterUri,
  mode = 'inline',
  autoPlay = false,
  width,
  height,
  style,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(!autoPlay);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const containerWidth = width || SCREEN_WIDTH;
  const containerHeight = height || (mode === 'fullscreen' ? SCREEN_WIDTH * (9 / 16) : containerWidth * (9 / 16));

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis);
    setDuration(status.durationMillis || 0);

    // Loop or auto-pause at end
    if (status.didJustFinish) {
      setIsPlaying(false);
      setShowControls(true);
      videoRef.current?.setPositionAsync(0);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isPlaying]);

  const handlePress = useCallback(() => {
    if (mode === 'inline' && !isPlaying) {
      togglePlay();
      return;
    }
    setShowControls((prev) => !prev);
  }, [mode, isPlaying, togglePlay]);

  const formatTime = (millis: number) => {
    const totalSecs = Math.floor(millis / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        { width: containerWidth, height: containerHeight },
        mode === 'fullscreen' && styles.fullscreen,
        style,
      ]}
    >
      <Video
        ref={videoRef}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={mode === 'fullscreen' ? ResizeMode.CONTAIN : ResizeMode.COVER}
        shouldPlay={autoPlay}
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        posterSource={posterUri ? { uri: posterUri } : undefined}
        usePoster={!!posterUri}
        posterStyle={StyleSheet.absoluteFill}
      />

      {/* Loading spinner */}
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
        </View>
      )}

      {/* Play/Pause overlay */}
      {showControls && !isLoading && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={styles.overlay}
        >
          <Pressable onPress={togglePlay} style={styles.playButton}>
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={mode === 'fullscreen' ? 56 : 40}
              color="#FFFFFF"
            />
          </Pressable>

          {/* Duration badge (bottom-right) */}
          {duration > 0 && (
            <View style={styles.durationBadge}>
              <SacredText variant="caption" style={styles.durationText}>
                {isPlaying ? `${formatTime(position)} / ${formatTime(duration)}` : formatTime(duration)}
              </SacredText>
            </View>
          )}
        </Animated.View>
      )}

      {/* Minimal duration badge when controls are hidden */}
      {!showControls && duration > 0 && isPlaying && (
        <View style={styles.minimalDuration}>
          <SacredText variant="caption" style={styles.durationText}>
            {formatTime(duration - position)}
          </SacredText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: VanshColors.masi[900],
    borderRadius: VanshRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    borderRadius: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: VanshSpacing.sm,
    right: VanshSpacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: VanshSpacing.xs,
    paddingVertical: 2,
    borderRadius: VanshRadius.sm,
  },
  minimalDuration: {
    position: 'absolute',
    bottom: VanshSpacing.xs,
    right: VanshSpacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: VanshRadius.sm,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
