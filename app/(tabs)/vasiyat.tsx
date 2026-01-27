/**
 * 🪷 VASIYAT TAB - Wisdom vault screen
 */

import React, { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VasiyatCreator, VasiyatViewer, WisdomVault } from '../../src/features/vasiyat';
import { useVasiyats } from '../../src/hooks';
import { useAuthStore, useFamilyStore } from '../../src/state';
import type { Vasiyat } from '../../src/types';

type ViewMode = 'vault' | 'creator' | 'viewer';

export default function VasiyatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { family } = useFamilyStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('vault');
  const [selectedVasiyat, setSelectedVasiyat] = useState<Vasiyat | null>(null);
  
  // Use the API hook
  const { vasiyats, receivedVasiyats, isLoading, refresh, createVasiyat } = useVasiyats();
  
  // Combine created and received vasiyats
  const allVasiyats = [...vasiyats, ...receivedVasiyats];
  
  const handleVasiyatPress = useCallback((vasiyat: Vasiyat) => {
    setSelectedVasiyat(vasiyat);
    setViewMode('viewer');
  }, []);
  
  const handleCreated = useCallback(() => {
    setViewMode('vault');
    refresh();
  }, [refresh]);
  
  if (viewMode === 'creator') {
    return (
      <VasiyatCreator
        onClose={() => setViewMode('vault')}
        onCreated={handleCreated}
      />
    );
  }
  
  if (viewMode === 'viewer' && selectedVasiyat) {
    return (
      <VasiyatViewer
        vasiyat={selectedVasiyat}
        onClose={() => setViewMode('vault')}
      />
    );
  }
  
  return (
    <WisdomVault
      vasiyatList={allVasiyats}
      onVasiyatPress={handleVasiyatPress}
      onCreateNew={() => setViewMode('creator')}
    />
  );
}
