/**
 * 🪷 VASIYAT CREATOR - Create time-locked wisdom messages
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar, SacredText, SilkButton } from '../../components';
import { useVasiyats } from '../../hooks/use-api';
import { useAuthStore, useFamilyStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { LifeEvent, MemberId } from '../../types';

interface VasiyatCreatorProps {
  onClose: () => void;
  onCreated?: () => void;
}

type VasiyatMood = 'loving' | 'wisdom' | 'celebration' | 'comfort' | 'guidance';
type TriggerType = 'date' | 'event' | 'death' | 'manual';

const MESSAGE_MOODS: { mood: VasiyatMood; emoji: string; label: string; desc: string }[] = [
  { mood: 'loving', emoji: '💝', label: 'Loving', desc: 'A heartfelt message' },
  { mood: 'wisdom', emoji: '🪷', label: 'Wisdom', desc: 'Life lessons to share' },
  { mood: 'celebration', emoji: '🎉', label: 'Celebration', desc: 'For joyful moments' },
  { mood: 'guidance', emoji: '🧭', label: 'Guidance', desc: 'Advice and direction' },
];

const UNLOCK_CONDITIONS: { type: TriggerType; emoji: string; label: string }[] = [
  { type: 'date', emoji: '📅', label: 'On a specific date' },
  { type: 'event', emoji: '🎊', label: 'Life event (wedding, graduation)' },
  { type: 'death', emoji: '🕊️', label: 'After my passing' },
  { type: 'manual', emoji: '🔓', label: 'I\'ll unlock manually' },
];

export function VasiyatCreator({ onClose, onCreated }: VasiyatCreatorProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { membersList, family } = useFamilyStore();
  const { createVasiyat } = useVasiyats();
  
  // Form state
  const [step, setStep] = useState<'type' | 'recipient' | 'content' | 'timing'>('type');
  const [selectedMood, setSelectedMood] = useState<VasiyatMood | null>(null);
  const [recipientType, setRecipientType] = useState<'family' | 'individual'>('family');
  const [selectedRecipients, setSelectedRecipients] = useState<MemberId[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('manual');
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [eventType, setEventType] = useState<LifeEvent | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Other family members (not self)
  const otherMembers = membersList.filter(m => m.id !== user?.memberId);
  
  const handleNext = () => {
    if (step === 'type' && selectedMood) setStep('recipient');
    else if (step === 'recipient') setStep('content');
    else if (step === 'content' && message.trim()) setStep('timing');
  };
  
  const handleBack = () => {
    if (step === 'timing') setStep('content');
    else if (step === 'content') setStep('recipient');
    else if (step === 'recipient') setStep('type');
    else onClose();
  };
  
  const toggleRecipient = (memberId: MemberId) => {
    setSelectedRecipients(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };
  
  const handleSubmit = async () => {
    if (!user || !family || !selectedMood) return;
    
    // Need at least one recipient
    if (selectedRecipients.length === 0) {
      Alert.alert('Select Recipients', 'Please select at least one family member to receive this message.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createVasiyat({
        title: title || 'Untitled Message',
        contentText: message,
        recipients: selectedRecipients.map(id => ({
          memberId: id as string,
          relationshipLabel: 'family member',
        })),
        triggerType: triggerType === 'death' ? 'after_passing' : triggerType,
        triggerDate: triggerType === 'date' ? unlockDate?.toISOString().split('T')[0] : undefined,
        triggerEvent: triggerType === 'event' ? (eventType || 'wedding') : undefined,
        mood: selectedMood,
      });
      
      Alert.alert(
        '💌 Sealed with Love',
        'Your message has been safely stored and will be delivered when the time is right.',
        [{ text: 'OK', onPress: onCreated }]
      );
    } catch (error: any) {
      console.error('Vasiyat creation error:', error);
      Alert.alert('Error', error.message || 'Could not save your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const buildTrigger = () => {
    switch (triggerType) {
      case 'date':
        return { type: 'date' as const, date: unlockDate?.toISOString() || '' };
      case 'event':
        return { type: 'event' as const, event: eventType || 'wedding' };
      case 'death':
        return { type: 'death' as const };
      case 'manual':
      default:
        return { type: 'manual' as const, approverIds: [user?.memberId].filter(Boolean) as MemberId[] };
    }
  };
  
  const renderTypeSelection = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        What kind of message?
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.stepDesc}>
        Choose how you want to share your wisdom
      </SacredText>
      
      <View style={styles.optionsGrid}>
        {MESSAGE_MOODS.map((item, index) => (
          <Animated.View key={item.mood} entering={FadeInDown.delay(index * 80)}>
            <Pressable
              style={[
                styles.typeCard,
                selectedMood === item.mood && styles.typeCardSelected,
              ]}
              onPress={() => setSelectedMood(item.mood)}
            >
              <SacredText variant="displaySmall">{item.emoji}</SacredText>
              <SacredText variant="subhead" color={selectedMood === item.mood ? 'gold' : 'primary'}>
                {item.label}
              </SacredText>
              <SacredText variant="caption" color="muted" align="center">
                {item.desc}
              </SacredText>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
  
  const renderRecipientSelection = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        Who is this for?
      </SacredText>
      
      <View style={styles.recipientTypeRow}>
        <Pressable
          style={[
            styles.recipientTypeButton,
            recipientType === 'family' && styles.recipientTypeButtonActive,
          ]}
          onPress={() => setRecipientType('family')}
        >
          <SacredText variant="body" color={recipientType === 'family' ? 'gold' : 'primary'}>
            👨‍👩‍👧‍👦 Entire Family
          </SacredText>
        </Pressable>
        
        <Pressable
          style={[
            styles.recipientTypeButton,
            recipientType === 'individual' && styles.recipientTypeButtonActive,
          ]}
          onPress={() => setRecipientType('individual')}
        >
          <SacredText variant="body" color={recipientType === 'individual' ? 'gold' : 'primary'}>
            👤 Specific People
          </SacredText>
        </Pressable>
      </View>
      
      {recipientType === 'individual' && (
        <ScrollView style={styles.memberList}>
          {otherMembers.map(member => (
            <Pressable
              key={member.id}
              style={styles.memberItem}
              onPress={() => toggleRecipient(member.id)}
            >
              <MemberAvatar
                uri={member.avatarUri}
                name={`${member.firstName} ${member.lastName}`}
                size="sm"
              />
              <SacredText variant="body" color="primary" style={styles.memberName}>
                {member.firstName} {member.lastName}
              </SacredText>
              <View style={[
                styles.checkbox,
                selectedRecipients.includes(member.id) && styles.checkboxChecked,
              ]}>
                {selectedRecipients.includes(member.id) && (
                  <SacredText variant="caption" style={styles.checkmark}>✓</SacredText>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
  
  const renderContentInput = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        Write Your Message
      </SacredText>
      
      <TextInput
        style={styles.titleInput}
        placeholder="Title (optional)"
        placeholderTextColor={VanshColors.masi[400]}
        value={title}
        onChangeText={setTitle}
      />
      
      <TextInput
        style={styles.messageInput}
        placeholder="Dear loved ones..."
        placeholderTextColor={VanshColors.masi[400]}
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
      />
      
      <SacredText variant="caption" color="muted" align="right">
        {message.length} characters
      </SacredText>
    </Animated.View>
  );
  
  const renderTimingSelection = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        When should this open?
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.stepDesc}>
        Choose the moment your words will be revealed
      </SacredText>
      
      {UNLOCK_CONDITIONS.map((condition) => (
        <Pressable
          key={condition.type}
          style={[
            styles.conditionCard,
            triggerType === condition.type && styles.conditionCardSelected,
          ]}
          onPress={() => setTriggerType(condition.type)}
        >
          <SacredText variant="title">{condition.emoji}</SacredText>
          <SacredText
            variant="body"
            color={triggerType === condition.type ? 'gold' : 'primary'}
          >
            {condition.label}
          </SacredText>
        </Pressable>
      ))}
      
      {triggerType === 'date' && (
        <TextInput
          style={styles.eventInput}
          placeholder="Enter date (YYYY-MM-DD)..."
          placeholderTextColor={VanshColors.masi[400]}
          value={unlockDate?.toISOString().split('T')[0] || ''}
          onChangeText={(text) => {
            const date = new Date(text);
            if (!isNaN(date.getTime())) setUnlockDate(date);
          }}
        />
      )}
      
      {triggerType === 'event' && (
        <TextInput
          style={styles.eventInput}
          placeholder="e.g., wedding, first_child, graduation..."
          placeholderTextColor={VanshColors.masi[400]}
          value={eventType}
          onChangeText={(text) => setEventType(text as LifeEvent)}
        />
      )}
    </Animated.View>
  );
  
  const canProceed = () => {
    switch (step) {
      case 'type': return !!selectedMood;
      case 'recipient': return recipientType === 'family' || selectedRecipients.length > 0;
      case 'content': return message.trim().length > 0;
      case 'timing': return true;
      default: return false;
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="← Back" onPress={handleBack} />
        <SacredText variant="caption" color="muted">
          Step {['type', 'recipient', 'content', 'timing'].indexOf(step) + 1} of 4
        </SacredText>
        <View style={{ width: 70 }} />
      </View>
      
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${((['type', 'recipient', 'content', 'timing'].indexOf(step) + 1) / 4) * 100}%` },
        ]} />
      </View>
      
      <ScrollView style={styles.scrollContent}>
        {step === 'type' && renderTypeSelection()}
        {step === 'recipient' && renderRecipientSelection()}
        {step === 'content' && renderContentInput()}
        {step === 'timing' && renderTimingSelection()}
      </ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        {step === 'timing' ? (
          <SilkButton
            variant="primary"
            label={isSubmitting ? 'Sealing...' : '💌 Seal & Save'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            fullWidth
          />
        ) : (
          <SilkButton
            variant="primary"
            label="Continue"
            onPress={handleNext}
            disabled={!canProceed()}
            fullWidth
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: VanshColors.khadi[200],
  },
  progressFill: {
    height: '100%',
    backgroundColor: VanshColors.suvarna[500],
  },
  scrollContent: {
    flex: 1,
  },
  stepContent: {
    padding: VanshSpacing.lg,
  },
  stepDesc: {
    marginTop: VanshSpacing.xs,
    marginBottom: VanshSpacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.md,
    justifyContent: 'center',
  },
  typeCard: {
    width: 150,
    padding: VanshSpacing.lg,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    alignItems: 'center',
    gap: VanshSpacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: VanshColors.suvarna[500],
    backgroundColor: VanshColors.suvarna[50],
  },
  recipientTypeRow: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
    marginVertical: VanshSpacing.lg,
  },
  recipientTypeButton: {
    flex: 1,
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recipientTypeButtonActive: {
    borderColor: VanshColors.suvarna[500],
    backgroundColor: VanshColors.suvarna[50],
  },
  memberList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  memberName: {
    flex: 1,
    marginLeft: VanshSpacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: VanshColors.khadi[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: VanshColors.suvarna[500],
    borderColor: VanshColors.suvarna[500],
  },
  checkmark: {
    color: VanshColors.khadi[50],
  },
  titleInput: {
    fontFamily: 'System',
    fontSize: 18,
    color: VanshColors.masi[800],
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[300],
    paddingVertical: VanshSpacing.md,
    marginBottom: VanshSpacing.md,
  },
  messageInput: {
    fontFamily: 'System',
    fontSize: 16,
    color: VanshColors.masi[800],
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    padding: VanshSpacing.md,
    minHeight: 200,
    marginBottom: VanshSpacing.sm,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    marginBottom: VanshSpacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  conditionCardSelected: {
    borderColor: VanshColors.suvarna[500],
    backgroundColor: VanshColors.suvarna[50],
  },
  datePickerButton: {
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    marginTop: VanshSpacing.md,
    alignItems: 'center',
  },
  eventInput: {
    fontFamily: 'System',
    fontSize: 16,
    color: VanshColors.masi[800],
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    padding: VanshSpacing.md,
    marginTop: VanshSpacing.md,
  },
  footer: {
    padding: VanshSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
  },
});
