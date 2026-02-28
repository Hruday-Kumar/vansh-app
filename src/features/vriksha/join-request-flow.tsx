/**
 * 📋 JOIN REQUEST FLOW - Quick-Add Wizard for Recipients
 * ═══════════════════════════════════════════════════════════
 * 
 * When a recipient opens an "invite_to_join" share link,
 * they can fill in their details and submit a request
 * to be added to the family tree.
 * 
 * Works locally (persists via AsyncStorage) AND with backend.
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VanshColors, VanshRadius } from '../../theme';

// JoinRequest submission is now handled locally (no backend needed)
async function submitJoinRequest(_params: {
  shareTokenId: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  message?: string;
}) {
  // Stub — join requests are no longer needed since recipients
  // can import trees directly. Kept for backwards compatibility.
  return { id: `jr_${Date.now()}`, status: 'pending' };
}

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface JoinRequestFlowProps {
  visible: boolean;
  shareTokenId: string;
  familyName?: string; // For display (e.g., the shared member's name)
  onClose: () => void;
  onSuccess?: () => void;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function JoinRequestFlow({ visible, shareTokenId, familyName, onClose, onSuccess }: JoinRequestFlowProps) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canSubmit = name.trim().length >= 2;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await submitJoinRequest({
        shareTokenId,
        requesterName: name.trim(),
        requesterEmail: email.trim() || undefined,
        requesterPhone: phone.trim() || undefined,
        message: message.trim() || undefined,
      });

      setIsSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[JoinRequest] Submit failed:', error);
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, shareTokenId, name, email, phone, message]);

  const handleClose = useCallback(() => {
    if (isSubmitted && onSuccess) onSuccess();
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    onClose();
  }, [isSubmitted, onSuccess, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* ── SUCCESS STATE ── */}
          {isSubmitted ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialIcons name="check-circle" size={48} color="#22C55E" />
              </View>
              <Text style={styles.successTitle}>Request Sent!</Text>
              <Text style={styles.successDesc}>
                Your request to join {familyName ? `${familyName}'s family tree` : 'this family tree'} has been submitted.
                You'll be notified when it's reviewed.
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* ── FORM STATE ── */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <MaterialIcons name="person-add" size={22} color="#22C55E" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Join Family Tree</Text>
                  <Text style={styles.headerSubtitle}>
                    {familyName ? `Request to join ${familyName}'s tree` : 'Request to join this family tree'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <MaterialIcons name="close" size={20} color={VanshColors.masi[400]} />
                </TouchableOpacity>
              </View>

              {/* Form fields */}
              <Animated.View entering={FadeInDown.delay(100)} style={styles.formSection}>
                {/* Name (required) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Your Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor={VanshColors.masi[300]}
                    autoCapitalize="words"
                    autoFocus
                  />
                </View>

                {/* Email (optional) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com (optional)"
                    placeholderTextColor={VanshColors.masi[300]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Phone (optional) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210 (optional)"
                    placeholderTextColor={VanshColors.masi[300]}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Message (optional) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="How are you related to the family? (optional)"
                    placeholderTextColor={VanshColors.masi[300]}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </Animated.View>

              {/* Info note */}
              <View style={styles.infoNote}>
                <MaterialIcons name="info-outline" size={14} color={VanshColors.masi[400]} />
                <Text style={styles.infoNoteText}>
                  The tree owner will review your request. Only share information you're comfortable with.
                </Text>
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>Send Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
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
  content: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    marginBottom: 6,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F0FDF4',
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

  // Form
  formSection: { gap: 14, paddingTop: 10 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: VanshColors.masi[600] },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: VanshColors.masi[800],
  },
  textArea: { minHeight: 80, paddingTop: 12 },

  // Info note
  infoNote: {
    flexDirection: 'row', gap: 6,
    backgroundColor: '#F9FAFB',
    padding: 12, borderRadius: 10,
    marginTop: 14,
  },
  infoNoteText: { flex: 1, fontSize: 12, color: VanshColors.masi[500], lineHeight: 17 },

  // Submit
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16, borderRadius: VanshRadius.lg,
    marginTop: 16, marginBottom: 10, gap: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Success
  successContainer: {
    alignItems: 'center', padding: 40, gap: 12,
  },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '800', color: VanshColors.masi[800] },
  successDesc: {
    fontSize: 14, color: VanshColors.masi[500],
    textAlign: 'center', lineHeight: 20,
  },
  doneButton: {
    backgroundColor: VanshColors.suvarna[500],
    paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: VanshRadius.lg, marginTop: 12,
  },
  doneButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
