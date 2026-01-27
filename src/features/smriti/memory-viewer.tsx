/**
 * 🪷 MEMORY VIEWER - Full screen memory display with voice overlay
 */

import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText, SilkButton, VoiceWaveform } from '../../components';
import { useFamilyStore, useKathaStore } from '../../state';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing, VanshSpring } from '../../theme';
import type { Katha, SmritiMedia } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MemoryViewerProps {
  memory: SmritiMedia;
  onClose: () => void;
  onPlayKatha?: (katha: Katha) => void;
}

export function MemoryViewer({ memory, onClose, onPlayKatha }: MemoryViewerProps) {
  const insets = useSafeAreaInsets();
  const { getMember } = useFamilyStore();
  const { kathas } = useKathaStore();
  
  const [showDetails, setShowDetails] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Pinch to zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, VanshSpring.gentle);
        savedScale.value = 1;
        setIsZoomed(false);
      } else if (scale.value > 3) {
        scale.value = withSpring(3, VanshSpring.gentle);
        savedScale.value = 3;
        setIsZoomed(true);
      } else {
        savedScale.value = scale.value;
        setIsZoomed(scale.value > 1.2);
      }
    });
  
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // Get linked kathas
  const linkedKathas = memory.linkedKathas
    ?.map(id => kathas.get(id))
    .filter(Boolean) as Katha[] | undefined;
  
  // Get tagged members
  const taggedMembers = memory.linkedMembers
    ?.map(id => getMember(id))
    .filter(Boolean);
  
  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Main Image */}
      <GestureDetector gesture={pinchGesture}>
        <Pressable onPress={toggleDetails} style={styles.imageContainer}>
          <Animated.View style={imageStyle}>
            <Image
              source={{ uri: memory.uri }}
              style={styles.image}
              contentFit="contain"
              placeholder={memory.blurhash}
              transition={300}
            />
          </Animated.View>
        </Pressable>
      </GestureDetector>
      
      {/* Header */}
      {!isZoomed && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.header, { top: insets.top + VanshSpacing.md }]}
        >
          <Pressable onPress={onClose} style={styles.closeButton}>
            <SacredText variant="title" style={styles.closeIcon}>✕</SacredText>
          </Pressable>
          
          {memory.title && (
            <SacredText variant="subhead" style={styles.headerTitle} numberOfLines={1}>
              {memory.title}
            </SacredText>
          )}
          
          <View style={styles.headerSpacer} />
        </Animated.View>
      )}
      
      {/* Details Panel */}
      {showDetails && !isZoomed && (
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown}
          style={[styles.detailsPanel, { paddingBottom: insets.bottom + VanshSpacing.lg }]}
        >
          <View style={styles.detailsHandle} />
          
          <ScrollView
            style={styles.detailsScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Date & Location */}
            <View style={styles.metaRow}>
              {memory.capturedAt && (
                <View style={styles.metaItem}>
                  <SacredText variant="caption" color="muted">📅 Captured</SacredText>
                  <SacredText variant="body" color="primary">
                    {new Date(memory.capturedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </SacredText>
                </View>
              )}
              
              {memory.placeName && (
                <View style={styles.metaItem}>
                  <SacredText variant="caption" color="muted">📍 Location</SacredText>
                  <SacredText variant="body" color="primary">{memory.placeName}</SacredText>
                </View>
              )}
            </View>
            
            {/* Description */}
            {memory.description && (
              <View style={styles.section}>
                <SacredText variant="body" color="secondary">
                  {memory.description}
                </SacredText>
              </View>
            )}
            
            {/* Tagged Members */}
            {taggedMembers && taggedMembers.length > 0 && (
              <View style={styles.section}>
                <SacredText variant="label" color="muted" style={styles.sectionTitle}>
                  In This Memory
                </SacredText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.avatarRow}>
                    {taggedMembers.map(member => (
                      <MemberAvatar
                        key={member!.id}
                        uri={member!.avatarUri}
                        name={`${member!.firstName} ${member!.lastName}`}
                        size="md"
                        isAlive={member!.isAlive}
                        showName
                        style={styles.avatar}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
            
            {/* Voice Overlays */}
            {linkedKathas && linkedKathas.length > 0 && (
              <View style={styles.section}>
                <SacredText variant="label" color="muted" style={styles.sectionTitle}>
                  Voice Stories
                </SacredText>
                {linkedKathas.map(katha => {
                  const narrator = getMember(katha.narratorId);
                  return (
                    <HeritageCard
                      key={katha.id}
                      variant="filled"
                      onPress={() => onPlayKatha?.(katha)}
                      style={styles.kathaCard}
                    >
                      <VoiceWaveform
                        waveform={katha.waveform}
                        duration={katha.duration}
                        narratorName={narrator ? `${narrator.firstName} ${narrator.lastName}` : undefined}
                      />
                    </HeritageCard>
                  );
                })}
              </View>
            )}
            
            {/* Tags */}
            {memory.tags && memory.tags.length > 0 && (
              <View style={styles.section}>
                <View style={styles.tagsRow}>
                  {memory.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <SacredText variant="caption" color="gold">#{tag}</SacredText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
      
      {/* Quick Actions */}
      {!showDetails && !isZoomed && linkedKathas && linkedKathas.length > 0 && (
        <Animated.View
          entering={FadeIn.delay(300)}
          style={[styles.quickActions, { bottom: insets.bottom + VanshSpacing.lg }]}
        >
          <SilkButton
            variant="primary"
            size="md"
            label="🎙️ Listen to Story"
            onPress={() => linkedKathas[0] && onPlayKatha?.(linkedKathas[0])}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.masi[900],
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VanshColors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: VanshColors.khadi[50],
  },
  headerTitle: {
    flex: 1,
    color: VanshColors.khadi[50],
    textAlign: 'center',
    marginHorizontal: VanshSpacing.md,
  },
  headerSpacer: {
    width: 44,
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.6,
    backgroundColor: VanshColors.khadi[50],
    borderTopLeftRadius: VanshRadius['2xl'],
    borderTopRightRadius: VanshRadius['2xl'],
    paddingTop: VanshSpacing.md,
    ...VanshShadows['2xl'],
  },
  detailsHandle: {
    width: 40,
    height: 4,
    backgroundColor: VanshColors.khadi[400],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: VanshSpacing.md,
  },
  detailsScroll: {
    paddingHorizontal: VanshSpacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: VanshSpacing.xl,
    marginBottom: VanshSpacing.lg,
  },
  metaItem: {
    flex: 1,
  },
  section: {
    marginBottom: VanshSpacing.lg,
  },
  sectionTitle: {
    marginBottom: VanshSpacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
  },
  avatar: {
    marginRight: VanshSpacing.xs,
  },
  kathaCard: {
    marginBottom: VanshSpacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.xs,
  },
  tag: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
  },
  quickActions: {
    position: 'absolute',
    left: VanshSpacing.lg,
    right: VanshSpacing.lg,
  },
});
