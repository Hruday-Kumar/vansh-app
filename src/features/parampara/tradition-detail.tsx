/**
 * 🪷 TRADITION DETAIL - View and edit a family tradition
 */

import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText, SilkButton } from '../../components';
import { useFamilyStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { Parampara } from '../../types';

interface TraditionDetailProps {
  tradition: Parampara;
  onClose: () => void;
  onEdit?: (updated: Partial<Parampara>) => void;
  onAddMemory?: () => void;
  onAddKatha?: () => void;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Once a year',
  occasional: 'Occasionally',
  lifecycle: 'Life events',
};

export function TraditionDetail({
  tradition,
  onClose,
  onEdit,
  onAddMemory,
  onAddKatha,
}: TraditionDetailProps) {
  const insets = useSafeAreaInsets();
  const { getMember } = useFamilyStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(tradition.description || '');
  const [editedSteps, setEditedSteps] = useState(
    tradition.steps?.map(s => s.instruction).join('\n') || ''
  );
  
  const handleSave = () => {
    if (onEdit) {
      onEdit({
        description: editedDescription,
        steps: editedSteps.split('\n').filter(s => s.trim()).map((instruction, i) => ({
          order: i + 1,
          instruction,
        })),
      });
    }
    setIsEditing(false);
  };
  
  const performers = tradition.performedBy?.map(id => getMember(id)).filter(Boolean) || [];
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="← Back" onPress={onClose} />
        {onEdit && (
          <SilkButton
            variant="ghost"
            label={isEditing ? 'Cancel' : 'Edit'}
            onPress={() => setIsEditing(!isEditing)}
          />
        )}
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title section */}
        <Animated.View entering={FadeIn} style={styles.titleSection}>
          <SacredText variant="displaySmall" color="gold" align="center">
            {tradition.name}
          </SacredText>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <SacredText variant="caption" color="secondary">
                {tradition.type}
              </SacredText>
            </View>
            <View style={styles.tag}>
              <SacredText variant="caption" color="secondary">
                {frequencyLabels[tradition.frequency || 'yearly'] || tradition.frequency}
              </SacredText>
            </View>
          </View>
        </Animated.View>
        
        {/* Origin */}
        {tradition.originStory && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <HeritageCard variant="outlined" style={styles.section}>
              <SacredText variant="label" color="muted">Origin</SacredText>
              <SacredText variant="body" color="primary" style={styles.sectionContent}>
                {tradition.originStory}
              </SacredText>
              {tradition.originYear && (
                <SacredText variant="caption" color="muted">
                  Since {tradition.originYear}
                </SacredText>
              )}
            </HeritageCard>
          </Animated.View>
        )}
        
        {/* Description */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <HeritageCard variant="elevated" style={styles.section}>
            <SacredText variant="label" color="muted">About This Tradition</SacredText>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedDescription}
                onChangeText={setEditedDescription}
                multiline
                placeholder="Describe this tradition..."
                placeholderTextColor={VanshColors.masi[400]}
              />
            ) : (
              <SacredText variant="body" color="secondary" style={styles.sectionContent}>
                {tradition.description || 'No description yet. Tap Edit to add one.'}
              </SacredText>
            )}
          </HeritageCard>
        </Animated.View>
        
        {/* Steps/Instructions */}
        {(tradition.steps?.length || isEditing) && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <HeritageCard variant="outlined" style={styles.section}>
              <SacredText variant="label" color="muted">How It's Done</SacredText>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedSteps}
                  onChangeText={setEditedSteps}
                  multiline
                  placeholder="Enter each step on a new line..."
                  placeholderTextColor={VanshColors.masi[400]}
                />
              ) : (
                <View style={styles.stepsList}>
                  {tradition.steps?.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <SacredText variant="caption" color="gold">{step.order || index + 1}</SacredText>
                      </View>
                      <View style={styles.stepContent}>
                        <SacredText variant="body" color="secondary" style={styles.stepText}>
                          {step.instruction}
                        </SacredText>
                        {step.tips && (
                          <SacredText variant="caption" color="muted">
                            💡 {step.tips}
                          </SacredText>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </HeritageCard>
          </Animated.View>
        )}
        
        {/* Performers */}
        {performers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <HeritageCard variant="outlined" style={styles.section}>
              <SacredText variant="label" color="muted">Tradition Keepers</SacredText>
              <SacredText variant="caption" color="secondary" style={styles.keeperDesc}>
                These family members practice this tradition
              </SacredText>
              <View style={styles.keepersGrid}>
                {performers.map(member => member && (
                  <View key={member.id} style={styles.keeperItem}>
                    <MemberAvatar
                      uri={member.avatarUri}
                      name={`${member.firstName} ${member.lastName}`}
                      size="md"
                    />
                    <SacredText variant="caption" color="primary" align="center">
                      {member.firstName}
                    </SacredText>
                  </View>
                ))}
              </View>
            </HeritageCard>
          </Animated.View>
        )}
        
        {/* Related Content */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <HeritageCard variant="outlined" style={styles.section}>
            <SacredText variant="label" color="muted">Document This Tradition</SacredText>
            <View style={styles.actionButtons}>
              {onAddMemory && (
                <SilkButton
                  variant="secondary"
                  label="📸 Add Photos"
                  onPress={onAddMemory}
                  style={styles.actionButton}
                />
              )}
              {onAddKatha && (
                <SilkButton
                  variant="secondary"
                  label="🎙️ Record Story"
                  onPress={onAddKatha}
                  style={styles.actionButton}
                />
              )}
            </View>
          </HeritageCard>
        </Animated.View>
        
        {/* Save button when editing */}
        {isEditing && (
          <Animated.View entering={FadeIn}>
            <SilkButton
              variant="primary"
              label="Save Changes"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </Animated.View>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: VanshSpacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: VanshSpacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    gap: VanshSpacing.sm,
    marginTop: VanshSpacing.sm,
  },
  tag: {
    backgroundColor: VanshColors.khadi[200],
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
  },
  section: {
    marginBottom: VanshSpacing.md,
  },
  sectionContent: {
    marginTop: VanshSpacing.sm,
  },
  textInput: {
    marginTop: VanshSpacing.sm,
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    fontSize: 16,
    color: VanshColors.masi[800],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  stepsList: {
    marginTop: VanshSpacing.sm,
    gap: VanshSpacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: VanshSpacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VanshColors.suvarna[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    gap: VanshSpacing.xs,
  },
  stepText: {
    flex: 1,
  },
  keeperDesc: {
    marginTop: VanshSpacing.xs,
  },
  keepersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.md,
    marginTop: VanshSpacing.md,
  },
  keeperItem: {
    alignItems: 'center',
    gap: VanshSpacing.xs,
    width: 70,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: VanshSpacing.sm,
    marginTop: VanshSpacing.md,
  },
  actionButton: {
    flex: 1,
  },
  saveButton: {
    marginTop: VanshSpacing.lg,
  },
});
