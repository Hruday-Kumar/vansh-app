/**
 * 🪷 PARAMPARA TAB - Family traditions screen
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SacredText, SilkButton } from '../../src/components';
import { TraditionCreator, TraditionDetail, TraditionsList } from '../../src/features/parampara';
import { useTraditions } from '../../src/hooks';
import { VanshColors, VanshSpacing } from '../../src/theme';
import type { Parampara } from '../../src/types';

type ViewMode = 'list' | 'detail' | 'create';

// Mock data for development fallback
const mockTraditions: Parampara[] = [
  {
    id: 'par_1' as any,
    familyId: 'fam_1' as any,
    name: 'Diwali Puja',
    type: 'puja',
    description: 'Our family\'s special way of celebrating the festival of lights.',
    frequency: 'yearly',
    occasion: 'Diwali',
    steps: [
      { order: 1, instruction: 'Clean the house and decorate with rangoli' },
      { order: 2, instruction: 'Light diyas in every room at sunset' },
      { order: 3, instruction: 'Perform Lakshmi puja together' },
      { order: 4, instruction: 'Exchange sweets and gifts' },
    ],
    photos: [],
    videos: [],
    performedBy: [],
    atRisk: false,
  },
  {
    id: 'par_2' as any,
    familyId: 'fam_1' as any,
    name: 'Grandma\'s Secret Kheer',
    type: 'recipe',
    description: 'A special rice pudding recipe passed down through generations.',
    frequency: 'monthly',
    originStory: 'My grandmother learned this from her mother in Punjab.',
    steps: [
      { order: 1, instruction: 'Soak rice for 30 minutes' },
      { order: 2, instruction: 'Boil milk on low flame with cardamom' },
      { order: 3, instruction: 'Add rice and cook slowly for 2 hours' },
      { order: 4, instruction: 'Add sugar and secret spice blend' },
    ],
    photos: [],
    videos: [],
    performedBy: [],
    atRisk: true, // Only grandma knows the secret!
  },
];

export default function ParamparaScreen() {
  const insets = useSafeAreaInsets();
  
  // Use API hook
  const { traditions: apiTraditions, isLoading, refresh } = useTraditions();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTradition, setSelectedTradition] = useState<Parampara | null>(null);
  
  // Use API traditions if available, otherwise fall back to mock data
  const traditions = apiTraditions.length > 0 ? apiTraditions : mockTraditions;
  
  const handleTraditionPress = useCallback((tradition: Parampara) => {
    setSelectedTradition(tradition);
    setViewMode('detail');
  }, []);
  
  const handleTraditionCreated = useCallback((newTradition: Parampara) => {
    refresh(); // Refresh from API
    setViewMode('list');
  }, [refresh]);
  
  const handleEditTradition = useCallback((updates: Partial<Parampara>) => {
    if (!selectedTradition) return;
    
    // In real app, would call API to update
    setSelectedTradition(prev => prev ? { ...prev, ...updates } : null);
    refresh(); // Refresh from API
  }, [selectedTradition]);
  
  if (viewMode === 'create') {
    return (
      <TraditionCreator
        onClose={() => setViewMode('list')}
        onCreated={handleTraditionCreated}
      />
    );
  }
  
  if (viewMode === 'detail' && selectedTradition) {
    return (
      <TraditionDetail
        tradition={selectedTradition}
        onClose={() => setViewMode('list')}
        onEdit={handleEditTradition}
        onAddMemory={() => {
          // Would navigate to memory upload with tradition context
        }}
        onAddKatha={() => {
          // Would navigate to katha recorder with tradition context
        }}
      />
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <SacredText variant="displaySmall" color="gold">Parampara</SacredText>
          <SacredText variant="caption" color="muted">परम्परा - Family Traditions</SacredText>
        </View>
        <SilkButton
          variant="secondary"
          label="+ Add"
          onPress={() => setViewMode('create')}
        />
      </View>
      
      {/* Traditions List */}
      <TraditionsList
        traditions={traditions}
        onTraditionPress={handleTraditionPress}
        onAddNew={() => setViewMode('create')}
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
