/**
 * 🪷 SETTINGS SCREEN - Simple logout only
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeritageCard, MemberAvatar, SacredText, SilkButton } from '../../src/components';
import { useAuth } from '../../src/hooks';
import { useAuthStore, useFamilyStore } from '../../src/state';
import { VanshColors, VanshSpacing } from '../../src/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { family, membersList } = useFamilyStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login' as any);
          }
        },
      ]
    );
  };

  return (
    <View 
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <SacredText variant="displaySmall" color="gold">Settings</SacredText>
      </View>
      
      {/* User Profile Card */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <HeritageCard variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <MemberAvatar
              uri={undefined}
              name={user?.email || 'User'}
              size="lg"
            />
            <View style={styles.profileInfo}>
              <SacredText variant="heading" color="primary">
                {user?.email?.split('@')[0] || 'User'}
              </SacredText>
              <SacredText variant="caption" color="muted">
                {user?.email}
              </SacredText>
              <View style={styles.roleBadge}>
                <SacredText variant="caption" color="gold">
                  {user?.role?.toUpperCase() || 'MEMBER'}
                </SacredText>
              </View>
            </View>
          </View>
        </HeritageCard>
      </Animated.View>
      
      {/* Family Stats */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <HeritageCard variant="outlined" style={styles.statsCard}>
          <SacredText variant="label" color="muted" style={styles.sectionTitle}>
            Family Overview
          </SacredText>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <SacredText variant="displaySmall" color="gold">
                {membersList.length}
              </SacredText>
              <SacredText variant="caption" color="muted">Members</SacredText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SacredText variant="displaySmall" color="gold">
                {family?.name || '-'}
              </SacredText>
              <SacredText variant="caption" color="muted">Family</SacredText>
            </View>
          </View>
        </HeritageCard>
      </Animated.View>
      
      {/* Logout Button */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.logoutContainer}>
        <SilkButton
          variant="secondary"
          label="Sign Out"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </Animated.View>
      
      {/* App Version */}
      <Animated.View entering={FadeInDown.delay(250).springify()}>
        <SacredText variant="caption" color="muted" align="center" style={styles.version}>
          Vansh v1.0.0 • Made with 🪷 for families
        </SacredText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
    paddingHorizontal: VanshSpacing.lg,
  },
  header: {
    paddingVertical: VanshSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
    marginBottom: VanshSpacing.lg,
  },
  profileCard: {
    marginBottom: VanshSpacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  roleBadge: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: VanshSpacing.xs,
  },
  statsCard: {
    marginBottom: VanshSpacing.lg,
  },
  sectionTitle: {
    marginBottom: VanshSpacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: VanshColors.khadi[300],
  },
  logoutContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  logoutButton: {
    marginBottom: VanshSpacing.lg,
  },
  version: {
    marginBottom: VanshSpacing.xl,
  },
});
