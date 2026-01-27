/**
 * 🪷 LANGUAGE SELECTOR COMPONENT
 * Modal/sheet for selecting app language
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from '../../hooks/use-language';
import type { LanguageCode } from '../../i18n';
import { VanshColors, VanshSpacing, VanshTypeScale } from '../../theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { language, languages, setLanguage, t, isLoading } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  
  const handleSelectLanguage = async (code: LanguageCode) => {
    setSelectedLanguage(code);
    try {
      await setLanguage(code);
      onClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.selectLanguage')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={VanshColors.masi[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.languageList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  selectedLanguage === lang.code && styles.languageItemSelected,
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
                disabled={isLoading}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === lang.code && styles.languageNameSelected,
                  ]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={styles.languageEnglishName}>
                    {lang.name}
                  </Text>
                </View>
                
                {selectedLanguage === lang.code && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={VanshColors.suvarna[500]} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              {language === 'hi' ? 'भाषा परिवर्तन तुरंत लागू होगा' : 
               language === 'te' ? 'భాష మార్పు వెంటనే వర్తిస్తుంది' :
               'Language change will be applied immediately'}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Language Button - shows current language and opens selector
 */
interface LanguageButtonProps {
  onPress: () => void;
}

export function LanguageButton({ onPress }: LanguageButtonProps) {
  const { languageInfo, t } = useLanguage();
  
  return (
    <TouchableOpacity 
      style={styles.settingsRow}
      onPress={onPress}
      accessibilityLabel={t('settings.language')}
      accessibilityHint={`Current language: ${languageInfo.name}`}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons name="language" size={22} color={VanshColors.masi[600]} />
        <Text style={styles.settingsRowLabel}>{t('settings.language')}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        <Text style={styles.settingsRowValue}>{languageInfo.nativeName}</Text>
        <Ionicons name="chevron-forward" size={20} color={VanshColors.masi[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: VanshColors.khadi[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: VanshColors.masi[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: VanshSpacing.md,
    marginBottom: VanshSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.masi[200],
  },
  title: {
    fontSize: VanshTypeScale.title,
    fontWeight: '600',
    color: VanshColors.masi[900],
  },
  closeButton: {
    padding: VanshSpacing.xs,
  },
  languageList: {
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.md,
    marginVertical: VanshSpacing.xs,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  languageItemSelected: {
    backgroundColor: VanshColors.suvarna[50],
    borderWidth: 1,
    borderColor: VanshColors.suvarna[200],
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: VanshTypeScale.lead,
    fontWeight: '500',
    color: VanshColors.masi[800],
    marginBottom: 2,
  },
  languageNameSelected: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },
  languageEnglishName: {
    fontSize: VanshTypeScale.small,
    color: VanshColors.masi[500],
  },
  footer: {
    paddingHorizontal: VanshSpacing.lg,
    paddingTop: VanshSpacing.md,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: VanshTypeScale.small,
    color: VanshColors.masi[500],
    textAlign: 'center',
  },
  // Settings Row styles (for LanguageButton)
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.lg,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.masi[100],
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
  },
  settingsRowLabel: {
    fontSize: VanshTypeScale.body,
    color: VanshColors.masi[800],
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.xs,
  },
  settingsRowValue: {
    fontSize: VanshTypeScale.body,
    color: VanshColors.masi[500],
  },
});

export default LanguageSelector;
