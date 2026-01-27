/**
 * 🪷 VANSH SACRED COLOR PALETTE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Colors drawn from India's living heritage:
 * - Temple walls of Thanjavur
 * - Kanchipuram silk weavings  
 * - Aged manuscripts and palm leaves
 * - Sacred vermilion and turmeric
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const VanshColors = {
  // ═══════════════════════════════════════════════════════════
  // PRIMARY PALETTE - The Soul of Vansh
  // ═══════════════════════════════════════════════════════════
  
  /** Royal Gold - Temple spires, sacred threads, prosperity */
  suvarna: {
    50: '#FFF9E6',
    100: '#FFF0C2',
    200: '#FFE299',
    300: '#FFD066',
    400: '#F5C542',
    500: '#D4AF37', // PRIMARY - Royal Gold
    600: '#B8962E',
    700: '#9A7B24',
    800: '#7C611A',
    900: '#5E4812',
  },
  
  /** Deep Vermilion - Sindoor, Kumkum, life-force */
  sindoor: {
    50: '#FDF2F2',
    100: '#FCE4E4',
    200: '#F9CACA',
    300: '#F4A3A3',
    400: '#EC7676',
    500: '#E04545',
    600: '#C62828',
    700: '#7E191B', // PRIMARY - Deep Vermilion  
    800: '#5C1213',
    900: '#3D0C0D',
  },
  
  /** Sacred Lotus - Lakshmi's seat, purity, devotion */
  padma: {
    50: '#FFF5F7',
    100: '#FFEBEF',
    200: '#FFD6E0',
    300: '#FFB7C5', // PRIMARY - Sacred Lotus
    400: '#FF8FA8',
    500: '#FF6B8A',
    600: '#E84A6F',
    700: '#C92D55',
    800: '#A31B40',
    900: '#7D132F',
  },
  
  // ═══════════════════════════════════════════════════════════
  // NEUTRALS - Aged Paper & Sacred Ink
  // ═══════════════════════════════════════════════════════════
  
  /** Khadi Paper - The base canvas, never pure white */
  khadi: {
    50: '#FDFBF7',  // Primary background
    100: '#FAF6EE',
    200: '#F5EDE0',
    300: '#EDE3D0',
    400: '#E2D4BB',
    500: '#D4C4A5',
    600: '#C4B08A',
    700: '#B09970',
    800: '#9A8259',
    900: '#7A6745',
  },
  
  /** Sacred Ink - Charcoal from agarbatti, never pure black */
  masi: {
    50: '#F7F6F4',
    100: '#ECEAE6',
    200: '#D9D5CE',
    300: '#C2BDB3',
    400: '#A8A193',
    500: '#8E8573',
    600: '#746A58',
    700: '#594F40',
    800: '#3D362B', // Secondary text
    900: '#2C241B', // Primary text - Soft charcoal
  },
  
  // ═══════════════════════════════════════════════════════════
  // ACCENT COLORS - Elements of Ritual
  // ═══════════════════════════════════════════════════════════
  
  /** Turmeric - Haldi, auspiciousness, new beginnings */
  haldi: {
    400: '#E5A832',
    500: '#D4972A',
    600: '#B8821F',
  },
  
  /** Sandalwood - Chandan, peace, temple fragrance */
  chandan: {
    400: '#C9A66B',
    500: '#B8925A',
    600: '#A37E4A',
  },
  
  /** Deep Teal - Temple ponds, depth, reflection */
  neelam: {
    400: '#2D8B8B',
    500: '#1A7575',
    600: '#0D5F5F',
  },
  
  /** Sacred Saffron - Bhagwa, renunciation, devotion */
  bhagwa: {
    400: '#FF7722',
    500: '#E86A1C',
    600: '#CC5C15',
  },
  
  // ═══════════════════════════════════════════════════════════
  // SEMANTIC COLORS
  // ═══════════════════════════════════════════════════════════
  
  semantic: {
    /** Memory Locked - Waiting to be unlocked */
    locked: '#8E8573',
    
    /** Memory Available - Ready to view */
    available: '#D4AF37',
    
    /** New Memory - Recently added */
    fresh: '#2D8B8B',
    
    /** Sacred/Important - Marked by family */
    sacred: '#7E191B',
    
    /** Connection Active - Live family bond */
    connected: '#4CAF50',
    
    /** Gentle Warning */
    caution: '#E5A832',
    
    /** Error/Destructive */
    error: '#C62828',
  },
  
  // ═══════════════════════════════════════════════════════════
  // GLASSMORPHISM & OVERLAYS
  // ═══════════════════════════════════════════════════════════
  
  overlay: {
    /** Light overlay for modals */
    light: 'rgba(253, 251, 247, 0.85)',
    
    /** Dark overlay for focus states */
    dark: 'rgba(44, 36, 27, 0.7)',
    
    /** Golden shimmer for sacred moments */
    shimmer: 'rgba(212, 175, 55, 0.15)',
    
    /** Vermilion glow for life-force */
    prana: 'rgba(126, 25, 27, 0.2)',
  },
} as const;

// Type exports for strict typing
export type VanshColorKey = keyof typeof VanshColors;
export type SuvarnaShade = keyof typeof VanshColors.suvarna;
export type SindoorShade = keyof typeof VanshColors.sindoor;
export type PadmaShade = keyof typeof VanshColors.padma;
export type KhadiShade = keyof typeof VanshColors.khadi;
export type MasiShade = keyof typeof VanshColors.masi;
