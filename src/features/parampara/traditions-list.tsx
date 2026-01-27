/**
 * 🪷 TRADITIONS LIST - Family traditions and rituals
 */

import React, { useCallback } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, SacredText, SilkButton } from '../../components';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { Parampara } from '../../types';

interface TraditionsListProps {
  traditions: Parampara[];
  onTraditionPress: (tradition: Parampara) => void;
  onAddNew: () => void;
}

const typeIcons: Record<string, string> = {
  puja: '🕉️',
  festival: '🪔',
  ceremony: '🎊',
  recipe: '🍲',
  song: '🎵',
  story: '📖',
  craft: '🎨',
  custom: '✨',
};

const typeColors: Record<string, string> = {
  puja: VanshColors.bhagwa[500],
  festival: VanshColors.suvarna[500],
  ceremony: VanshColors.padma[400],
  recipe: VanshColors.chandan[500],
  song: VanshColors.neelam[500],
  story: VanshColors.masi[500],
  craft: VanshColors.padma[300],
  custom: VanshColors.khadi[600],
};

export function TraditionsList({ traditions, onTraditionPress, onAddNew }: TraditionsListProps) {
  const insets = useSafeAreaInsets();
  
  // Group traditions by type
  const groupedTraditions = React.useMemo(() => {
    const groups: Record<string, Parampara[]> = {};
    traditions.forEach(t => {
      const typ = t.type || 'custom';
      if (!groups[typ]) groups[typ] = [];
      groups[typ].push(t);
    });
    return groups;
  }, [traditions]);
  
  const renderTradition = useCallback(({ item, index }: { item: Parampara; index: number }) => {
    const icon = typeIcons[item.type] || '✨';
    const color = typeColors[item.type] || VanshColors.suvarna[500];
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <Pressable onPress={() => onTraditionPress(item)}>
          <HeritageCard variant="elevated" style={styles.traditionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <SacredText variant="heading">{icon}</SacredText>
              </View>
              <View style={styles.cardMeta}>
                <SacredText variant="subhead" color="primary" numberOfLines={1}>
                  {item.name}
                </SacredText>
                <SacredText variant="caption" color="muted" numberOfLines={1}>
                  {item.frequency || 'Occasional'} • {item.originStory ? 'Has origin story' : 'Family tradition'}
                </SacredText>
              </View>
            </View>
            
            {item.description && (
              <SacredText variant="body" color="secondary" numberOfLines={2} style={styles.description}>
                {item.description}
              </SacredText>
            )}
            
            {/* Performers */}
            {item.performedBy && item.performedBy.length > 0 && (
              <View style={styles.keepersRow}>
                <SacredText variant="caption" color="gold">
                  Practiced by {item.performedBy.length} family member{item.performedBy.length > 1 ? 's' : ''}
                </SacredText>
              </View>
            )}
          </HeritageCard>
        </Pressable>
      </Animated.View>
    );
  }, [onTraditionPress]);
  
  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <SacredText variant="heading" color="gold">{traditions.length}</SacredText>
          <SacredText variant="caption" color="muted">Traditions</SacredText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <SacredText variant="heading" color="vermilion">
            {Object.keys(groupedTraditions).length}
          </SacredText>
          <SacredText variant="caption" color="muted">Categories</SacredText>
        </View>
      </View>
      
      {/* Description */}
      <HeritageCard variant="outlined" style={styles.descCard}>
        <SacredText variant="quote" color="secondary" align="center">
          "परम्परा - The unbroken chain of customs, rituals, and wisdom 
          passed down through generations."
        </SacredText>
      </HeritageCard>
      
      {/* Add button */}
      <SilkButton
        variant="primary"
        label="+ Add Tradition"
        onPress={onAddNew}
        style={styles.addButton}
      />
    </View>
  ), [traditions.length, groupedTraditions, onAddNew]);
  
  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <SacredText variant="hero" color="gold">🪔</SacredText>
      <SacredText variant="title" color="primary" align="center">
        No Traditions Yet
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.emptyText}>
        Document your family's traditions, recipes, rituals, and customs for future generations.
      </SacredText>
      <SilkButton
        variant="primary"
        label="Add First Tradition"
        onPress={onAddNew}
      />
    </View>
  ), [onAddNew]);
  
  return (
    <FlatList
      data={traditions}
      renderItem={renderTradition}
      keyExtractor={item => item.id}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: VanshSpacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: VanshSpacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: VanshSpacing.lg,
    gap: VanshSpacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: VanshColors.khadi[300],
  },
  descCard: {
    marginBottom: VanshSpacing.md,
    padding: VanshSpacing.md,
  },
  addButton: {
    marginTop: VanshSpacing.sm,
  },
  traditionCard: {
    marginBottom: VanshSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: VanshRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMeta: {
    flex: 1,
    gap: VanshSpacing.xs,
  },
  description: {
    marginTop: VanshSpacing.sm,
  },
  keepersRow: {
    marginTop: VanshSpacing.sm,
    paddingTop: VanshSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
    minHeight: 400,
    gap: VanshSpacing.md,
  },
  emptyText: {
    marginBottom: VanshSpacing.md,
    maxWidth: 280,
  },
});
