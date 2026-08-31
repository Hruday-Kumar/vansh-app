/**
 * 🪷 EVENT LIST - Horizontal scrollable event album cards
 * 
 * Shows family events as album cards in a horizontal scroll.
 * Each card shows cover photo, event name, date, and media count.
 * A "+ New Event" card at the end triggers event creation.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import type { EventType, FamilyEvent } from '../../types';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 180;

// Event type icons and labels
const EVENT_TYPE_CONFIG: Record<EventType, { icon: string; color: string }> = {
  wedding: { icon: '💍', color: VanshColors.sindoor[500] },
  birthday: { icon: '🎂', color: VanshColors.suvarna[500] },
  festival: { icon: '🪔', color: VanshColors.suvarna[600] },
  reunion: { icon: '👨‍👩‍👧‍👦', color: VanshColors.masi[600] },
  trip: { icon: '✈️', color: '#4A90D9' },
  ceremony: { icon: '🙏', color: VanshColors.sindoor[400] },
  milestone: { icon: '🌟', color: VanshColors.suvarna[500] },
  other: { icon: '📸', color: VanshColors.masi[500] },
};

interface EventListProps {
  events: FamilyEvent[];
  onEventPress: (event: FamilyEvent) => void;
  onCreatePress: () => void;
}

export function EventList({ events, onEventPress, onCreatePress }: EventListProps) {
  const renderEvent = useCallback(({ item }: { item: FamilyEvent }) => (
    <EventCard event={item} onPress={() => onEventPress(item)} />
  ), [onEventPress]);

  const keyExtractor = useCallback((item: FamilyEvent) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialIcons name="collections" size={18} color={VanshColors.suvarna[600]} />
          <Text style={styles.sectionTitle}>Event Albums</Text>
        </View>
        <Text style={styles.sectionCount}>{events.length} albums</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <CreateEventCard onPress={onCreatePress} />
        }
        ListEmptyComponent={null}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Event Card Component
// ─────────────────────────────────────────────────────────

interface EventCardProps {
  event: FamilyEvent;
  onPress: () => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.other;
  const totalMedia = event.memoryCount + event.videoCount;

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Cover Image or Placeholder */}
      {event.coverUri ? (
        <Image
          source={{ uri: event.coverUri }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.cardPlaceholder, { backgroundColor: config.color + '20' }]}>
          <Text style={styles.placeholderEmoji}>{config.icon}</Text>
        </View>
      )}

      {/* Gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.cardGradient}
      />

      {/* Event type badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{config.icon}</Text>
      </View>

      {/* Card info overlay */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {event.name}
        </Text>
        <View style={styles.cardMeta}>
          {formattedDate ? (
            <Text style={styles.cardDate}>{formattedDate}</Text>
          ) : null}
          <Text style={styles.cardCount}>
            {totalMedia} {totalMedia === 1 ? 'memory' : 'memories'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────
// Create Event Card
// ─────────────────────────────────────────────────────────

function CreateEventCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.createCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.createIconWrapper}>
        <LinearGradient
          colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createIconGradient}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </View>
      <Text style={styles.createText}>New Album</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: VanshSpacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: VanshSpacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  sectionCount: {
    fontSize: 12,
    color: VanshColors.masi[400],
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // Event card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: VanshRadius.lg,
    overflow: 'hidden',
    backgroundColor: VanshColors.khadi[200],
    ...VanshShadows.md,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  typeBadge: {
    position: 'absolute',
    top: VanshSpacing.xs,
    right: VanshSpacing.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 14,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: VanshSpacing.sm,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  cardDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  cardCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },

  // Create card
  createCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: VanshRadius.lg,
    borderWidth: 2,
    borderColor: VanshColors.suvarna[200],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.suvarna[50],
    gap: VanshSpacing.sm,
  },
  createIconWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  createIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    fontSize: 12,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },
});
