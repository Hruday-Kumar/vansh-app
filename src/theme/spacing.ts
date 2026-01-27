/**
 * 🪷 VANSH SPACING SYSTEM
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Based on the Golden Ratio (φ = 1.618)
 * Inspired by temple architecture proportions
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ═══════════════════════════════════════════════════════════
// BASE SPACING SCALE (4px base unit)
// ═══════════════════════════════════════════════════════════

export const VanshSpacing = {
  /** 0px - No space */
  none: 0,
  
  /** 2px - Hairline */
  hair: 2,
  
  /** 4px - Micro spacing */
  micro: 4,
  
  /** 8px - Tight spacing */
  xs: 8,
  
  /** 12px - Small spacing */
  sm: 12,
  
  /** 16px - Base spacing */
  md: 16,
  
  /** 24px - Medium-large spacing */
  lg: 24,
  
  /** 32px - Large spacing */
  xl: 32,
  
  /** 48px - Extra-large spacing */
  '2xl': 48,
  
  /** 64px - Section spacing */
  '3xl': 64,
  
  /** 96px - Major section spacing */
  '4xl': 96,
  
  /** 128px - Page-level spacing */
  '5xl': 128,
} as const;

// ═══════════════════════════════════════════════════════════
// INSETS - Padding presets
// ═══════════════════════════════════════════════════════════

export const VanshInsets = {
  /** Screen edge padding */
  screen: {
    horizontal: VanshSpacing.lg,
    vertical: VanshSpacing.xl,
  },
  
  /** Card internal padding */
  card: {
    horizontal: VanshSpacing.md,
    vertical: VanshSpacing.lg,
  },
  
  /** Button padding */
  button: {
    horizontal: VanshSpacing.lg,
    vertical: VanshSpacing.sm,
  },
  
  /** Input field padding */
  input: {
    horizontal: VanshSpacing.md,
    vertical: VanshSpacing.sm,
  },
  
  /** Modal padding */
  modal: {
    horizontal: VanshSpacing.xl,
    vertical: VanshSpacing.xl,
  },
  
  /** List item padding */
  listItem: {
    horizontal: VanshSpacing.md,
    vertical: VanshSpacing.sm,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// GAPS - Space between elements
// ═══════════════════════════════════════════════════════════

export const VanshGaps = {
  /** Between inline elements */
  inline: VanshSpacing.xs,
  
  /** Between form fields */
  form: VanshSpacing.md,
  
  /** Between list items */
  list: VanshSpacing.sm,
  
  /** Between cards */
  cards: VanshSpacing.lg,
  
  /** Between sections */
  section: VanshSpacing.xl,
  
  /** Between major page sections */
  page: VanshSpacing['3xl'],
} as const;

// ═══════════════════════════════════════════════════════════
// BORDER RADIUS - Rounded corners
// ═══════════════════════════════════════════════════════════

export const VanshRadius = {
  /** No rounding */
  none: 0,
  
  /** Subtle rounding - 4px */
  sm: 4,
  
  /** Standard rounding - 8px */
  md: 8,
  
  /** Prominent rounding - 12px */
  lg: 12,
  
  /** Large rounding - 16px */
  xl: 16,
  
  /** Extra large - 24px */
  '2xl': 24,
  
  /** Pill shape */
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════
// BORDERS - Line weights
// ═══════════════════════════════════════════════════════════

export const VanshBorders = {
  /** Hairline border */
  hairline: 0.5,
  
  /** Standard border */
  thin: 1,
  
  /** Medium border */
  medium: 2,
  
  /** Thick border (decorative) */
  thick: 3,
  
  /** Heavy border (emphasis) */
  heavy: 4,
} as const;

// ═══════════════════════════════════════════════════════════
// SHADOWS - Depth & elevation
// ═══════════════════════════════════════════════════════════

export const VanshShadows = {
  /** No shadow */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  /** Subtle lift */
  sm: {
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  
  /** Card shadow */
  md: {
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  /** Elevated element */
  lg: {
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  
  /** Floating element */
  xl: {
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  
  /** Modal/overlay */
  '2xl': {
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 24,
  },
  
  /** Golden glow (for sacred elements) */
  glow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  
  /** Vermilion pulse (for active elements) */
  pulse: {
    shadowColor: '#7E191B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type VanshSpacingKey = keyof typeof VanshSpacing;
export type VanshRadiusKey = keyof typeof VanshRadius;
export type VanshShadowKey = keyof typeof VanshShadows;
