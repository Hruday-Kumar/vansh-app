/**
 * ANIMATED MEMBER NODE - Clean Family Member Card
 * 
 * Features:
 * - Smooth scale transitions on press
 * - Gender-based gradient backgrounds
 * - Clean card design with minimal borders
 * - Photo with fallback initials
 * - Relationship badge overlay
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { VanshColors } from '../../theme';
import type { LayoutNode } from './types';

interface AnimatedMemberNodeProps {
  node: LayoutNode;
  isRoot: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  relationLabel?: string;
  onPress: (node: LayoutNode) => void;
  onLongPress?: (node: LayoutNode) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 150;

const COLORS = {
  male: {
    gradient: ['#60A5FA', '#3B82F6'] as const,
    bg: '#EFF6FF',
    border: '#93C5FD',
    accent: '#3B82F6',
  },
  female: {
    gradient: ['#F472B6', '#EC4899'] as const,
    bg: '#FDF2F8',
    border: '#F9A8D4',
    accent: '#EC4899',
  },
  other: {
    gradient: ['#A78BFA', '#8B5CF6'] as const,
    bg: '#F5F3FF',
    border: '#C4B5FD',
    accent: '#8B5CF6',
  },
  deceased: {
    gradient: ['#9CA3AF', '#6B7280'] as const,
    bg: '#F9FAFB',
    border: '#D1D5DB',
    accent: '#6B7280',
  },
  root: {
    border: '#F59E0B',
    bg: '#FFFBEB',
  },
  selected: {
    border: '#10B981',
    bg: '#ECFDF5',
  },
};

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';
  return first + last || '?';
}

function getColorScheme(gender: string, isAlive: boolean) {
  if (!isAlive) return COLORS.deceased;
  if (gender === 'male') return COLORS.male;
  if (gender === 'female') return COLORS.female;
  return COLORS.other;
}

export const AnimatedMemberNode = memo(function AnimatedMemberNode({
  node,
  isRoot,
  isSelected,
  isHighlighted,
  relationLabel,
  onPress,
  onLongPress,
}: AnimatedMemberNodeProps) {
  const person = node.person;
  const isAlive = person?.isAlive ?? true;
  const colorScheme = getColorScheme(node.gender, isAlive);
  
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 350 });
  }, []);
  
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      pressScale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
    })
    .onEnd(() => {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      runOnJS(onPress)(node);
    })
    .onFinalize(() => {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
  
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) {
        runOnJS(onLongPress)(node);
      }
    });
  
  const composed = Gesture.Exclusive(longPressGesture, tapGesture);
  
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: pressScale.value }],
  }));
  
  // Visual states
  const borderColor = isSelected
    ? COLORS.selected.border
    : isRoot
      ? COLORS.root.border
      : (isHighlighted ? COLORS.selected.border : colorScheme.border);
  
  const cardBg = isSelected
    ? COLORS.selected.bg
    : isRoot
      ? COLORS.root.bg
      : '#FFFFFF';
  
  const displayName = person
    ? `${person.firstName}${person.lastName ? ` ${person.lastName.charAt(0)}.` : ''}`
    : 'Unknown';
  
  const birthYear = person?.birthDate ? new Date(person.birthDate).getFullYear() : null;
  const deathYear = person?.deathDate ? new Date(person.deathDate).getFullYear() : null;
  
  let lifeSpan = '';
  if (birthYear) {
    lifeSpan = deathYear ? `${birthYear} – ${deathYear}` : `b. ${birthYear}`;
  }
  
  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.wrapper, containerStyle]}>
        {/* Selection ring */}
        {(isSelected || isHighlighted) && (
          <View style={[styles.selectionRing, { borderColor }]} />
        )}
        
        {/* Main Card */}
        <View style={[styles.card, { borderColor, backgroundColor: cardBg }]}>
          {/* Root badge */}
          {isRoot && (
            <View style={styles.rootBadge}>
              <Text style={styles.rootBadgeText}>YOU</Text>
            </View>
          )}
          
          {/* Avatar */}
          <View style={[styles.avatarContainer, { borderColor: colorScheme.border }]}>
            {person?.photoUri ? (
              <Image
                source={{ uri: person.photoUri }}
                style={[styles.avatarImage, !isAlive && styles.avatarDeceased]}
                fadeDuration={0}
              />
            ) : (
              <LinearGradient colors={colorScheme.gradient} style={styles.avatarGradient}>
                <Text style={styles.initialsText}>
                  {getInitials(person?.firstName, person?.lastName)}
                </Text>
              </LinearGradient>
            )}
            
            {!isAlive && (
              <View style={styles.deceasedOverlay}>
                <Text style={styles.crossText}>†</Text>
              </View>
            )}
          </View>
          
          {/* Name */}
          <Text style={[styles.name, !isAlive && styles.deceasedText]} numberOfLines={2}>
            {displayName}
          </Text>
          
          {/* Life Span */}
          {lifeSpan !== '' && (
            <Text style={styles.lifeSpan}>{lifeSpan}</Text>
          )}
          
          {/* Relationship Badge */}
          {relationLabel && !isRoot && (
            <View style={styles.relationBadge}>
              <Text style={styles.relationText}>{relationLabel}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionRing: {
    position: 'absolute',
    width: NODE_WIDTH + 10,
    height: NODE_HEIGHT + 10,
    borderRadius: 20,
    borderWidth: 2.5,
  },
  card: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rootBadge: {
    position: 'absolute',
    top: -9,
    left: '50%',
    marginLeft: -16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
  },
  rootBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarDeceased: {
    opacity: 0.6,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deceasedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 15,
  },
  deceasedText: {
    color: '#9CA3AF',
  },
  lifeSpan: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  relationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: VanshColors.suvarna[50],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: VanshColors.suvarna[200],
  },
  relationText: {
    fontSize: 8,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default AnimatedMemberNode;
