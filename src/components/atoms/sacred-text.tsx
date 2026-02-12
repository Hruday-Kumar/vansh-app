/**
 * 🪷 SACRED TEXT - Typography component with Vansh styling
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEntranceAnimation } from '../../hooks';
import { VanshColors, VanshTextStyleKey, VanshTextStyles } from '../../theme';

interface SacredTextProps extends TextProps {
  variant?: VanshTextStyleKey;
  color?: 'primary' | 'secondary' | 'gold' | 'vermilion' | 'muted';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  animated?: boolean;
  animationDelay?: number;
  children: React.ReactNode;
}

const colorMap = {
  primary: VanshColors.masi[900],
  secondary: VanshColors.masi[700],
  gold: VanshColors.suvarna[500],
  vermilion: VanshColors.sindoor[700],
  muted: VanshColors.masi[500],
};

const weightMap: Record<string, TextStyle['fontWeight']> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function SacredText({
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  animated = false,
  animationDelay = 0,
  style,
  children,
  ...props
}: SacredTextProps) {
  const textStyle: TextStyle = {
    ...VanshTextStyles[variant],
    color: colorMap[color],
    textAlign: align,
    ...(weight && { fontWeight: weightMap[weight] }),
  };

  if (animated) {
    const entranceStyle = useEntranceAnimation(animationDelay);

    return (
      <Animated.Text style={[textStyle, entranceStyle, style]} {...props}>
        {children}
      </Animated.Text>
    );
  }

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
}

// Convenience exports for common text types
export function DisplayText(props: Omit<SacredTextProps, 'variant'>) {
  return <SacredText variant="displayLarge" {...props} />;
}

export function HeadingText(props: Omit<SacredTextProps, 'variant'>) {
  return <SacredText variant="heading" {...props} />;
}

export function TitleText(props: Omit<SacredTextProps, 'variant'>) {
  return <SacredText variant="title" {...props} />;
}

export function BodyText(props: Omit<SacredTextProps, 'variant'>) {
  return <SacredText variant="body" {...props} />;
}

export function CaptionText(props: Omit<SacredTextProps, 'variant'>) {
  return <SacredText variant="caption" {...props} />;
}

export function QuoteText(props: Omit<SacredTextProps, 'variant'>) {
  return <SacredText variant="quote" {...props} />;
}
