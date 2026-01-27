/**
 * 🪷 VANSH ANIMATION SYSTEM
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * "Digital Silk" - Fluid, slightly heavy, textured motion
 * All animations use physics-based Bézier curves for natural feel
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Easing } from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════
// DURATION SCALE - Time in milliseconds
// ═══════════════════════════════════════════════════════════

export const VanshDuration = {
  /** Instant feedback - 100ms */
  instant: 100,
  
  /** Quick response - 200ms */
  fast: 200,
  
  /** Standard transition - 300ms */
  normal: 300,
  
  /** Deliberate motion - 400ms */
  slow: 400,
  
  /** Dramatic reveal - 600ms */
  dramatic: 600,
  
  /** Ceremonial - 800ms */
  ceremonial: 800,
  
  /** Grand entrance - 1000ms */
  grand: 1000,
  
  /** Epic moment - 1500ms */
  epic: 1500,
} as const;

// ═══════════════════════════════════════════════════════════
// EASING CURVES - The Soul of Motion
// ═══════════════════════════════════════════════════════════

export const VanshEasing = {
  /**
   * Silk Flow - Primary easing
   * Slow start, smooth acceleration, gentle settle
   * Like silk unfolding in wind
   */
  silk: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  
  /**
   * Enter - Elements coming into view
   * Quick departure, gentle arrival
   * Like a guest entering a room with grace
   */
  enter: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  
  /**
   * Exit - Elements leaving view
   * Quick start, no settle needed
   * Like pages turning in wind
   */
  exit: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  
  /**
   * Bounce - Joyful arrival
   * Overshoots then settles
   * Like a diya flame dancing
   */
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1.0),
  
  /**
   * Dramatic - For important moments
   * Slow build, quick release
   * Like unveiling a sacred object
   */
  dramatic: Easing.bezier(0.7, 0.0, 0.3, 1.0),
  
  /**
   * Heartbeat - Pulsing animations
   * Quick in, slow out
   * Like a heartbeat
   */
  heartbeat: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  
  /**
   * Book Page - For page flip physics
   * Simulates paper resistance
   */
  pageFlip: Easing.bezier(0.65, 0.0, 0.35, 1.0),
  
  /**
   * Water - For fluid gestures
   * Like ripples in a temple pond
   */
  water: Easing.bezier(0.2, 0.8, 0.2, 1.0),
} as const;

// ═══════════════════════════════════════════════════════════
// SPRING CONFIGURATIONS - Physics-based motion
// ═══════════════════════════════════════════════════════════

