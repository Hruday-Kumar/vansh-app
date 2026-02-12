/**
 * 📋 MEMBER DETAIL SHEET - Simple Profile View
 * ═══════════════════════════════════════════════════════════
 * 
 * A beautiful, simple member profile view:
 * ✓ Stunning visual design
 * ✓ Works with our local-first FamilyMember type
 * ✓ Edit and delete actions
 * ✓ Relationship list
 * 
 * For laymen - simple and beautiful!
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import { QuickAddMember } from './quick-add-member';
import { useVrikshaStore, type FamilyMember } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface MemberDetailSheetProps {
  member: FamilyMember;
  visible: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export function MemberDetailSheet({
  member,
  visible,
  onClose
}: MemberDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const {
    members,
    relations,
    updateMember,
    deleteMember,
    getMemberRelationships,
    rootMemberId,
    setRootMember,
    findRelationship,
  } = useVrikshaStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<FamilyMember>(member);
  const [showAddRelative, setShowAddRelative] = useState(false);

  // Reset edited member when member changes
  React.useEffect(() => {
    setEditedMember(member);
    setIsEditing(false);
    setShowAddRelative(false);
  }, [member.id]);

  // Get member's relationships
  const memberRelationships = getMemberRelationships(member.id);

  // Get relationship to root
  const relationToRoot = rootMemberId && rootMemberId !== member.id
    ? findRelationship(rootMemberId, member.id)
    : null;

  // Handle save
  // Navigate to a related member
  const handleNavigateToMember = useCallback((memberId: string) => {
    const targetMember = members.get(memberId);
    if (targetMember) {
      setEditedMember(targetMember);
      setIsEditing(false);
      setShowAddRelative(false);
      // Re-trigger with new member by calling onClose and reopening
      // Actually, we can directly update the member prop context
      onClose();
      // Small delay so the sheet can re-open with new member
      setTimeout(() => {
        // Use store to set this as selected and trigger reopen externally
        // For now just close - the user can tap the member in the tree
      }, 100);
    }
  }, [members, onClose]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateMember(member.id, {
      firstName: editedMember.firstName,
      lastName: editedMember.lastName,
      bio: editedMember.bio,
      birthDate: editedMember.birthDate,
      deathDate: editedMember.deathDate,
      birthPlace: editedMember.birthPlace,
      avatarUri: editedMember.avatarUri,
      isAlive: editedMember.isAlive,
      gender: editedMember.gender,
      occupation: editedMember.occupation,
    });
    setIsEditing(false);
  }, [member.id, editedMember, updateMember]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      '🗑️ Delete Member?',
      `Are you sure you want to remove ${member.firstName} ${member.lastName} from your family tree? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteMember(member.id);
            onClose();
          }
        },
      ]
    );
  }, [member, deleteMember, onClose]);

  // Handle set as root (POV switch)
  const handleSetAsRoot = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRootMember(member.id);
    onClose(); // Close sheet and let tree re-render from new root
  }, [member, setRootMember, onClose]);

  // Get gradient colors based on gender
  const gradientColors = member.gender === 'male'
    ? ['#3B82F6', '#1D4ED8'] as const
    : ['#EC4899', '#BE185D'] as const;

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get initials
  const initials = (member.firstName?.[0] || '') + (member.lastName?.[0] || '');

  // Handle Pick Photo
  const handlePickPhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setEditedMember(prev => ({ ...prev, avatarUri: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={[styles.sheet, { paddingBottom: insets.bottom + VanshSpacing.md }]}
        >
          {/* ═══════════ HEADER ═══════════ */}
          <View style={styles.sheetHandle} />

          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Avatar */}
            {member.avatarUri ? (
              <Image source={{ uri: member.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}

            {/* Edit Photo Overlay */}
            {isEditing && (
              <TouchableOpacity
                style={styles.editPhotoOverlay}
                onPress={handlePickPhoto}
              >
                <View style={styles.editPhotoIcon}>
                  <MaterialIcons name="camera-alt" size={20} color={VanshColors.suvarna[700]} />
                </View>
              </TouchableOpacity>
            )}

            {/* Name */}
            <View style={styles.headerInfo}>
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editedMember.firstName}
                    onChangeText={(text) => setEditedMember({ ...editedMember, firstName: text })}
                    placeholder="First Name"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={editedMember.lastName}
                    onChangeText={(text) => setEditedMember({ ...editedMember, lastName: text })}
                    placeholder="Last Name"
                  />
                </View>
              ) : (
                <Text style={styles.memberName}>
                  {member.firstName} {member.lastName}
                </Text>
              )}

              {/* Life status */}
              {member.isAlive ? (
                <Text style={styles.lifeStatus}>🌿 Living</Text>
              ) : (
                <Text style={styles.lifeStatus}>🕯️ In Loving Memory</Text>
              )}

              {/* Relationship to root */}
              {relationToRoot && (
                <View style={styles.relationBadge}>
                  <Text style={styles.relationBadgeText}>{relationToRoot.label}</Text>
                </View>
              )}
            </View>

            {/* Header action buttons */}
            <View style={styles.headerActions}>
              {!isEditing && (
                <>
                  <TouchableOpacity 
                    style={styles.headerActionBtn}
                    onPress={() => setIsEditing(true)}
                  >
                    <MaterialIcons name="edit" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.headerActionBtn, { backgroundColor: 'rgba(239,68,68,0.4)' }]}
                    onPress={handleDelete}
                  >
                    <MaterialIcons name="delete" size={18} color="#FFF" />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.headerActionBtn} onPress={onClose}>
                <MaterialIcons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ═══════════ CONTENT ═══════════ */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Life Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Life Information</Text>

              {isEditing ? (
                <View style={styles.editFieldsContainer}>
                  <View style={styles.editFieldRow}>
                    <MaterialIcons name="cake" size={18} color={VanshColors.masi[400]} />
                    <TextInput
                      style={styles.editFieldInput}
                      value={editedMember.birthDate || ''}
                      onChangeText={(text) => setEditedMember({ ...editedMember, birthDate: text })}
                      placeholder="Birth Date (YYYY-MM-DD)"
                      placeholderTextColor={VanshColors.masi[400]}
                    />
                  </View>
                  
                  <View style={styles.editFieldRow}>
                    <MaterialIcons name="place" size={18} color={VanshColors.masi[400]} />
                    <TextInput
                      style={styles.editFieldInput}
                      value={editedMember.birthPlace || ''}
                      onChangeText={(text) => setEditedMember({ ...editedMember, birthPlace: text })}
                      placeholder="Birth Place"
                      placeholderTextColor={VanshColors.masi[400]}
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.aliveToggle}
                    onPress={() => setEditedMember({ ...editedMember, isAlive: !editedMember.isAlive })}
                  >
                    <MaterialIcons 
                      name={editedMember.isAlive ? "check-box" : "check-box-outline-blank"} 
                      size={22} 
                      color={editedMember.isAlive ? VanshColors.suvarna[500] : VanshColors.masi[400]} 
                    />
                    <Text style={styles.aliveToggleText}>
                      {editedMember.isAlive ? 'Living' : 'Deceased'}
                    </Text>
                  </TouchableOpacity>
                  
                  {!editedMember.isAlive && (
                    <View style={styles.editFieldRow}>
                      <MaterialIcons name="sentiment-neutral" size={18} color={VanshColors.masi[400]} />
                      <TextInput
                        style={styles.editFieldInput}
                        value={editedMember.deathDate || ''}
                        onChangeText={(text) => setEditedMember({ ...editedMember, deathDate: text })}
                        placeholder="Death Date (YYYY-MM-DD)"
                        placeholderTextColor={VanshColors.masi[400]}
                      />
                    </View>
                  )}
                  
                  {/* Gender picker */}
                  <View style={styles.genderPickerRow}>
                    <MaterialIcons name="person" size={18} color={VanshColors.masi[400]} />
                    <Text style={styles.genderPickerLabel}>Gender:</Text>
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderOption,
                          editedMember.gender === g && styles.genderOptionSelected,
                        ]}
                        onPress={() => setEditedMember({ ...editedMember, gender: g })}
                      >
                        <Text style={[
                          styles.genderOptionText,
                          editedMember.gender === g && styles.genderOptionTextSelected,
                        ]}>
                          {g === 'male' ? '👨 M' : g === 'female' ? '👩 F' : '🧑 O'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <View style={styles.editFieldRow}>
                    <MaterialIcons name="work" size={18} color={VanshColors.masi[400]} />
                    <TextInput
                      style={styles.editFieldInput}
                      value={editedMember.occupation || ''}
                      onChangeText={(text) => setEditedMember({ ...editedMember, occupation: text })}
                      placeholder="Occupation"
                      placeholderTextColor={VanshColors.masi[400]}
                    />
                  </View>
                  
                  <View style={styles.editFieldRow}>
                    <MaterialIcons name="notes" size={18} color={VanshColors.masi[400]} />
                    <TextInput
                      style={[styles.editFieldInput, styles.editFieldMultiline]}
                      value={editedMember.bio || ''}
                      onChangeText={(text) => setEditedMember({ ...editedMember, bio: text })}
                      placeholder="Bio / Notes"
                      placeholderTextColor={VanshColors.masi[400]}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.infoGrid}>
                  <InfoItem
                    icon="cake"
                    label="Born"
                    value={formatDate(member.birthDate)}
                  />
                  {!member.isAlive && (
                    <InfoItem
                      icon="sentiment-neutral"
                      label="Passed"
                      value={formatDate(member.deathDate)}
                    />
                  )}
                  <InfoItem
                    icon="place"
                    label="Birthplace"
                    value={member.birthPlace || '—'}
                  />
                  <InfoItem
                    icon="person"
                    label="Gender"
                    value={member.gender === 'male' ? '👨 Male' : member.gender === 'female' ? '👩 Female' : '🧑 Other'}
                  />
                  {member.occupation && (
                    <InfoItem
                      icon="work"
                      label="Occupation"
                      value={member.occupation}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Bio */}
            {member.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 About</Text>
                <Text style={styles.bioText}>{member.bio}</Text>
              </View>
            )}

            {/* Relationships */}
            {memberRelationships.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Connections</Text>

                {memberRelationships.map((rel, index) => {
                  const relatedMember = members.get(rel.memberId);
                  if (!relatedMember) return null;

                  return (
                    <TouchableOpacity
                      key={rel.memberId}
                      style={styles.relationItem}
                      onPress={() => handleNavigateToMember(rel.memberId)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.relationIcon}>
                        <Text style={styles.relationIconText}>
                          {rel.type === 'parent' ? '👆' :
                            rel.type === 'child' ? '👇' :
                              rel.type === 'spouse' ? '💕' :
                                rel.type === 'sibling' ? '👥' : '🔗'}
                        </Text>
                      </View>
                      <View style={styles.relationInfo}>
                        <Text style={styles.relationName}>
                          {relatedMember.firstName} {relatedMember.lastName}
                        </Text>
                        <Text style={styles.relationType}>
                          {rel.subtype
                            ? rel.subtype.charAt(0).toUpperCase() + rel.subtype.slice(1).replace(/-/g, ' ')
                            : rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={VanshColors.masi[300]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsSection}>
              {isEditing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditing(false);
                      setEditedMember(member);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <MaterialIcons name="check" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addRelativeButton]}
                    onPress={() => setShowAddRelative(true)}
                  >
                    <MaterialIcons name="person-add" size={20} color="#FFF" />
                    <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                      Add Relative to {member.firstName}
                    </Text>
                  </TouchableOpacity>

                  {rootMemberId !== member.id && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleSetAsRoot}
                    >
                      <MaterialIcons name="center-focus-strong" size={20} color={VanshColors.suvarna[600]} />
                      <Text style={styles.actionButtonText}>View Tree from Here</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <MaterialIcons name="edit" size={20} color={VanshColors.suvarna[600]} />
                    <Text style={styles.actionButtonText}>Edit Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
                    <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
                      Remove from Tree
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Add Relative Modal */}
      <QuickAddMember
        visible={showAddRelative}
        baseMember={member}
        onClose={() => setShowAddRelative(false)}
        onSuccess={() => setShowAddRelative(false)}
      />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <MaterialIcons name={icon as any} size={20} color={VanshColors.masi[400]} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: VanshColors.khadi[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: VanshSpacing.sm,
    marginBottom: VanshSpacing.sm,
  },

  // Header
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: VanshSpacing.lg,
    marginHorizontal: VanshSpacing.md,
    borderRadius: VanshRadius.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  editPhotoOverlay: {
    position: 'absolute',
    left: VanshSpacing.lg + 54,
    bottom: VanshSpacing.lg,
    zIndex: 10,
  },
  editPhotoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: VanshSpacing.md,
  },
  memberName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lifeStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  relationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  relationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    position: 'absolute',
    top: VanshSpacing.md,
    right: VanshSpacing.md,
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: VanshColors.masi[800],
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: VanshSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[700],
    marginBottom: VanshSpacing.md,
  },

  // Info Grid
  infoGrid: {
    gap: VanshSpacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
  },
  infoLabel: {
    fontSize: 11,
    color: VanshColors.masi[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: VanshColors.masi[700],
    fontWeight: '500',
  },

  // Bio
  bioText: {
    fontSize: 15,
    color: VanshColors.masi[600],
    lineHeight: 22,
  },

  // Relations
  relationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: VanshSpacing.sm,
    paddingHorizontal: VanshSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
  },
  relationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VanshColors.khadi[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationIconText: {
    fontSize: 20,
  },
  relationInfo: {
    flex: 1,
    marginLeft: VanshSpacing.sm,
  },
  relationName: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.masi[700],
  },
  relationType: {
    fontSize: 12,
    color: VanshColors.masi[500],
    marginTop: 2,
  },

  // Actions
  actionsSection: {
    padding: VanshSpacing.lg,
    gap: VanshSpacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: VanshSpacing.sm,
    backgroundColor: VanshColors.suvarna[50],
    paddingVertical: VanshSpacing.md,
    borderRadius: VanshRadius.lg,
    borderWidth: 1,
    borderColor: VanshColors.suvarna[200],
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.suvarna[700],
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  addRelativeButton: {
    backgroundColor: VanshColors.suvarna[500],
    borderColor: VanshColors.suvarna[600],
  },

  // Edit Fields
  editFieldsContainer: {
    gap: VanshSpacing.sm,
  },
  editFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.md,
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: 2,
    gap: VanshSpacing.sm,
  },
  editFieldInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: VanshColors.masi[800],
  },
  editFieldMultiline: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: VanshSpacing.sm,
  },
  aliveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
    paddingVertical: VanshSpacing.sm,
  },
  aliveToggleText: {
    fontSize: 15,
    color: VanshColors.masi[700],
    fontWeight: '500',
  },
  genderPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
    paddingVertical: VanshSpacing.sm,
  },
  genderPickerLabel: {
    fontSize: 14,
    color: VanshColors.masi[500],
    marginRight: 4,
  },
  genderOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: VanshColors.khadi[100],
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
  },
  genderOptionSelected: {
    backgroundColor: VanshColors.suvarna[100],
    borderColor: VanshColors.suvarna[500],
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: VanshColors.masi[600],
  },
  genderOptionTextSelected: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },

  editActions: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: VanshSpacing.md,
    borderRadius: VanshRadius.lg,
    backgroundColor: VanshColors.khadi[100],
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[600],
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: VanshSpacing.xs,
    paddingVertical: VanshSpacing.md,
    borderRadius: VanshRadius.lg,
    backgroundColor: VanshColors.suvarna[500],
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MemberDetailSheet;
