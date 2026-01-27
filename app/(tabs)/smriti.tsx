/**
 * 🪷 SMRITI TAB - Memories screen
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SacredText, SilkButton } from '../../src/components';
import { MemoryGallery, MemoryUpload, MemoryViewer } from '../../src/features/smriti';
import { useMemories } from '../../src/hooks';
import { VanshColors, VanshSpacing } from '../../src/theme';
import type { SmritiMedia } from '../../src/types';

type ViewMode = 'gallery' | 'viewer' | 'upload';

export default function SmritiScreen() {
  const insets = useSafeAreaInsets();
  
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedMemory, setSelectedMemory] = useState<SmritiMedia | null>(null);
  
  // Use API hook
  const { memories, isLoading, refresh } = useMemories();
  
  const handleMemoryPress = useCallback((memory: SmritiMedia) => {
    setSelectedMemory(memory);
    setViewMode('viewer');
  }, []);
  
  const handleUploadComplete = useCallback((memoryId: string) => {
    setViewMode('gallery');
    refresh(); // Refresh the memories list
  }, [refresh]);
  
  if (viewMode === 'viewer' && selectedMemory) {
    return (
      <MemoryViewer
        memory={selectedMemory}
        onClose={() => setViewMode('gallery')}
      />
    );
  }
  
  if (viewMode === 'upload') {
    return (
      <MemoryUpload
        onCancel={() => setViewMode('gallery')}
        onComplete={() => {
          handleUploadComplete('');
        }}
      />
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <SacredText variant="displaySmall" color="gold">Smriti</SacredText>
          <SacredText variant="caption" color="muted">स्मृति - Sacred Memories</SacredText>
        </View>
        <SilkButton
          variant="secondary"
          label="+ Add"
          onPress={() => setViewMode('upload')}
        />
      </View>
      
      {/* Gallery - uses store internally */}
      <MemoryGallery
        onMemoryPress={handleMemoryPress}
        onRefresh={async () => { await refresh(); }}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
});
