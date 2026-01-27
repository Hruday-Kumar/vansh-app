/**
 * 🪷 VANSH DESIGN SYSTEM
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * The Complete Visual Language for Digital Sanskriti
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Core theme exports
export * from './animations';
export * from './colors';
export * from './spacing';
export * from './typography';

// Convenience re-exports
import { VanshAnimations, VanshDuration, VanshEasing, VanshGestures, VanshSpring } from './animations';
import { VanshColors } from './colors';
import { VanshBorders, VanshGaps, VanshInsets, VanshRadius, VanshShadows, VanshSpacing } from './spacing';
import { VanshFonts, VanshTextStyles, VanshTypeScale } from './typography';

/**
 * 🪷 The Complete Vansh Theme
 * Use this for theme provider or to access all tokens
 */
export const VanshTheme = {
  colors: VanshColors,
  fonts: VanshFonts,
  typeScale: VanshTypeScale,
  textStyles: VanshTextStyles,
  spacing: VanshSpacing,
  radius: VanshRadius,
  shadows: VanshShadows,
  insets: VanshInsets,
  gaps: VanshGaps,
  borders: VanshBorders,
  duration: VanshDuration,
  easing: VanshEasing,
  spring: VanshSpring,
  animations: VanshAnimations,
  gestures: VanshGestures,
} as const;

export type VanshThemeType = typeof VanshTheme;

/**
 * Quick access to most-used tokens
 */
export const V = {
  // Colors
  gold: VanshColors.suvarna[500],
  vermilion: VanshColors.sindoor[700],
  lotus: VanshColors.padma[300],
  paper: VanshColors.khadi[50],
  ink: VanshColors.masi[900],
  
  // Spacing
  xs: VanshSpacing.xs,
  sm: VanshSpacing.sm,
  md: VanshSpacing.md,
  lg: VanshSpacing.lg,
  xl: VanshSpacing.xl,
  
  // Animation
  fast: VanshDuration.fast,
  normal: VanshDuration.normal,
  slow: VanshDuration.slow,
} as const;
