/**
 * ⬇️ IMPORT TREE MODAL - Import via File or QR Code
 * ═══════════════════════════════════════════════════════════
 * 
 * Modern import flow:
 *   1. Choose: Import from File OR Scan QR Code
 *   2. Preview: shows tree name, member count, mode
 *   3. Identity: "Who are you in this tree?"
 *   4. Import: tree revolves around the selected person
 */

import { MaterialIcons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isFirebaseConfigured } from '../../config/firebase';
import { VanshColors, VanshRadius } from '../../theme';
import {
  decodeShareCode,
  importTreeFromFile,
  saveImportedTree,
  type SharePayload,
  type ShareToken
} from './share-service';
import { useVrikshaStore } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ImportTreeModalProps {
  visible: boolean;
  onClose: () => void;
  onImported: (token: ShareToken) => void;
}

type ImportStep = 'start' | 'scanning' | 'preview' | 'identity' | 'add-self';

interface RelationshipOption {
  label: string;
  type: 'parent' | 'child' | 'spouse' | 'sibling';
  icon: string;
}

const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { label: 'Son / Daughter', type: 'child', icon: '👶' },
  { label: 'Spouse / Partner', type: 'spouse', icon: '💍' },
  { label: 'Parent (Father / Mother)', type: 'parent', icon: '👨‍👩‍👦' },
  { label: 'Sibling (Brother / Sister)', type: 'sibling', icon: '👫' },
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function ImportTreeModal({ visible, onClose, onImported }: ImportTreeModalProps) {
  const insets = useSafeAreaInsets();
  const { members, importData, addMember, addRelation } = useVrikshaStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [step, setStep] = useState<ImportStep>('start');
  const [isLoading, setIsLoading] = useState(false);
  const [decodedPayload, setDecodedPayload] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // "I'm not in the tree" — add self flow
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'other'>('male');
  const [relatedToId, setRelatedToId] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipOption | null>(null);

  const currentMemberCount = Array.from(members.values()).length;

  // Handle QR scanner button press
  const handleOpenScanner = useCallback(async () => {
    if (!cameraPermission) return;

    if (!cameraPermission.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to scan QR codes.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setStep('scanning');
  }, [cameraPermission, requestCameraPermission]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep('start');
        setIsLoading(false);
        setDecodedPayload(null);
        setError(null);
        setSelectedIdentityId(null);
        setSearchQuery('');
        setNewFirstName('');
        setNewLastName('');
        setNewGender('male');
        setRelatedToId(null);
        setRelationshipType(null);
      }, 300);
    }
  }, [visible]);

  // ═══════════════════════════════════════════════════════════
  // IMPORT HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleImportFromFile = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const jsonText = await response.text();
      
      const payload = await importTreeFromFile(jsonText);

      if (!payload) {
        setError('Invalid tree file. Please make sure it\'s a valid Vansh family tree export.');
        setIsLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setDecodedPayload(payload);
      setIsLoading(false);
      setStep('preview');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(`Failed to import file: ${e?.message || 'Unknown error'}`);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const handleBarCodeScanned = useCallback(({ data }: BarcodeScanningResult) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);
      setError(null);

      const payload = decodeShareCode(data);

      if (!payload) {
        setError('Invalid QR code. Please scan a Vansh family tree QR code.');
        setIsLoading(false);
        setStep('start');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setDecodedPayload(payload);
      setIsLoading(false);
      setStep('preview');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(`Failed to scan code: ${e?.message || 'Unknown error'}`);
      setIsLoading(false);
      setStep('start');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  // Move to identity selection step
  const handleProceedToIdentity = useCallback(() => {
    if (!decodedPayload) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIdentityId(decodedPayload.data.rootMemberId || null);
    setStep('identity');
  }, [decodedPayload]);

  // Final import with selected identity
  const handleImportWithIdentity = useCallback(() => {
    if (!decodedPayload || !selectedIdentityId) return;

    const action = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      importData(decodedPayload.data.members, decodedPayload.data.relations, selectedIdentityId);
      saveImportedTree(decodedPayload);

      // Auto-join sync if the shared tree has a syncTreeId
      if (decodedPayload.syncTreeId && isFirebaseConfigured) {
        try {
          const { joinSync } = useVrikshaStore.getState();
          await joinSync(decodedPayload.syncTreeId, selectedIdentityId);
          console.log('[ImportTree] Auto-joined sync channel:', decodedPayload.syncTreeId);
        } catch (err) {
          console.warn('[ImportTree] Failed to join sync, tree imported locally:', err);
        }
      }

      const selectedMember = decodedPayload.data.members.find(m => m.id === selectedIdentityId);
      const name = selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : 'you';

      const syncNote = decodedPayload.syncTreeId && isFirebaseConfigured
        ? '\n\n🔄 This tree is synced — changes will update across all devices automatically!'
        : '';

      Alert.alert(
        '🌳 Welcome to Your Tree!',
        `The tree now revolves around ${name}.\n\n` +
        (decodedPayload.mode === 'invite_to_join'
          ? 'You can now add your own family members, update details, and grow the tree from your perspective!'
          : 'You can explore the tree from your perspective.') +
        syncNote,
      );
      onClose();
    };

    if (currentMemberCount > 0) {
      Alert.alert(
        'Replace Your Tree?',
        `You currently have ${currentMemberCount} members. Importing will replace your existing tree.\n\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace & Import', style: 'destructive', onPress: action },
        ],
      );
    } else {
      action();
    }
  }, [decodedPayload, selectedIdentityId, currentMemberCount, importData, onClose]);

  // "I'm not in the tree" — add yourself as a new member
  const handleAddSelfAndImport = useCallback(() => {
    if (!decodedPayload || !newFirstName.trim() || !relatedToId || !relationshipType) return;

    const action = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // First import the tree data
      importData(decodedPayload.data.members, decodedPayload.data.relations, relatedToId);
      saveImportedTree(decodedPayload);

      // Then add the new member (self)
      const newId = addMember({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        gender: newGender,
        isAlive: true,
        familyId: decodedPayload.data.members[0]?.familyId || 'fam',
      });

      // Add the relationship
      if (relationshipType.type === 'child') {
        addRelation(relatedToId, newId, 'parent');
      } else if (relationshipType.type === 'parent') {
        addRelation(newId, relatedToId, 'parent');
      } else if (relationshipType.type === 'spouse') {
        addRelation(relatedToId, newId, 'spouse');
      } else if (relationshipType.type === 'sibling') {
        addRelation(relatedToId, newId, 'sibling');
      }

      // Set new member as root
      const { setRootMember } = useVrikshaStore.getState();
      setRootMember(newId);

      // Auto-join sync if the shared tree has a syncTreeId
      if (decodedPayload.syncTreeId && isFirebaseConfigured) {
        try {
          const { joinSync } = useVrikshaStore.getState();
          await joinSync(decodedPayload.syncTreeId, newId);
          console.log('[ImportTree] Auto-joined sync (add-self):', decodedPayload.syncTreeId);
        } catch (err) {
          console.warn('[ImportTree] Failed to join sync:', err);
        }
      }

      const syncNote = decodedPayload.syncTreeId && isFirebaseConfigured
        ? '\n\n🔄 This tree is synced — updates will appear automatically!'
        : '';

      Alert.alert(
        '🎉 You\'ve Joined the Tree!',
        `Welcome, ${newFirstName}! The tree now revolves around you.\n\nYou can add your own family members and grow the tree!` + syncNote,
      );
      onClose();
    };

    if (currentMemberCount > 0) {
      Alert.alert(
        'Replace Your Tree?',
        `You currently have ${currentMemberCount} members. Importing will replace your tree.\n\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace & Join', style: 'destructive', onPress: action },
        ],
      );
    } else {
      action();
    }
  }, [decodedPayload, newFirstName, newLastName, newGender, relatedToId, relationshipType, currentMemberCount, importData, addMember, addRelation, onClose]);

  // Filtered members for identity/add-self search
  const filteredMembers = useCallback(() => {
    if (!decodedPayload) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return decodedPayload.data.members;
    return decodedPayload.data.members.filter(m =>
      m.firstName.toLowerCase().includes(q) ||
      (m.lastName || '').toLowerCase().includes(q)
    );
  }, [decodedPayload, searchQuery]);

  // ═══════════════════════════════════════════════════════════
  // RENDER STEPS
  // ═══════════════════════════════════════════════════════════

  const renderStartStep = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
      <View style={styles.heroIcon}>
        <MaterialIcons name="download" size={48} color={VanshColors.suvarna[600]} />
      </View>
      <Text style={styles.heroTitle}>Import Family Tree</Text>
      <Text style={styles.heroSubtitle}>
        Choose how you'd like to import a shared family tree
      </Text>

      <View style={styles.importOptions}>
        <Pressable style={styles.importOptionCard} onPress={handleImportFromFile}>
          <View style={[styles.importOptionIcon, { backgroundColor: '#EFF6FF' }]}>
            <MaterialIcons name="insert-drive-file" size={32} color="#3B82F6" />
          </View>
          <View style={styles.importOptionInfo}>
            <Text style={styles.importOptionTitle}>Import from File</Text>
            <Text style={styles.importOptionDesc}>
              Select a .json file you received via WhatsApp, email, etc.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[300]} />
        </Pressable>

        <Pressable style={styles.importOptionCard} onPress={handleOpenScanner}>
          <View style={[styles.importOptionIcon, { backgroundColor: '#F0FDF4' }]}>
            <MaterialIcons name="qr-code-2" size={32} color="#22C55E" />
          </View>
          <View style={styles.importOptionInfo}>
            <Text style={styles.importOptionTitle}>Scan QR Code</Text>
            <Text style={styles.importOptionDesc}>
              Scan a QR code displayed on another device
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[300]} />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderScanningStep = () => (
    <View style={styles.scannerContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerHeader}>
          <Pressable style={styles.scannerBackBtn} onPress={() => setStep('start')}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.scannerTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.scannerFrame} />
        <Text style={styles.scannerHint}>
          Position the QR code within the frame
        </Text>
      </View>
    </View>
  );

  const renderPreviewStep = () => {
    if (!decodedPayload) return null;

    const { members, relations } = decodedPayload.data;
    const modeLabel = decodedPayload.mode === 'view_only' ? 'View Only' : 'Editable';
    const modeColor = decodedPayload.mode === 'view_only' ? '#3B82F6' : '#22C55E';

    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.content}>
        <View style={styles.previewHeader}>
          <View style={[styles.modeBadge, { backgroundColor: modeColor + '18' }]}>
            <Text style={[styles.modeBadgeText, { color: modeColor }]}>{modeLabel}</Text>
          </View>
          <Text style={styles.previewTitle}>{decodedPayload.name}'s Family Tree</Text>
          <Text style={styles.previewMeta}>
            {members.length} members · {relations.length} relations
          </Text>
        </View>

        <View style={styles.previewStats}>
          <View style={styles.previewStat}>
            <MaterialIcons name="people" size={24} color={VanshColors.suvarna[600]} />
            <Text style={styles.previewStatLabel}>{members.length}</Text>
            <Text style={styles.previewStatText}>Members</Text>
          </View>
          <View style={styles.previewStat}>
            <MaterialIcons name="share" size={24} color={VanshColors.suvarna[600]} />
            <Text style={styles.previewStatLabel}>{relations.length}</Text>
            <Text style={styles.previewStatText}>Relations</Text>
          </View>
          <View style={styles.previewStat}>
            <MaterialIcons name={decodedPayload.mode === 'view_only' ? 'visibility' : 'edit'} size={24} color={modeColor} />
            <Text style={styles.previewStatLabel}>{modeLabel}</Text>
            <Text style={styles.previewStatText}>Mode</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => setStep('start')}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleProceedToIdentity}>
            <Text style={styles.primaryButtonText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderIdentityStep = () => {
    if (!decodedPayload) return null;

    const filtered = filteredMembers();

    return (
      <Animated.View entering={FadeIn.duration(200)} style={[styles.identityContainer, { flex: 1 }]}>
        <Text style={styles.identityTitle}>Who are you in this tree?</Text>
        <Text style={styles.identitySubtitle}>
          Select yourself so the tree revolves around you
        </Text>

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={VanshColors.masi[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor={VanshColors.masi[300]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={16} color={VanshColors.masi[400]} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedIdentityId;
            const genderColor = item.gender === 'male' ? '#3B82F6' : item.gender === 'female' ? '#EC4899' : '#9CA3AF';
            return (
              <Pressable
                style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                onPress={() => {
                  setSelectedIdentityId(item.id);
                  Haptics.selectionAsync();
                }}
              >
                <View style={[styles.memberAvatar, { backgroundColor: genderColor + '18' }]}>
                  <Text style={[styles.memberAvatarText, { color: genderColor }]}>
                    {item.firstName[0]}{(item.lastName || '')[0] || ''}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.firstName} {item.lastName || ''}</Text>
                  {item.occupation && <Text style={styles.memberDetail}>{item.occupation}</Text>}
                </View>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={24} color={VanshColors.suvarna[600]} />
                )}
              </Pressable>
            );
          }}
          style={styles.memberList}
          contentContainerStyle={styles.memberListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          }
          ListFooterComponent={
            <Pressable style={styles.notInTreeButton} onPress={() => setStep('add-self')}>
              <MaterialIcons name="person-add" size={20} color="#9333EA" />
              <Text style={styles.notInTreeText}>I'm not in this tree</Text>
</Pressable>
          }
        />

        <View style={styles.actionButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => setStep('preview')}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, !selectedIdentityId && styles.buttonDisabled]}
            onPress={handleImportWithIdentity}
            disabled={!selectedIdentityId}
          >
            <Text style={styles.primaryButtonText}>Import Tree</Text>
            <MaterialIcons name="check" size={18} color="#FFF" />
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderAddSelfStep = () => {
    if (!decodedPayload) return null;

    const filtered = filteredMembers();
    const canSubmit = newFirstName.trim() && relatedToId && relationshipType;

    return (
      <ScrollView style={styles.addSelfContainer} contentContainerStyle={styles.addSelfContent}>
        <Text style={styles.addSelfTitle}>Add Yourself to the Tree</Text>
        <Text style={styles.addSelfSubtitle}>
          Tell us your name, who you're related to, and your relationship
        </Text>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Your Name</Text>
          <TextInput
            style={styles.formInput}
            placeholder="First Name"
            placeholderTextColor={VanshColors.masi[300]}
            value={newFirstName}
            onChangeText={setNewFirstName}
          />
          <TextInput
            style={styles.formInput}
            placeholder="Last Name (optional)"
            placeholderTextColor={VanshColors.masi[300]}
            value={newLastName}
            onChangeText={setNewLastName}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Gender</Text>
          <View style={styles.genderButtons}>
            {(['male', 'female', 'other'] as const).map(g => (
              <Pressable
                key={g}
                style={[styles.genderButton, newGender === g && styles.genderButtonSelected]}
                onPress={() => setNewGender(g)}
              >
                <Text style={[styles.genderButtonText, newGender === g && styles.genderButtonTextSelected]}>
                  {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Your Relationship</Text>
          <View style={styles.relationshipOptions}>
            {RELATIONSHIP_OPTIONS.map(opt => (
              <Pressable
                key={opt.type}
                style={[styles.relationshipCard, relationshipType?.type === opt.type && styles.relationshipCardSelected]}
                onPress={() => setRelationshipType(opt)}
              >
                <Text style={styles.relationshipIcon}>{opt.icon}</Text>
                <Text style={styles.relationshipLabel}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {relationshipType && (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Relate to...</Text>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={VanshColors.masi[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members..."
                placeholderTextColor={VanshColors.masi[300]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.relateToList}>
              {filtered.slice(0, 5).map(member => (
                <Pressable
                  key={member.id}
                  style={[styles.relateToRow, relatedToId === member.id && styles.relateToRowSelected]}
                  onPress={() => {
                    setRelatedToId(member.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.relateToName}>{member.firstName} {member.lastName || ''}</Text>
                  {relatedToId === member.id && (
                    <MaterialIcons name="check-circle" size={20} color={VanshColors.suvarna[600]} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => setStep('identity')}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleAddSelfAndImport}
            disabled={!canSubmit}
          >
            <Text style={styles.primaryButtonText}>Join Tree</Text>
            <MaterialIcons name="check" size={18} color="#FFF" />
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={step === 'start' ? onClose : undefined} />

        {step !== 'scanning' && (
          <Animated.View
            entering={SlideInDown.duration(300).springify()}
            exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16, flex: 1 }]}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="download" size={22} color={VanshColors.suvarna[600]} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Import Family Tree</Text>
                <Text style={styles.headerSubtitle}>
                  {step === 'start' && 'Choose import method'}
                  {step === 'preview' && 'Review tree'}
                  {step === 'identity' && 'Select yourself'}
                  {step === 'add-self' && 'Join the tree'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <MaterialIcons name="close" size={20} color={VanshColors.masi[400]} />
              </TouchableOpacity>
            </View>

            {/* Content based on step */}
            <View style={{ flex: 1, overflow: 'hidden' }}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={VanshColors.suvarna[600]} />
                <Text style={styles.loadingText}>Loading tree...</Text>
              </View>
            ) : (
              <>
                {step === 'start' && renderStartStep()}
                {step === 'preview' && renderPreviewStep()}
                {step === 'identity' && renderIdentityStep()}
                {step === 'add-self' && renderAddSelfStep()}
              </>
            )}
            </View>
          </Animated.View>
        )}

        {step === 'scanning' && renderScanningStep()}
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
    maxHeight: '90%',
    minHeight: 400,
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
  content: { padding: 20, gap: 16 },
  
  // Start step
  heroIcon: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: VanshColors.suvarna[50],
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: VanshColors.masi[800],
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: VanshColors.masi[400],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  importOptions: { gap: 12 },
  importOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: VanshRadius.lg,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  importOptionIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  importOptionInfo: { flex: 1 },
  importOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: 4,
  },
  importOptionDesc: {
    fontSize: 13,
    color: VanshColors.masi[500],
    lineHeight: 18,
  },

  // Scanner
  scannerContainer: { flex: 1 },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  scannerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scannerFrame: {
    width: 250, height: 250,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scannerHint: {
    fontSize: 15,
    color: '#FFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  // Preview
  previewHeader: { alignItems: 'center', marginBottom: 20 },
  modeBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  modeBadgeText: { fontSize: 13, fontWeight: '600' },
  previewTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: VanshColors.masi[800],
    marginBottom: 6,
  },
  previewMeta: { fontSize: 14, color: VanshColors.masi[400] },
  previewStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  previewStat: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: VanshRadius.lg,
    alignItems: 'center',
    gap: 8,
  },
  previewStatLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  previewStatText: {
    fontSize: 12,
    color: VanshColors.masi[400],
  },

  // Identity
  identityContainer: { flex: 1, padding: 20 },
  identityTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
    marginBottom: 6,
  },
  identitySubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: VanshColors.masi[800],
    padding: 0,
  },
  memberList: { flex: 1 },
  memberListContent: { paddingBottom: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    backgroundColor: '#FAFAFA',
  },
  memberRowSelected: {
    backgroundColor: VanshColors.suvarna[50],
    borderWidth: 1.5,
    borderColor: VanshColors.suvarna[300],
  },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 16, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: VanshColors.masi[800] },
  memberDetail: { fontSize: 13, color: VanshColors.masi[400], marginTop: 2 },
  notInTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    backgroundColor: '#FAF5FF',
    gap: 8,
    marginTop: 12,
  },
  notInTreeText: { fontSize: 15, fontWeight: '600', color: '#9333EA' },

  // Add Self
  addSelfContainer: { flex: 1 },
  addSelfContent: { padding: 20, paddingBottom: 100 },
  addSelfTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
    marginBottom: 6,
  },
  addSelfSubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    marginBottom: 20,
  },
  formSection: { marginBottom: 20 },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[700],
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: VanshColors.masi[800],
    marginBottom: 8,
  },
  genderButtons: { flexDirection: 'row', gap: 8 },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[500],
  },
  genderButtonTextSelected: {
    color: VanshColors.suvarna[700],
  },
  relationshipOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relationshipCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    gap: 8,
  },
  relationshipCardSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  relationshipIcon: { fontSize: 32 },
  relationshipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[700],
    textAlign: 'center',
  },
  relateToList: { gap: 8, marginTop: 8 },
  relateToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  relateToRowSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  relateToName: { fontSize: 15, fontWeight: '600', color: VanshColors.masi[800] },

  // Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.masi[700],
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // States
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: VanshColors.masi[400],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: VanshColors.masi[400],
  },
});
