/**
 * 🪷 KATHA PLAYER - Voice story playback with photo sync
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar, SacredText, SilkButton, VoiceWaveform } from '../../components';
import { useFamilyStore, useMemoryStore } from '../../state';
import { VanshColors, VanshDuration, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import type { Katha, SmritiMedia, VoiceSyncPoint } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface KathaPlayerProps {
  katha: Katha;
  onClose: () => void;
}

export function KathaPlayer({ katha, onClose }: KathaPlayerProps) {
  const insets = useSafeAreaInsets();
  const { getMember } = useFamilyStore();
  const { memories } = useMemoryStore();
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0); // 0-1
  const [currentSyncIndex, setCurrentSyncIndex] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Get narrator info
  const narrator = getMember(katha.narratorId);
  
  // Get linked memories
  const linkedMemories = katha.linkedMedia
    ?.map(id => memories.get(id))
    .filter(Boolean) as SmritiMedia[] | undefined;
  
  // Photo transition animation
  const photoOpacity = useSharedValue(1);
  const photoScale = useSharedValue(1);
  
  // Initialize audio
  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [katha.audioUri]);
  
  const loadAudio = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: katha.audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };
  
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    const newPosition = status.positionMillis / (katha.duration * 1000);
    setPosition(newPosition);
    setIsPlaying(status.isPlaying);
    
    // Check for sync points
    if (katha.syncPoints) {
      const currentTime = status.positionMillis / 1000;
      const syncIndex = katha.syncPoints.findIndex(
        (sp, i) => {
          const next = katha.syncPoints![i + 1];
          return currentTime >= sp.audioTime && (!next || currentTime < next.audioTime);
        }
      );
      
      if (syncIndex !== -1 && syncIndex !== currentSyncIndex) {
        setCurrentSyncIndex(syncIndex);
        handleSyncPoint(katha.syncPoints[syncIndex]);
      }
    }
  };
  
  const handleSyncPoint = (syncPoint: VoiceSyncPoint) => {
    // Animate photo transition
    photoOpacity.value = withTiming(0, { duration: 200 }, () => {
      photoOpacity.value = withTiming(1, { duration: 300 });
    });
    
    // Scroll to the synced photo
    if (linkedMemories) {
      const index = linkedMemories.findIndex(m => m.id === syncPoint.mediaId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    }
    
    // Handle zoom action
    if (syncPoint.action === 'zoom' && syncPoint.target) {
      photoScale.value = withTiming(1.3, { duration: VanshDuration.slow });
      setTimeout(() => {
        photoScale.value = withTiming(1, { duration: VanshDuration.slow });
      }, 2000);
    }
  };
  
  const handlePlayPause = async () => {
    if (!sound) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };
  
  const handleSeek = async (newPosition: number) => {
    if (!sound) return;
    const positionMillis = newPosition * katha.duration * 1000;
    await sound.setPositionAsync(positionMillis);
  };
  
  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ scale: photoScale.value }],
  }));
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="✕" onPress={onClose} />
        <View style={styles.narratorInfo}>
          {narrator && (
            <MemberAvatar
              uri={narrator.avatarUri}
              name={`${narrator.firstName} ${narrator.lastName}`}
              size="sm"
            />
          )}
          <View style={styles.narratorText}>
            <SacredText variant="caption" color="muted">Story by</SacredText>
            <SacredText variant="subhead" color="primary">
              {narrator ? `${narrator.firstName} ${narrator.lastName}` : 'Family Member'}
            </SacredText>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>
      
      {/* Photo Slideshow */}
      {linkedMemories && linkedMemories.length > 0 ? (
        <Animated.View style={[styles.photoContainer, photoStyle]}>
          <FlatList
            ref={flatListRef}
            data={linkedMemories}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                style={styles.photo}
                contentFit="cover"
              />
            )}
            keyExtractor={item => item.id}
          />
          
          {/* Photo indicator */}
          <View style={styles.photoIndicator}>
            {linkedMemories.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  index === currentSyncIndex && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      ) : (
        <View style={styles.noPhotoContainer}>
          <SacredText variant="hero" color="gold">🎙️</SacredText>
          <SacredText variant="title" color="primary" align="center">
            {katha.type === 'song' ? 'Family Song' : 'Voice Story'}
          </SacredText>
        </View>
      )}
      
      {/* Transcript */}
      {katha.transcript && (
        <View style={styles.transcriptContainer}>
          <SacredText variant="quote" color="secondary" align="center" numberOfLines={3}>
            "{katha.transcript.slice(0, 150)}..."
          </SacredText>
        </View>
      )}
      
      {/* Waveform & Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + VanshSpacing.lg }]}>
        <VoiceWaveform
          waveform={katha.waveform}
          duration={katha.duration}
          currentPosition={position}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          onPlayPause={handlePlayPause}
        />
        
        {/* Topics/Emotions */}
        {katha.topics && katha.topics.length > 0 && (
          <View style={styles.topicsContainer}>
            {katha.topics.slice(0, 4).map(topic => (
              <View key={topic} style={styles.topicTag}>
                <SacredText variant="caption" color="gold">
                  {topic}
                </SacredText>
              </View>
            ))}
          </View>
        )}
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
  },
  narratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
  },
  narratorText: {
    alignItems: 'flex-start',
  },
  photoContainer: {
    flex: 1,
    backgroundColor: VanshColors.masi[900],
  },
  photo: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  photoIndicator: {
    position: 'absolute',
    bottom: VanshSpacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: VanshSpacing.xs,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VanshColors.khadi[200],
    opacity: 0.5,
  },
  indicatorDotActive: {
    backgroundColor: VanshColors.suvarna[500],
    opacity: 1,
    width: 24,
  },
  noPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[100],
    gap: VanshSpacing.md,
  },
  transcriptContainer: {
    padding: VanshSpacing.lg,
    backgroundColor: VanshColors.khadi[100],
  },
  controls: {
    padding: VanshSpacing.lg,
    backgroundColor: VanshColors.khadi[50],
    ...VanshShadows.lg,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.xs,
    marginTop: VanshSpacing.md,
    justifyContent: 'center',
  },
  topicTag: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
  },
});
