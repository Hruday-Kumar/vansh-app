/**
 * 🪷 TRADITION CREATOR - Add new family traditions
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar, SacredText, SilkButton } from '../../components';
import { useTraditions } from '../../hooks';
import { useAuthStore, useFamilyStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { MemberId, Parampara, ParamparaType } from '../../types';

interface TraditionCreatorProps {
  onClose: () => void;
  onCreated?: (tradition: Parampara) => void;
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'occasional' | 'once';

// Map UI types to database ENUM: 'festival', 'ritual', 'recipe', 'ceremony', 'practice', 'other'
const TYPES: { value: ParamparaType; emoji: string; label: string; dbCategory: string }[] = [
  { value: 'puja', emoji: '🕉️', label: 'Puja/Ritual', dbCategory: 'ritual' },
  { value: 'festival', emoji: '🪔', label: 'Festival', dbCategory: 'festival' },
  { value: 'ceremony', emoji: '🎊', label: 'Ceremony', dbCategory: 'ceremony' },
  { value: 'recipe', emoji: '🍲', label: 'Recipe', dbCategory: 'recipe' },
  { value: 'song', emoji: '🎵', label: 'Song', dbCategory: 'practice' },
  { value: 'story', emoji: '📖', label: 'Story', dbCategory: 'practice' },
  { value: 'craft', emoji: '🎨', label: 'Craft', dbCategory: 'practice' },
  { value: 'custom', emoji: '✨', label: 'Custom', dbCategory: 'other' },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'occasional', label: 'Life Events' },
];

export function TraditionCreator({ onClose, onCreated }: TraditionCreatorProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { membersList, family } = useFamilyStore();
  const { createTradition } = useTraditions();
  
  // Form state
  const [step, setStep] = useState<'type' | 'details' | 'performers'>('type');
  const [selectedType, setSelectedType] = useState<ParamparaType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('yearly');
  const [originStory, setOriginStory] = useState('');
  const [steps, setSteps] = useState('');
  const [selectedPerformers, setSelectedPerformers] = useState<MemberId[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleNext = () => {
    if (step === 'type' && selectedType) setStep('details');
    else if (step === 'details' && name.trim()) setStep('performers');
  };
  
  const handleBack = () => {
    if (step === 'performers') setStep('details');
    else if (step === 'details') setStep('type');
    else onClose();
  };
  
  const togglePerformer = (memberId: MemberId) => {
    setSelectedPerformers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };
  
  const handleSubmit = async () => {
    if (!user || !family || !selectedType) return;
    
    setIsSubmitting(true);
    
    try {
      // Call API to create tradition
      // Map the UI type to the database category
      const typeInfo = TYPES.find(t => t.value === selectedType);
      const dbCategory = typeInfo?.dbCategory || 'other';
      
      const result = await createTradition({
        name: name.trim(),
        description: description.trim() || undefined,
        category: dbCategory,
        frequency,
        dateOrOccasion: originStory.trim() || undefined,
      });
      
      if (result) {
        Alert.alert(
          '🪔 Tradition Saved',
          'This tradition has been added to your family\'s heritage.',
          [{ text: 'OK', onPress: () => onCreated?.({
            id: result.id,
            familyId: family.id,
            name: name.trim(),
            type: selectedType,
            description: description.trim(),
            originStory: originStory.trim() || undefined,
            frequency,
            steps: steps.split('\n').filter(s => s.trim()).map((instruction, i) => ({
              order: i + 1,
              instruction,
            })),
            performedBy: selectedPerformers,
            photos: [],
            videos: [],
            atRisk: false,
          }) }]
        );
      } else {
        throw new Error('No result returned from API');
      }
    } catch (error: any) {
      console.error('Error creating tradition:', error);
      Alert.alert('Error', error.message || 'Could not save tradition. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderTypeSelection = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        What type of tradition?
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.stepDesc}>
        Choose the category that best describes this tradition
      </SacredText>
      
      <View style={styles.categoriesGrid}>
        {TYPES.map((item, index) => (
          <Animated.View key={item.value} entering={FadeInDown.delay(index * 60)}>
            <Pressable
              style={[
                styles.categoryCard,
                selectedType === item.value && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedType(item.value)}
            >
              <SacredText variant="heading">{item.emoji}</SacredText>
              <SacredText
                variant="body"
                color={selectedType === item.value ? 'gold' : 'secondary'}
              >
                {item.label}
              </SacredText>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
  
  const renderDetailsForm = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        Tell us about it
      </SacredText>
      
      <View style={styles.formGroup}>
        <SacredText variant="label" color="muted">Name *</SacredText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Diwali Puja, Grandma's Kheer Recipe"
          placeholderTextColor={VanshColors.masi[400]}
        />
      </View>
      
      <View style={styles.formGroup}>
        <SacredText variant="label" color="muted">Description</SacredText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe this tradition and why it's meaningful..."
          placeholderTextColor={VanshColors.masi[400]}
          multiline
        />
      </View>
      
      <View style={styles.formGroup}>
        <SacredText variant="label" color="muted">How often?</SacredText>
        <View style={styles.frequencyRow}>
          {FREQUENCIES.map(f => (
            <Pressable
              key={f.value}
              style={[
                styles.frequencyChip,
                frequency === f.value && styles.frequencyChipSelected,
              ]}
              onPress={() => setFrequency(f.value)}
            >
              <SacredText
                variant="caption"
                color={frequency === f.value ? 'gold' : 'secondary'}
              >
                {f.label}
              </SacredText>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <SacredText variant="label" color="muted">Origin Story (optional)</SacredText>
        <TextInput
          style={styles.input}
          value={originStory}
          onChangeText={setOriginStory}
          placeholder="Where did this tradition come from?"
          placeholderTextColor={VanshColors.masi[400]}
        />
      </View>
      
      <View style={styles.formGroup}>
        <SacredText variant="label" color="muted">Steps/Instructions (optional)</SacredText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={steps}
          onChangeText={setSteps}
          placeholder="Enter each step on a new line..."
          placeholderTextColor={VanshColors.masi[400]}
          multiline
        />
      </View>
    </Animated.View>
  );
  
  const renderPerformersSelection = () => (
    <Animated.View entering={FadeIn} style={styles.stepContent}>
      <SacredText variant="title" color="primary" align="center">
        Who practices this tradition?
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.stepDesc}>
        Select family members who know this tradition
      </SacredText>
      
      <View style={styles.membersGrid}>
        {membersList.map((member, index) => (
          <Animated.View key={member.id} entering={FadeInDown.delay(index * 40)}>
            <Pressable
              style={[
                styles.memberCard,
                selectedPerformers.includes(member.id) && styles.memberCardSelected,
              ]}
              onPress={() => togglePerformer(member.id)}
            >
              <MemberAvatar
                uri={member.avatarUri}
                name={`${member.firstName} ${member.lastName}`}
                size="md"
              />
              <SacredText variant="caption" color="primary" align="center" numberOfLines={1}>
                {member.firstName}
              </SacredText>
              {selectedPerformers.includes(member.id) && (
                <View style={styles.checkmark}>
                  <SacredText variant="caption">✓</SacredText>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="← Back" onPress={handleBack} />
        <SacredText variant="subhead" color="primary">
          {step === 'type' ? '1 of 3' : step === 'details' ? '2 of 3' : '3 of 3'}
        </SacredText>
        <View style={{ width: 70 }} />
      </View>
      
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { 
          width: step === 'type' ? '33%' : step === 'details' ? '66%' : '100%' 
        }]} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {step === 'type' && renderTypeSelection()}
        {step === 'details' && renderDetailsForm()}
        {step === 'performers' && renderPerformersSelection()}
      </ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        {step !== 'performers' ? (
          <SilkButton
            variant="primary"
            label="Continue"
            onPress={handleNext}
            disabled={
              (step === 'type' && !selectedType) ||
              (step === 'details' && !name.trim())
            }
          />
        ) : (
          <SilkButton
            variant="primary"
            label={isSubmitting ? 'Saving...' : '🪔 Save Tradition'}
            onPress={handleSubmit}
            disabled={isSubmitting}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: VanshSpacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepDesc: {
    marginTop: VanshSpacing.sm,
    marginBottom: VanshSpacing.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: VanshSpacing.md,
  },
  categoryCard: {
    width: 100,
    height: 100,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: VanshSpacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: VanshColors.suvarna[50],
    borderColor: VanshColors.suvarna[500],
  },
  formGroup: {
    marginBottom: VanshSpacing.lg,
  },
  input: {
    marginTop: VanshSpacing.xs,
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    fontSize: 16,
    color: VanshColors.masi[800],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.sm,
    marginTop: VanshSpacing.sm,
  },
  frequencyChip: {
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    backgroundColor: VanshColors.khadi[200],
    borderRadius: VanshRadius.full,
  },
  frequencyChipSelected: {
    backgroundColor: VanshColors.suvarna[100],
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: VanshSpacing.md,
  },
  memberCard: {
    width: 90,
    padding: VanshSpacing.sm,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    alignItems: 'center',
    gap: VanshSpacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberCardSelected: {
    backgroundColor: VanshColors.suvarna[50],
    borderColor: VanshColors.suvarna[500],
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: VanshColors.suvarna[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: VanshSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
  },
});
