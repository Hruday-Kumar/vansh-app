/**
 * 🪷 MEMORY GALLERY - Grid view of family memories
 */

import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import { SacredText } from '../../components';
import { useMemoryStore, useUIStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { SmritiMedia } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_GAP = VanshSpacing.xs;
const ITEM_SIZE = (SCREEN_WIDTH - VanshSpacing.lg * 2 - ITEM_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface MemoryGalleryProps {
  memories?: SmritiMedia[];
  onMemoryPress?: (memory: SmritiMedia) => void;
  onRefresh?: () => Promise<void>;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
}

export function MemoryGallery({
  memories: memoriesProp,
  onMemoryPress,
  onRefresh,
  ListHeaderComponent,
}: MemoryGalleryProps) {
  const { recentMemories, filters } = useMemoryStore();
  const displayMemories = memoriesProp ?? recentMemories;
  const { openModal } = useUIStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Group memories by era/month
  const groupedMemories = useMemo(() => {
    return displayMemories;
  }, [displayMemories]);
  
  const handleMemoryPress = useCallback((memory: SmritiMedia) => {
    if (onMemoryPress) {
      onMemoryPress(memory);
    } else {
      openModal('memory-viewer', { memoryId: memory.id });
    }
  }, [onMemoryPress, openModal]);
  
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  }, [onRefresh]);
  
  const renderItem = useCallback(({ item, index }: { item: SmritiMedia; index: number }) => (
    <MemoryThumbnail
      memory={item}
      onPress={() => handleMemoryPress(item)}
      index={index}
    />
  ), [handleMemoryPress]);
  
  const keyExtractor = useCallback((item: SmritiMedia) => item.id, []);
  
  if (displayMemories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <SacredText variant="hero" color="gold" align="center">
          🪷
        </SacredText>
        <SacredText variant="title" color="primary" align="center">
          No Memories Yet
        </SacredText>
        <SacredText variant="body" color="secondary" align="center" style={styles.emptyText}>
          Begin preserving your family&apos;s heritage by adding the first memory.
        </SacredText>
      </View>
    );
  }
  
  return (
    <FlatList
      data={groupedMemories}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      removeClippedSubviews={true}
      windowSize={5}
      maxToRenderPerBatch={9}
      initialNumToRender={12}
      getItemLayout={(_data, index) => ({
        length: ITEM_SIZE + ITEM_GAP,
        offset: (ITEM_SIZE + ITEM_GAP) * Math.floor(index / NUM_COLUMNS),
        index,
      })}
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
    />
  );
}

// ─────────────────────────────────────────────────────────
// Memory Thumbnail Component
// ─────────────────────────────────────────────────────────

interface MemoryThumbnailProps {
  memory: SmritiMedia;
  onPress: () => void;
  index: number;
}

function MemoryThumbnail({ memory, onPress, index }: MemoryThumbnailProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.thumbnail,
        pressed && styles.thumbnailPressed,
      ]}
    >
      <Image
        source={{ uri: memory.thumbnailUri || memory.uri }}
        style={styles.thumbnailImage}
        contentFit="cover"
        placeholder={memory.blurhash}
        transition={150}
        recyclingKey={`thumb-${memory.id}`}
        cachePolicy="memory-disk"
      />
        
        {/* Type indicator */}
        {memory.type === 'video' && (
          <View style={styles.typeIndicator}>
            <SacredText variant="caption" style={styles.typeIcon}>▶</SacredText>
          </View>
        )}
        
        {/* Voice overlay indicator */}
        {memory.linkedKathas && memory.linkedKathas.length > 0 && (
          <View style={styles.voiceIndicator}>
            <SacredText variant="caption" style={styles.voiceIcon}>🎙️</SacredText>
          </View>
        )}
        
        {/* Date overlay */}
        {memory.capturedAt && (
          <View style={styles.dateOverlay}>
            <SacredText variant="timestamp" style={styles.dateText}>
              {new Date(memory.capturedAt).getFullYear()}
            </SacredText>
          </View>
        )}
      </Pressable>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: VanshSpacing.lg,
    paddingBottom: 120,
  },
  row: {
    gap: ITEM_GAP,
    marginBottom: ITEM_GAP,
  },
  thumbnail: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: VanshRadius.md,
    overflow: 'hidden',
    backgroundColor: VanshColors.khadi[200],
  },
  thumbnailPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  typeIndicator: {
    position: 'absolute',
    top: VanshSpacing.xs,
    right: VanshSpacing.xs,
    backgroundColor: VanshColors.overlay.dark,
    borderRadius: VanshRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeIcon: {
    color: VanshColors.khadi[50],
    fontSize: 10,
  },
  voiceIndicator: {
    position: 'absolute',
    bottom: VanshSpacing.xs,
    left: VanshSpacing.xs,
    backgroundColor: VanshColors.suvarna[500],
    borderRadius: VanshRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    fontSize: 12,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: VanshColors.overlay.dark,
  },
  dateText: {
    color: VanshColors.khadi[100],
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
  },
  emptyText: {
    marginTop: VanshSpacing.md,
    maxWidth: 280,
  },
});
