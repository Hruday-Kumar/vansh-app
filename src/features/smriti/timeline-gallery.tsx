/**
 * 🪷 TIMELINE GALLERY - Chronological timeline view of memories
 *
 * Groups memories by year/era and displays them in a vertical timeline
 * with a left-side time rail, year markers, and horizontal photo strips.
 * Perfect for viewing the family's journey through time.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { SmritiMedia } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = 90;
const RAIL_WIDTH = 48;

interface TimelineGroup {
  year: number;
  label: string;
  memories: SmritiMedia[];
}

interface TimelineGalleryProps {
  memories: SmritiMedia[];
  onMemoryPress?: (memory: SmritiMedia) => void;
  onRefresh?: () => Promise<void>;
  ListHeaderComponent?: React.ReactElement;
}

export function TimelineGallery({
  memories,
  onMemoryPress,
  onRefresh,
  ListHeaderComponent,
}: TimelineGalleryProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (err) {
        console.error('Refresh failed:', err);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  // Group memories by year, sorted newest first
  const groups: TimelineGroup[] = useMemo(() => {
    const yearMap = new Map<number, SmritiMedia[]>();

    memories.forEach((m) => {
      let year: number;
      if (m.capturedAt) {
        year = new Date(m.capturedAt).getFullYear();
      } else if (m.era?.startYear) {
        year = m.era.startYear;
      } else {
        try {
          year = new Date(m.uploadedAt).getFullYear();
        } catch {
          year = new Date().getFullYear();
        }
      }
      if (isNaN(year)) year = new Date().getFullYear();
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(m);
    });

    return Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0]) // newest first
      .map(([year, mems]) => ({
        year,
        label: getDecadeLabel(year),
        memories: mems,
      }));
  }, [memories]);

  if (memories.length === 0) return null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={VanshColors.suvarna[500]}
            colors={[VanshColors.suvarna[500]]}
          />
        ) : undefined
      }
    >
      {ListHeaderComponent}

      {/* Timeline label */}
      <View style={styles.timelineHeader}>
        <MaterialIcons name="timeline" size={18} color={VanshColors.suvarna[600]} />
        <Text style={styles.timelineHeaderText}>Family Timeline</Text>
        <Text style={styles.timelineHeaderSub}>
          {groups.length > 0
            ? `${groups[groups.length - 1].year} – ${groups[0].year}`
            : ''}
        </Text>
      </View>

      {/* Year groups */}
      {groups.map((group, gi) => (
        <View key={group.year} style={styles.yearGroup}>
          {/* Timeline rail */}
          <View style={styles.rail}>
            {/* Dot */}
            <View
              style={[
                styles.railDot,
                gi === 0 && styles.railDotFirst,
              ]}
            />
            {/* Connecting line */}
            {gi < groups.length - 1 && <View style={styles.railLine} />}
          </View>

          {/* Content */}
          <View style={styles.yearContent}>
            {/* Year header */}
            <View style={styles.yearHeader}>
              <Text style={styles.yearText}>{group.year}</Text>
              <Text style={styles.yearCount}>
                {group.memories.length}{' '}
                {group.memories.length === 1 ? 'memory' : 'memories'}
              </Text>
            </View>

            {/* Horizontal photo strip */}
            <FlatList
              data={group.memories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.photoStrip}
              renderItem={({ item }) => (
                <TimelineThumbnail
                  memory={item}
                  onPress={() => onMemoryPress?.(item)}
                />
              )}
            />
          </View>
        </View>
      ))}

      {/* End cap */}
      {groups.length > 0 && (
        <View style={styles.endCap}>
          <View style={styles.rail}>
            <View style={styles.railDotEnd} />
          </View>
          <View style={styles.endCapContent}>
            <Text style={styles.endCapText}>
              Beginning of your family&apos;s digital archive
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────
// Timeline Thumbnail
// ─────────────────────────────────────────────────────────

interface TimelineThumbnailProps {
  memory: SmritiMedia;
  onPress: () => void;
}

function TimelineThumbnail({ memory, onPress }: TimelineThumbnailProps) {
  const month = memory.capturedAt
    ? new Date(memory.capturedAt).toLocaleDateString('en-IN', { month: 'short' })
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.thumb,
        pressed && styles.thumbPressed,
      ]}
    >
      <Image
        source={{ uri: memory.thumbnailUri || memory.uri }}
        style={styles.thumbImage}
        contentFit="cover"
        placeholder={memory.blurhash}
        transition={150}
        recyclingKey={`tl-${memory.id}`}
        cachePolicy="memory-disk"
      />

      {/* Video indicator */}
      {memory.type === 'video' && (
        <View style={styles.thumbVideoIcon}>
          <MaterialIcons name="play-arrow" size={14} color="#FFF" />
        </View>
      )}

      {/* Month label */}
      {month && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.thumbGradient}
        >
          <Text style={styles.thumbMonth}>{month}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function getDecadeLabel(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: VanshSpacing.lg,
    paddingBottom: 120,
  },

  // Header
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: VanshSpacing.lg,
    paddingBottom: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  timelineHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  timelineHeaderSub: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginLeft: 'auto',
  },

  // Year group
  yearGroup: {
    flexDirection: 'row',
    marginBottom: VanshSpacing.lg,
  },

  // Rail
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
    paddingTop: 4,
  },
  railDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: VanshColors.suvarna[400],
    borderWidth: 2,
    borderColor: VanshColors.suvarna[200],
    zIndex: 1,
  },
  railDotFirst: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: VanshColors.suvarna[600],
    borderWidth: 3,
    borderColor: VanshColors.suvarna[200],
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: VanshColors.suvarna[200],
    marginTop: 4,
  },
  railDotEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: VanshColors.masi[300],
    borderWidth: 2,
    borderColor: VanshColors.khadi[200],
  },

  // Year content
  yearContent: {
    flex: 1,
    paddingLeft: VanshSpacing.sm,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: VanshSpacing.sm,
  },
  yearText: {
    fontSize: 22,
    fontWeight: '800',
    color: VanshColors.masi[800],
    letterSpacing: -0.5,
  },
  yearCount: {
    fontSize: 12,
    fontWeight: '500',
    color: VanshColors.masi[400],
  },

  // Photo strip
  photoStrip: {
    gap: VanshSpacing.xs,
    paddingRight: VanshSpacing.sm,
  },

  // Thumbnail
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: VanshRadius.md,
    overflow: 'hidden',
    backgroundColor: VanshColors.khadi[200],
  },
  thumbPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbVideoIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  thumbMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },

  // End cap
  endCap: {
    flexDirection: 'row',
    paddingBottom: VanshSpacing.xl,
  },
  endCapContent: {
    flex: 1,
    paddingLeft: VanshSpacing.sm,
    paddingTop: 2,
  },
  endCapText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: VanshColors.masi[400],
  },
});
