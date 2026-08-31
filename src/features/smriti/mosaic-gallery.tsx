/**
 * 🪷 MOSAIC GALLERY - Pinterest-style masonry layout for memories
 *
 * Renders photos in a 2-column masonry grid where each tile height varies
 * based on a pseudo-random aspect ratio derived from the memory id.
 * Tiles alternate between small/medium/tall sizes for visual interest.
 * A beautiful, organic-feeling layout for browsing family photos.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import {
    Dimensions,
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
const NUM_COLUMNS = 2;
const COLUMN_GAP = VanshSpacing.sm;
const PADDING = VanshSpacing.lg;
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP) / NUM_COLUMNS;

// Tile height variations for masonry effect
const HEIGHT_RATIOS = [1.0, 1.4, 1.1, 1.6, 0.9, 1.3, 1.5, 1.0, 1.2, 1.4];

interface MosaicGalleryProps {
  memories: SmritiMedia[];
  onMemoryPress?: (memory: SmritiMedia) => void;
  onRefresh?: () => Promise<void>;
  ListHeaderComponent?: React.ReactElement;
}

export function MosaicGallery({
  memories,
  onMemoryPress,
  onRefresh,
  ListHeaderComponent,
}: MosaicGalleryProps) {
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

  // Split memories into two columns using a greedy shortest-column algo
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: { memory: SmritiMedia; height: number }[] = [];
    const right: { memory: SmritiMedia; height: number }[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    memories.forEach((memory, i) => {
      const ratio = HEIGHT_RATIOS[i % HEIGHT_RATIOS.length];
      const height = COLUMN_WIDTH * ratio;
      const tile = { memory, height };

      if (leftHeight <= rightHeight) {
        left.push(tile);
        leftHeight += height + COLUMN_GAP;
      } else {
        right.push(tile);
        rightHeight += height + COLUMN_GAP;
      }
    });

    return { leftColumn: left, rightColumn: right };
  }, [memories]);

  if (memories.length === 0) {
    return null;
  }

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
      <View style={styles.masonryContainer}>
        {/* Left column */}
        <View style={styles.column}>
          {leftColumn.map(({ memory, height }) => (
            <MosaicTile
              key={memory.id}
              memory={memory}
              height={height}
              onPress={() => onMemoryPress?.(memory)}
            />
          ))}
        </View>

        {/* Right column */}
        <View style={styles.column}>
          {rightColumn.map(({ memory, height }) => (
            <MosaicTile
              key={memory.id}
              memory={memory}
              height={height}
              onPress={() => onMemoryPress?.(memory)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────
// Mosaic Tile
// ─────────────────────────────────────────────────────────

interface MosaicTileProps {
  memory: SmritiMedia;
  height: number;
  onPress: () => void;
}

function MosaicTile({ memory, height, onPress }: MosaicTileProps) {
  const hasVoice = memory.linkedKathas && memory.linkedKathas.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { height },
        pressed && styles.tilePressed,
      ]}
    >
      <Image
        source={{ uri: memory.thumbnailUri || memory.uri }}
        style={styles.tileImage}
        contentFit="cover"
        placeholder={memory.blurhash}
        transition={200}
        recyclingKey={`mosaic-${memory.id}`}
        cachePolicy="memory-disk"
      />

      {/* Video badge */}
      {memory.type === 'video' && (
        <View style={styles.videoBadge}>
          <MaterialIcons name="play-circle-outline" size={22} color="#FFF" />
        </View>
      )}

      {/* Voice overlay badge */}
      {hasVoice && (
        <View style={styles.voiceBadge}>
          <MaterialIcons name="mic" size={12} color="#FFF" />
        </View>
      )}

      {/* Title or date */}
      {(memory.title || memory.capturedAt) && (
        <View style={styles.tileOverlay}>
          <Text style={styles.tileLabel} numberOfLines={1}>
            {memory.title || formatYear(memory.capturedAt)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function formatYear(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: {
    padding: PADDING,
    paddingBottom: 120,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  tile: {
    borderRadius: VanshRadius.lg,
    overflow: 'hidden',
    backgroundColor: VanshColors.khadi[200],
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBadge: {
    position: 'absolute',
    bottom: 30,
    left: 8,
    backgroundColor: VanshColors.suvarna[500],
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
});
