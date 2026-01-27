/**
 * 🌳 VRIKSHA TAB - Family Tree Screen
 * ═══════════════════════════════════════════════════════════
 * 
 * Complete redesign with:
 * ✓ Professional family tree visualization with HIERARCHY
 * ✓ Comprehensive relationship system (40+ types)
 * ✓ All text in ENGLISH
 * ✓ Visual connection lines between members
 */

import React, { useCallback, useState } from 'react';
import {
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyTree, MemberProfile } from '../../src/features/vriksha';
import {
    CATEGORY_LABELS,
    getRelationshipsByCategory,
    RELATIONSHIP_OPTIONS,
    type RelationshipCategory
} from '../../src/features/vriksha/types';
import { useAddMember, useFamilyData } from '../../src/hooks';
import { useAuthStore, useFamilyStore } from '../../src/state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../src/theme';
import type { Gender, VrikshaMember } from '../../src/types';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type ViewMode = 'tree' | 'profile';
type FormStep = 'basic' | 'life' | 'relations';

interface RelationshipEntry {
  memberId: string;
  memberName: string;
  relationType: string;  // Uses comprehensive RELATIONSHIP_OPTIONS values
}

interface AddMemberFormData {
  firstName: string;
  lastName: string;
  maidenName: string;
  gender: Gender;
  isAlive: boolean;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  currentCity: string;
  occupation: string;
  bio: string;
  relationships: RelationshipEntry[];
}

const initialFormData: AddMemberFormData = {
  firstName: '',
  lastName: '',
  maidenName: '',
  gender: 'male',
  isAlive: true,
  birthDate: '',
  deathDate: '',
  birthPlace: '',
  currentCity: '',
  occupation: '',
  bio: '',
  relationships: [],
};

