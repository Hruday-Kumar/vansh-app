/**
 * 📤 SHARE TREE MODAL - Modern File + QR Sharing
 * ═══════════════════════════════════════════════════════════
 * 
 * New approach: NO text copy/paste! Only:
 *   1. QR Code — instant visual transfer
 *   2. File Share — .json attachment for WhatsApp/email
 * 
 * Flow:
 *   1. Choose mode (View Only / Invite to Join)
 *   2. Choose method (QR or File)
 *   3. Share!
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isFirebaseConfigured } from './tree-sync-service';
import { VanshColors, VanshRadius } from '../../theme';
import {
    encodeTreeAsShareCode,
    shareTreeAsFile,
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

type ShareStep = 'mode' | 'method' | 'qr';

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function ShareTreeModal({ visible, member, onClose }: ShareTreeModalProps) {
  const insets = useSafeAreaInsets();
  const { exportData, isSynced, syncTreeId, enableSync } = useVrikshaStore();

  const [step, setStep] = useState<ShareStep>('mode');
  const [selectedMode, setSelectedMode] = useState<ShareMode | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [qrFeasible, setQrFeasible] = useState(false);
  const qrRef = useRef<any>(null);

  // QR codes can hold ~2,900 alphanumeric chars max
  const QR_MAX_LENGTH = 2900;

  const handleReset = useCallback(() => {
    setStep('mode');
    setSelectedMode(null);
    setShareCode(null);
    setMemberCount(0);
    setQrFeasible(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [onClose, handleReset]);

  // Generate QR code data + auto-enable sync
  const handleSelectMode = useCallback(async (mode: ShareMode) => {
    setSelectedMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const exported = exportData();

      // Auto-publish to Firebase for live sync (if not already synced)
      let currentSyncTreeId = syncTreeId;
      if (isFirebaseConfigured && !isSynced) {
        const treeName = `${member.firstName} ${member.lastName || ''}`.trim();
        currentSyncTreeId = await enableSync(treeName, member.id);
        console.log('[ShareTree] Auto-enabled sync:', currentSyncTreeId);
      }

      const code = encodeTreeAsShareCode({
        mode,
        memberName: `${member.firstName} ${member.lastName || ''}`.trim(),
        members: exported.members,
        relations: exported.relations,
        rootMemberId: member.id,
        syncTreeId: currentSyncTreeId || undefined,
      });

      setShareCode(code);
      setMemberCount(exported.members.length);
      setQrFeasible(code.length <= QR_MAX_LENGTH);
      setStep('method');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[ShareTree] Failed to generate code:', error);
      Alert.alert('Error', 'Could not prepare sharing. Please try again.');
      handleReset();
    }
  }, [member, exportData, handleReset, isSynced, syncTreeId, enableSync]);

  // Show QR code
  const handleShowQR = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('qr');
  }, []);

  // Share as file
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
        syncTreeId: syncTreeId || undefined,
      });
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Shared!', 'Tree file has been shared. The recipient can import it using the Import button.');
        handleClose();
      }
    } catch (error) {
      console.error('[ShareTree] File share failed:', error);
      Alert.alert('Error', 'Could not share file. Please try again.');
    }
  }, [selectedMode, member, exportData, handleClose]);

  // ═══════════════════════════════════════════════════════════
  // RENDER STEPS
  // ═══════════════════════════════════════════════════════════

  const renderModeStep = () => (
    <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
      <View style={styles.heroIcon}>
        <MaterialIcons name="share" size={40} color={VanshColors.suvarna[600]} />
      </View>
      <Text style={styles.heroTitle}>Share Family Tree</Text>
      <Text style={styles.heroSubtitle}>
        Centered on {member.firstName} {member.lastName || ''}
      </Text>

      <Text style={styles.stepLabel}>Choose sharing permissions:</Text>

      <Pressable
        style={styles.modeCard}
        onPress={() => handleSelectMode('view_only')}
      >
        <View style={[styles.modeIcon, { backgroundColor: '#EFF6FF' }]}>
          <MaterialIcons name="visibility" size={28} color="#3B82F6" />
        </View>
        <View style={styles.modeInfo}>
          <Text style={styles.modeTitle}>View Only</Text>
          <Text style={styles.modeDesc}>
            Recipients can view the tree but cannot add or edit members.
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[300]} />
      </Pressable>

      <Pressable
        style={styles.modeCard}
        onPress={() => handleSelectMode('invite_to_join')}
      >
        <View style={[styles.modeIcon, { backgroundColor: '#F0FDF4' }]}>
          <MaterialIcons name="group-add" size={28} color="#22C55E" />
        </View>
        <View style={styles.modeInfo}>
          <Text style={styles.modeTitle}>Invite to Join</Text>
          <Text style={styles.modeDesc}>
            Recipients can add themselves and edit the tree from their perspective.
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[300]} />
      </Pressable>
    </Animated.View>
  );

  const renderMethodStep = () => (
    <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
      <View style={styles.previewHeader}>
        <View style={[
          styles.modeBadge,
          { backgroundColor: selectedMode === 'view_only' ? '#EFF6FF' : '#F0FDF4' }
        ]}>
          <Text style={[
            styles.modeBadgeText,
            { color: selectedMode === 'view_only' ? '#3B82F6' : '#22C55E' }
          ]}>
            {selectedMode === 'view_only' ? 'View Only' : 'Invite to Join'}
          </Text>
        </View>
        <Text style={styles.previewTitle}>
          {member.firstName}&apos;s Family Tree
        </Text>
        <Text style={styles.previewMeta}>{memberCount} members</Text>
      </View>

      <Text style={styles.stepLabel}>Choose sharing method:</Text>

      <Pressable
        style={[styles.methodCard, !qrFeasible && styles.methodCardDisabled]}
        onPress={qrFeasible ? handleShowQR : undefined}
        disabled={!qrFeasible}
      >
        <View style={[styles.methodIcon, { backgroundColor: qrFeasible ? '#F3E8FF' : '#F3F4F6' }]}>
          <MaterialIcons name="qr-code-2" size={32} color={qrFeasible ? '#9333EA' : '#9CA3AF'} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={[styles.methodTitle, !qrFeasible && styles.methodTitleDisabled]}>
            Show QR Code
          </Text>
          <Text style={styles.methodDesc}>
            {qrFeasible
              ? `Instant scan transfer (${shareCode?.length?.toLocaleString() ?? '?'} chars)`
              : `Tree too large for QR (${memberCount} members, ${shareCode?.length?.toLocaleString() ?? '?'} chars). Use file sharing instead.`}
          </Text>
        </View>
        {qrFeasible
          ? <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[300]} />
          : <MaterialIcons name="block" size={22} color="#D1D5DB" />
        }
      </Pressable>

      <Pressable style={styles.methodCard} onPress={handleShareAsFile}>
        <View style={[styles.methodIcon, { backgroundColor: '#DBEAFE' }]}>
          <MaterialIcons name="insert-drive-file" size={32} color="#3B82F6" />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>Share as File</Text>
          <Text style={styles.methodDesc}>
            Send a .json file via WhatsApp, email, or any app
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[300]} />
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => setStep('mode')}>
        <MaterialIcons name="arrow-back" size={18} color={VanshColors.masi[600]} />
        <Text style={styles.backButtonText}>Change Permissions</Text>
      </Pressable>
    </Animated.View>
  );

  const renderQRStep = () => {
    if (!shareCode) return null;

    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.qrContainer}>
        <View style={styles.qrHeader}>
          <Pressable style={styles.qrBackBtn} onPress={() => setStep('method')}>
            <MaterialIcons name="arrow-back" size={24} color={VanshColors.masi[700]} />
          </Pressable>
          <Text style={styles.qrTitle}>Scan to Import</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.qrContent}>
          <View style={styles.qrCard}>
            <QRCode
              value={shareCode}
              size={240}
              color={VanshColors.masi[800]}
              backgroundColor="#FFF"
              logoMargin={2}
              logoSize={40}
              quietZone={16}
              getRef={(c) => (qrRef.current = c)}
            />
          </View>

          <View style={styles.qrInfo}>
            <View style={[
              styles.qrModeBadge,
              { backgroundColor: selectedMode === 'view_only' ? '#EFF6FF' : '#F0FDF4' }
            ]}>
              <Text style={[
                styles.qrModeBadgeText,
                { color: selectedMode === 'view_only' ? '#3B82F6' : '#22C55E' }
              ]}>
                {selectedMode === 'view_only' ? 'View Only' : 'Invite to Join'}
              </Text>
            </View>
            <Text style={styles.qrInfoTitle}>
              {member.firstName}&apos;s Family Tree
            </Text>
            <Text style={styles.qrInfoMeta}>{memberCount} members</Text>
          </View>

          <View style={styles.qrInstructions}>
            <View style={styles.qrInstructionRow}>
              <View style={styles.qrInstructionNumber}>
                <Text style={styles.qrInstructionNumberText}>1</Text>
              </View>
              <Text style={styles.qrInstructionText}>
                Open Vansh app on the recipient&apos;s device
              </Text>
            </View>
            <View style={styles.qrInstructionRow}>
              <View style={styles.qrInstructionNumber}>
                <Text style={styles.qrInstructionNumberText}>2</Text>
              </View>
              <Text style={styles.qrInstructionText}>
                Tap Import → Scan QR Code
              </Text>
            </View>
            <View style={styles.qrInstructionRow}>
              <View style={styles.qrInstructionNumber}>
                <Text style={styles.qrInstructionNumberText}>3</Text>
              </View>
              <Text style={styles.qrInstructionText}>
                Point camera at this QR code
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            step === 'qr' && styles.sheetQR
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header (non-QR steps) */}
          {step !== 'qr' && (
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="share" size={22} color={VanshColors.suvarna[600]} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Share Family Tree</Text>
                <Text style={styles.headerSubtitle}>
                  {step === 'mode' && 'Choose permissions'}
                  {step === 'method' && 'Choose method'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <MaterialIcons name="close" size={20} color={VanshColors.masi[400]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 'mode' && renderModeStep()}
            {step === 'method' && renderMethodStep()}
            {step === 'qr' && renderQRStep()}
          </ScrollView>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: 400,
  },
  sheetQR: {
    maxHeight: '90%',
    minHeight: 500,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: VanshColors.khadi[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  scrollView: { flex: 1 },
  scrollViewContent: { flexGrow: 1 },

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
  content: { padding: 20, gap: 16 },

  // Hero (mode step)
  heroIcon: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: VanshColors.suvarna[50],
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: VanshColors.masi[800],
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: VanshColors.masi[400],
    textAlign: 'center',
    marginBottom: 20,
  },

  // Step labels
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[600],
    marginBottom: 8,
  },

  // Mode cards
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: VanshRadius.lg,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  modeIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  modeInfo: { flex: 1 },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 13,
    color: VanshColors.masi[500],
    lineHeight: 18,
  },

  // Preview (method step)
  previewHeader: { alignItems: 'center', marginBottom: 20 },
  modeBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  modeBadgeText: { fontSize: 13, fontWeight: '600' },
  previewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
    marginBottom: 4,
  },
  previewMeta: { fontSize: 14, color: VanshColors.masi[400] },

  // Method cards
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: VanshRadius.lg,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  methodIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  methodInfo: { flex: 1 },
  methodTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: 4,
  },
  methodTitleDisabled: {
    color: VanshColors.masi[400],
  },
  methodCardDisabled: {
    opacity: 0.6,
    borderColor: '#E5E7EB',
  },
  methodDesc: {
    fontSize: 14,
    color: VanshColors.masi[500],
    lineHeight: 19,
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[600],
  },

  // QR Step
  qrContainer: { flex: 1 },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qrBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  qrContent: {
    padding: 24,
    alignItems: 'center',
    gap: 24,
  },
  qrCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  qrInfo: { alignItems: 'center', gap: 6 },
  qrModeBadge: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 14,
  },
  qrModeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  qrInfoTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: VanshColors.masi[800],
    marginTop: 4,
  },
  qrInfoMeta: {
    fontSize: 14,
    color: VanshColors.masi[400],
  },

  // Instructions
  qrInstructions: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  qrInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  qrInstructionNumber: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInstructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
  },
  qrInstructionText: {
    flex: 1,
    fontSize: 14,
    color: VanshColors.masi[700],
    lineHeight: 20,
    paddingTop: 4,
  },
});
