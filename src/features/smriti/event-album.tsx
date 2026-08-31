/**
 * 🪷 EVENT ALBUM - Full detail screen for an event
 * 
 * Shows:
 * - Hero cover image with gradient overlay
 * - Event metadata (name, type, date, location, counts)
 * - Media grid (photos & videos filtered from event memories)
 * - FAB to add more media to the event
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import type { EventType, FamilyEvent, SmritiMedia } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_GAP = 3;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const HERO_HEIGHT = 240;

const EVENT_TYPE_LABELS: Record<EventType, { icon: string; label: string }> = {
  wedding: { icon: '💍', label: 'Wedding' },
  birthday: { icon: '🎂', label: 'Birthday' },
  festival: { icon: '🪔', label: 'Festival' },
  reunion: { icon: '👨‍👩‍👧‍👦', label: 'Reunion' },
  trip: { icon: '✈️', label: 'Trip' },
  ceremony: { icon: '🙏', label: 'Ceremony' },
  milestone: { icon: '🌟', label: 'Milestone' },
  other: { icon: '📸', label: 'Other' },
};

type MediaFilter = 'all' | 'photo' | 'video';

interface EventAlbumProps {
  event: FamilyEvent;
  onClose: () => void;
  onMemoryPress: (memory: SmritiMedia) => void;
  onAddMedia: () => void;
  loadEventMemories: (eventId: string, filters?: { type?: string; page?: number }) => Promise<{ memories: SmritiMedia[]; meta?: any }>;
}

export function EventAlbum({
  event,
  onClose,
  onMemoryPress,
  onAddMedia,
  loadEventMemories,
}: EventAlbumProps) {
  const insets = useSafeAreaInsets();
  const [memories, setMemories] = useState<SmritiMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<MediaFilter>('all');

  const typeConfig = EVENT_TYPE_LABELS[event.eventType] || EVENT_TYPE_LABELS.other;
  const totalMedia = event.memoryCount + event.videoCount;

  // Load memories for this event
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const typeParam = filter === 'all' ? undefined : filter;
        const result = await loadEventMemories(event.id, { type: typeParam });
        if (!cancelled) {
          setMemories(result.memories || []);
        }
      } catch (_err) {
        if (!cancelled) setMemories([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [event.id, filter, loadEventMemories]);

  const formattedDate = useMemo(() => {
    if (!event.eventDate) return '';
    const d = new Date(event.eventDate);
    const parts = [
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    ];
    if (event.eventEndDate) {
      const end = new Date(event.eventEndDate);
      parts.push(' — ' + end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
    }
    return parts.join('');
  }, [event.eventDate, event.eventEndDate]);

  const renderMemory = useCallback(({ item, index }: { item: SmritiMedia; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
      <Pressable
        onPress={() => onMemoryPress(item)}
        style={({ pressed }) => [
          styles.thumbContainer,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Image
          source={{ uri: item.thumbnailUri || item.uri }}
          style={styles.thumbImage}
          contentFit="cover"
          transition={150}
          recyclingKey={`evt-${item.id}`}
          cachePolicy="memory-disk"
        />
        {item.type === 'video' && (
          <View style={styles.videoIndicator}>
            <MaterialIcons name="play-circle-outline" size={22} color="#FFF" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  ), [onMemoryPress]);

  const keyExtractor = useCallback((item: SmritiMedia) => item.id, []);

  const ListHeader = useMemo(() => (
    <View>
      {/* Hero cover */}
      <View style={styles.hero}>
        {event.coverUri ? (
          <Image
            source={{ uri: event.coverUri }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderEmoji}>{typeConfig.icon}</Text>
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.4, 1]}
          style={styles.heroGradient}
        />

        {/* Back button */}
        <Pressable
          onPress={onClose}
          style={[styles.backButton, { top: insets.top + VanshSpacing.sm }]}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>

        {/* Hero info */}
        <View style={[styles.heroInfo, { paddingBottom: VanshSpacing.lg }]}>
          <View style={styles.heroTypeBadge}>
            <Text style={styles.heroTypeBadgeIcon}>{typeConfig.icon}</Text>
            <Text style={styles.heroTypeBadgeLabel}>{typeConfig.label}</Text>
          </View>
          <Text style={styles.heroTitle}>{event.name}</Text>
          <View style={styles.heroMetaRow}>
            {formattedDate ? (
              <View style={styles.heroMetaItem}>
                <MaterialIcons name="event" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{formattedDate}</Text>
              </View>
            ) : null}
            {event.location ? (
              <View style={styles.heroMetaItem}>
                <MaterialIcons name="place" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{event.location}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{event.memoryCount}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{event.videoCount}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalMedia}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Description */}
      {event.description ? (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>
      ) : null}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'photo', 'video'] as MediaFilter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'photo' ? '📷 Photos' : '🎬 Videos'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  ), [event, typeConfig, formattedDate, filter, insets.top, onClose, totalMedia]);

  return (
    <View style={styles.container}>
      <FlatList
        data={memories}
        renderItem={renderMemory}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
              <Text style={styles.loadingText}>Loading memories...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>No memories yet</Text>
              <Text style={styles.emptySubtitle}>
                Add photos and videos to this album
              </Text>
            </View>
          )
        }
      />

      {/* FAB - Add Media */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + VanshSpacing.lg }]}
        onPress={onAddMedia}
      >
        <LinearGradient
          colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add-a-photo" size={24} color="#FFF" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  gridContent: {
    paddingBottom: 100,
  },
  gridRow: {
    gap: ITEM_GAP,
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: VanshColors.masi[800],
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.masi[700],
  },
  heroPlaceholderEmoji: {
    fontSize: 56,
    opacity: 0.6,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: VanshSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: VanshSpacing.lg,
  },
  heroTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: VanshRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: VanshSpacing.xs,
  },
  heroTypeBadgeIcon: {
    fontSize: 14,
  },
  heroTypeBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
    marginBottom: VanshSpacing.xs,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: VanshSpacing.md,
    marginHorizontal: VanshSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: VanshColors.khadi[300],
  },

  // Description
  descriptionSection: {
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
  },
  descriptionText: {
    fontSize: 14,
    color: VanshColors.masi[600],
    lineHeight: 20,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: VanshSpacing.lg,
    paddingBottom: VanshSpacing.md,
    gap: VanshSpacing.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: VanshRadius.full,
    backgroundColor: VanshColors.khadi[200],
  },
  filterChipActive: {
    backgroundColor: VanshColors.suvarna[100],
    borderWidth: 1,
    borderColor: VanshColors.suvarna[400],
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: VanshColors.masi[500],
  },
  filterChipTextActive: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },

  // Thumbnails
  thumbContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: VanshColors.khadi[200],
    marginBottom: ITEM_GAP,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: VanshSpacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[700],
  },
  emptySubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: VanshSpacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: VanshColors.masi[400],
  },

  // FAB
  fab: {
    position: 'absolute',
    right: VanshSpacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    ...VanshShadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
