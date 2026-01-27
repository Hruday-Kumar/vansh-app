/**
 * 🪷 WISDOM ENVELOPE - Wax-sealed letter component for Vasiyat
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useGoldenShimmer } from '../../hooks';
import { VanshColors, VanshDuration, VanshRadius, VanshShadows, VanshSpacing, VanshSpring } from '../../theme';
import { SacredText } from '../atoms/sacred-text';

interface WisdomEnvelopeProps {
  title: string;
  fromName: string;
  toName: string;
  mood: 'loving' | 'wisdom' | 'celebration' | 'comfort' | 'guidance';
  isLocked: boolean;
  unlockDate?: string;
  onOpen?: () => void;
  style?: ViewStyle;
}

const moodColors = {
  loving: VanshColors.padma[300],
  wisdom: VanshColors.suvarna[500],
  celebration: VanshColors.bhagwa[500],
  comfort: VanshColors.chandan[500],
  guidance: VanshColors.neelam[500],
};

const moodIcons = {
  loving: '💕',
  wisdom: '🪷',
  celebration: '🎊',
  comfort: '🤲',
  guidance: '🧭',
};

export function WisdomEnvelope({
  title,
  fromName,
  toName,
  mood,
  isLocked,
  unlockDate,
  onOpen,
  style,
}: WisdomEnvelopeProps) {
  const flapRotation = useSharedValue(0);
  const envelopeScale = useSharedValue(1);
  const waxScale = useSharedValue(1);
  const isOpened = useSharedValue(false);
  
  const shimmerStyle = useGoldenShimmer(!isLocked);
  
  const handleOpen = () => {
    if (isLocked || isOpened.value) return;
    
    // Break the seal
    waxScale.value = withSequence(
      withSpring(1.2, VanshSpring.bouncy),
      withTiming(0, { duration: VanshDuration.fast })
    );
    
    // Open the flap
    flapRotation.value = withSpring(180, VanshSpring.page);
    
    // Slight lift
    envelopeScale.value = withSequence(
      withSpring(1.02, VanshSpring.gentle),
      withSpring(1, VanshSpring.gentle)
    );
    
    isOpened.value = true;
    
    if (onOpen) {
      setTimeout(onOpen, VanshDuration.dramatic);
    }
  };
  
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleOpen)();
  });
  
  const envelopeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: envelopeScale.value }],
  }));
  
  const flapStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${flapRotation.value}deg` },
    ],
  }));
  
  const waxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waxScale.value }],
    opacity: waxScale.value,
  }));
  
  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.container, envelopeStyle, style]}>
        {/* Envelope body */}
        <View style={styles.body}>
          {/* Paper texture overlay */}
          <View style={styles.paperTexture} />
          
          {/* Content */}
          <View style={styles.content}>
            <SacredText variant="caption" color="muted">
              To: {toName}
            </SacredText>
            <SacredText variant="title" color="primary" style={styles.title}>
              {title}
            </SacredText>
            <SacredText variant="caption" color="muted">
              From: {fromName}
            </SacredText>
            
            {isLocked && unlockDate && (
              <View style={styles.lockInfo}>
                <SacredText variant="timestamp" color="muted">
                  🔒 Opens: {unlockDate}
                </SacredText>
              </View>
            )}
          </View>
        </View>
        
        {/* Envelope flap */}
        <Animated.View style={[styles.flap, flapStyle]}>
          <View style={[styles.flapInner, { borderBottomColor: moodColors[mood] }]} />
        </Animated.View>
        
        {/* Wax seal */}
        {!isOpened.value && (
          <Animated.View
            style={[
              styles.waxSeal,
              { backgroundColor: moodColors[mood] },
              waxStyle,
              !isLocked && shimmerStyle,
            ]}
          >
            <SacredText variant="title" style={styles.waxIcon}>
              {moodIcons[mood]}
            </SacredText>
          </Animated.View>
        )}
        
        {/* Locked overlay */}
        {isLocked && (
          <View style={styles.lockedOverlay}>
            <View style={styles.lockBadge}>
              <SacredText variant="caption" style={styles.lockText}>
                Time-Locked
              </SacredText>
            </View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1.5,
    position: 'relative',
  },
  body: {
    flex: 1,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    overflow: 'hidden',
    ...VanshShadows.lg,
  },
  paperTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VanshColors.khadi[200],
    opacity: 0.3,
  },
  content: {
    flex: 1,
    padding: VanshSpacing.lg,
    justifyContent: 'center',
  },
  title: {
    marginVertical: VanshSpacing.sm,
  },
  lockInfo: {
    marginTop: VanshSpacing.md,
    paddingTop: VanshSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[300],
  },
  flap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    transformOrigin: 'top',
    zIndex: 10,
  },
  flapInner: {
    flex: 1,
    backgroundColor: VanshColors.khadi[200],
    borderBottomWidth: 3,
    borderBottomLeftRadius: VanshRadius.lg,
    borderBottomRightRadius: VanshRadius.lg,
  },
  waxSeal: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    ...VanshShadows.md,
  },
  waxIcon: {
    fontSize: 28,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VanshColors.overlay.dark,
    borderRadius: VanshRadius.lg,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: VanshSpacing.lg,
  },
  lockBadge: {
    backgroundColor: VanshColors.masi[800],
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
  },
  lockText: {
    color: VanshColors.khadi[100],
    fontSize: 12,
  },
});
