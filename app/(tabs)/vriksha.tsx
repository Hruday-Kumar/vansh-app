/**
 * VRIKSHA TAB - Family Tree Screen
 * Clean, modern interface for the family tree
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>Family Tree</Text>
              {isSynced && (
                <View style={styles.syncBadge}>
                  <MaterialIcons
                    name={isSyncPushing ? 'sync' : 'cloud-done'}
                    size={14}
                    color="#10B981"
                  />
                  <Text style={styles.syncBadgeText}>
                    {isSyncPushing ? 'Syncing…' : 'Synced'}
                  </Text>
                </View>
              )}
            </View>
            {totalMembers > 0 && (
              <Text style={styles.headerSubtitle}>
                {totalMembers} member{totalMembers !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <View style={styles.headerActions}>
            {/* Import button — always visible */}
            <Pressable
              style={styles.headerButton}
              onPress={() => setShowImportModal(true)}
              hitSlop={12}
            >
              <MaterialIcons name="download" size={20} color="#3B82F6" />
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
                  <MaterialIcons name="share" size={20} color={VanshColors.suvarna[600]} />
                </Pressable>
                <Pressable
                  style={styles.headerButton}
                  onPress={handleClearAll}
                  hitSlop={12}
                >
                  <MaterialIcons name="delete-outline" size={20} color={VanshColors.masi[400]} />
                </Pressable>
              </>
            )}
          </View>
        </View>
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
    backgroundColor: '#FAFAF9',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FAFAF9',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: VanshColors.masi[800],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: VanshColors.khadi[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: VanshColors.khadi[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
});
