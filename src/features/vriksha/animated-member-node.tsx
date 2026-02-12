/**
 * 🌳 ANIMATED MEMBER NODE - Stunning Visual Family Member Card
 * ═══════════════════════════════════════════════════════════
 * 
 * Features:
 * ✓ Pulse animation for selected nodes
 * ✓ Glow effect for living members
 * ✓ Smooth scale transitions
 * ✓ Gender-based gradient backgrounds
 * ✓ Deceased memorial styling
 * ✓ Photo with fallback initials
 * ✓ Relationship badge
 * 
 * PHILOSOPHY: "Each node is a living soul in the tree of life"
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { VanshColors } from '../../theme';
import type { LayoutNode } from './types';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface AnimatedMemberNodeProps {
  node: LayoutNode;
  isRoot: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  relationLabel?: string;
  onPress: (node: LayoutNode) => void;
  onLongPress?: (node: LayoutNode) => void;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const NODE_WIDTH = 120;
const NODE_HEIGHT = 150;

const COLORS = {
  male: {
    gradient: ['#3B82F6', '#1D4ED8'] as const,
    bg: '#DBEAFE',
    border: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.5)',
  },
  female: {
    gradient: ['#EC4899', '#BE185D'] as const,
    bg: '#FCE7F3',
    border: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.5)',
  },
  other: {
    gradient: ['#8B5CF6', '#6D28D9'] as const,
    bg: '#EDE9FE',
    border: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.5)',
  },
  deceased: {
    gradient: ['#6B7280', '#4B5563'] as const,
    bg: '#F3F4F6',
    border: '#9CA3AF',
    glow: 'rgba(107, 114, 128, 0.3)',
  },
  root: {
    border: '#D97706',
    glow: 'rgba(217, 119, 6, 0.6)',
  },
  selected: {
    border: '#10B981',
    glow: 'rgba(16, 185, 129, 0.6)',
  },
};

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// ANIMATED COMPONENT
// ═══════════════════════════════════════════════════════════

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
  
  // Animation values
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);
  
  // Simple fade-in on mount
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, []);
  
  // Gesture handlers
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      pressScale.value = withTiming(0.96, { duration: 100 });
    })
    .onEnd(() => {
      pressScale.value = withTiming(1, { duration: 150 });
      runOnJS(onPress)(node);
    })
    .onFinalize(() => {
      pressScale.value = withTiming(1, { duration: 150 });
    });
  
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) {
        runOnJS(onLongPress)(node);
      }
    });
  
  const composed = Gesture.Exclusive(longPressGesture, tapGesture);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: pressScale.value },
    ],
  }));
  
  // Determine border color
  const borderColor = isRoot 
    ? COLORS.root.border 
    : isSelected 
      ? COLORS.selected.border 
      : colorScheme.border;
  
  const glowColor = isRoot 
    ? COLORS.root.glow 
    : isSelected 
      ? COLORS.selected.glow 
      : colorScheme.glow;
  
  // Display info
  const displayName = person 
    ? `${person.firstName}${person.lastName ? ` ${person.lastName.charAt(0)}.` : ''}`
    : 'Unknown';
  
  const birthYear = person?.birthDate ? new Date(person.birthDate).getFullYear() : null;
  const deathYear = person?.deathDate ? new Date(person.deathDate).getFullYear() : null;
  
  let lifeSpan = '';
  if (birthYear) {
    if (deathYear) {
      lifeSpan = `${birthYear} - ${deathYear}`;
    } else {
      lifeSpan = `b. ${birthYear}`;
    }
  }
  
  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.wrapper, containerStyle]}>
        {/* Highlight Ring (static, no animation) */}
        {(isSelected || isHighlighted) && (
          <View 
            style={[
              styles.highlightRing, 
              { borderColor: glowColor }
            ]} 
          />
        )}
        
        {/* Main Card */}
        <View style={[styles.card, { borderColor }]}>
          {/* Root Badge */}
          {isRoot && (
            <View style={styles.rootBadge}>
              <Text style={styles.rootBadgeText}>ME</Text>
            </View>
          )}
          
          {/* Deceased Indicator */}
          {!isAlive && (
            <View style={styles.deceasedBadge}>
              <Text style={styles.deceasedEmoji}>🕯️</Text>
            </View>
          )}
          
          {/* Avatar */}
          <View style={[styles.avatarContainer, { borderColor }]}>
            {person?.photoUri ? (
              <Image 
                source={{ uri: person.photoUri }} 
                style={[styles.avatarImage, !isAlive && styles.avatarDeceased]} 
              />
            ) : (
              <LinearGradient
                colors={colorScheme.gradient}
                style={styles.avatarGradient}
              >
                <Text style={styles.initialsText}>
                  {getInitials(person?.firstName, person?.lastName)}
                </Text>
              </LinearGradient>
            )}
            
            {/* Deceased cross overlay */}
            {!isAlive && (
              <View style={styles.deceasedOverlay}>
                <Text style={styles.crossText}>†</Text>
              </View>
            )}
          </View>
          
          {/* Name */}
          <Text 
            style={[styles.name, !isAlive && styles.deceasedText]} 
            numberOfLines={2}
          >
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

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  wrapper: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  highlightRing: {
    position: 'absolute',
    width: NODE_WIDTH + 12,
    height: NODE_HEIGHT + 12,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  
  card: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Root Badge
  rootBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -18,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
    
    // Shadow
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  rootBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  
  // Deceased Badge
  deceasedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  deceasedEmoji: {
    fontSize: 16,
  },
  
  // Avatar
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 6,
    
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarDeceased: {
    opacity: 0.7,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  deceasedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  
  // Name
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  deceasedText: {
    color: '#6B7280',
  },
  
  // Life Span
  lifeSpan: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Relation Badge
  relationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: VanshColors.suvarna[100],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  relationText: {
    fontSize: 9,
    fontWeight: '600',
    color: VanshColors.suvarna[700],
    textTransform: 'uppercase',
  },
});

export default AnimatedMemberNode;
