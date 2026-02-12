/**
 * 🌳 QUICK ADD MEMBER - Simple & Beautiful Add Relative Flow
 * ═══════════════════════════════════════════════════════════
 * 
 * Designed for LAYMEN - not tech professionals:
 * ✓ Big, tappable relationship cards with emojis
 * ✓ Minimal required fields (just name!)
 * ✓ Smart defaults based on relationship
 * ✓ Beautiful animations
 * ✓ Conversational flow
 * 
 * PHILOSOPHY: "Adding family should feel like a warm embrace"
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { Gender } from '../../types';
import { useVrikshaStore, type BasicRelationType, type FamilyMember } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface QuickAddMemberProps {
  visible: boolean;
  baseMember?: FamilyMember;
  onClose: () => void;
  onSuccess?: (newMemberId: string) => void;
}

type Step = 'relationship' | 'details' | 'photo';

interface RelationshipOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
  relationType: BasicRelationType;
  reverseType: BasicRelationType;
  defaultGender: Gender;
}

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP OPTIONS
// ═══════════════════════════════════════════════════════════

const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  {
    id: 'father',
    label: 'Father',
    emoji: '👨',
    description: 'Your dad or father figure',
    relationType: 'child',
    reverseType: 'parent',
    defaultGender: 'male',
  },
  {
    id: 'mother',
    label: 'Mother',
    emoji: '👩',
    description: 'Your mom or mother figure',
    relationType: 'child',
    reverseType: 'parent',
    defaultGender: 'female',
  },
  {
    id: 'son',
    label: 'Son',
    emoji: '👦',
    description: 'Your male child',
    relationType: 'parent',
    reverseType: 'child',
    defaultGender: 'male',
  },
  {
    id: 'daughter',
    label: 'Daughter',
    emoji: '👧',
    description: 'Your female child',
    relationType: 'parent',
    reverseType: 'child',
    defaultGender: 'female',
  },
  {
    id: 'husband',
    label: 'Husband',
    emoji: '🤵',
    description: 'Your male spouse',
    relationType: 'spouse',
    reverseType: 'spouse',
    defaultGender: 'male',
  },
  {
    id: 'wife',
    label: 'Wife',
    emoji: '👰',
    description: 'Your female spouse',
    relationType: 'spouse',
    reverseType: 'spouse',
    defaultGender: 'female',
  },
  {
    id: 'brother',
    label: 'Brother',
    emoji: '🧑',
    description: 'Your male sibling',
    relationType: 'sibling',
    reverseType: 'sibling',
    defaultGender: 'male',
  },
  {
    id: 'sister',
    label: 'Sister',
    emoji: '👩',
    description: 'Your female sibling',
    relationType: 'sibling',
    reverseType: 'sibling',
    defaultGender: 'female',
  },
  {
    id: 'son_in_law',
    label: 'Son-in-law',
    emoji: '🤵',
    description: "Your child's husband",
    relationType: 'spouse',
    reverseType: 'spouse',
    defaultGender: 'male',
  },
  {
    id: 'daughter_in_law',
    label: 'Daughter-in-law',
    emoji: '👰',
    description: "Your child's wife",
    relationType: 'spouse',
    reverseType: 'spouse',
    defaultGender: 'female',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP CARD COMPONENT
// ═══════════════════════════════════════════════════════════

interface RelationshipCardProps {
  option: RelationshipOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

function RelationshipCard({ option, isSelected, onPress, index }: RelationshipCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(300)}
    >
      <Pressable
        style={[
          styles.relationCard,
          isSelected && styles.relationCardSelected,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.relationEmoji}>{option.emoji}</Text>
        <Text style={[
          styles.relationLabel,
          isSelected && styles.relationLabelSelected,
        ]}>
          {option.label}
        </Text>
        {isSelected && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.checkmark}
          >
            <MaterialIcons name="check-circle" size={24} color={VanshColors.suvarna[500]} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export function QuickAddMember({
  visible,
  baseMember,
  onClose,
  onSuccess,
}: QuickAddMemberProps) {
  const insets = useSafeAreaInsets();
  const { addMember, addRelation, members } = useVrikshaStore();
  
  // State
  const [step, setStep] = useState<Step>('relationship');
  const [selectedRelation, setSelectedRelation] = useState<RelationshipOption | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const progressWidth = useSharedValue(0);
  
  // Reset on open
  useEffect(() => {
    if (visible) {
      setStep('relationship');
      setSelectedRelation(null);
      setFirstName('');
      setLastName(baseMember?.lastName || '');
      setPhotoUri(undefined);
      progressWidth.value = withTiming(33, { duration: 300 });
    }
  }, [visible, baseMember]);
  
  // Update progress bar
  useEffect(() => {
    const progress = step === 'relationship' ? 33 : step === 'details' ? 66 : 100;
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [step]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  // Handlers
  const handleSelectRelation = useCallback((option: RelationshipOption) => {
    setSelectedRelation(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Auto-advance after selection
    setTimeout(() => {
      setStep('details');
    }, 300);
  }, []);
  
  const handlePickPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };
  
  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };
  
  const handleSubmit = async () => {
    if (!firstName.trim() || !selectedRelation) return;
    
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Determine family ID
      const familyId = baseMember?.familyId || 'default-family';
      
      // Create new member
      const newMemberId = addMember({
        familyId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: selectedRelation.defaultGender,
        isAlive: true,
        avatarUri: photoUri,
      });
      
      // Create relationship if we have a base member
      if (baseMember) {
        addRelation(
          newMemberId,
          baseMember.id,
          selectedRelation.relationType,
          selectedRelation.id
        );
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.(newMemberId);
      onClose();
    } catch (error) {
      console.error('Failed to add member:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'details') {
      setStep('relationship');
    } else if (step === 'photo') {
      setStep('details');
    }
  };
  
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'details') {
      if (!firstName.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setStep('photo');
    }
  };
  
  const handleSkipPhoto = () => {
    handleSubmit();
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'relationship':
        return (
          <Animated.View 
            key="step-relationship"
            entering={SlideInRight.duration(250)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>
              {baseMember 
                ? `Who is this person to ${baseMember.firstName}?`
                : 'Add your first family member'
              }
            </Text>
            <Text style={styles.stepSubtitle}>
              Tap to select the relationship
            </Text>
            
            <View style={styles.relationGrid}>
              {RELATIONSHIP_OPTIONS.map((option, index) => (
                <RelationshipCard
                  key={option.id}
                  option={option}
                  isSelected={selectedRelation?.id === option.id}
                  onPress={() => handleSelectRelation(option)}
                  index={index}
                />
              ))}
            </View>
          </Animated.View>
        );
        
      case 'details':
        return (
          <Animated.View
            key="step-details"
            entering={SlideInRight.duration(250)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>
              What's their name?
            </Text>
            <Text style={styles.stepSubtitle}>
              Adding {selectedRelation?.label.toLowerCase()}
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="person" 
                  size={24} 
                  color={VanshColors.masi[400]} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First Name *"
                  placeholderTextColor={VanshColors.masi[400]}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoFocus
                  returnKeyType="next"
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="family-restroom" 
                  size={24} 
                  color={VanshColors.masi[400]} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor={VanshColors.masi[400]}
                  value={lastName}
                  onChangeText={setLastName}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.primaryButton,
                !firstName.trim() && styles.primaryButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!firstName.trim()}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 'photo':
        return (
          <Animated.View
            key="step-photo"
            entering={SlideInRight.duration(250)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>
              Add a photo of {firstName}
            </Text>
            <Text style={styles.stepSubtitle}>
              This helps everyone recognize them
            </Text>
            
            <View style={styles.photoSection}>
              {photoUri ? (
                <Animated.View 
                  entering={FadeIn.duration(300)}
                  style={styles.photoPreviewContainer}
                >
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <TouchableOpacity 
                    style={styles.changePhotoButton}
                    onPress={handlePickPhoto}
                  >
                    <MaterialIcons name="edit" size={16} color="#FFF" />
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <View style={styles.photoOptions}>
                  <TouchableOpacity 
                    style={styles.photoOptionButton}
                    onPress={handleTakePhoto}
                  >
                    <MaterialIcons name="camera-alt" size={32} color={VanshColors.suvarna[600]} />
                    <Text style={styles.photoOptionText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoOptionButton}
                    onPress={handlePickPhoto}
                  >
                    <MaterialIcons name="photo-library" size={32} color={VanshColors.suvarna[600]} />
                    <Text style={styles.photoOptionText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.photoActions}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Adding...' : 'Add to Family'}
                </Text>
                <MaterialIcons name="check" size={20} color="#FFF" />
              </TouchableOpacity>
              
              {!photoUri && (
                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={handleSkipPhoto}
                >
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        );
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          {step !== 'relationship' ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={VanshColors.masi[700]} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          
          <Text style={styles.headerTitle}>Add Family Member</Text>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={VanshColors.masi[700]} />
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[
              styles.progressLabel,
              step === 'relationship' && styles.progressLabelActive,
            ]}>
              Relation
            </Text>
            <Text style={[
              styles.progressLabel,
              step === 'details' && styles.progressLabelActive,
            ]}>
              Details
            </Text>
            <Text style={[
              styles.progressLabel,
              step === 'photo' && styles.progressLabelActive,
            ]}>
              Photo
            </Text>
          </View>
        </View>
        
        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Progress
  progressContainer: {
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: VanshColors.khadi[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: VanshColors.suvarna[500],
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: VanshSpacing.xs,
  },
  progressLabel: {
    fontSize: 12,
    color: VanshColors.masi[400],
  },
  progressLabelActive: {
    color: VanshColors.suvarna[600],
    fontWeight: '600',
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: VanshSpacing.lg,
    paddingBottom: VanshSpacing.xl,
  },
  stepContent: {
    flex: 1,
    paddingTop: VanshSpacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: VanshSpacing.xs,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: VanshColors.masi[500],
    textAlign: 'center',
    marginBottom: VanshSpacing.lg,
  },
  
  // Relationship Grid
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: VanshSpacing.sm,
  },
  relationCard: {
    width: (SCREEN_WIDTH - VanshSpacing.lg * 2 - VanshSpacing.sm) / 2,
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: VanshColors.khadi[200],
  },
  relationCardSelected: {
    borderColor: VanshColors.suvarna[500],
    backgroundColor: VanshColors.suvarna[50],
  },
  relationEmoji: {
    fontSize: 40,
    marginBottom: VanshSpacing.xs,
  },
  relationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.masi[700],
  },
  relationLabelSelected: {
    color: VanshColors.suvarna[700],
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  // Input
  inputContainer: {
    marginBottom: VanshSpacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.md,
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    marginBottom: VanshSpacing.sm,
    paddingHorizontal: VanshSpacing.md,
  },
  inputIcon: {
    marginRight: VanshSpacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: VanshColors.masi[800],
  },
  
  // Photo
  photoSection: {
    alignItems: 'center',
    marginBottom: VanshSpacing.lg,
  },
  photoOptions: {
    flexDirection: 'row',
    gap: VanshSpacing.lg,
  },
  photoOptionButton: {
    width: 100,
    height: 100,
    backgroundColor: VanshColors.suvarna[50],
    borderRadius: VanshRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: VanshColors.suvarna[200],
    borderStyle: 'dashed',
  },
  photoOptionText: {
    fontSize: 14,
    color: VanshColors.suvarna[700],
    marginTop: VanshSpacing.xs,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: VanshColors.suvarna[400],
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: VanshColors.suvarna[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  photoActions: {
    alignItems: 'center',
    gap: VanshSpacing.sm,
  },
  
  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.xl,
    borderRadius: VanshRadius.full,
    gap: VanshSpacing.sm,
    minWidth: 200,
    
    shadowColor: VanshColors.suvarna[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: VanshColors.masi[300],
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: VanshSpacing.sm,
    paddingHorizontal: VanshSpacing.md,
  },
  skipButtonText: {
    fontSize: 14,
    color: VanshColors.masi[500],
    textDecorationLine: 'underline',
  },
});

export default QuickAddMember;
