/**
 * 🪷 HERITAGE CARD - Sacred container for memories
 */

import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEntranceAnimation, useHeartbeatPulse, useSilkPress } from '../../hooks';
import { VanshColors, VanshInsets, VanshRadius, VanshShadows } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'sacred';

interface HeritageCardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  onPress?: () => void;
  animated?: boolean;
  animationDelay?: number;
  hasPulse?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: VanshColors.khadi[50],
    ...VanshShadows.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: VanshColors.khadi[400],
  },
  filled: {
    backgroundColor: VanshColors.khadi[100],
  },
  sacred: {
    backgroundColor: VanshColors.khadi[50],
    borderWidth: 1.5,
    borderColor: VanshColors.suvarna[400],
    ...VanshShadows.glow,
  },
};

export function HeritageCard({
  variant = 'elevated',
  children,
  onPress,
  animated = true,
  animationDelay = 0,
  hasPulse = false,
  style,
}: HeritageCardProps) {
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useSilkPress();
  const entranceStyle = useEntranceAnimation(animationDelay);
  const pulseStyle = useHeartbeatPulse(hasPulse);
  
  const cardStyle: ViewStyle = {
    ...styles.base,
    ...variantStyles[variant],
  };
  
  if (onPress) {
    return (
      <AnimatedPressable
        style={[
          cardStyle,
          animated && entranceStyle,
          pressStyle,
          hasPulse && pulseStyle,
          style,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {children}
      </AnimatedPressable>
    );
  }
  
  if (animated) {
    return (
      <Animated.View style={[cardStyle, entranceStyle, hasPulse && pulseStyle, style]}>
        {children}
      </Animated.View>
    );
  }
  
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: VanshRadius.xl,
    padding: VanshInsets.card.horizontal,
    overflow: 'hidden',
  },
});
