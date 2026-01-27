/**
 * 🪷 MEMBER PROFILE - Individual family member detail view
 */

import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText, SilkButton } from '../../components';
import { useFamilyStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { VrikshaMember } from '../../types';

interface MemberProfileProps {
  member: VrikshaMember;
  onClose: () => void;
  onViewMemories?: () => void;
  onViewKathas?: () => void;
  onChatWithEcho?: () => void;
}

export function MemberProfile({
  member,
  onClose,
  onViewMemories,
  onViewKathas,
  onChatWithEcho,
}: MemberProfileProps) {
  const insets = useSafeAreaInsets();
  const { getMember } = useFamilyStore();
  
  // Get relationships - safely handle undefined
  const relationships = (member.relationships || []).map(rel => {
    const relatedMember = getMember(rel.memberId);
    return { ...rel, member: relatedMember };
  }).filter(r => r.member);
  
  // Format life span
  const formatLifespan = () => {
    const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
    const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : null;
    
    if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
    if (birthYear && member.isAlive) return `Born ${birthYear}`;
    if (birthYear) return `${birthYear} - ?`;
    return null;
  };
  
  const lifespan = formatLifespan();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="✕" onPress={onClose} />
        <SacredText variant="title" color="primary">Profile</SacredText>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <MemberAvatar
            uri={member.avatarUri}
            name={`${member.firstName} ${member.lastName}`}
            size="xl"
            isAlive={member.isAlive}
            pranaStrength={member.isAlive ? 0.8 : 0}
          />
          
          <SacredText variant="heading" color="primary" align="center">
            {member.firstName} {member.lastName}
          </SacredText>
          
          {member.maidenName && (
            <SacredText variant="caption" color="muted" align="center">
              née {member.maidenName}
            </SacredText>
          )}
          
          {lifespan && (
            <SacredText variant="body" color="secondary" align="center">
              {lifespan}
            </SacredText>
          )}
          
          {member.nicknames && member.nicknames.length > 0 && (
            <SacredText variant="caption" color="gold" align="center">
              "{member.nicknames.join('", "')}"
            </SacredText>
          )}
        </View>
        
        {/* Bio */}
        {member.bio && (
          <HeritageCard variant="outlined" style={styles.section}>
            <SacredText variant="body" color="secondary">
              {member.bio}
            </SacredText>
          </HeritageCard>
        )}
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <SacredText variant="heading" color="gold">{member.memoryCount}</SacredText>
            <SacredText variant="caption" color="muted">Memories</SacredText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <SacredText variant="heading" color="gold">{member.kathaCount}</SacredText>
            <SacredText variant="caption" color="muted">Stories</SacredText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <SacredText variant="heading" color="gold">{relationships.length}</SacredText>
            <SacredText variant="caption" color="muted">Connections</SacredText>
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.actions}>
          {member.memoryCount > 0 && (
            <SilkButton
              variant="secondary"
              label="📸 View Memories"
              onPress={onViewMemories}
              fullWidth
            />
          )}
          
          {member.kathaCount > 0 && (
            <SilkButton
              variant="secondary"
              label="🎙️ Listen to Stories"
              onPress={onViewKathas}
              fullWidth
            />
          )}
          
          {!member.isAlive && member.hasVoiceSamples && (
            <SilkButton
              variant="primary"
              label="🪷 Connect with Digital Echo"
              onPress={onChatWithEcho}
              fullWidth
            />
          )}
        </View>
        
        {/* Relationships */}
        {relationships.length > 0 && (
          <View style={styles.section}>
            <SacredText variant="label" color="muted" style={styles.sectionTitle}>
              Family Connections
            </SacredText>
            
            {relationships.map((rel, index) => (
              <View key={index} style={styles.relationshipItem}>
                <MemberAvatar
                  uri={rel.member!.avatarUri}
                  name={`${rel.member!.firstName} ${rel.member!.lastName}`}
                  size="sm"
                  isAlive={rel.member!.isAlive}
                />
                <View style={styles.relationshipInfo}>
                  <SacredText variant="body" color="primary">
                    {rel.member!.firstName} {rel.member!.lastName}
                  </SacredText>
                  <SacredText variant="caption" color="muted">
                    {rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}
                  </SacredText>
                </View>
                {rel.prana && (
                  <View style={[styles.pranaBadge, { opacity: 0.4 + rel.prana.strength * 0.6 }]}>
                    <SacredText variant="caption" color="gold">
                      {Math.round(rel.prana.strength * 100)}%
                    </SacredText>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        
        {/* Location */}
        {(member.birthPlace || member.currentCity) && (
          <View style={styles.section}>
            <SacredText variant="label" color="muted" style={styles.sectionTitle}>
              Places
            </SacredText>
            
            {member.birthPlace && (
              <View style={styles.placeItem}>
                <SacredText variant="caption" color="muted">📍 Born in</SacredText>
                <SacredText variant="body" color="primary">{member.birthPlace}</SacredText>
              </View>
            )}
            
            {member.currentCity && member.isAlive && (
              <View style={styles.placeItem}>
                <SacredText variant="caption" color="muted">🏠 Lives in</SacredText>
                <SacredText variant="body" color="primary">{member.currentCity}</SacredText>
              </View>
            )}
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: VanshSpacing.xl,
    gap: VanshSpacing.xs,
  },
  section: {
    marginBottom: VanshSpacing.lg,
  },
  sectionTitle: {
    marginBottom: VanshSpacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: VanshColors.khadi[300],
  },
  actions: {
    gap: VanshSpacing.sm,
    marginBottom: VanshSpacing.xl,
  },
  relationshipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  relationshipInfo: {
    flex: 1,
  },
  pranaBadge: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
  },
  placeItem: {
    paddingVertical: VanshSpacing.xs,
  },
});
