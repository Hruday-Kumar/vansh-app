/**
 * ANIMATED MEMBER NODE - Heritage-Styled Family Member Card
 * 
 * Features:
 * - Prominent photo display with golden ring
 * - Heritage gradient backgrounds
 * - Elegant card design with warm shadows
 * - Photo with decorative border
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

const NODE_WIDTH = 130;
const NODE_HEIGHT = 160;

const COLORS = {
  male: {
    gradient: [VanshColors.neelam[400], VanshColors.neelam[600]] as const,
    bg: '#F0F9F9',
    border: VanshColors.neelam[400],
    accent: VanshColors.neelam[500],
    ring: VanshColors.neelam[400],
  },
  female: {
    gradient: [VanshColors.padma[400], VanshColors.sindoor[600]] as const,
    bg: '#FFF5F7',
    border: VanshColors.padma[400],
    accent: VanshColors.padma[500],
    ring: VanshColors.padma[400],
  },
  other: {
    gradient: [VanshColors.chandan[400], VanshColors.chandan[600]] as const,
    bg: '#FAF7F2',
    border: VanshColors.chandan[400],
    accent: VanshColors.chandan[500],
    ring: VanshColors.chandan[400],
  },
  deceased: {
    gradient: [VanshColors.masi[300], VanshColors.masi[500]] as const,
    bg: VanshColors.khadi[50],
    border: VanshColors.masi[300],
    accent: VanshColors.masi[500],
    ring: VanshColors.masi[300],
  },
  root: {
    border: VanshColors.suvarna[500],
    bg: VanshColors.suvarna[50],
    ring: VanshColors.suvarna[500],
  },
  selected: {
    border: VanshColors.suvarna[400],
    bg: VanshColors.suvarna[50],
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
  const ringColor = isSelected
    ? COLORS.selected.border
    : isRoot
      ? COLORS.root.ring
      : (isHighlighted ? COLORS.selected.border : colorScheme.ring);
  
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
  
  const hasPhoto = !!person?.photoUri;
  
  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.wrapper, containerStyle]}>
        {/* Selection / highlight ring */}
        {(isSelected || isHighlighted) && (
          <View style={[styles.selectionRing, { borderColor: ringColor }]} />
        )}
        
        {/* Main Card */}
        <View style={[styles.card, { borderColor, backgroundColor: cardBg }]}>
          {/* Root crown badge */}
          {isRoot && (
            <View style={styles.rootBadge}>
              <LinearGradient
                colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
                style={styles.rootBadgeGradient}
              >
                <Text style={styles.rootBadgeText}>👑 YOU</Text>
              </LinearGradient>
            </View>
          )}
          
          {/* Avatar with decorative ring */}
          <View style={[styles.avatarOuter, { borderColor: ringColor }]}>
            <View style={[styles.avatarContainer, { borderColor: colorScheme.border }]}>
              {hasPhoto ? (
                <Image
                  source={{ uri: person!.photoUri }}
                  style={[styles.avatarImage, !isAlive && styles.avatarDeceased]}
                  fadeDuration={0}
                  resizeMode="cover"
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
          </View>
          
          {/* Name */}
          <Text style={[styles.name, !isAlive && styles.deceasedText]} numberOfLines={2}>
            {displayName}
          </Text>
          
          {/* Life Span */}
          {lifeSpan !== '' && (
            <Text style={styles.lifeSpan}>{lifeSpan}</Text>
          )}
          
          {/* Gender indicator dot */}
          <View style={[styles.genderDot, { backgroundColor: colorScheme.accent }]} />
          
          {/* Relationship Badge */}
          {relationLabel && !isRoot && (
            <View style={styles.relationBadge}>
              <LinearGradient
                colors={[VanshColors.suvarna[50], VanshColors.suvarna[100]]}
                style={styles.relationBadgeInner}
              >
                <Text style={styles.relationText}>{relationLabel}</Text>
              </LinearGradient>
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
    width: NODE_WIDTH + 12,
    height: NODE_HEIGHT + 12,
    borderRadius: 22,
    borderWidth: 2.5,
    borderStyle: 'dashed',
  },
  card: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: VanshColors.masi[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  rootBadge: {
    position: 'absolute',
    top: -11,
    zIndex: 10,
  },
  rootBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rootBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  avatarOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    marginTop: 2,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarDeceased: {
    opacity: 0.5,
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
    textShadowColor: 'rgba(0,0,0,0.2)',
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
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: VanshColors.masi[800],
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 15,
    letterSpacing: -0.2,
  },
  deceasedText: {
    color: VanshColors.masi[400],
    fontStyle: 'italic',
  },
  lifeSpan: {
    fontSize: 10,
    color: VanshColors.masi[400],
    textAlign: 'center',
    fontWeight: '500',
  },
  genderDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  relationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  relationBadgeInner: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: VanshColors.suvarna[200],
    borderRadius: 10,
  },
  relationText: {
    fontSize: 8,
    fontWeight: '800',
    color: VanshColors.suvarna[700],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default AnimatedMemberNode;
