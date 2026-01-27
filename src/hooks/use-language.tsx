/**
 * 🪷 LANGUAGE HOOK
 * React hook for managing app language with context
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  initializeI18n,
  setLanguage as setI18nLanguage,
  getCurrentLanguage,
  getCurrentLanguageInfo,
  t,
  formatDate,
  formatTime,
  formatNumber,
  formatRelativeTime,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type Language,
} from '../i18n';

// ============================================================================
// CONTEXT
// ============================================================================

interface LanguageContextValue {
  /** Current language code */
  language: LanguageCode;
  /** Current language info */
  languageInfo: Language;
  /** All supported languages */
  languages: Language[];
  /** Is language loading */
  isLoading: boolean;
  /** Change language */
  setLanguage: (code: LanguageCode) => Promise<void>;
  /** Translation function */
  t: typeof t;
  /** Format date */
  formatDate: typeof formatDate;
  /** Format time */
  formatTime: typeof formatTime;
  /** Format number */
  formatNumber: typeof formatNumber;
  /** Format relative time */
  formatRelativeTime: typeof formatRelativeTime;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Language Provider
 * Wrap your app with this provider to enable language switching
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize language on mount
  useEffect(() => {
    const init = async () => {
      try {
        const savedLanguage = await initializeI18n();
        setLanguageState(savedLanguage);
      } catch (error) {
        console.error('[LanguageProvider] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);
  
  // Change language handler
  const setLanguage = useCallback(async (code: LanguageCode) => {
    try {
      setIsLoading(true);
      await setI18nLanguage(code);
      setLanguageState(code);
    } catch (error) {
      console.error('[LanguageProvider] Set language error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const value: LanguageContextValue = {
    language,
    languageInfo: getCurrentLanguageInfo(),
    languages: SUPPORTED_LANGUAGES,
    isLoading,
    setLanguage,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatRelativeTime,
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useLanguage Hook
 * Access translation functions and language management
 * 
 * @example
 * const { t, language, setLanguage } = useLanguage();
 * // Returns translated text for 'auth.signIn'
 * // setLanguage('hi') to switch to Hindi
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
}

/**
 * useTranslation Hook
 * Simpler hook when you only need translation function
 * 
 * @example
 * const { t } = useTranslation();
 * // t('common.save') returns the translated string
 */
export function useTranslation() {
  const { t, formatDate, formatTime, formatNumber, formatRelativeTime } = useLanguage();
  
  return {
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatRelativeTime,
  };
}

/**
 * useTranslationScope Hook
 * Get translations for a specific scope
 * 
 * @example
 * const { t } = useTranslationScope('vriksha');
 * // t('title') returns "Family Tree"
 */
export function useTranslationScope(scopeKey: string) {
  const { t: translate } = useLanguage();
  
  const t = useCallback(
    (key: string, options?: Record<string, string | number>) => {
      return translate(`${scopeKey}.${key}`, options);
    },
    [scopeKey, translate]
  );
  
  return { t };
}

export default useLanguage;
