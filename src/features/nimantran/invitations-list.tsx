/**
 * 🪷 INVITATIONS LIST - View all family invitations
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { VanshColors } from '../../theme';
import type { CeremonyType, Nimantran } from '../../types';

interface InvitationsListProps {
  invitations: Nimantran[];
  onInvitationPress: (invitation: Nimantran) => void;
  onCreateNew: () => void;
}

const ceremonyIcons: Record<CeremonyType, keyof typeof MaterialIcons.glyphMap> = {
  wedding: 'favorite',
  engagement: 'diamond',
  housewarming: 'home',
  baby_shower: 'child-care',
  birthday: 'cake',
  anniversary: 'celebration',
  puja: 'self-improvement',
  mundan: 'content-cut',
  thread_ceremony: 'auto-awesome',
  naming_ceremony: 'badge',
  graduation: 'school',
  retirement: 'beach-access',
  reunion: 'groups',
  festival: 'festival',
  other: 'event',
};

const ceremonyColors: Record<CeremonyType, string> = {
  wedding: '#E11D48',
  engagement: '#EC4899',
  housewarming: '#F59E0B',
  baby_shower: '#8B5CF6',
  birthday: '#3B82F6',
  anniversary: '#EF4444',
  puja: '#F97316',
  mundan: '#14B8A6',
  thread_ceremony: '#A855F7',
  naming_ceremony: '#06B6D4',
  graduation: '#10B981',
  retirement: '#6366F1',
  reunion: '#0EA5E9',
  festival: '#D97706',
  other: '#6B7280',
};

const ceremonyLabels: Record<CeremonyType, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  housewarming: 'Housewarming',
  baby_shower: 'Baby Shower',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  puja: 'Puja',
  mundan: 'Mundan',
  thread_ceremony: 'Thread Ceremony',
  naming_ceremony: 'Naming Ceremony',
  graduation: 'Graduation',
  retirement: 'Retirement',
  reunion: 'Family Reunion',
  festival: 'Festival',
  other: 'Event',
};

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const event = new Date(dateStr);
  const diff = event.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function InvitationsList({ invitations, onInvitationPress, onCreateNew }: InvitationsListProps) {
  const renderInvitation = useCallback(
    ({ item, index }: { item: Nimantran; index: number }) => {
      const icon = ceremonyIcons[item.ceremonyType] || 'event';
      const color = ceremonyColors[item.ceremonyType] || '#6B7280';
      const label = ceremonyLabels[item.ceremonyType] || 'Event';
      const daysUntil = getDaysUntil(item.eventDate);
      const isPast = daysUntil < 0;
      const isToday = daysUntil === 0;
      const isSoon = daysUntil > 0 && daysUntil <= 3;

      const acceptedCount = item.recipients.filter((r) => r.rsvpStatus === 'accepted').length;
      const totalRecipients = item.recipients.length;

      return (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
          <Pressable
            style={[styles.card, isPast && styles.cardPast]}
            onPress={() => onInvitationPress(item)}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            {/* Card image / icon header */}
            {item.cardUri || item.thumbnailUri ? (
              <Image
                source={{ uri: item.cardUri || item.thumbnailUri }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImagePlaceholder, { backgroundColor: color + '15' }]}>
                <MaterialIcons name={icon} size={40} color={color} />
              </View>
            )}

            <View style={styles.cardBody}>
              {/* Ceremony type badge */}
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                  <MaterialIcons name={icon} size={12} color={color} />
                  <Text style={[styles.typeBadgeText, { color }]}>{label}</Text>
                </View>
                {item.status === 'draft' && (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>Draft</Text>
                  </View>
                )}
                {isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today!</Text>
                  </View>
                )}
                {isSoon && !isToday && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>{daysUntil}d left</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={[styles.cardTitle, isPast && styles.cardTitlePast]} numberOfLines={2}>
                {item.title}
              </Text>

              {/* Date & Venue */}
              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={14} color={VanshColors.masi[400]} />
                <Text style={styles.infoText}>{formatEventDate(item.eventDate)}</Text>
                {item.eventTime && (
                  <Text style={styles.infoText}> • {item.eventTime}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="place" size={14} color={VanshColors.masi[400]} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.venue}
                </Text>
              </View>

              {/* RSVP summary */}
              {totalRecipients > 0 && (
                <View style={styles.rsvpRow}>
                  <MaterialIcons name="people" size={14} color={VanshColors.suvarna[600]} />
                  <Text style={styles.rsvpText}>
                    {acceptedCount}/{totalRecipients} accepted
                  </Text>
                </View>
              )}
            </View>

            {/* Video indicator */}
            {item.videoUri && (
              <View style={styles.videoIndicator}>
                <MaterialIcons name="play-circle-filled" size={20} color="#FFF" />
              </View>
            )}
          </Pressable>
        </Animated.View>
      );
    },
    [onInvitationPress]
  );

  if (invitations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="mail-outline" size={56} color={VanshColors.masi[300]} />
        <Text style={styles.emptyTitle}>No Invitations Yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first invitation to share with family
        </Text>
        <Pressable style={styles.emptyAction} onPress={onCreateNew}>
          <MaterialIcons name="add" size={18} color="#FFF" />
          <Text style={styles.emptyActionText}>Create Invitation</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={invitations}
      keyExtractor={(item) => item.id}
      renderItem={renderInvitation}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPast: {
    opacity: 0.6,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardBody: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  todayBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  soonBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: 8,
  },
  cardTitlePast: {
    color: VanshColors.masi[400],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: VanshColors.masi[500],
  },
  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[100],
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },
  videoIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[700],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    textAlign: 'center',
    marginTop: 6,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: VanshColors.suvarna[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
