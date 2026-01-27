/**
 * 🪷 VANSH - Settings Screen
 * User preferences and app configuration
 */

import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LanguageButton, LanguageSelector } from '../../components/molecules/language-selector';
import { useLanguage } from '../../hooks/use-language';
import { useAuthStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing, VanshTextStyles } from '../../theme';

// ============================================================================
// Types
// ============================================================================

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

// ============================================================================
// Settings Item Component
// ============================================================================

function SettingItem({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  showArrow = false,
  danger = false,
}: SettingItemProps) {
  const content = (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onToggle !== undefined && value !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: VanshColors.khadi[300], true: VanshColors.suvarna[400] }}
          thumbColor={value ? VanshColors.suvarna[600] : VanshColors.khadi[100]}
        />
      )}
      {showArrow && (
        <Text style={styles.arrowIcon}>›</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ============================================================================
// Settings Section Component
// ============================================================================

function SettingsSection({ title, children, delay = 0 }: SettingsSectionProps) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Settings Screen
// ============================================================================

interface SettingsScreenProps {
  onClose?: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { t } = useLanguage();
  const { logout } = useAuthStore();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  // Handlers
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by auth state change
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Vansh',
      'Version 1.0.0\n\nVansh - Preserving your family\'s legacy through stories, memories, and traditions.\n\n© 2024 Vansh App',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your family data is stored securely and never shared with third parties. All memories and stories remain private to your family.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'For help and support, please contact us at:\n\nsupport@vanshapp.com',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <SettingsSection title="Preferences" delay={0}>
          <LanguageButton onPress={() => setLanguageSelectorVisible(true)} />
          <SettingItem
            icon="🔔"
            title="Notifications"
            subtitle="Memory anniversaries, updates"
            value={notifications}
            onToggle={setNotifications}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About" delay={100}>
          <SettingItem
            icon="ℹ️"
            title="About Vansh"
            subtitle="Version 1.0.0"
            onPress={handleAbout}
            showArrow
          />
          <SettingItem
            icon="🔒"
            title="Privacy Policy"
            onPress={handlePrivacyPolicy}
            showArrow
          />
          <SettingItem
            icon="❓"
            title="Help & Support"
            onPress={handleHelpSupport}
            showArrow
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Account" delay={200}>
          <SettingItem
            icon="🚪"
            title="Log Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger
            showArrow
          />
        </SettingsSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerEmoji}>🪷</Text>
          <Text style={styles.footerText}>Vansh</Text>
          <Text style={styles.footerSubtext}>Preserving your family's legacy</Text>
        </View>
      </ScrollView>
      
      {/* Language Selector Modal */}
      <LanguageSelector 
        visible={languageSelectorVisible} 
        onClose={() => setLanguageSelectorVisible(false)} 
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.md,
    paddingTop: VanshSpacing.xl,
    paddingBottom: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[50],
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: VanshColors.masi[600],
  },
  headerTitle: {
    ...VanshTextStyles.heading,
    color: VanshColors.masi[900],
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: VanshSpacing.md,
    paddingBottom: VanshSpacing['2xl'],
  },
  section: {
    marginTop: VanshSpacing.lg,
  },
  sectionTitle: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
    marginBottom: VanshSpacing.sm,
    marginLeft: VanshSpacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.lg,
    overflow: 'hidden',
    shadowColor: VanshColors.masi[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: VanshColors.khadi[200],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: VanshRadius.md,
    backgroundColor: VanshColors.khadi[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: VanshSpacing.sm,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...VanshTextStyles.body,
    color: VanshColors.masi[900],
  },
  settingSubtitle: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
    marginTop: 2,
  },
  dangerText: {
    color: VanshColors.semantic.error,
  },
  arrowIcon: {
    fontSize: 20,
    color: VanshColors.masi[400],
    marginLeft: VanshSpacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: VanshSpacing['2xl'],
    paddingVertical: VanshSpacing.lg,
  },
  footerEmoji: {
    fontSize: 32,
    marginBottom: VanshSpacing.xs,
  },
  footerText: {
    ...VanshTextStyles.title,
    color: VanshColors.suvarna[600],
  },
  footerSubtext: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
    marginTop: VanshSpacing.xs,
  },
});
