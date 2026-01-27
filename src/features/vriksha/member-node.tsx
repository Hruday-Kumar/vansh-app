/**
 * 🌳 MEMBER NODE COMPONENT
 * ═══════════════════════════════════════════════════════════
 * 
 * Individual family member card for the tree visualization
 * Features:
 * ✓ Photo or gender icon
 * ✓ Name and birth year
 * ✓ Relationship label to root (e.g., "Father", "Grandchild")
 * ✓ Living/deceased indicator
 * ✓ Gender-based border colors
 */

import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LayoutNode } from './types';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

interface MemberNodeProps {
  node: LayoutNode;
  isRoot: boolean;
  isSelected: boolean;
  onPress: (node: LayoutNode) => void;
  onLongPress?: (node: LayoutNode) => void;
}

// ═══════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════

const COLORS = {
  maleBg: '#DBEAFE',       // Light blue
  maleBorder: '#3B82F6',   // Blue
  femaleBg: '#FCE7F3',     // Light pink
  femaleBorder: '#EC4899', // Pink
  deceased: '#6B7280',     // Gray
  deceasedBg: '#F3F4F6',   // Light gray
  root: '#D97706',         // Amber/Gold for root
  selected: '#10B981',     // Emerald
  text: '#1F2937',         // Dark gray
  muted: '#6B7280',        // Gray
  relationBg: '#FEF3C7',   // Light amber for relation label
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export const MemberNode = memo(function MemberNode({
  node,
  isRoot,
  isSelected,
  onPress,
  onLongPress,
}: MemberNodeProps) {
  const person = node.person;
  const isAlive = person?.isAlive ?? true;
  
  // Determine colors based on gender and alive status
  const bgColor = !isAlive 
    ? COLORS.deceasedBg 
    : node.gender === 'male' 
      ? COLORS.maleBg 
      : COLORS.femaleBg;
      
  const borderColor = isRoot 
    ? COLORS.root 
    : isSelected 
      ? COLORS.selected 
      : !isAlive 
        ? COLORS.deceased 
        : node.gender === 'male' 
          ? COLORS.maleBorder 
          : COLORS.femaleBorder;
  
  // Get display name
  const displayName = person 
    ? `${person.firstName}${person.lastName ? ` ${person.lastName.charAt(0)}.` : ''}`
    : 'Unknown';
  
  // Get birth year
  const birthYear = person?.birthDate ? new Date(person.birthDate).getFullYear() : null;
  const deathYear = person?.deathDate ? new Date(person.deathDate).getFullYear() : null;
  
  // Get life span display
  let lifeSpan = '';
  if (birthYear) {
    if (deathYear) {
      lifeSpan = `${birthYear} - ${deathYear}`;
    } else if (!isAlive) {
      lifeSpan = `b. ${birthYear}`;
    } else {
      lifeSpan = `b. ${birthYear}`;
    }
  }
  
  // Get gender icon
  const genderIcon = node.gender === 'male' ? '👨' : node.gender === 'female' ? '👩' : '🧑';
  
  // Get relationship label
  const relationLabel = isRoot ? 'YOU' : (node.relationToRoot || '');
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
        isRoot && styles.rootContainer,
        isSelected && styles.selectedContainer,
      ]}
      onPress={() => onPress(node)}
      onLongPress={() => onLongPress?.(node)}
      activeOpacity={0.8}
    >
      {/* Root Badge (ME badge) */}
      {isRoot && (
        <View style={styles.rootBadge}>
          <Text style={styles.rootBadgeText}>ME</Text>
        </View>
      )}
      
      {/* Deceased Indicator */}
      {!isAlive && (
        <View style={styles.deceasedBadge}>
          <Text style={styles.deceasedBadgeText}>🕯️</Text>
        </View>
      )}
      
      {/* Avatar */}
      <View style={[styles.avatar, { borderColor }]}>
        {person?.photoUri ? (
          <Image source={{ uri: person.photoUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarEmoji}>{genderIcon}</Text>
        )}
      </View>
      
      {/* Name */}
      <Text style={[styles.name, !isAlive && styles.deceasedText]} numberOfLines={2}>
        {displayName}
      </Text>
      
      {/* Life Span */}
      {lifeSpan !== '' && (
        <Text style={styles.lifeSpan}>{lifeSpan}</Text>
      )}
      
      {/* Relationship Label (e.g., "Father", "Grandchild") */}
      {relationLabel !== '' && !isRoot && (
        <View style={styles.relationBadge}>
          <Text style={styles.relationText}>{relationLabel}</Text>
        </View>
      )}
      
      {/* Location or Occupation (optional, if space allows) */}
      {(person?.currentCity && isSelected) && (
        <Text style={styles.detail} numberOfLines={1}>
          📍 {person.currentCity}
        </Text>
      )}
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    width: 110,
    minHeight: 130,
    borderRadius: 12,
    borderWidth: 2.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  rootContainer: {
    borderWidth: 3,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  selectedContainer: {
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  
  // Root Badge
  rootBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -16,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
  },
  rootBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  
  // Deceased Badge
  deceasedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 10,
  },
  deceasedBadgeText: {
    fontSize: 14,
  },
  
  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  
  // Text
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  deceasedText: {
    color: COLORS.deceased,
  },
  lifeSpan: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 2,
  },
  
  // Relationship Badge
  relationBadge: {
    marginTop: 4,
    backgroundColor: COLORS.relationBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relationText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Detail
  detail: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});