// ═══════════════════════════════════════════════════════════
// MAIN SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function VrikshaScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { membersList } = useFamilyStore();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [selectedMember, setSelectedMember] = useState<VrikshaMember | null>(null);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<AddMemberFormData>(initialFormData);
  const [expandedCategory, setExpandedCategory] = useState<RelationshipCategory | null>('immediate');
  const [selectedMemberForRelation, setSelectedMemberForRelation] = useState<string | null>(null);
  
  // API hooks
  const { refresh: refreshFamily } = useFamilyData();
  const { createMember, addRelationship, isLoading } = useAddMember();
  
  // Handlers
  const handleMemberPress = useCallback((member: VrikshaMember) => {
    setSelectedMember(member);
    setViewMode('profile');
  }, []);
  
  const handleOpenAddModal = useCallback(() => {
    // Initialize relationships with existing members
    const initialRels: RelationshipEntry[] = membersList.map(m => ({
      memberId: m.id,
      memberName: `${m.firstName} ${m.lastName}`,
      relationType: '',
    }));
    setFormData({ ...initialFormData, relationships: initialRels });
    setCurrentStep('basic');
    setExpandedCategory('immediate');
    setSelectedMemberForRelation(membersList.length > 0 ? membersList[0].id : null);
    setShowAddModal(true);
  }, [membersList]);
  
  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setFormData(initialFormData);
    setCurrentStep('basic');
  }, []);
  
  const updateField = useCallback(<K extends keyof AddMemberFormData>(
    field: K,
    value: AddMemberFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const updateRelationship = useCallback((memberId: string, relationType: string) => {
    setFormData(prev => ({
      ...prev,
      relationships: prev.relationships.map(r =>
        r.memberId === memberId ? { ...r, relationType } : r
      ),
    }));
  }, []);
  
  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      Alert.alert('Required', 'Please enter first name');
      return;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Required', 'Please enter last name');
      return;
    }
    
    try {
      // Create member
      const result = await createMember({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        isAlive: formData.isAlive,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace || undefined,
        bio: formData.bio || undefined,
      });
      
      // Add relationships
      if (result?.id) {
        const selectedRelations = formData.relationships.filter(r => r.relationType !== '');
        console.log('📝 Adding relationships for new member:', result.id);
        console.log('📝 Selected relations:', selectedRelations.length, selectedRelations);
        
        for (const rel of selectedRelations) {
          try {
            console.log(`📝 Adding relationship: ${result.id} -> ${rel.memberId} (${rel.relationType})`);
            // Store the DETAILED relationship type (father, mother, son, etc.)
            // The tree algorithm will convert to basic types as needed
            const success = await addRelationship(result.id, rel.memberId, rel.relationType);
            console.log(`📝 Relationship added: ${success}`);
          } catch (err) {
            console.warn('Failed to add relationship:', err);
          }
        }
      }
      
      // Success
      handleCloseModal();
      refreshFamily();
      Alert.alert('Success ✓', 'Family member added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add member');
    }
  };
  
  // Render profile view
  if (viewMode === 'profile' && selectedMember) {
    return (
      <MemberProfile
        member={selectedMember}
        onClose={() => setViewMode('tree')}
        onViewMemories={() => {}}
        onViewKathas={() => {}}
        onChatWithEcho={() => {}}
      />
    );
  }
  
  // Calculate stats
  const totalMembers = membersList.length;
  const livingMembers = membersList.filter(m => m.isAlive).length;
  const deceasedMembers = totalMembers - livingMembers;
  const maleCount = membersList.filter(m => m.gender === 'male').length;
  const femaleCount = membersList.filter(m => m.gender === 'female').length;
  
  // Get grouped relationships
  const groupedRelations = getRelationshipsByCategory();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🌳 Vriksha</Text>
          <Text style={styles.headerSubtitle}>Family Tree</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
          <Text style={styles.addButtonText}>+ Add Member</Text>
        </TouchableOpacity>
      </View>
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* STATS BAR */}
      {/* ═══════════════════════════════════════════════════════ */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalMembers}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: VanshColors.chandan[600] }]}>{livingMembers}</Text>
          <Text style={styles.statLabel}>🌿 Living</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: VanshColors.masi[500] }]}>{deceasedMembers}</Text>
          <Text style={styles.statLabel}>🕯️ Deceased</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{maleCount}</Text>
          <Text style={styles.statLabel}>👨 Male</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#EC4899' }]}>{femaleCount}</Text>
          <Text style={styles.statLabel}>👩 Female</Text>
        </View>
      </View>
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* FAMILY TREE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <FamilyTree
        onMemberPress={handleMemberPress}
        onAddMember={handleOpenAddModal}
      />
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* ADD MEMBER MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
              <Text style={[styles.saveText, isLoading && styles.disabledText]}>
                {isLoading ? '...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Step Tabs */}
          <View style={styles.stepTabs}>
            {(['basic', 'life', 'relations'] as FormStep[]).map((step) => {
              const isActive = currentStep === step;
              const labels = {
                basic: { emoji: '👤', text: 'Basic Info' },
                life: { emoji: '📅', text: 'Life Details' },
                relations: { emoji: '🔗', text: 'Relations' },
              };
              
              return (
                <TouchableOpacity
                  key={step}
                  style={[styles.stepTab, isActive && styles.stepTabActive]}
                  onPress={() => setCurrentStep(step)}
                >
                  <Text style={[styles.stepTabText, isActive && styles.stepTabTextActive]}>
                    {labels[step].emoji} {labels[step].text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Form Content */}
          <ScrollView 
            style={styles.formContent}
            contentContainerStyle={styles.formContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* ═══════════ STEP 1: BASIC INFO ═══════════ */}
            {currentStep === 'basic' && (
              <Animated.View entering={FadeIn}>
                {/* First Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>First Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.firstName}
                    onChangeText={(v) => updateField('firstName', v)}
                    placeholder="Enter first name"
                    placeholderTextColor={VanshColors.khadi[400]}
                    autoCapitalize="words"
                  />
                </View>
                
                {/* Last Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.lastName}
                    onChangeText={(v) => updateField('lastName', v)}
                    placeholder="Enter last name"
                    placeholderTextColor={VanshColors.khadi[400]}
                    autoCapitalize="words"
                  />
                </View>
                
                {/* Gender */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.optionsRow}>
                    {[
                      { value: 'male', label: '👨 Male' },
                      { value: 'female', label: '👩 Female' },
                      { value: 'other', label: '🧑 Other' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.optionButton,
                          formData.gender === opt.value && styles.optionButtonActive,
                        ]}
                        onPress={() => updateField('gender', opt.value as Gender)}
                      >
                        <Text style={[
                          styles.optionText,
                          formData.gender === opt.value && styles.optionTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Maiden Name (for females) */}
                {formData.gender === 'female' && (
                  <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Maiden Name (optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.maidenName}
                      onChangeText={(v) => updateField('maidenName', v)}
                      placeholder="Surname before marriage"
                      placeholderTextColor={VanshColors.khadi[400]}
                    />
                  </Animated.View>
                )}
                
                {/* Current City */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.currentCity}
                    onChangeText={(v) => updateField('currentCity', v)}
                    placeholder="City, State"
                    placeholderTextColor={VanshColors.khadi[400]}
                  />
                </View>
                
                {/* Occupation */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Occupation</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.occupation}
                    onChangeText={(v) => updateField('occupation', v)}
                    placeholder="Profession or work"
                    placeholderTextColor={VanshColors.khadi[400]}
                  />
                </View>
                
                {/* Next Button */}
                <TouchableOpacity 
                  style={styles.nextButton}
                  onPress={() => setCurrentStep('life')}
                >
                  <Text style={styles.nextButtonText}>Next: Life Details →</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* ═══════════ STEP 2: LIFE INFO ═══════════ */}
            {currentStep === 'life' && (
              <Animated.View entering={FadeIn}>
                {/* Living/Deceased Status */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.statusRow}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        formData.isAlive && styles.statusButtonLiving,
                      ]}
                      onPress={() => updateField('isAlive', true)}
                    >
                      <Text style={styles.statusEmoji}>🌿</Text>
                      <Text style={[
                        styles.statusText,
                        formData.isAlive && styles.statusTextActive,
                      ]}>
                        Living
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        !formData.isAlive && styles.statusButtonDeceased,
                      ]}
                      onPress={() => updateField('isAlive', false)}
                    >
                      <Text style={styles.statusEmoji}>🕯️</Text>
                      <Text style={[
                        styles.statusText,
                        !formData.isAlive && styles.statusTextActive,
                      ]}>
                        Deceased
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Birth Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Birth Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.birthDate}
                    onChangeText={(v) => updateField('birthDate', v)}
                    placeholder="YYYY-MM-DD (e.g., 1965-03-15)"
                    placeholderTextColor={VanshColors.khadi[400]}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                
                {/* Death Date (only if deceased) */}
                {!formData.isAlive && (
                  <Animated.View entering={FadeInDown} style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Death Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.deathDate}
                      onChangeText={(v) => updateField('deathDate', v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={VanshColors.khadi[400]}
                      keyboardType="numbers-and-punctuation"
                    />
                  </Animated.View>
                )}
                
                {/* Birth Place */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Birth Place</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.birthPlace}
                    onChangeText={(v) => updateField('birthPlace', v)}
                    placeholder="Village/City, District, State"
                    placeholderTextColor={VanshColors.khadi[400]}
                  />
                </View>
                
                {/* Biography */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Biography</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.bio}
                    onChangeText={(v) => updateField('bio', v)}
                    placeholder="Write something about this person..."
                    placeholderTextColor={VanshColors.khadi[400]}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                {/* Navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setCurrentStep('basic')}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={() => setCurrentStep('relations')}
                  >
                    <Text style={styles.nextButtonText}>Next: Relations →</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
            
            {/* ═══════════ STEP 3: RELATIONSHIPS ═══════════ */}
            {currentStep === 'relations' && (
              <Animated.View entering={FadeIn}>
                {formData.relationships.length === 0 ? (
                  <View style={styles.emptyRelations}>
                    <Text style={styles.emptyRelationsEmoji}>🌱</Text>
                    <Text style={styles.emptyRelationsTitle}>First Family Member!</Text>
                    <Text style={styles.emptyRelationsText}>
                      This is your first member. After adding them, you can define relationships with future members.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.relationsIntro}>
                      Define how <Text style={styles.highlight}>{formData.firstName || 'this person'}</Text> is related to existing family members:
                    </Text>
                    
                    {/* Member Selection */}
                    <View style={styles.memberTabs}>
                      {formData.relationships.map((rel) => {
                        const isSelected = selectedMemberForRelation === rel.memberId;
                        const hasRelation = rel.relationType !== '';
                        return (
                          <TouchableOpacity
                            key={rel.memberId}
                            style={[
                              styles.memberTab,
                              isSelected && styles.memberTabSelected,
                              hasRelation && styles.memberTabWithRelation,
                            ]}
                            onPress={() => setSelectedMemberForRelation(rel.memberId)}
                          >
                            <Text style={[
                              styles.memberTabText,
                              isSelected && styles.memberTabTextSelected,
                            ]} numberOfLines={1}>
                              {rel.memberName.split(' ')[0]}
                            </Text>
                            {hasRelation && (
                              <Text style={styles.memberTabCheck}>✓</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    
                    {/* Relationship Selection for Selected Member */}
                    {selectedMemberForRelation && (
                      <View style={styles.relationSelection}>
                        {(() => {
                          const selectedRel = formData.relationships.find(
                            r => r.memberId === selectedMemberForRelation
                          );
                          if (!selectedRel) return null;
                          
                          return (
                            <>
                              <Text style={styles.relationQuestion}>
                                {formData.firstName || 'This person'} is the ___ of{' '}
                                <Text style={styles.highlight}>{selectedRel.memberName}</Text>:
                              </Text>
                              
                              {/* Current Selection */}
                              {selectedRel.relationType && (
                                <View style={styles.currentSelection}>
                                  <Text style={styles.currentSelectionLabel}>Selected:</Text>
                                  <View style={styles.currentSelectionValue}>
                                    <Text style={styles.currentSelectionText}>
                                      {RELATIONSHIP_OPTIONS.find(o => o.value === selectedRel.relationType)?.emoji}{' '}
                                      {RELATIONSHIP_OPTIONS.find(o => o.value === selectedRel.relationType)?.label}
                                    </Text>
                                    <TouchableOpacity
                                      onPress={() => updateRelationship(selectedRel.memberId, '')}
                                      style={styles.clearButton}
                                    >
                                      <Text style={styles.clearButtonText}>✕ Clear</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                              
                              {/* Category Accordion */}
                              {(Object.keys(groupedRelations) as RelationshipCategory[]).map((category) => {
                                const options = groupedRelations[category];
                                if (options.length === 0) return null;
                                
                                const isExpanded = expandedCategory === category;
                                
                                return (
                                  <View key={category} style={styles.categorySection}>
                                    <TouchableOpacity
                                      style={styles.categoryHeader}
                                      onPress={() => setExpandedCategory(isExpanded ? null : category)}
                                    >
                                      <Text style={styles.categoryTitle}>
                                        {CATEGORY_LABELS[category]}
                                      </Text>
                                      <Text style={styles.categoryArrow}>
                                        {isExpanded ? '▼' : '▶'}
                                      </Text>
                                    </TouchableOpacity>
                                    
                                    {isExpanded && (
                                      <Animated.View entering={FadeInDown} style={styles.categoryOptions}>
                                        {options.map((opt) => {
                                          const isSelected = selectedRel.relationType === opt.value;
                                          return (
                                            <TouchableOpacity
                                              key={opt.value}
                                              style={[
                                                styles.relationOption,
                                                isSelected && styles.relationOptionSelected,
                                              ]}
                                              onPress={() => updateRelationship(selectedRel.memberId, opt.value)}
                                            >
                                              <Text style={styles.relationOptionEmoji}>{opt.emoji}</Text>
                                              <View style={styles.relationOptionInfo}>
                                                <Text style={[
                                                  styles.relationOptionLabel,
                                                  isSelected && styles.relationOptionLabelSelected,
                                                ]}>
                                                  {opt.label}
                                                </Text>
                                                <Text style={styles.relationOptionDesc}>
                                                  {opt.description}
                                                </Text>
                                              </View>
                                              {isSelected && (
                                                <Text style={styles.relationOptionCheck}>✓</Text>
                                              )}
                                            </TouchableOpacity>
                                          );
                                        })}
                                      </Animated.View>
                                    )}
                                  </View>
                                );
                              })}
                            </>
                          );
                        })()}
                      </View>
                    )}
                    
                    {/* Summary of Relations */}
                    <View style={styles.relationsSummary}>
                      <Text style={styles.summaryTitle}>Relations Summary</Text>
                      {formData.relationships.filter(r => r.relationType).length === 0 ? (
                        <Text style={styles.summaryEmpty}>No relations defined yet</Text>
                      ) : (
                        formData.relationships.filter(r => r.relationType).map((rel) => (
                          <View key={rel.memberId} style={styles.summaryItem}>
                            <Text style={styles.summaryText}>
                              {RELATIONSHIP_OPTIONS.find(o => o.value === rel.relationType)?.emoji}{' '}
                              <Text style={styles.highlight}>
                                {RELATIONSHIP_OPTIONS.find(o => o.value === rel.relationType)?.label}
                              </Text>{' '}
                              of {rel.memberName}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </>
                )}
                
                {/* Navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setCurrentStep('life')}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <Text style={styles.submitButtonText}>
                      {isLoading ? 'Adding...' : '✓ Add Member'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[100],
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    backgroundColor: VanshColors.suvarna[500],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: VanshColors.khadi[50],
  },
  headerSubtitle: {
    fontSize: 13,
    color: VanshColors.khadi[200],
    marginTop: 2,
  },
  addButton: {
    backgroundColor: VanshColors.suvarna[400],
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    borderRadius: VanshRadius.md,
  },
  addButtonText: {
    color: VanshColors.khadi[900],
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: VanshSpacing.sm,
    paddingHorizontal: VanshSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: VanshColors.masi[700],
  },
  statLabel: {
    fontSize: 11,
    color: VanshColors.masi[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: VanshColors.khadi[200],
    marginVertical: 4,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  cancelText: {
    fontSize: 16,
    color: VanshColors.masi[500],
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },
  disabledText: {
    opacity: 0.5,
  },
  
  // Step Tabs
  stepTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    gap: VanshSpacing.xs,
  },
  stepTab: {
    flex: 1,
    paddingVertical: VanshSpacing.sm,
    alignItems: 'center',
    borderRadius: VanshRadius.sm,
    backgroundColor: VanshColors.khadi[100],
  },
  stepTabActive: {
    backgroundColor: VanshColors.suvarna[100],
  },
  stepTabText: {
    fontSize: 12,
    color: VanshColors.masi[500],
  },
  stepTabTextActive: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },
  
  // Form
  formContent: {
    flex: 1,
  },
  formContentContainer: {
    padding: VanshSpacing.md,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: VanshSpacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: VanshColors.masi[700],
    marginBottom: VanshSpacing.xs,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    borderRadius: VanshRadius.md,
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    fontSize: 16,
    color: VanshColors.masi[800],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: VanshSpacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: VanshSpacing.sm,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    borderRadius: VanshRadius.md,
  },
  optionButtonActive: {
    backgroundColor: VanshColors.suvarna[100],
    borderColor: VanshColors.suvarna[500],
  },
  optionText: {
    fontSize: 14,
    color: VanshColors.masi[600],
  },
  optionTextActive: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
    padding: VanshSpacing.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    borderRadius: VanshRadius.md,
  },
  statusButtonLiving: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  statusButtonDeceased: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6B7280',
  },
  statusEmoji: {
    fontSize: 24,
  },
  statusText: {
    fontSize: 14,
    color: VanshColors.masi[600],
  },
  statusTextActive: {
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  
  // Navigation Buttons
  navRow: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
    marginTop: VanshSpacing.lg,
  },
  backButton: {
    flex: 1,
    paddingVertical: VanshSpacing.md,
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[200],
    borderRadius: VanshRadius.md,
  },
  backButtonText: {
    fontSize: 16,
    color: VanshColors.masi[700],
  },
  nextButton: {
    flex: 2,
    paddingVertical: VanshSpacing.md,
    alignItems: 'center',
    backgroundColor: VanshColors.suvarna[500],
    borderRadius: VanshRadius.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  submitButton: {
    flex: 2,
    paddingVertical: VanshSpacing.md,
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: VanshRadius.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Relations Step
  relationsIntro: {
    fontSize: 15,
    color: VanshColors.masi[700],
    marginBottom: VanshSpacing.md,
    lineHeight: 22,
  },
  highlight: {
    fontWeight: '700',
    color: VanshColors.suvarna[700],
  },
  memberTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.xs,
    marginBottom: VanshSpacing.md,
  },
  memberTab: {
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    borderRadius: VanshRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberTabSelected: {
    backgroundColor: VanshColors.suvarna[100],
    borderColor: VanshColors.suvarna[500],
  },
  memberTabWithRelation: {
    borderColor: '#10B981',
  },
  memberTabText: {
    fontSize: 13,
    color: VanshColors.masi[600],
    maxWidth: 80,
  },
  memberTabTextSelected: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },
  memberTabCheck: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  relationSelection: {
    marginBottom: VanshSpacing.md,
  },
  relationQuestion: {
    fontSize: 14,
    color: VanshColors.masi[600],
    marginBottom: VanshSpacing.sm,
  },
  currentSelection: {
    backgroundColor: '#D1FAE5',
    padding: VanshSpacing.sm,
    borderRadius: VanshRadius.md,
    marginBottom: VanshSpacing.md,
  },
  currentSelectionLabel: {
    fontSize: 11,
    color: '#059669',
    marginBottom: 4,
  },
  currentSelectionValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentSelectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  clearButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: 4,
    borderRadius: VanshRadius.sm,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#DC2626',
  },
  categorySection: {
    marginBottom: VanshSpacing.sm,
    backgroundColor: '#FFF',
    borderRadius: VanshRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: VanshSpacing.sm,
    backgroundColor: VanshColors.khadi[100],
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[700],
  },
  categoryArrow: {
    fontSize: 10,
    color: VanshColors.masi[400],
  },
  categoryOptions: {
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
  },
  relationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[100],
  },
  relationOptionSelected: {
    backgroundColor: VanshColors.suvarna[50],
  },
  relationOptionEmoji: {
    fontSize: 20,
    marginRight: VanshSpacing.sm,
  },
  relationOptionInfo: {
    flex: 1,
  },
  relationOptionLabel: {
    fontSize: 14,
    color: VanshColors.masi[700],
  },
  relationOptionLabelSelected: {
    fontWeight: '600',
    color: VanshColors.suvarna[700],
  },
  relationOptionDesc: {
    fontSize: 11,
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  relationOptionCheck: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },
  relationsSummary: {
    backgroundColor: '#FFF',
    padding: VanshSpacing.md,
    borderRadius: VanshRadius.md,
    marginTop: VanshSpacing.md,
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[700],
    marginBottom: VanshSpacing.sm,
  },
  summaryEmpty: {
    fontSize: 13,
    color: VanshColors.masi[400],
    fontStyle: 'italic',
  },
  summaryItem: {
    paddingVertical: VanshSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[100],
  },
  summaryText: {
    fontSize: 14,
    color: VanshColors.masi[600],
  },
  emptyRelations: {
    alignItems: 'center',
    padding: VanshSpacing.xl,
  },
  emptyRelationsEmoji: {
    fontSize: 48,
    marginBottom: VanshSpacing.md,
  },
  emptyRelationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: VanshSpacing.sm,
  },
  emptyRelationsText: {
    fontSize: 14,
    color: VanshColors.masi[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
