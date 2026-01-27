/**
 * 🪷 SILK BUTTON - Fluid press feedback button
 */

import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSilkPress } from '../../hooks';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import { SacredText } from './sacred-text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'vermilion';
type ButtonSize = 'sm' | 'md' | 'lg';

interface SilkButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, ViewStyle & { textColor: string }> = {
  primary: {
    backgroundColor: VanshColors.suvarna[500],
    borderWidth: 0,
    textColor: VanshColors.khadi[50],
    ...VanshShadows.md,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: VanshColors.suvarna[500],
    textColor: VanshColors.suvarna[600],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    textColor: VanshColors.masi[700],
  },
  vermilion: {
    backgroundColor: VanshColors.sindoor[700],
    borderWidth: 0,
    textColor: VanshColors.khadi[50],
    ...VanshShadows.md,
  },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: VanshSpacing.md, fontSize: 14 },
  md: { height: 48, paddingHorizontal: VanshSpacing.lg, fontSize: 16 },
  lg: { height: 56, paddingHorizontal: VanshSpacing.xl, fontSize: 18 },
};

export function SilkButton({
  variant = 'primary',
  size = 'md',
  label,
  leftIcon,
  rightIcon,
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  style,
  onPress,
  ...props
}: SilkButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = useSilkPress();
  
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  
  const buttonStyle: ViewStyle = {
    ...styles.base,
    ...variantStyle,
    height: sizeStyle.height,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    ...(fullWidth && { width: '100%' }),
    ...(isDisabled && styles.disabled),
  };
  
  return (
    <AnimatedPressable
      style={[buttonStyle, animatedStyle, style]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={isDisabled || isLoading ? undefined : onPress}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.textColor}
        />
      ) : (
        <>
          {leftIcon}
          <SacredText
            variant="label"
            style={[
              styles.label,
              { color: variantStyle.textColor, fontSize: sizeStyle.fontSize },
              leftIcon ? { marginLeft: VanshSpacing.xs } : undefined,
              rightIcon ? { marginRight: VanshSpacing.xs } : undefined,
            ]}
          >
            {label}
          </SacredText>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: VanshRadius.lg,
  },
  label: {
    textTransform: 'none',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
