/**
 * 🔗 SHARE TREE MODAL - Generate & Share Tree (v2)
 * ═══════════════════════════════════════════════════════════
 * 
 * Generates share codes (v2 compact format) and offers
 * multiple sharing methods:
 *   1. Text Code — small enough for WhatsApp/SMS (< 15 members)
 *   2. File Share — .vansh file as attachment (any size)
 *   3. Copy Code — clipboard for manual paste
 * 
 * Flow:
 *   1. Choose mode (View Only / Invite to Join)
 *   2. Code is generated instantly (no backend needed)
 *   3. Pick a sharing method
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VanshColors, VanshRadius } from '../../theme';
import {
    encodeTreeAsShareCode,
    shareTreeAsFile,
    shareTreeCode,
    type ShareMode
} from './share-service';
import { useVrikshaStore, type FamilyMember } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ShareTreeModalProps {
  visible: boolean;
  member: FamilyMember;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function ShareTreeModal({ visible, member, onClose }: ShareTreeModalProps) {
  const insets = useSafeAreaInsets();
  const { exportData } = useVrikshaStore();

  const [selectedMode, setSelectedMode] = useState<ShareMode | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isLargeTree, setIsLargeTree] = useState(false);

  const handleReset = useCallback(() => {
    setSelectedMode(null);
    setShareCode(null);
    setMemberCount(0);
    setIsLargeTree(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [onClose, handleReset]);

  const handleGenerateCode = useCallback((mode: ShareMode) => {
    setSelectedMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const exported = exportData();
      const code = encodeTreeAsShareCode({
        mode,
        memberName: `${member.firstName} ${member.lastName || ''}`.trim(),
        members: exported.members,
        relations: exported.relations,
        rootMemberId: member.id,
      });

      setShareCode(code);
      setMemberCount(exported.members.length);
      setIsLargeTree(exported.members.length >= 15);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[ShareTree] Failed to generate code:', error);
      Alert.alert('Error', 'Could not generate share code. Please try again.');
      handleReset();
    }
  }, [member, exportData, handleReset]);

  const handleShareViaSystem = useCallback(async () => {
    if (!shareCode || !selectedMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await shareTreeCode({
      shareCode,
      memberName: `${member.firstName} ${member.lastName || ''}`.trim(),
      memberCount,
      mode: selectedMode,
    });
  }, [shareCode, selectedMode, member, memberCount]);

  const handleShareAsFile = useCallback(async () => {
    if (!selectedMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const exported = exportData();
      const success = await shareTreeAsFile({
        mode: selectedMode,
        memberName: `${member.firstName} ${member.lastName || ''}`.trim(),
        members: exported.members,
        relations: exported.relations,
        rootMemberId: member.id,
      });
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('[ShareTree] File share failed:', error);
      Alert.alert('Error', 'Could not share as file. Please try sharing the code instead.');
    }
  }, [selectedMode, member, exportData]);

  const handleCopyCode = useCallback(async () => {
    if (!shareCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(shareCode);
    } catch {
      // Fallback: just alert
    }
    Alert.alert('Copied!', 'Share code has been copied to your clipboard.');
  }, [shareCode]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="share" size={22} color={VanshColors.suvarna[600]} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Share Family Tree</Text>
              <Text style={styles.headerSubtitle}>
                Centered on {member.firstName} {member.lastName || ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <MaterialIcons name="close" size={20} color={VanshColors.masi[400]} />
            </TouchableOpacity>
          </View>

          {/* ── STEP 1: Choose mode ── */}
          {!shareCode && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
              <Text style={styles.stepLabel}>Choose sharing mode:</Text>

              <Pressable
                style={[styles.modeCard, selectedMode === 'view_only' && styles.modeCardSelected]}
                onPress={() => handleGenerateCode('view_only')}
              >
                <View style={[styles.modeIcon, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="visibility" size={24} color="#3B82F6" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>View Only</Text>
                  <Text style={styles.modeDesc}>
                    Recipients can view the tree but cannot add or edit members.
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={VanshColors.masi[300]} />
              </Pressable>

              <Pressable
                style={[styles.modeCard, selectedMode === 'invite_to_join' && styles.modeCardSelected]}
                onPress={() => handleGenerateCode('invite_to_join')}
              >
                <View style={[styles.modeIcon, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialIcons name="person-add" size={24} color="#22C55E" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Invite to Edit</Text>
                  <Text style={styles.modeDesc}>
                    Recipients can view the tree AND add new family members of their own.
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={VanshColors.masi[300]} />
              </Pressable>
            </Animated.View>
          )}

          {/* ── STEP 2: Code generated ── */}
          {shareCode && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
              {/* Success badge */}
              <View style={styles.successBadge}>
                <MaterialIcons name="check-circle" size={20} color="#22C55E" />
                <Text style={styles.successText}>
                  {selectedMode === 'view_only' ? 'View-only' : 'Editable'} code ready!
                </Text>
              </View>

              {/* Large tree warning + file share recommendation */}
              {isLargeTree && (
                <View style={styles.fileTip}>
                  <MaterialIcons name="info-outline" size={16} color="#F59E0B" />
                  <Text style={styles.fileTipText}>
                    Large tree ({memberCount} members). Use "Send as File" for reliable sharing.
                  </Text>
                </View>
              )}

              {/* Code preview */}
              <View style={styles.codeBox}>
                <View style={styles.codeHeader}>
                  <MaterialIcons name="qr-code-2" size={16} color={VanshColors.suvarna[600]} />
                  <Text style={styles.codeLabel}>Share Code (v2 Compact)</Text>
                  <Text style={styles.codeSizeLabel}>
                    {(shareCode.length / 1024).toFixed(1)}KB
                  </Text>
                </View>
                <ScrollView style={styles.codeScroll} horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.codeText} selectable>{shareCode}</Text>
                </ScrollView>
              </View>

              {/* Sharing methods */}
              <Text style={styles.shareMethodsLabel}>Share via:</Text>

              <View style={styles.actionButtons}>
                <Pressable style={styles.shareButton} onPress={handleShareViaSystem}>
                  <MaterialIcons name="send" size={20} color="#FFF" />
                  <Text style={styles.shareButtonText}>Send Code</Text>
                </Pressable>

                <Pressable style={styles.copyButton} onPress={handleCopyCode}>
                  <MaterialIcons name="content-copy" size={20} color={VanshColors.suvarna[600]} />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </Pressable>
              </View>

              {/* File share option — shares actual file attachment */}
              <Pressable style={styles.fileShareButton} onPress={handleShareAsFile}>
                <View style={styles.fileShareIcon}>
                  <MaterialIcons name="attach-file" size={20} color="#3B82F6" />
                </View>
                <View style={styles.fileShareInfo}>
                  <Text style={styles.fileShareTitle}>Share as File 📎</Text>
                  <Text style={styles.fileShareDesc}>
                    Sends a .json file attachment — works with any app, never truncated
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={VanshColors.masi[300]} />
              </Pressable>

              {/* How it works */}
              <View style={styles.howItWorks}>
                <Text style={styles.howItWorksTitle}>How it works for the recipient</Text>
                <View style={styles.step}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                  <Text style={styles.stepText}>They open Vansh → Tree → tap Import (⬇)</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                  <Text style={styles.stepText}>They select "Who am I in this tree?"</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                  <Text style={styles.stepText}>
                    {selectedMode === 'view_only'
                      ? 'Tree revolves around them — view only'
                      : 'Tree revolves around them — they can add their own family'}
                  </Text>
                </View>
              </View>

              {/* Generate new code */}
              <TouchableOpacity style={styles.newCodeButton} onPress={handleReset}>
                <MaterialIcons name="refresh" size={16} color={VanshColors.suvarna[600]} />
                <Text style={styles.newCodeText}>Change Mode</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: VanshColors.khadi[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: VanshColors.suvarna[50],
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: VanshColors.masi[800] },
  headerSubtitle: { fontSize: 13, color: VanshColors.masi[400], marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  // Content
  content: { padding: 20, gap: 12 },
  stepLabel: {
    fontSize: 14, fontWeight: '600',
    color: VanshColors.masi[500],
    marginBottom: 4,
  },

  // Mode cards
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: VanshRadius.lg,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAF9',
    gap: 12,
  },
  modeCardSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  modeIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: 16, fontWeight: '700', color: VanshColors.masi[800] },
  modeDesc: { fontSize: 13, color: VanshColors.masi[500], marginTop: 3, lineHeight: 18 },

  // Success
  successBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, gap: 8,
    alignSelf: 'flex-start',
  },
  successText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },

  // Code box
  codeBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  codeLabel: { fontSize: 13, fontWeight: '600', color: VanshColors.masi[600], flex: 1 },
  codeSizeLabel: { fontSize: 11, color: VanshColors.masi[400] },
  codeScroll: { maxHeight: 60, paddingHorizontal: 14, paddingVertical: 10 },
  codeText: { fontSize: 11, color: VanshColors.masi[500], fontFamily: 'monospace' },

  // Actions
  actionButtons: { flexDirection: 'row', gap: 10 },
  shareButton: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: 14, borderRadius: VanshRadius.lg,
    gap: 8,
  },
  shareButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  copyButton: {
    flex: 0.6, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[50],
    borderWidth: 1.5, borderColor: VanshColors.suvarna[200],
    paddingVertical: 14, borderRadius: VanshRadius.lg,
    gap: 8,
  },
  copyButtonText: { fontSize: 15, fontWeight: '600', color: VanshColors.suvarna[600] },

  // Share methods label
  shareMethodsLabel: {
    fontSize: 13, fontWeight: '600',
    color: VanshColors.masi[500],
    marginTop: 2,
  },

  // File share option
  fileShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: VanshRadius.lg,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    backgroundColor: '#F0F7FF',
    gap: 12,
  },
  fileShareIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
  },
  fileShareInfo: { flex: 1 },
  fileShareTitle: { fontSize: 15, fontWeight: '700', color: '#1D4ED8' },
  fileShareDesc: { fontSize: 12, color: '#60A5FA', marginTop: 2, lineHeight: 16 },

  // Large tree tip
  fileTip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  fileTipText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },

  // How it works
  howItWorks: {
    backgroundColor: '#F9FAFB',
    padding: 14, borderRadius: 12,
    gap: 10,
  },
  howItWorksTitle: {
    fontSize: 13, fontWeight: '700', color: VanshColors.masi[600],
    marginBottom: 2,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNumber: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { fontSize: 11, fontWeight: '700', color: VanshColors.suvarna[700] },
  stepText: { flex: 1, fontSize: 12, color: VanshColors.masi[500], lineHeight: 17 },

  // New code
  newCodeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  newCodeText: { fontSize: 13, fontWeight: '600', color: VanshColors.suvarna[600] },
});