export const VanshSpring = {
  /** Gentle - For subtle movements */
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  
  /** Default - Standard spring */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  /** Bouncy - For playful elements */
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  
  /** Stiff - For quick responses */
  stiff: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  
  /** Heavy - For "Digital Silk" feel */
  heavy: {
    damping: 25,
    stiffness: 100,
    mass: 1.5,
  },
  
  /** Page - For book-like page flips */
  page: {
    damping: 18,
    stiffness: 120,
    mass: 1.2,
  },
  
  /** Heartbeat - For pulse animations */
  heartbeat: {
    damping: 12,
    stiffness: 200,
    mass: 0.6,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// ANIMATION PRESETS - Common motion patterns
// ═══════════════════════════════════════════════════════════

export const VanshAnimations = {
  // ─────────────────────────────────────────────────────────
  // ENTRANCE ANIMATIONS
  // ─────────────────────────────────────────────────────────
  
  /** Fade in from transparent */
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: VanshDuration.normal,
    easing: VanshEasing.enter,
  },
  
  /** Slide up from below */
  slideUp: {
    from: { opacity: 0, translateY: 24 },
    to: { opacity: 1, translateY: 0 },
    duration: VanshDuration.slow,
    easing: VanshEasing.enter,
  },
  
  /** Scale up from center */
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: VanshDuration.slow,
    easing: VanshEasing.bounce,
  },
  
  /** Unfold like silk */
  unfold: {
    from: { opacity: 0, scaleY: 0.8, translateY: -10 },
    to: { opacity: 1, scaleY: 1, translateY: 0 },
    duration: VanshDuration.dramatic,
    easing: VanshEasing.silk,
  },
  
  // ─────────────────────────────────────────────────────────
  // EXIT ANIMATIONS
  // ─────────────────────────────────────────────────────────
  
  /** Fade out */
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: VanshDuration.fast,
    easing: VanshEasing.exit,
  },
  
  /** Slide down and out */
  slideDown: {
    from: { opacity: 1, translateY: 0 },
    to: { opacity: 0, translateY: 24 },
    duration: VanshDuration.normal,
    easing: VanshEasing.exit,
  },
  
  /** Fold like paper */
  fold: {
    from: { opacity: 1, scaleY: 1 },
    to: { opacity: 0, scaleY: 0.8 },
    duration: VanshDuration.normal,
    easing: VanshEasing.exit,
  },
  
  // ─────────────────────────────────────────────────────────
  // CONTINUOUS ANIMATIONS
  // ─────────────────────────────────────────────────────────
  
  /** Heartbeat pulse - for active connections */
  heartbeat: {
    keyframes: [
      { scale: 1, opacity: 1 },
      { scale: 1.05, opacity: 0.9 },
      { scale: 1, opacity: 1 },
    ],
    duration: VanshDuration.grand,
    easing: VanshEasing.heartbeat,
    loop: true,
  },
  
  /** Golden shimmer - for sacred elements */
  shimmer: {
    keyframes: [
      { opacity: 0.4 },
      { opacity: 0.8 },
      { opacity: 0.4 },
    ],
    duration: VanshDuration.epic,
    easing: VanshEasing.silk,
    loop: true,
  },
  
  /** Gentle float - for ethereal elements */
  float: {
    keyframes: [
      { translateY: 0 },
      { translateY: -8 },
      { translateY: 0 },
    ],
    duration: 3000,
    easing: VanshEasing.water,
    loop: true,
  },
  
  /** Breathe - for meditation/focus states */
  breathe: {
    keyframes: [
      { scale: 1, opacity: 0.8 },
      { scale: 1.02, opacity: 1 },
      { scale: 1, opacity: 0.8 },
    ],
    duration: 4000,
    easing: VanshEasing.silk,
    loop: true,
  },
  
  // ─────────────────────────────────────────────────────────
  // GESTURE-BASED ANIMATIONS
  // ─────────────────────────────────────────────────────────
  
  /** Press feedback */
  press: {
    pressed: { scale: 0.97, opacity: 0.9 },
    released: { scale: 1, opacity: 1 },
    duration: VanshDuration.instant,
    spring: VanshSpring.stiff,
  },
  
  /** Page flip rotation */
  pageFlip: {
    degrees: 180,
    duration: VanshDuration.dramatic,
    easing: VanshEasing.pageFlip,
  },
  
  /** Swipe reveal */
  swipeReveal: {
    threshold: 100,
    duration: VanshDuration.slow,
    spring: VanshSpring.heavy,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// GESTURE THRESHOLDS
// ═══════════════════════════════════════════════════════════

export const VanshGestures = {
  /** Minimum swipe distance to trigger action */
  swipeThreshold: 50,
  
  /** Velocity needed for fling gesture */
  flingVelocity: 500,
  
  /** Long press duration */
  longPressDuration: 500,
  
  /** Double tap window */
  doubleTapWindow: 300,
  
  /** Drag resistance factor */
  dragResistance: 0.5,
} as const;

export type VanshDurationKey = keyof typeof VanshDuration;
export type VanshEasingKey = keyof typeof VanshEasing;
export type VanshSpringKey = keyof typeof VanshSpring;
export type VanshAnimationKey = keyof typeof VanshAnimations;
