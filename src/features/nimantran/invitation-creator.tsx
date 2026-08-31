/**
 * 🪷 INVITATION CREATOR - Create & send invitations to family
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../state';
import { VanshColors } from '../../theme';
import type { CeremonyType, InvitationMediaType, MemberId, NimantranReminder } from '../../types';

interface InvitationCreatorProps {
  onClose: () => void;
  onCreated: (invitationData: any) => void;
}

const ceremonyTypes: { type: CeremonyType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { type: 'wedding', label: 'Wedding', icon: 'favorite' },
  { type: 'engagement', label: 'Engagement', icon: 'diamond' },
  { type: 'housewarming', label: 'Housewarming', icon: 'home' },
  { type: 'baby_shower', label: 'Baby Shower', icon: 'child-care' },
  { type: 'birthday', label: 'Birthday', icon: 'cake' },
  { type: 'anniversary', label: 'Anniversary', icon: 'celebration' },
  { type: 'puja', label: 'Puja', icon: 'self-improvement' },
  { type: 'mundan', label: 'Mundan', icon: 'content-cut' },
  { type: 'thread_ceremony', label: 'Thread Ceremony', icon: 'auto-awesome' },
  { type: 'naming_ceremony', label: 'Naming Ceremony', icon: 'badge' },
  { type: 'graduation', label: 'Graduation', icon: 'school' },
  { type: 'retirement', label: 'Retirement', icon: 'beach-access' },
  { type: 'reunion', label: 'Reunion', icon: 'groups' },
  { type: 'festival', label: 'Festival', icon: 'festival' },
  { type: 'other', label: 'Other', icon: 'event' },
];

const reminderOptions = [
  { label: '1 day before', days: 1 },
  { label: '3 days before', days: 3 },
  { label: '7 days before', days: 7 },
  { label: '14 days before', days: 14 },
  { label: '30 days before', days: 30 },
];

export function InvitationCreator({ onClose, onCreated }: InvitationCreatorProps) {
  const insets = useSafeAreaInsets();
  const { membersList } = useFamilyStore();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>('wedding');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [mediaType, setMediaType] = useState<InvitationMediaType>('card');
  const [cardUri, setCardUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<MemberId>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<Set<number>>(new Set([1, 7]));
  const [dressCode, setDressCode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [step, setStep] = useState(0); // 0: details, 1: media, 2: recipients, 3: reminders

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setCardUri(result.assets[0].uri);
    }
  };

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(membersList.map((m) => m.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleMember = (id: MemberId) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(id)) {
      newSet.delete(id);
      setSelectAll(false);
    } else {
      newSet.add(id);
      if (newSet.size === membersList.length) setSelectAll(true);
    }
    setSelectedMembers(newSet);
  };

  const toggleReminder = (days: number) => {
    const newSet = new Set(selectedReminders);
    if (newSet.has(days)) {
      newSet.delete(days);
    } else {
      newSet.add(days);
    }
    setSelectedReminders(newSet);
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please enter a title for the invitation');
      return false;
    }
    if (!venue.trim()) {
      Alert.alert('Missing Info', 'Please enter the venue');
      return false;
    }
    if (!eventDate.trim()) {
      Alert.alert('Missing Info', 'Please enter the event date (YYYY-MM-DD)');
      return false;
    }
    if (selectedMembers.size === 0) {
      Alert.alert('No Recipients', 'Please select at least one family member to invite');
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validate()) return;

    const reminders: NimantranReminder[] = Array.from(selectedReminders).map((days) => ({
      id: `rem_${days}`,
      type: 'before_event' as const,
      daysBefore: days,
      sent: false,
    }));

    const invitationData = {
      title: title.trim(),
      description: description.trim() || undefined,
      ceremonyType,
      venue: venue.trim(),
      venueAddress: venueAddress.trim() || undefined,
      eventDate: eventDate.trim(),
      eventTime: eventTime.trim() || undefined,
      mediaType,
      cardUri: cardUri || undefined,
      videoUri: videoUri || undefined,
      recipientIds: Array.from(selectedMembers),
      reminders,
      dressCode: dressCode.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
    };

    onCreated(invitationData);
  };

  const totalSteps = 4;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose} hitSlop={12}>
          <MaterialIcons name="close" size={22} color={VanshColors.masi[700]} />
        </Pressable>
        <Text style={styles.headerTitle}>New Invitation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {['Event Details', 'Invitation Media', 'Select Recipients', 'Reminders & Extras'][step]}
      </Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ──── STEP 0: Event Details ──── */}
          {step === 0 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul & Priya's Wedding"
                placeholderTextColor={VanshColors.masi[300]}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Ceremony Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.chipRow}>
                  {ceremonyTypes.map((ct) => (
                    <Pressable
                      key={ct.type}
                      style={[
                        styles.chip,
                        ceremonyType === ct.type && styles.chipActive,
                      ]}
                      onPress={() => setCeremonyType(ct.type)}
                    >
                      <MaterialIcons
                        name={ct.icon}
                        size={16}
                        color={ceremonyType === ct.type ? '#FFF' : VanshColors.masi[500]}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          ceremonyType === ct.type && styles.chipTextActive,
                        ]}
                      >
                        {ct.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Tell your family about this occasion..."
                placeholderTextColor={VanshColors.masi[300]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Venue *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Taj Palace, New Delhi"
                placeholderTextColor={VanshColors.masi[300]}
                value={venue}
                onChangeText={setVenue}
              />

              <Text style={styles.label}>Venue Address</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Full address for navigation..."
                placeholderTextColor={VanshColors.masi[300]}
                value={venueAddress}
                onChangeText={setVenueAddress}
                multiline
                numberOfLines={2}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2026-03-15"
                    placeholderTextColor={VanshColors.masi[300]}
                    value={eventDate}
                    onChangeText={setEventDate}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10:00 AM"
                    placeholderTextColor={VanshColors.masi[300]}
                    value={eventTime}
                    onChangeText={setEventTime}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ──── STEP 1: Media ──── */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={styles.label}>Invitation Type</Text>
              <View style={styles.mediaTypeRow}>
                {(['card', 'video', 'both'] as InvitationMediaType[]).map((mt) => (
                  <Pressable
                    key={mt}
                    style={[styles.mediaTypeButton, mediaType === mt && styles.mediaTypeActive]}
                    onPress={() => setMediaType(mt)}
                  >
                    <MaterialIcons
                      name={mt === 'card' ? 'image' : mt === 'video' ? 'videocam' : 'collections'}
                      size={24}
                      color={mediaType === mt ? '#FFF' : VanshColors.masi[500]}
                    />
                    <Text style={[styles.mediaTypeText, mediaType === mt && styles.mediaTypeTextActive]}>
                      {mt === 'card' ? 'Card' : mt === 'video' ? 'Video' : 'Both'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(mediaType === 'card' || mediaType === 'both') && (
                <View style={styles.mediaSection}>
                  <Text style={styles.label}>Invitation Card</Text>
                  {cardUri ? (
                    <View style={styles.mediaPreview}>
                      <Image source={{ uri: cardUri }} style={styles.previewImage} resizeMode="cover" />
                      <Pressable style={styles.removeMedia} onPress={() => setCardUri(null)}>
                        <MaterialIcons name="close" size={18} color="#FFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.uploadArea} onPress={handlePickImage}>
                      <MaterialIcons name="add-photo-alternate" size={40} color={VanshColors.masi[300]} />
                      <Text style={styles.uploadText}>Upload Invitation Card</Text>
                      <Text style={styles.uploadHint}>JPG, PNG supported</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {(mediaType === 'video' || mediaType === 'both') && (
                <View style={styles.mediaSection}>
                  <Text style={styles.label}>Invitation Video</Text>
                  {videoUri ? (
                    <View style={styles.mediaPreview}>
                      <View style={styles.videoPreviewPlaceholder}>
                        <MaterialIcons name="play-circle-filled" size={48} color={VanshColors.suvarna[500]} />
                        <Text style={styles.videoPreviewText}>Video Selected</Text>
                      </View>
                      <Pressable style={styles.removeMedia} onPress={() => setVideoUri(null)}>
                        <MaterialIcons name="close" size={18} color="#FFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.uploadArea} onPress={handlePickVideo}>
                      <MaterialIcons name="video-library" size={40} color={VanshColors.masi[300]} />
                      <Text style={styles.uploadText}>Upload Invitation Video</Text>
                      <Text style={styles.uploadHint}>MP4, MOV supported</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* ──── STEP 2: Recipients ──── */}
          {step === 2 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Pressable style={styles.selectAllButton} onPress={handleSelectAll}>
                <MaterialIcons
                  name={selectAll ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={selectAll ? VanshColors.suvarna[600] : VanshColors.masi[400]}
                />
                <Text style={styles.selectAllText}>
                  Select All Family Members ({membersList.length})
                </Text>
              </Pressable>

              <View style={styles.membersList}>
                {membersList.map((member) => {
                  const isSelected = selectedMembers.has(member.id);
                  return (
                    <Pressable
                      key={member.id}
                      style={[styles.memberItem, isSelected && styles.memberItemSelected]}
                      onPress={() => toggleMember(member.id)}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.firstName?.[0] || '?'}
                          {member.lastName?.[0] || ''}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {member.firstName} {member.lastName}
                        </Text>
                        {member.currentCity && (
                          <Text style={styles.memberCity}>{member.currentCity}</Text>
                        )}
                      </View>
                      <MaterialIcons
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                        size={22}
                        color={isSelected ? VanshColors.suvarna[600] : VanshColors.masi[300]}
                      />
                    </Pressable>
                  );
                })}
              </View>

              {membersList.length === 0 && (
                <View style={styles.noMembers}>
                  <MaterialIcons name="people-outline" size={40} color={VanshColors.masi[300]} />
                  <Text style={styles.noMembersText}>
                    No family members found. Add members to your family tree first.
                  </Text>
                </View>
              )}

              <Text style={styles.selectedCount}>
                {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
              </Text>
            </Animated.View>
          )}

          {/* ──── STEP 3: Reminders & Extras ──── */}
          {step === 3 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={styles.sectionTitle}>Send Reminders</Text>
              <Text style={styles.sectionHint}>
                Automatic notifications will be sent to all recipients before the event
              </Text>

              <View style={styles.remindersList}>
                {reminderOptions.map((opt) => {
                  const isSelected = selectedReminders.has(opt.days);
                  return (
                    <Pressable
                      key={opt.days}
                      style={[styles.reminderItem, isSelected && styles.reminderItemActive]}
                      onPress={() => toggleReminder(opt.days)}
                    >
                      <MaterialIcons
                        name={isSelected ? 'notifications-active' : 'notifications-none'}
                        size={20}
                        color={isSelected ? VanshColors.suvarna[600] : VanshColors.masi[400]}
                      />
                      <Text style={[styles.reminderText, isSelected && styles.reminderTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Additional Details</Text>

              <Text style={styles.label}>Dress Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Traditional / Formal"
                placeholderTextColor={VanshColors.masi[300]}
                value={dressCode}
                onChangeText={setDressCode}
              />

              <Text style={styles.label}>Special Instructions</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Any special notes for guests..."
                placeholderTextColor={VanshColors.masi[300]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor={VanshColors.masi[300]}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 80, 96) }]}>
        {step > 0 && (
          <Pressable style={styles.prevButton} onPress={() => setStep((s) => s - 1)}>
            <MaterialIcons name="arrow-back" size={20} color={VanshColors.masi[600]} />
            <Text style={styles.prevButtonText}>Back</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />
        {step < totalSteps - 1 ? (
          <Pressable style={styles.nextButton} onPress={() => setStep((s) => s + 1)}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </Pressable>
        ) : (
          <Pressable style={styles.createButton} onPress={handleCreate}>
            <MaterialIcons name="send" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Send Invitation</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.khadi[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: VanshColors.khadi[200],
  },
  progressDotActive: {
    backgroundColor: VanshColors.suvarna[500],
  },
  stepLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[500],
    marginTop: 8,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: VanshColors.masi[600],
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: VanshColors.masi[800],
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipScroll: {
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
  },
  chipActive: {
    backgroundColor: VanshColors.suvarna[500],
    borderColor: VanshColors.suvarna[500],
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[600],
  },
  chipTextActive: {
    color: '#FFF',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  // Media step
  mediaTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  mediaTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: VanshColors.khadi[200],
  },
  mediaTypeActive: {
    backgroundColor: VanshColors.suvarna[500],
    borderColor: VanshColors.suvarna[500],
  },
  mediaTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[600],
    marginTop: 4,
  },
  mediaTypeTextActive: {
    color: '#FFF',
  },
  mediaSection: {
    marginTop: 8,
  },
  uploadArea: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: VanshColors.khadi[300],
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[500],
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: VanshColors.masi[300],
    marginTop: 4,
  },
  mediaPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewPlaceholder: {
    backgroundColor: VanshColors.khadi[100],
    borderRadius: 16,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[500],
    marginTop: 8,
  },
  // Recipients step
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[700],
  },
  membersList: {
    gap: 6,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  memberItemSelected: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50] || '#FFFBEB',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  memberCity: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  noMembers: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMembersText: {
    fontSize: 14,
    color: VanshColors.masi[400],
    textAlign: 'center',
    marginTop: 12,
  },
  selectedCount: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
    marginTop: 16,
  },
  // Reminders step
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  sectionHint: {
    fontSize: 13,
    color: VanshColors.masi[400],
    marginTop: 4,
    marginBottom: 12,
  },
  remindersList: {
    gap: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reminderItemActive: {
    borderColor: VanshColors.suvarna[400],
    backgroundColor: VanshColors.suvarna[50] || '#FFFBEB',
  },
  reminderText: {
    fontSize: 15,
    fontWeight: '500',
    color: VanshColors.masi[600],
  },
  reminderTextActive: {
    fontWeight: '600',
    color: VanshColors.suvarna[700],
  },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
    backgroundColor: '#FAFAF9',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  prevButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[600],
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
