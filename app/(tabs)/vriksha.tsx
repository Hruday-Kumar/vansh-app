/**
 * VRIKSHA TAB - Family Tree Screen
 * Heritage-themed family tree with creative visual design
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    EnhancedFamilyTree,
    ImportTreeModal,
    MemberDetailSheet,
    ShareTreeModal,
    SharedTreeView,
    useVrikshaStore,
    type FamilyMember,
    type ShareToken,
} from '../../src/features/vriksha';
import { VanshColors } from '../../src/theme';

export default function VrikshaScreen() {
  const insets = useSafeAreaInsets();

  const {
    members,
    rootMemberId,
    importData,
    clearAll,
    isSynced,
    isSyncPushing,
  } = useVrikshaStore();

  const [showProfile, setShowProfile] = useState(false);
  const [profileMember, setProfileMember] = useState<FamilyMember | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Shared tree preview state
  const [sharedToken, setSharedToken] = useState<ShareToken | null>(null);
  const [showSharedTree, setShowSharedTree] = useState(false);

  const membersList = Array.from(members.values());
  const totalMembers = membersList.length;

  const handleMemberPress = useCallback((member: FamilyMember) => {
    setProfileMember(member);
    setShowProfile(true);
  }, []);

  const handleMemberLongPress = useCallback((_member: FamilyMember) => {
    // Long press handled internally by EnhancedFamilyTree
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Members?',
      'This will remove all family members from your tree. This cannot be undone.',
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

  // Called when ImportTreeModal decodes a code and user taps "Preview Tree"
  const handleTreeImported = useCallback((token: ShareToken) => {
    setSharedToken(token);
    setShowSharedTree(true);
  }, []);

  // Called when user taps "Import & Add Members" from SharedTreeView
  const handleImportFromPreview = useCallback(() => {
    if (!sharedToken?.treeSnapshot) return;

    const { members: treeMems, relations } = sharedToken.treeSnapshot;
    const currentCount = Array.from(members.values()).length;

    const doImport = () => {
      importData(treeMems, relations);
      setShowSharedTree(false);
      setSharedToken(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Tree Imported! 🌳',
        `${treeMems.length} family members have been added. You can now add your own family members!`,
      );
    };

    if (currentCount > 0) {
      Alert.alert(
        'Replace Your Tree?',
        `You currently have ${currentCount} members. Importing will replace your tree with ${treeMems.length} members.\n\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace & Import', style: 'destructive', onPress: doImport },
        ],
      );
    } else {
      doImport();
    }
  }, [sharedToken, members, importData]);

  // Compute generation count (rough: count unique y-level groups)
  const generationCount = totalMembers > 0 ? Math.max(1, Math.ceil(Math.log2(totalMembers + 1))) : 0;

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

      {/* Heritage Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ zIndex: 10 }}
      >
        <LinearGradient
          colors={[VanshColors.masi[900], VanshColors.masi[800], '#3D2B1B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          {/* Decorative watermark */}
          <Text style={styles.watermark}>🌳</Text>

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerLabel}>वंश वृक्ष</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.headerTitle}>Family Tree</Text>
                {isSynced && (
                  <View style={styles.syncBadge}>
                    <MaterialIcons
                      name={isSyncPushing ? 'sync' : 'cloud-done'}
                      size={12}
                      color={VanshColors.suvarna[400]}
                    />
                    <Text style={styles.syncBadgeText}>
                      {isSyncPushing ? 'Syncing…' : 'Synced'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Import button */}
              <Pressable
                style={styles.headerButton}
                onPress={() => setShowImportModal(true)}
                hitSlop={12}
              >
                <MaterialIcons name="download" size={18} color={VanshColors.suvarna[300]} />
              </Pressable>

              {totalMembers > 0 && (
                <>
                  <Pressable
                    style={styles.headerButton}
                    onPress={() => {
                      const rootMember = rootMemberId ? members.get(rootMemberId) : membersList[0];
                      if (rootMember) {
                        setProfileMember(rootMember);
                        setShowShareModal(true);
                      }
                    }}
                    hitSlop={12}
                  >
                    <MaterialIcons name="share" size={18} color={VanshColors.suvarna[300]} />
                  </Pressable>
                  <Pressable
                    style={styles.headerButton}
                    onPress={handleClearAll}
                    hitSlop={12}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={VanshColors.masi[400]} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Stats strip */}
          {totalMembers > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.statsRow}>
              <View style={styles.statPill}>
                <MaterialIcons name="people" size={13} color={VanshColors.suvarna[400]} />
                <Text style={styles.statValue}>{totalMembers}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statPill}>
                <MaterialIcons name="layers" size={13} color={VanshColors.padma[300]} />
                <Text style={styles.statValue}>{generationCount}</Text>
                <Text style={styles.statLabel}>Generations</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statPill}>
                <MaterialIcons name="favorite" size={13} color={VanshColors.sindoor[400]} />
                <Text style={styles.statValue}>{membersList.filter(m => m.isAlive).length}</Text>
                <Text style={styles.statLabel}>Living</Text>
              </View>
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Family Tree */}
      <EnhancedFamilyTree
        onMemberPress={handleMemberPress}
        onMemberLongPress={handleMemberLongPress}
      />

      {/* Share Tree Modal */}
      {profileMember && (
        <ShareTreeModal
          visible={showShareModal}
          member={profileMember}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Import Tree Modal */}
      <ImportTreeModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={handleTreeImported}
      />

      {/* Shared Tree Preview */}
      <SharedTreeView
        visible={showSharedTree}
        shareToken={sharedToken}
        onClose={() => {
          setShowSharedTree(false);
          setSharedToken(null);
        }}
        onImportTree={handleImportFromPreview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -10,
    top: 10,
    fontSize: 80,
    opacity: 0.06,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontSize: 11,
    color: VanshColors.suvarna[400],
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: VanshColors.khadi[50],
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: VanshColors.suvarna[400],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: VanshColors.khadi[50],
  },
  statLabel: {
    fontSize: 11,
    color: VanshColors.masi[400],
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 4,
  },
});
