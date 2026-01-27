/**
 * 🪷 WISDOM VAULT - List of Vasiyat (time-locked wisdom)
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
import { HeritageCard, SacredText, WisdomEnvelope } from '../../components';
import { useAuthStore, useFamilyStore } from '../../state';
import { VanshColors, VanshRadius, VanshShadows, VanshSpacing } from '../../theme';
import type { Vasiyat } from '../../types';

interface WisdomVaultProps {
  vasiyatList: Vasiyat[];
  onVasiyatPress: (vasiyat: Vasiyat) => void;
  onCreateNew: () => void;
}

export function WisdomVault({ vasiyatList, onVasiyatPress, onCreateNew }: WisdomVaultProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { getMember } = useFamilyStore();
  
  // Separate into my vault vs received
  const myVasiyat = vasiyatList.filter(v => v.creatorId === user?.memberId);
  const receivedVasiyat = vasiyatList.filter(v => v.creatorId !== user?.memberId);
  const unlockedCount = receivedVasiyat.filter(v => v.isUnlocked).length;
  const lockedCount = receivedVasiyat.filter(v => !v.isUnlocked).length;
  
  const renderVasiyat = useCallback(({ item, index }: { item: Vasiyat; index: number }) => {
    const author = getMember(item.creatorId);
    const isOwn = item.creatorId === user?.memberId;
    const authorName = author ? `${author.firstName} ${author.lastName}` : 'Family Member';
    
    // Get first recipient name for display
    const firstRecipient = item.recipients?.[0];
    const recipientMember = firstRecipient ? getMember(firstRecipient.memberId) : null;
    const recipientName = recipientMember 
      ? `${recipientMember.firstName} ${recipientMember.lastName}` 
      : 'Family';
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
        <Pressable onPress={() => onVasiyatPress(item)}>
          <WisdomEnvelope
            title={item.title || 'Untitled Message'}
            fromName={authorName}
            toName={isOwn ? recipientName : 'You'}
            mood={item.mood || 'wisdom'}
            isLocked={!item.isUnlocked}
            unlockDate={item.trigger?.type === 'date' ? item.trigger.date : undefined}
          />
        </Pressable>
      </Animated.View>
    );
  }, [getMember, user]);
  
  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <SacredText variant="heading" color="gold">{myVasiyat.length}</SacredText>
          <SacredText variant="caption" color="muted">Your Messages</SacredText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <SacredText variant="heading" color="vermilion">{lockedCount}</SacredText>
          <SacredText variant="caption" color="muted">Sealed</SacredText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <SacredText variant="heading" color="primary">{unlockedCount}</SacredText>
          <SacredText variant="caption" color="muted">Unlocked</SacredText>
        </View>
      </View>
      
      {/* Description */}
      <HeritageCard variant="outlined" style={styles.descCard}>
        <SacredText variant="quote" color="secondary" align="center">
          "The wisdom vault holds messages across time—letters sealed by love, 
          waiting for the right moment to be read."
        </SacredText>
      </HeritageCard>
      
      {/* Section title */}
      {receivedVasiyat.length > 0 && (
        <SacredText variant="label" color="muted" style={styles.sectionTitle}>
          Messages for You
        </SacredText>
      )}
    </View>
  ), [myVasiyat.length, lockedCount, unlockedCount]);
  
  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <SacredText variant="hero" color="gold">💌</SacredText>
      <SacredText variant="title" color="primary" align="center">
        No Messages Yet
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.emptyText}>
        Create a time-locked message for your loved ones, to be opened when the time is right.
      </SacredText>
    </View>
  ), []);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <SacredText variant="displaySmall" color="gold">Wisdom Vault</SacredText>
        <SacredText variant="caption" color="muted">वसीयत - Legacy of Love</SacredText>
      </View>
      
      <FlatList
        data={receivedVasiyat}
        renderItem={renderVasiyat}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {/* Create FAB */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + VanshSpacing.lg }]}
        onPress={onCreateNew}
      >
        <SacredText variant="title" style={styles.fabIcon}>✉️</SacredText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: VanshSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  header: {
    padding: VanshSpacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: VanshColors.khadi[300],
  },
  descCard: {
    marginBottom: VanshSpacing.lg,
  },
  sectionTitle: {
    marginBottom: VanshSpacing.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: VanshSpacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
    minHeight: 300,
  },
  emptyText: {
    marginTop: VanshSpacing.md,
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    right: VanshSpacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: VanshColors.suvarna[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...VanshShadows.lg,
  },
  fabIcon: {
    fontSize: 28,
  },
});
