/**
 * ⬇️ IMPORT TREE MODAL - Import a Shared Family Tree (v2)
 * ═══════════════════════════════════════════════════════════
 * 
 * Lets the user paste a VANSH share code (v1 or v2) received
 * via WhatsApp, SMS, email, etc. 
 * 
 * Flow:
 *   1. Paste or auto-read code from clipboard
 *   2. Preview: shows tree name, member count, mode
 *   3. "Who are you?" — select yourself OR add yourself as new
 *   4. Import: tree revolves around the selected person
 *      Recipient can then add their own family members
 */

import { MaterialIcons } from '@expo/vector-icons';
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

import { VanshColors, VanshRadius } from '../../theme';
import {
    decodeShareCode,
    payloadToShareToken,
    saveImportedTree,
    type SharePayload,
    type ShareToken,
} from './share-service';
import { useVrikshaStore } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ImportTreeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called when a tree is imported; provides ShareToken for SharedTreeView */
  onImported: (token: ShareToken) => void;
}

type ImportStep = 'paste' | 'preview' | 'identity' | 'add-self';

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP OPTIONS for "I'm not in the tree"
// ═══════════════════════════════════════════════════════════

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

  const [step, setStep] = useState<ImportStep>('paste');
  const [codeInput, setCodeInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
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

  // Auto-paste from clipboard when modal opens
  useEffect(() => {
    if (visible) {
      tryReadClipboard();
    }
    return () => {
      setStep('paste');
      setCodeInput('');
      setDecodedPayload(null);
      setError(null);
      setIsDecoding(false);
      setSelectedIdentityId(null);
      setSearchQuery('');
      setNewFirstName('');
      setNewLastName('');
      setNewGender('male');
      setRelatedToId(null);
      setRelationshipType(null);
    };
  }, [visible]);

  const tryReadClipboard = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      const text = await Clipboard.getStringAsync();
      if (text && (text.includes('VANSH:1:') || text.includes('VANSH:2:'))) {
        setCodeInput(text);
        // Auto-decode
        handleDecode(text);
      }
    } catch {
      // Clipboard not available — user will paste manually
    }
  };

  const handleDecode = useCallback((rawCode?: string) => {
    const code = rawCode || codeInput;
    if (!code.trim()) {
      setError('Please paste a share code.');
      return;
    }

    setIsDecoding(true);
    setError(null);

    // Use setTimeout to let the UI update
    setTimeout(() => {
      try {
        const payload = decodeShareCode(code);

        if (!payload) {
          // Provide diagnostic info to help debug
          const trimmed = code.trim();
          const hasV1 = trimmed.includes('VANSH:1:');
          const hasV2 = trimmed.includes('VANSH:2:');
          const prefix = hasV2 ? 'v2' : hasV1 ? 'v1' : 'none';
          
          setError(
            `Could not decode the share code.\n\n` +
            `Format detected: ${prefix} | Length: ${trimmed.length} chars\n\n` +
            `Make sure you copied the ENTIRE code (it starts with VANSH: and can be very long). ` +
            `Try selecting all text in the message and pasting again.`
          );
          setIsDecoding(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }

        setDecodedPayload(payload);
        setIsDecoding(false);
        setStep('preview');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e: any) {
        setError(`Decode error: ${e?.message || 'Unknown error'}. Please try copying the code again.`);
        setIsDecoding(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 100);
  }, [codeInput]);

  const handlePreviewTree = useCallback(() => {
    if (!decodedPayload) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Build a ShareToken and send to SharedTreeView
    const token = payloadToShareToken(decodedPayload);
    saveImportedTree(decodedPayload); // Save to history
    onImported(token);
    onClose();
  }, [decodedPayload, onImported, onClose]);

  // Move to identity selection step
  const handleProceedToIdentity = useCallback(() => {
    if (!decodedPayload) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Pre-select the root member (the sharer)
    setSelectedIdentityId(decodedPayload.data.rootMemberId || null);
    setStep('identity');
  }, [decodedPayload]);

  // Final import with selected identity
  const handleImportWithIdentity = useCallback(() => {
    if (!decodedPayload || !selectedIdentityId) return;

    const action = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      importData(decodedPayload.data.members, decodedPayload.data.relations, selectedIdentityId);
      saveImportedTree(decodedPayload);

      const selectedMember = decodedPayload.data.members.find(m => m.id === selectedIdentityId);
      const name = selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : 'you';

      Alert.alert(
        '🌳 Welcome to Your Tree!',
        `The tree now revolves around ${name}.\n\n` +
        (decodedPayload.mode === 'invite_to_join'
          ? 'You can now add your own family members, update details, and grow the tree from your perspective!'
          : 'You can explore the tree from your perspective.'),
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

    const action = () => {
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
      // relationshipType.type is what the NEW person is TO the existing person
      // e.g., if type='child', the new person is a child of relatedToId
      if (relationshipType.type === 'child') {
        addRelation(relatedToId, newId, 'parent');
      } else if (relationshipType.type === 'parent') {
        addRelation(newId, relatedToId, 'parent');
      } else if (relationshipType.type === 'spouse') {
        addRelation(relatedToId, newId, 'spouse');
      } else if (relationshipType.type === 'sibling') {
        addRelation(relatedToId, newId, 'sibling');
      }

      // Set the new person as root so tree revolves around them
      const { setRootMember } = useVrikshaStore.getState();
      setRootMember(newId);

      Alert.alert(
        '🌳 Welcome to Your Tree!',
        `You've been added to the family tree as ${newFirstName}!\n\n` +
        'The tree now revolves around you. Add more family members to grow the tree from your perspective!',
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
  }, [decodedPayload, newFirstName, newLastName, newGender, relatedToId, relationshipType, currentMemberCount, importData, addMember, addRelation, onClose]);

  const handleReset = useCallback(() => {
    setStep('paste');
    setCodeInput('');
    setDecodedPayload(null);
    setError(null);
    setSelectedIdentityId(null);
    setSearchQuery('');
    setNewFirstName('');
    setNewLastName('');
    setNewGender('male');
    setRelatedToId(null);
    setRelationshipType(null);
  }, []);

  // Filter members for identity selection
  const filteredMembers = decodedPayload?.data.members.filter(m => {
    if (!searchQuery.trim()) return true;
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

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
              <MaterialIcons
                name={step === 'identity' ? 'person-search' : 'download'}
                size={22}
                color={step === 'identity' ? VanshColors.suvarna[600] : '#3B82F6'}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                {step === 'paste' ? 'Import Shared Tree' :
                  step === 'preview' ? 'Tree Preview' :
                    step === 'add-self' ? 'Add Yourself' :
                      'Who Are You?'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {step === 'paste' ? 'Paste a share code to import' :
                  step === 'preview' ? 'Review and continue' :
                    step === 'add-self' ? 'Tell us about yourself' :
                      'Select yourself from this tree'}
              </Text>
            </View>
            {step !== 'paste' && step !== 'identity' && step !== 'add-self' && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('paste')}>
                <MaterialIcons name="arrow-back" size={18} color={VanshColors.masi[500]} />
              </TouchableOpacity>
            )}
            {(step === 'identity' || step === 'add-self') && (
              <TouchableOpacity style={styles.backBtn} onPress={() => step === 'add-self' ? setStep('identity') : setStep('preview')}>
                <MaterialIcons name="arrow-back" size={18} color={VanshColors.masi[500]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={VanshColors.masi[400]} />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step !== 'paste' && styles.stepDotCompleted]} />
            <View style={[styles.stepLine, step !== 'paste' && styles.stepLineActive]} />
            <View style={[styles.stepDot, (step === 'identity' || step === 'add-self') && styles.stepDotCompleted]} />
            <View style={[styles.stepLine, (step === 'identity' || step === 'add-self') && styles.stepLineActive]} />
            <View style={[styles.stepDot, styles.stepDotFinal]} />
          </View>

          {/* ── STEP 1: Paste code ── */}
          {step === 'paste' && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
              <Text style={styles.stepLabel}>Paste share code:</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.codeInput}
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="VANSH:2:eyJhb2..."
                  placeholderTextColor={VanshColors.masi[300]}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                />
                {codeInput.length > 0 && (
                  <TouchableOpacity style={styles.clearInput} onPress={() => setCodeInput('')}>
                    <MaterialIcons name="close" size={16} color={VanshColors.masi[400]} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Paste from clipboard button */}
              <TouchableOpacity style={styles.pasteButton} onPress={() => tryReadClipboard()}>
                <MaterialIcons name="content-paste" size={16} color={VanshColors.suvarna[600]} />
                <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
              </TouchableOpacity>

              {/* Error */}
              {error && (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Decode button */}
              <Pressable
                style={[styles.decodeButton, !codeInput.trim() && styles.decodeButtonDisabled]}
                onPress={() => handleDecode()}
                disabled={!codeInput.trim() || isDecoding}
              >
                {isDecoding ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" />
                    <Text style={styles.decodeButtonText}>Decode Share Code</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* ── STEP 2: Preview decoded tree ── */}
          {step === 'preview' && decodedPayload && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
              {/* Success */}
              <View style={styles.successBadge}>
                <MaterialIcons name="check-circle" size={20} color="#22C55E" />
                <Text style={styles.successText}>Code decoded successfully!</Text>
              </View>

              {/* Tree info card */}
              <View style={styles.treeInfoCard}>
                <View style={styles.treeInfoHeader}>
                  <View style={styles.treeInfoIcon}>
                    <Text style={styles.treeInfoEmoji}>🌳</Text>
                  </View>
                  <View style={styles.treeInfoContent}>
                    <Text style={styles.treeInfoName}>{decodedPayload.name}'s Family Tree</Text>
                    <Text style={styles.treeInfoMeta}>
                      {decodedPayload.data.members.length} members • Shared {formatTimeAgo(decodedPayload.ts)}
                    </Text>
                  </View>
                </View>

                <View style={styles.treeInfoBadges}>
                  <View style={[
                    styles.modeBadge,
                    { backgroundColor: decodedPayload.mode === 'view_only' ? '#EFF6FF' : '#F0FDF4' }
                  ]}>
                    <MaterialIcons
                      name={decodedPayload.mode === 'view_only' ? 'visibility' : 'edit'}
                      size={14}
                      color={decodedPayload.mode === 'view_only' ? '#3B82F6' : '#22C55E'}
                    />
                    <Text style={[
                      styles.modeBadgeText,
                      { color: decodedPayload.mode === 'view_only' ? '#3B82F6' : '#22C55E' }
                    ]}>
                      {decodedPayload.mode === 'view_only' ? 'View Only' : 'Can Edit & Add'}
                    </Text>
                  </View>
                </View>

                {/* Member preview list */}
                <View style={styles.memberPreview}>
                  {decodedPayload.data.members.slice(0, 4).map((m, i) => (
                    <View key={m.id || i} style={styles.memberChip}>
                      <View style={[styles.memberAvatar, {
                        backgroundColor: m.gender === 'male' ? '#EFF6FF' : '#FDF2F8'
                      }]}>
                        <Text style={styles.memberAvatarText}>
                          {m.firstName?.charAt(0) || '?'}
                        </Text>
                      </View>
                      <Text style={styles.memberChipName} numberOfLines={1}>
                        {m.firstName}
                      </Text>
                    </View>
                  ))}
                  {decodedPayload.data.members.length > 4 && (
                    <View style={styles.moreChip}>
                      <Text style={styles.moreChipText}>
                        +{decodedPayload.data.members.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <Pressable style={styles.previewButton} onPress={handlePreviewTree}>
                  <MaterialIcons name="visibility" size={20} color="#FFF" />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </Pressable>

                <Pressable style={styles.importButton} onPress={handleProceedToIdentity}>
                  <MaterialIcons name="person-add" size={20} color="#FFF" />
                  <Text style={styles.importButtonTextPrimary}>Import & Join</Text>
                </Pressable>
              </View>

              {/* Try another code */}
              <TouchableOpacity style={styles.tryAnotherButton} onPress={handleReset}>
                <MaterialIcons name="refresh" size={16} color={VanshColors.suvarna[600]} />
                <Text style={styles.tryAnotherText}>Try Another Code</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 3: Claim Identity ── */}
          {step === 'identity' && decodedPayload && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.identityContent}>
              {/* Intro */}
              <View style={styles.identityIntro}>
                <Text style={styles.identityIntroEmoji}>🪞</Text>
                <Text style={styles.identityIntroText}>
                  Who are you in this family tree? The tree will revolve around you so you can easily add your own family members.
                </Text>
              </View>

              {/* Search */}
              <View style={styles.identitySearchContainer}>
                <MaterialIcons name="search" size={18} color={VanshColors.masi[400]} />
                <TextInput
                  style={styles.identitySearchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name..."
                  placeholderTextColor={VanshColors.masi[300]}
                />
              </View>

              {/* Member list */}
              <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.id}
                style={styles.identityList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedIdentityId === item.id;
                  const isSharer = item.id === decodedPayload.data.rootMemberId;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.identityItem,
                        isSelected && styles.identityItemSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedIdentityId(item.id);
                      }}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.identityAvatar, {
                        backgroundColor: isSelected
                          ? (item.gender === 'male' ? '#3B82F6' : '#EC4899')
                          : (item.gender === 'male' ? '#EFF6FF' : '#FDF2F8'),
                      }]}>
                        <Text style={[styles.identityAvatarText, isSelected && { color: '#FFF' }]}>
                          {item.firstName?.charAt(0) || '?'}
                        </Text>
                      </View>
                      <View style={styles.identityInfo}>
                        <Text style={[styles.identityName, isSelected && styles.identityNameSelected]}>
                          {item.firstName} {item.lastName}
                        </Text>
                        <Text style={styles.identityMeta}>
                          {item.gender === 'male' ? '👨' : item.gender === 'female' ? '👩' : '🧑'}
                          {' '}{item.birthPlace ? ` • ${item.birthPlace}` : ''}
                          {isSharer ? ' • 👑 Shared by' : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.identityCheck}>
                          <MaterialIcons name="check-circle" size={24} color={VanshColors.suvarna[500]} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptySearch}>
                    <Text style={styles.emptySearchText}>No members found</Text>
                  </View>
                }
                ListFooterComponent={
                  decodedPayload.mode === 'invite_to_join' ? (
                    <TouchableOpacity
                      style={styles.notInTreeButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSelectedIdentityId(null);
                        setStep('add-self');
                      }}
                    >
                      <View style={styles.notInTreeIcon}>
                        <MaterialIcons name="person-add" size={20} color="#8B5CF6" />
                      </View>
                      <View style={styles.notInTreeInfo}>
                        <Text style={styles.notInTreeTitle}>I'm not in this tree</Text>
                        <Text style={styles.notInTreeDesc}>Add yourself as a new family member</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={VanshColors.masi[300]} />
                    </TouchableOpacity>
                  ) : null
                }
              />

              {/* Confirm button */}
              <Pressable
                style={[
                  styles.confirmIdentityButton,
                  !selectedIdentityId && styles.confirmIdentityButtonDisabled,
                ]}
                onPress={handleImportWithIdentity}
                disabled={!selectedIdentityId}
              >
                <MaterialIcons name="check" size={22} color="#FFF" />
                <Text style={styles.confirmIdentityText}>
                  {selectedIdentityId
                    ? `Continue as ${decodedPayload.data.members.find(m => m.id === selectedIdentityId)?.firstName || '...'}`
                    : 'Select yourself above'}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── STEP 4: Add Yourself (not in tree) ── */}
          {step === 'add-self' && decodedPayload && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.identityContent}>
              {/* Intro */}
              <View style={styles.identityIntro}>
                <Text style={styles.identityIntroEmoji}>🙋</Text>
                <Text style={styles.identityIntroText}>
                  Add yourself to the tree! Tell us your name, what's your relation, and who you're related to.
                </Text>
              </View>

              <ScrollView style={styles.addSelfScroll} showsVerticalScrollIndicator={false}>
                {/* Name inputs */}
                <Text style={styles.addSelfLabel}>Your Name</Text>
                <View style={styles.nameRow}>
                  <TextInput
                    style={[styles.nameInput, { flex: 1 }]}
                    value={newFirstName}
                    onChangeText={setNewFirstName}
                    placeholder="First name *"
                    placeholderTextColor={VanshColors.masi[300]}
                  />
                  <TextInput
                    style={[styles.nameInput, { flex: 1 }]}
                    value={newLastName}
                    onChangeText={setNewLastName}
                    placeholder="Last name"
                    placeholderTextColor={VanshColors.masi[300]}
                  />
                </View>

                {/* Gender */}
                <Text style={styles.addSelfLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {(['male', 'female', 'other'] as const).map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderOption, newGender === g && styles.genderOptionSelected]}
                      onPress={() => setNewGender(g)}
                    >
                      <Text style={styles.genderEmoji}>
                        {g === 'male' ? '👨' : g === 'female' ? '👩' : '🧑'}
                      </Text>
                      <Text style={[styles.genderText, newGender === g && styles.genderTextSelected]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Relationship type */}
                <Text style={styles.addSelfLabel}>I am a...</Text>
                <View style={styles.relationOptions}>
                  {RELATIONSHIP_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.type}
                      style={[
                        styles.relationOption,
                        relationshipType?.type === opt.type && styles.relationOptionSelected,
                      ]}
                      onPress={() => setRelationshipType(opt)}
                    >
                      <Text style={styles.relationEmoji}>{opt.icon}</Text>
                      <Text style={[
                        styles.relationText,
                        relationshipType?.type === opt.type && styles.relationTextSelected,
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Related to whom */}
                {relationshipType && (
                  <Animated.View entering={FadeInDown.duration(200)}>
                    <Text style={styles.addSelfLabel}>
                      ...of which person in the tree?
                    </Text>
                    <View style={styles.relatedToList}>
                      {decodedPayload.data.members.map(m => {
                        const isSelected = relatedToId === m.id;
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={[styles.relatedToItem, isSelected && styles.relatedToItemSelected]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setRelatedToId(m.id);
                            }}
                          >
                            <Text style={styles.relatedToEmoji}>
                              {m.gender === 'male' ? '👨' : m.gender === 'female' ? '👩' : '🧑'}
                            </Text>
                            <Text style={[styles.relatedToName, isSelected && styles.relatedToNameSelected]} numberOfLines={1}>
                              {m.firstName} {m.lastName}
                            </Text>
                            {isSelected && <MaterialIcons name="check" size={16} color={VanshColors.suvarna[600]} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>
                )}
              </ScrollView>

              {/* Confirm button */}
              <Pressable
                style={[
                  styles.confirmIdentityButton,
                  (!newFirstName.trim() || !relatedToId || !relationshipType) && styles.confirmIdentityButtonDisabled,
                ]}
                onPress={handleAddSelfAndImport}
                disabled={!newFirstName.trim() || !relatedToId || !relationshipType}
              >
                <MaterialIcons name="person-add" size={22} color="#FFF" />
                <Text style={styles.confirmIdentityText}>
                  {newFirstName.trim() && relatedToId && relationshipType
                    ? `Join as ${newFirstName.trim()}`
                    : 'Fill in the details above'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
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
    maxHeight: '92%',
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: VanshColors.masi[800] },
  headerSubtitle: { fontSize: 13, color: VanshColors.masi[400], marginTop: 2 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  stepDotCompleted: {
    backgroundColor: VanshColors.suvarna[500],
  },
  stepDotFinal: {
    backgroundColor: '#E5E7EB',
  },
  stepLine: {
    width: 32, height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: VanshColors.suvarna[500],
  },

  // Content
  content: { padding: 20, gap: 14 },
  stepLabel: {
    fontSize: 14, fontWeight: '600',
    color: VanshColors.masi[500],
    marginBottom: 2,
  },

  // Input
  inputContainer: { position: 'relative' },
  codeInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    paddingRight: 40,
    fontSize: 13,
    fontFamily: 'monospace',
    color: VanshColors.masi[700],
    minHeight: 80,
    maxHeight: 120,
  },
  clearInput: {
    position: 'absolute', top: 12, right: 12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },

  // Paste button
  pasteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  pasteButtonText: { fontSize: 13, fontWeight: '600', color: VanshColors.suvarna[600] },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', lineHeight: 18 },

  // Decode button
  decodeButton: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14, borderRadius: VanshRadius.lg,
    gap: 8,
  },
  decodeButtonDisabled: { opacity: 0.4 },
  decodeButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Success
  successBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, gap: 8,
    alignSelf: 'flex-start',
  },
  successText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },

  // Tree info card
  treeInfoCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    gap: 12,
  },
  treeInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  treeInfoIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: VanshColors.suvarna[50],
    alignItems: 'center', justifyContent: 'center',
  },
  treeInfoEmoji: { fontSize: 24 },
  treeInfoContent: { flex: 1 },
  treeInfoName: { fontSize: 16, fontWeight: '700', color: VanshColors.masi[800] },
  treeInfoMeta: { fontSize: 12, color: VanshColors.masi[400], marginTop: 3 },

  // Badges
  treeInfoBadges: { flexDirection: 'row', gap: 8 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  modeBadgeText: { fontSize: 12, fontWeight: '600' },

  // Member preview
  memberPreview: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingTop: 4,
  },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  memberAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 10, fontWeight: '700', color: VanshColors.masi[600] },
  memberChipName: { fontSize: 12, fontWeight: '600', color: VanshColors.masi[600], maxWidth: 60 },
  moreChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: VanshColors.suvarna[50],
  },
  moreChipText: { fontSize: 12, fontWeight: '700', color: VanshColors.suvarna[600] },

  // Action buttons
  actionButtons: { flexDirection: 'row', gap: 10 },
  previewButton: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: VanshColors.masi[500],
    paddingVertical: 14, borderRadius: VanshRadius.lg,
    gap: 8,
  },
  previewButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  importButton: {
    flex: 1.4, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: 14, borderRadius: VanshRadius.lg,
    gap: 8,
  },
  importButtonTextPrimary: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Try another
  tryAnotherButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  tryAnotherText: { fontSize: 13, fontWeight: '600', color: VanshColors.suvarna[600] },

  // ═══════════ IDENTITY SELECTION ═══════════
  identityContent: {
    padding: 16,
    flex: 1,
    maxHeight: 500,
  },
  identityIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VanshColors.suvarna[50],
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 12,
  },
  identityIntroEmoji: { fontSize: 28 },
  identityIntroText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: VanshColors.masi[700],
    lineHeight: 20,
  },

  // Search
  identitySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  identitySearchInput: {
    flex: 1,
    fontSize: 14,
    color: VanshColors.masi[700],
    padding: 0,
  },

  // Member list
  identityList: {
    flex: 1,
    marginBottom: 12,
  },
  identityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: '#FAFAF9',
  },
  identityItemSelected: {
    backgroundColor: VanshColors.suvarna[50],
    borderWidth: 1.5,
    borderColor: VanshColors.suvarna[300],
  },
  identityAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  identityAvatarText: {
    fontSize: 16, fontWeight: '700', color: VanshColors.masi[600],
  },
  identityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  identityName: {
    fontSize: 15, fontWeight: '600', color: VanshColors.masi[700],
  },
  identityNameSelected: {
    color: VanshColors.suvarna[700],
    fontWeight: '700',
  },
  identityMeta: {
    fontSize: 12, color: VanshColors.masi[400], marginTop: 2,
  },
  identityCheck: {
    marginLeft: 8,
  },

  // Confirm button
  confirmIdentityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: 16,
    borderRadius: VanshRadius.lg,
    gap: 8,
  },
  confirmIdentityButtonDisabled: {
    opacity: 0.4,
  },
  confirmIdentityText: {
    fontSize: 16, fontWeight: '700', color: '#FFF',
  },

  // Empty search
  emptySearch: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: VanshColors.masi[400],
  },

  // ═══════════ "NOT IN TREE" BUTTON ═══════════
  notInTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    gap: 12,
  },
  notInTreeIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  notInTreeInfo: { flex: 1 },
  notInTreeTitle: { fontSize: 15, fontWeight: '700', color: '#7C3AED' },
  notInTreeDesc: { fontSize: 12, color: '#A78BFA', marginTop: 2 },

  // ═══════════ ADD SELF FORM ═══════════
  addSelfScroll: {
    flex: 1,
    marginBottom: 12,
  },
  addSelfLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[500],
    marginTop: 14,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: VanshColors.masi[700],
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  genderOptionSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  genderEmoji: { fontSize: 16 },
  genderText: { fontSize: 13, fontWeight: '600', color: VanshColors.masi[500] },
  genderTextSelected: { color: VanshColors.suvarna[700] },

  // Relationship picker
  relationOptions: {
    gap: 6,
  },
  relationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  relationOptionSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50],
  },
  relationEmoji: { fontSize: 18 },
  relationText: { fontSize: 14, fontWeight: '600', color: VanshColors.masi[600] },
  relationTextSelected: { color: VanshColors.suvarna[700] },

  // Related-to list
  relatedToList: {
    gap: 4,
    marginBottom: 16,
  },
  relatedToItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FAFAF9',
  },
  relatedToItemSelected: {
    backgroundColor: VanshColors.suvarna[50],
    borderWidth: 1,
    borderColor: VanshColors.suvarna[300],
  },
  relatedToEmoji: { fontSize: 16 },
  relatedToName: { flex: 1, fontSize: 14, fontWeight: '600', color: VanshColors.masi[600] },
  relatedToNameSelected: { color: VanshColors.suvarna[700] },
});
