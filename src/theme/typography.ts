/**
 * 🪷 VANSH TYPOGRAPHY SYSTEM
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Typography inspired by:
 * - Palm-leaf manuscripts
 * - Temple inscriptions
 * - Handwritten family letters
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Platform, TextStyle } from 'react-native';

// ═══════════════════════════════════════════════════════════
// FONT FAMILIES
// ═══════════════════════════════════════════════════════════

export const VanshFonts = {
  /** Primary serif - For body text, stories, memories */
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: "'Crimson Text', 'Noto Serif', Georgia, serif",
    default: 'serif',
  }),
  
  /** Display serif - For titles, names, sacred text */
  display: Platform.select({
    ios: 'Baskerville',
    android: 'serif',
    web: "'Playfair Display', 'Noto Serif Display', Baskerville, serif",
    default: 'serif',
  }),
  
  /** Sanskrit/Devanagari - For mantras, shlokas */
  devanagari: Platform.select({
    ios: 'Devanagari Sangam MN',
    android: 'sans-serif',
    web: "'Noto Serif Devanagari', 'Siddhanta', sans-serif",
    default: 'sans-serif',
  }),
  
  /** Handwritten - For personal notes, signatures */
  hand: Platform.select({
    ios: 'Snell Roundhand',
    android: 'cursive',
    web: "'Dancing Script', 'Noto Sans', cursive",
    default: 'cursive',
  }),
  
  /** Monospace - For dates, timestamps, metadata */
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: "'JetBrains Mono', 'Fira Code', monospace",
    default: 'monospace',
  }),
} as const;

// ═══════════════════════════════════════════════════════════
// TYPE SCALE - Musical Ratio (1.25 - Major Third)
// ═══════════════════════════════════════════════════════════

export const VanshTypeScale = {
  /** 10px - Metadata, timestamps */
  micro: 10,
  
  /** 12px - Captions, labels */
  caption: 12,
  
  /** 14px - Secondary text */
  small: 14,
  
  /** 16px - Body text (base) */
  body: 16,
  
  /** 18px - Lead paragraphs */
  lead: 18,
  
  /** 20px - Subheadings */
  subhead: 20,
  
  /** 24px - Section titles */
  title: 24,
  
  /** 30px - Page titles */
  heading: 30,
  
  /** 36px - Hero text */
  hero: 36,
  
  /** 48px - Display text */
  display: 48,
  
  /** 60px - Monumental */
  monument: 60,
} as const;

// ═══════════════════════════════════════════════════════════
// LINE HEIGHTS - For Breath in Reading
// ═══════════════════════════════════════════════════════════

export const VanshLineHeight = {
  /** Tight - For headings */
  tight: 1.2,
  
  /** Normal - For short text */
  normal: 1.4,
  
  /** Relaxed - For body text (primary) */
  relaxed: 1.6,
  
  /** Loose - For long-form stories */
  loose: 1.8,
  
  /** Double - For poetry, sacred text */
  double: 2.0,
} as const;

// ═══════════════════════════════════════════════════════════
// LETTER SPACING - Space to Breathe
// ═══════════════════════════════════════════════════════════

export const VanshLetterSpacing = {
  /** Tight - For large display text */
  tight: -0.5,
  
  /** Normal - Default */
  normal: 0,
  
  /** Wide - For small caps, labels */
  wide: 0.5,
  
  /** Spaced - For sacred words, emphasis */
  spaced: 1.0,
  
  /** Dramatic - For single words */
  dramatic: 2.0,
} as const;

// ═══════════════════════════════════════════════════════════
// PRE-COMPOSED TEXT STYLES
// ═══════════════════════════════════════════════════════════

