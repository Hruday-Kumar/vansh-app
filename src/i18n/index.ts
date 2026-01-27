/**
 * 🪷 VANSH i18n CONFIGURATION
 * Internationalization with Hindi, English, and Telugu support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { en, hi, te, type TranslationKeys } from './translations';

// ============================================================================
// LANGUAGE CONFIGURATION
// ============================================================================

export type LanguageCode = 'en' | 'hi' | 'te';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', rtl: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', rtl: false },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const LANGUAGE_STORAGE_KEY = '@vansh_language';

// ============================================================================
// i18n INSTANCE
// ============================================================================

const i18n = new I18n({
  en,
  hi,
  te,
});

// Configuration
i18n.defaultLocale = DEFAULT_LANGUAGE;
i18n.enableFallback = true;
i18n.missingBehavior = 'guess';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize i18n with saved or device language
 * Default is English, only uses device locale if it matches supported languages
 */
export async function initializeI18n(): Promise<LanguageCode> {
  try {
    // Try to get saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    if (savedLanguage && isValidLanguage(savedLanguage)) {
      i18n.locale = savedLanguage;
      return savedLanguage as LanguageCode;
    }
    
    // No saved language - default to English (not device locale)
    // User can change language in settings
    i18n.locale = DEFAULT_LANGUAGE;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('[i18n] Initialization error:', error);
    i18n.locale = DEFAULT_LANGUAGE;
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Check if a language code is supported
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

/**
 * Get current language code
 */
export function getCurrentLanguage(): LanguageCode {
  return (i18n.locale as LanguageCode) || DEFAULT_LANGUAGE;
}

/**
 * Get current language info
 */
export function getCurrentLanguageInfo(): Language {
  const code = getCurrentLanguage();
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
}

/**
 * Change the app language
 */
export async function setLanguage(languageCode: LanguageCode): Promise<void> {
  if (!isValidLanguage(languageCode)) {
    throw new Error(`Unsupported language: ${languageCode}`);
  }
  
  i18n.locale = languageCode;
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
}

/**
 * Get device preferred language (if supported)
 */
export function getDeviceLanguage(): LanguageCode {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  
  if (deviceLocale && isValidLanguage(deviceLocale)) {
    return deviceLocale;
  }
  
  return DEFAULT_LANGUAGE;
}

// ============================================================================
// TRANSLATION HELPERS
// ============================================================================

type PathKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? PathKeys<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`>
        : never;
    }[keyof T]
  : Prefix;

export type TranslationKey = PathKeys<TranslationKeys>;

/**
 * Main translation function
 * Usage: t('auth.signIn') or t('common.syncPending', { count: 5 })
 */
export function t(
  key: string,
  options?: Record<string, string | number>
): string {
  return i18n.t(key, options);
}

/**
 * Pluralization helper
 * Usage: plural('common.item', count, { count })
 */
export function plural(
  key: string,
  count: number,
  options?: Record<string, string | number>
): string {
  return i18n.t(key, { count, ...options });
}

/**
 * Get translation with scope
 * Usage: const authT = scope('auth'); authT('signIn')
 */
export function scope(scopeKey: string): (key: string, options?: Record<string, string | number>) => string {
  return (key: string, options?: Record<string, string | number>) => {
    return i18n.t(`${scopeKey}.${key}`, options);
  };
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const locale = getCurrentLanguage() === 'hi' ? 'hi-IN' : 
                 getCurrentLanguage() === 'te' ? 'te-IN' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(d);
}

/**
 * Format time according to locale
 */
export function formatTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const locale = getCurrentLanguage() === 'hi' ? 'hi-IN' : 
                 getCurrentLanguage() === 'te' ? 'te-IN' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, {
    timeStyle: 'short',
    ...options,
  }).format(d);
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getCurrentLanguage() === 'hi' ? 'hi-IN' : 
                 getCurrentLanguage() === 'te' ? 'te-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  const locale = getCurrentLanguage() === 'hi' ? 'hi-IN' : 
                 getCurrentLanguage() === 'te' ? 'te-IN' : 'en-US';
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diffSec < 60) {
    return rtf.format(-diffSec, 'second');
  } else if (diffMin < 60) {
    return rtf.format(-diffMin, 'minute');
  } else if (diffHour < 24) {
    return rtf.format(-diffHour, 'hour');
  } else if (diffDay < 30) {
    return rtf.format(-diffDay, 'day');
  } else {
    return formatDate(d);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { i18n };
export default i18n;
