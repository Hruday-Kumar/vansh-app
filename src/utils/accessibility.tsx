/**
 * 🪷 ACCESSIBILITY UTILITIES
 * A11y helpers and components for inclusive design
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

// ═══════════════════════════════════════════════════════════
// ACCESSIBILITY HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Check if screen reader is enabled
 */
export function useScreenReaderEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Get initial state
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Check if reduce motion is enabled
 */
export function useReduceMotion(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Check if bold text is enabled (iOS only)
 */
export function useBoldTextEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isBoldTextEnabled().then(setIsEnabled);

      const subscription = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        setIsEnabled
      );

      return () => subscription.remove();
    }
  }, []);

  return isEnabled;
}

/**
 * Check if grayscale mode is enabled (iOS only)
 */
export function useGrayscaleEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isGrayscaleEnabled().then(setIsEnabled);

      const subscription = AccessibilityInfo.addEventListener(
        'grayscaleChanged',
        setIsEnabled
      );

      return () => subscription.remove();
    }
  }, []);

  return isEnabled;
}

/**
 * Combined accessibility state hook
 */
export function useAccessibilityInfo(): {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  boldTextEnabled: boolean;
  grayscaleEnabled: boolean;
} {
  return {
    screenReaderEnabled: useScreenReaderEnabled(),
    reduceMotionEnabled: useReduceMotion(),
    boldTextEnabled: useBoldTextEnabled(),
    grayscaleEnabled: useGrayscaleEnabled(),
  };
}

// ═══════════════════════════════════════════════════════════
// ACCESSIBILITY ACTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Announce a message to the screen reader
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Focus on a specific accessibility element
 */
export function setAccessibilityFocus(element: React.RefObject<View>): void {
  if (element.current) {
    const reactTag = element.current as unknown as number;
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  }
}

// ═══════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════

export const HapticFeedback = {
  /** Light tap - for selections */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  /** Medium tap - for toggles */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  /** Heavy tap - for important actions */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  /** Rigid tap - for definitive actions */
  rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  
  /** Soft tap - for subtle feedback */
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
  
  /** Success notification */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  /** Warning notification */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  /** Error notification */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  /** Selection changed */
  selection: () => Haptics.selectionAsync(),
};

/**
 * Hook that provides haptic feedback respecting reduce motion preference
 */
export function useHaptics() {
  const reduceMotion = useReduceMotion();

  const safeHaptic = useCallback(
    (fn: () => Promise<void>) => {
      if (!reduceMotion) {
        return fn();
      }
      return Promise.resolve();
    },
    [reduceMotion]
  );

  return {
    enabled: !reduceMotion,
    light: () => safeHaptic(HapticFeedback.light),
    medium: () => safeHaptic(HapticFeedback.medium),
    heavy: () => safeHaptic(HapticFeedback.heavy),
    rigid: () => safeHaptic(HapticFeedback.rigid),
    soft: () => safeHaptic(HapticFeedback.soft),
    success: () => safeHaptic(HapticFeedback.success),
    warning: () => safeHaptic(HapticFeedback.warning),
    error: () => safeHaptic(HapticFeedback.error),
    selection: () => safeHaptic(HapticFeedback.selection),
  };
}

// ═══════════════════════════════════════════════════════════
// ACCESSIBILITY PROPS BUILDERS
// ═══════════════════════════════════════════════════════════

export interface A11yButtonProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: 'button';
  accessible: true;
}

export interface A11yLinkProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: 'link';
  accessible: true;
}

export interface A11yImageProps {
  accessibilityLabel: string;
  accessibilityRole: 'image';
  accessible: true;
}

export interface A11yHeaderProps {
  accessibilityLabel?: string;
  accessibilityRole: 'header';
  accessible: true;
}

/**
 * Generate button accessibility props
 */
export function a11yButton(label: string, hint?: string): A11yButtonProps {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Generate link accessibility props
 */
export function a11yLink(label: string, hint?: string): A11yLinkProps {
  return {
    accessible: true,
    accessibilityRole: 'link',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Generate image accessibility props
 */
export function a11yImage(description: string): A11yImageProps {
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: description,
  };
}

/**
 * Generate header accessibility props
 */
export function a11yHeader(label?: string): A11yHeaderProps {
  return {
    accessible: true,
    accessibilityRole: 'header',
    accessibilityLabel: label,
  };
}

// ═══════════════════════════════════════════════════════════
// ACCESSIBLE COMPONENTS
// ═══════════════════════════════════════════════════════════

interface VisuallyHiddenProps {
  children: React.ReactNode;
}

/**
 * Component that is only visible to screen readers
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps): React.ReactElement {
  return <View style={styles.visuallyHidden}>{children}</View>;
}

interface SkipLinkProps {
  target: React.RefObject<View>;
  label?: string;
}

/**
 * Skip link for screen reader users to jump to main content
 */
export function SkipLink({ target, label = 'Skip to main content' }: SkipLinkProps): React.ReactElement {
  const screenReaderEnabled = useScreenReaderEnabled();

  if (!screenReaderEnabled) {
    return <React.Fragment />;
  }

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Double-tap to skip to main content"
      onAccessibilityTap={() => setAccessibilityFocus(target)}
    >
      <Text style={styles.skipLinkText}>{label}</Text>
    </View>
  );
}

interface AccessibleIconProps {
  label: string;
  children: React.ReactNode;
}

/**
 * Wrapper for icons to make them accessible
 */
export function AccessibleIcon({ label, children }: AccessibleIconProps): React.ReactElement {
  return (
    <View accessible accessibilityLabel={label} accessibilityRole="image">
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// LIVE REGIONS (For dynamic content)
// ═══════════════════════════════════════════════════════════

interface LiveRegionProps {
  children: React.ReactNode;
  polite?: boolean;
}

/**
 * Live region that announces changes to screen readers
 */
export function LiveRegion({ children, polite = true }: LiveRegionProps): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLiveRegion={polite ? 'polite' : 'assertive'}
    >
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// HINDI/SANSKRIT LABELS
// ═══════════════════════════════════════════════════════════

export const VanshA11yLabels = {
  // Navigation
  home: 'मुख्य पृष्ठ',
  back: 'पीछे जाएं',
  menu: 'मेनू खोलें',
  close: 'बंद करें',
  
  // Tabs
  vriksha: 'वृक्ष, परिवार वृक्ष',
  smriti: 'स्मृति, यादें और तस्वीरें',
  katha: 'कथा, आवाज़ की कहानियां',
  vasiyat: 'वसीयत, विरासत दस्तावेज़',
  parampara: 'परंपरा, पारिवारिक रीति-रिवाज',
  
  // Actions
  add: 'जोड़ें',
  edit: 'संपादित करें',
  delete: 'हटाएं',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  share: 'साझा करें',
  
  // Media
  play: 'चलाएं',
  pause: 'रुकें',
  record: 'रिकॉर्ड करें',
  stop: 'बंद करें',
  
  // Family
  father: 'पिता',
  mother: 'माता',
  son: 'पुत्र',
  daughter: 'पुत्री',
  spouse: 'जीवनसाथी',
  sibling: 'भाई-बहन',
};

const styles = StyleSheet.create({
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    borderWidth: 0,
    opacity: 0,
  },
  skipLinkText: {
    padding: 16,
    backgroundColor: '#000',
    color: '#fff',
    fontWeight: 'bold',
  },
});
