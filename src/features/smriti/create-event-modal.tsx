/**
 * 🪷 CREATE EVENT MODAL - Modal form to create a new event album
 * 
 * Provides fields for:
 * - Event name (required)
 * - Event type picker (emoji grid)
 * - Date picker (start date)
 * - Location (text input)
 * - Description (optional textarea)
 */

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import type { EventType } from '../../types';

const EVENT_TYPES: { type: EventType; label: string; icon: string }[] = [
  { type: 'wedding', label: 'Wedding', icon: '💍' },
  { type: 'birthday', label: 'Birthday', icon: '🎂' },
  { type: 'festival', label: 'Festival', icon: '🪔' },
  { type: 'reunion', label: 'Reunion', icon: '👨‍👩‍👧‍👦' },
  { type: 'trip', label: 'Trip', icon: '✈️' },
  { type: 'ceremony', label: 'Ceremony', icon: '🙏' },
  { type: 'milestone', label: 'Milestone', icon: '🌟' },
  { type: 'other', label: 'Other', icon: '📸' },
];

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    eventType: EventType;
    eventDate?: string;
    location?: string;
  }) => Promise<void>;
}

export function CreateEventModal({ visible, onClose, onSubmit }: CreateEventModalProps) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('other');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setEventType('other');
    setEventDate('');
    setLocation('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name for this event album.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || undefined,
        eventType,
        eventDate: eventDate.trim() || undefined,
        location: location.trim() || undefined,
      });
      resetForm();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create event.');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, eventType, eventDate, location, onSubmit, resetForm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + VanshSpacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={VanshColors.masi[500]} />
            </Pressable>
            <Text style={styles.headerTitle}>New Event Album</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Event Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Album Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Diwali 2024, Grandpa's 80th..."
                placeholderTextColor={VanshColors.masi[300]}
                value={name}
                onChangeText={setName}
                maxLength={60}
                autoFocus
              />
            </View>

            {/* Event Type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeGrid}>
                {EVENT_TYPES.map((et) => (
                  <Pressable
                    key={et.type}
                    style={[
                      styles.typeChip,
                      eventType === et.type && styles.typeChipActive,
                    ]}
                    onPress={() => setEventType(et.type)}
                  >
                    <Text style={styles.typeChipEmoji}>{et.icon}</Text>
                    <Text
                      style={[
                        styles.typeChipLabel,
                        eventType === et.type && styles.typeChipLabelActive,
                      ]}
                    >
                      {et.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={VanshColors.masi[300]}
                value={eventDate}
                onChangeText={setEventDate}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Hyderabad, Grandma's house..."
                placeholderTextColor={VanshColors.masi[300]}
                value={location}
                onChangeText={setLocation}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Write a short note about this event..."
                placeholderTextColor={VanshColors.masi[300]}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && { opacity: 0.85 },
                (!name.trim() || isSubmitting) && { opacity: 0.5 },
              ]}
            >
              <LinearGradient
                colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <MaterialIcons
                  name="collections"
                  size={18}
                  color="#FFF"
                />
                <Text style={styles.submitText}>
                  {isSubmitting ? 'Creating...' : 'Create Album'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: VanshColors.khadi[50],
    borderTopLeftRadius: VanshRadius['2xl'],
    borderTopRightRadius: VanshRadius['2xl'],
    maxHeight: '85%',
    ...VanshShadows['2xl'],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: VanshColors.khadi[400],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: VanshSpacing.md,
    marginBottom: VanshSpacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: VanshSpacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  form: {
    paddingHorizontal: 20,
  },

  // Fields
  field: {
    marginBottom: VanshSpacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[600],
    marginBottom: VanshSpacing.xs,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    borderRadius: VanshRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: VanshColors.masi[800],
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },

  // Event type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: VanshRadius.full,
    backgroundColor: VanshColors.khadi[200],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: VanshColors.suvarna[50],
    borderColor: VanshColors.suvarna[400],
  },
  typeChipEmoji: {
    fontSize: 16,
  },
  typeChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: VanshColors.masi[500],
  },
  typeChipLabelActive: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },

  // Footer / Submit
  footer: {
    paddingHorizontal: 20,
    paddingTop: VanshSpacing.sm,
  },
  submitButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: VanshColors.suvarna[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