export const VanshTextStyles: Record<string, TextStyle> = {
  // ─────────────────────────────────────────────────────────
  // DISPLAY & HEADINGS
  // ─────────────────────────────────────────────────────────
  
  /** Monumental display - App name, major sections */
  displayLarge: {
    fontFamily: VanshFonts.display,
    fontSize: VanshTypeScale.display,
    lineHeight: VanshTypeScale.display * VanshLineHeight.tight,
    letterSpacing: VanshLetterSpacing.tight,
    fontWeight: '700',
  },
  
  /** Hero text - Welcome screens, major moments */
  hero: {
    fontFamily: VanshFonts.display,
    fontSize: VanshTypeScale.hero,
    lineHeight: VanshTypeScale.hero * VanshLineHeight.tight,
    letterSpacing: VanshLetterSpacing.tight,
    fontWeight: '600',
  },
  
  /** Page heading - Screen titles */
  heading: {
    fontFamily: VanshFonts.display,
    fontSize: VanshTypeScale.heading,
    lineHeight: VanshTypeScale.heading * VanshLineHeight.tight,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '600',
  },
  
  /** Section title - Card headers, section names */
  title: {
    fontFamily: VanshFonts.display,
    fontSize: VanshTypeScale.title,
    lineHeight: VanshTypeScale.title * VanshLineHeight.normal,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '600',
  },
  
  /** Subheading - Subsections */
  subhead: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.subhead,
    lineHeight: VanshTypeScale.subhead * VanshLineHeight.normal,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '500',
  },
  
  // ─────────────────────────────────────────────────────────
  // BODY TEXT
  // ─────────────────────────────────────────────────────────
  
  /** Lead paragraph - First paragraph of stories */
  lead: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.lead,
    lineHeight: VanshTypeScale.lead * VanshLineHeight.relaxed,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '400',
  },
  
  /** Body - Primary reading text */
  body: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.body,
    lineHeight: VanshTypeScale.body * VanshLineHeight.relaxed,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '400',
  },
  
  /** Body emphasis - Bold within body */
  bodyEmphasis: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.body,
    lineHeight: VanshTypeScale.body * VanshLineHeight.relaxed,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '600',
  },
  
  /** Small text - Secondary info */
  small: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.small,
    lineHeight: VanshTypeScale.small * VanshLineHeight.normal,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '400',
  },
  
  // ─────────────────────────────────────────────────────────
  // SPECIAL PURPOSE
  // ─────────────────────────────────────────────────────────
  
  /** Caption - Image descriptions, metadata */
  caption: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.caption,
    lineHeight: VanshTypeScale.caption * VanshLineHeight.normal,
    letterSpacing: VanshLetterSpacing.wide,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  
  /** Label - UI labels, buttons */
  label: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.small,
    lineHeight: VanshTypeScale.small * VanshLineHeight.tight,
    letterSpacing: VanshLetterSpacing.wide,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  
  /** Timestamp - Dates, times */
  timestamp: {
    fontFamily: VanshFonts.mono,
    fontSize: VanshTypeScale.micro,
    lineHeight: VanshTypeScale.micro * VanshLineHeight.normal,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '400',
  },
  
  /** Handwritten - Personal notes, signatures */
  handwritten: {
    fontFamily: VanshFonts.hand,
    fontSize: VanshTypeScale.lead,
    lineHeight: VanshTypeScale.lead * VanshLineHeight.loose,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '400',
  },
  
  /** Sacred - Mantras, shlokas */
  sacred: {
    fontFamily: VanshFonts.devanagari,
    fontSize: VanshTypeScale.title,
    lineHeight: VanshTypeScale.title * VanshLineHeight.loose,
    letterSpacing: VanshLetterSpacing.spaced,
    fontWeight: '400',
  },
  
  /** Quote - Family sayings, wisdom */
  quote: {
    fontFamily: VanshFonts.serif,
    fontSize: VanshTypeScale.lead,
    lineHeight: VanshTypeScale.lead * VanshLineHeight.loose,
    letterSpacing: VanshLetterSpacing.normal,
    fontWeight: '400',
    fontStyle: 'italic',
  },
} as const;

export type VanshTextStyleKey = keyof typeof VanshTextStyles;
