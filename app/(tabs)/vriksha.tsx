/**
 * 🌳 VRIKSHA TAB - Family Tree Screen
 * ═══════════════════════════════════════════════════════════
 * 
 * FULLY LOCAL-FIRST IMPLEMENTATION:
 * ✓ No backend dependencies
 * ✓ Stunning animated visualization
 * ✓ Simple layman-friendly interface
 * ✓ Relationship visualization between any two members
 * ✓ Clean header with stats and + Add Member
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EnhancedFamilyTree,
  MemberDetailSheet,
  useVrikshaStore,
  type FamilyMember,
} from '../../src/features/vriksha';
import { VanshColors, VanshSpacing } from '../../src/theme';

// ═══════════════════════════════════════════════════════════
// MAIN SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function VrikshaScreen() {
  const insets = useSafeAreaInsets();

  const {
    members,
    rootMemberId,
    setRootMember,
    clearAll,
  } = useVrikshaStore();

  const [showProfile, setShowProfile] = useState(false);
  const [profileMember, setProfileMember] = useState<FamilyMember | null>(null);

  const membersList = Array.from(members.values());
  const totalMembers = membersList.length;
  const livingMembers = membersList.filter(m => m.isAlive).length;
  const deceasedMembers = totalMembers - livingMembers;
  const maleCount = membersList.filter(m => m.gender === 'male').length;
  const femaleCount = membersList.filter(m => m.gender === 'female').length;

  const handleMemberPress = useCallback((member: FamilyMember) => {
    setProfileMember(member);
    setShowProfile(true);
  }, []);

  const handleMemberLongPress = useCallback((_member: FamilyMember) => {
    // Long press on tree node opens quick-add relative modal (handled internally)
    // POV switch is available from the detail sheet's "View Tree from Here" button
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      '🗑️ Clear All Members?',
      'This will remove all family members from your tree. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAll();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        },
      ]
    );
  }, [clearAll]);

  return (
    <View style={styles.container}>
      {/* Member Detail Sheet Modal */}
      {profileMember && (
        <MemberDetailSheet
          member={profileMember}
          visible={showProfile}
          onClose={() => {
            setShowProfile(false);
            setProfileMember(null);
          }}
        />
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + VanshSpacing.sm }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>{'🌳'}</Text>
            <View>
              <Text style={styles.headerTitle}>{'Vriksha'}</Text>
              <Text style={styles.headerSubtitle}>{'Family Tree'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {totalMembers > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <MaterialIcons name="delete-outline" size={18} color={VanshColors.masi[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* ═══════════ STATS BAR ═══════════ */}
      {totalMembers > 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.statsBar}
        >
          <StatItem value={totalMembers} label="Total" color={VanshColors.masi[700]} />
          <StatDivider />
          <StatItem value={livingMembers} label="Living" emoji="🌿" color={VanshColors.chandan ? VanshColors.chandan[600] : '#16a34a'} />
          <StatDivider />
          <StatItem value={deceasedMembers} label="Deceased" emoji="🕯️" color={VanshColors.masi[500]} />
          <StatDivider />
          <StatItem value={maleCount} label="Male" emoji="👨" color="#3B82F6" />
          <StatDivider />
          <StatItem value={femaleCount} label="Female" emoji="👩" color="#EC4899" />
        </Animated.View>
      )}

      {/* ═══════════ FAMILY TREE ═══════════ */}
      <EnhancedFamilyTree
        onMemberPress={handleMemberPress}
        onMemberLongPress={handleMemberLongPress}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatItem({ value, label, emoji, color }: {
  value: number;
  label: string;
  emoji?: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>
        {emoji ? `${emoji} ${label}` : label}
      </Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },

  // Header
  header: {
    paddingHorizontal: VanshSpacing.lg,
    paddingBottom: VanshSpacing.sm,
    backgroundColor: VanshColors.suvarna[500],
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.xs,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: VanshSpacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
    zIndex: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.sm,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: VanshColors.masi[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: VanshColors.khadi[300],
  },
});
