/**
 * 🪷 VOICE WAVEFORM - Audio visualization component
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import {
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import { SacredText } from '../atoms/sacred-text';

interface VoiceWaveformProps {
  waveform: number[]; // Array of amplitude values 0-1
  duration: number; // Total duration in seconds
  currentPosition?: number; // Current playback position 0-1
  isPlaying?: boolean;
  onSeek?: (position: number) => void;
  onPlayPause?: () => void;
  narratorName?: string;
  style?: ViewStyle;
}

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MIN_BAR_HEIGHT = 4;
const MAX_BAR_HEIGHT = 40;

export function VoiceWaveform({
  waveform,
  duration,
  currentPosition = 0,
  isPlaying = false,
  onSeek,
  onPlayPause,
  narratorName,
  style,
}: VoiceWaveformProps) {
  const playheadPosition = useSharedValue(currentPosition);
  
  // Update playhead when position changes
  React.useEffect(() => {
    playheadPosition.value = withTiming(currentPosition, {
      duration: 100,
    });
  }, [currentPosition]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const currentTime = formatTime(duration * currentPosition);
  const totalTime = formatTime(duration);
  
  // Normalize waveform to fixed number of bars
  const normalizedWaveform = useMemo(() => {
    const targetBars = 50;
    if (waveform.length === 0) return Array(targetBars).fill(0.3);
    
    const step = waveform.length / targetBars;
    const result: number[] = [];
    
    for (let i = 0; i < targetBars; i++) {
      const startIndex = Math.floor(i * step);
      const endIndex = Math.floor((i + 1) * step);
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += waveform[j] || 0;
      }
      result.push(sum / (endIndex - startIndex));
    }
    
    return result;
  }, [waveform]);
  
  const handleBarPress = (index: number) => {
    if (onSeek) {
      const position = index / normalizedWaveform.length;
      onSeek(position);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Narrator name */}
      {narratorName && (
        <View style={styles.header}>
          <SacredText variant="caption" color="gold">
            🎙️ {narratorName}
          </SacredText>
        </View>
      )}
      
      {/* Waveform */}
      <Pressable onPress={onPlayPause} style={styles.waveformContainer}>
        <View style={styles.barsContainer}>
          {normalizedWaveform.map((amplitude, index) => {
            const barPosition = index / normalizedWaveform.length;
            const isActive = barPosition <= currentPosition;
            const height = MIN_BAR_HEIGHT + amplitude * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
            
            return (
              <Pressable
                key={index}
                onPress={() => handleBarPress(index)}
                style={styles.barTouchArea}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: isActive
                        ? VanshColors.suvarna[500]
                        : VanshColors.masi[300],
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
        
        {/* Play/Pause indicator */}
        <View style={styles.playIndicator}>
          <SacredText variant="title" style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶️'}
          </SacredText>
        </View>
      </Pressable>
      
      {/* Time display */}
      <View style={styles.timeContainer}>
        <SacredText variant="timestamp" color="secondary">
          {currentTime}
        </SacredText>
        <SacredText variant="timestamp" color="muted">
          {totalTime}
        </SacredText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
  },
  header: {
    marginBottom: VanshSpacing.sm,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: MAX_BAR_HEIGHT,
  },
  barTouchArea: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: BAR_GAP / 2,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
  playIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VanshColors.suvarna[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    marginLeft: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: VanshSpacing.sm,
  },
});
