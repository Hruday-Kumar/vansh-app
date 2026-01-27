/**
 * 🪷 VANSH HOME - Time River Feed
 * The sacred stream of family moments
 */

import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText } from '../../src/components';
import { API_URL } from '../../src/config/api';
import { useFamilyData, useKathas, useMemories } from '../../src/hooks';
import { useAuthStore, useFamilyStore } from '../../src/state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../src/theme';

// Simplified feed item type
interface FeedItem {
  id: string;
  type: 'memory' | 'katha' | 'member_joined';
  date: string;
  preview: string;
  thumbnailUri?: string;
  members: string[];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { family, getMember, membersList } = useFamilyStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load family data on mount
  const { refresh: refreshFamily } = useFamilyData();
  const { kathas, refresh: refreshKathas } = useKathas();
  const { memories, refresh: refreshMemories } = useMemories();
  
  // Build feed items from all sources
  const feedItems = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];
    
    // Add kathas to feed
    (kathas || []).forEach((katha: any) => {
      items.push({
        id: `katha-${katha.id}`,
        type: 'katha',
        date: katha.createdAt || new Date().toISOString(),
        preview: katha.title || katha.transcript?.slice(0, 100) || 'Voice story',
        members: katha.narratorId ? [katha.narratorId] : [],
      });
    });
    
    // Add memories to feed
    (memories || []).forEach((memory: any) => {
      // Handle both full URLs and relative paths
      let thumbnailUri = memory.uri;
      if (thumbnailUri && !thumbnailUri.startsWith('http')) {
        thumbnailUri = `${API_URL.replace('/api', '')}${memory.uri}`;
      }
      
      items.push({
        id: `memory-${memory.id}`,
        type: 'memory',
        date: memory.createdAt || new Date().toISOString(),
        preview: memory.title || memory.description?.slice(0, 100) || 'Photo memory',
        thumbnailUri,
        members: memory.taggedMemberIds || [],
      });
    });
    
    // Add members joined
    (membersList || []).forEach((member: any) => {
      items.push({
        id: `member-${member.id}`,
        type: 'member_joined',
        date: member.createdAt || new Date().toISOString(),
        preview: `${member.firstName} ${member.lastName} joined the family tree`,
        members: [member.id],
      });
    });
    
    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return items;
  }, [kathas, memories, membersList]);
  
  // Get current user's member info for display
  const currentMember = user ? getMember(user.memberId) : null;
  const userName = currentMember 
    ? `${currentMember.firstName} ${currentMember.lastName}`
    : user?.email?.split('@')[0] || 'Welcome';
  
  useEffect(() => {
    // Load all family data when screen mounts
    if (user) {
      refreshFamily();
      refreshKathas();
      refreshMemories();
    }
  }, [user?.familyId, refreshFamily, refreshKathas, refreshMemories]);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshFamily(), refreshKathas(), refreshMemories()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFamily, refreshKathas, refreshMemories]);
  
  const renderItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    // Get first member from the item's members array (with safety check)
    const primaryMemberId = item.members?.[0];
    const member = primaryMemberId ? getMember(primaryMemberId as any) : null;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TimeRiverCard
          item={item}
          memberName={member ? `${member.firstName} ${member.lastName}` : 'Family Member'}
          memberAvatar={member?.avatarUri}
        />
      </Animated.View>
    );
  }, [getMember]);
  
  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.greeting}>
        <SacredText variant="caption" color="muted">
          {getGreeting()},
        </SacredText>
        <SacredText variant="heading" color="gold">
          {userName}
        </SacredText>
      </View>
      
      {/* Family name */}
      {family && (
        <HeritageCard variant="outlined" style={styles.familyCard}>
          <SacredText variant="subhead" color="primary" align="center">
            🏠 {family.name}
          </SacredText>
          <SacredText variant="caption" color="muted" align="center">
            Your family's living legacy
          </SacredText>
        </HeritageCard>
      )}
      
      {/* Section title */}
      <SacredText variant="label" color="muted" style={styles.sectionTitle}>
        Time River
      </SacredText>
    </View>
  ), [userName, family]);
  
  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <SacredText variant="hero" color="gold">🪷</SacredText>
      <SacredText variant="title" color="primary" align="center">
        Your Time River is Empty
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.emptyText}>
        Start adding memories, stories, and family members to see your river flow.
      </SacredText>
    </View>
  ), []);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={VanshColors.suvarna[500]}
          />
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Time River Card Component
// ─────────────────────────────────────────────────────────

interface TimeRiverCardProps {
  item: FeedItem;
  memberName: string;
  memberAvatar?: string;
}

function TimeRiverCard({ item, memberName, memberAvatar }: TimeRiverCardProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'memory': return '📸';
      case 'katha': return '🎙️';
      case 'member_joined': return '👤';
      default: return '✨';
    }
  };
  
  const getAction = () => {
    switch (item.type) {
      case 'memory': return 'added a memory';
      case 'katha': return 'recorded a story';
      case 'member_joined': return 'joined the family';
      default: return '';
    }
  };
  
  const timeAgo = formatTimeAgo(item.date);
  
  return (
    <HeritageCard variant="elevated" style={styles.riverCard}>
      <View style={styles.cardHeader}>
        <MemberAvatar
          uri={memberAvatar}
          name={memberName}
          size="sm"
        />
        <View style={styles.cardMeta}>
          <SacredText variant="body" color="primary" numberOfLines={1}>
            {memberName}
          </SacredText>
          <SacredText variant="caption" color="muted">
            {getAction()} • {timeAgo}
          </SacredText>
        </View>
        <SacredText variant="title">{getIcon()}</SacredText>
      </View>
      
      {/* Preview content */}
      <View style={styles.cardContent}>
        {item.thumbnailUri && (
          <Image
            source={{ uri: item.thumbnailUri }}
            style={styles.previewImage}
            contentFit="cover"
          />
        )}
        {item.preview && (
          <SacredText variant="body" color="secondary" numberOfLines={2}>
            {item.preview}
          </SacredText>
        )}
      </View>
    </HeritageCard>
  );
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    padding: VanshSpacing.lg,
  },
  greeting: {
    marginBottom: VanshSpacing.md,
  },
  familyCard: {
    marginBottom: VanshSpacing.lg,
  },
  sectionTitle: {
    marginBottom: VanshSpacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
    minHeight: 400,
  },
  emptyText: {
    marginTop: VanshSpacing.md,
    maxWidth: 280,
  },
  riverCard: {
    marginHorizontal: VanshSpacing.lg,
    marginBottom: VanshSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
  },
  cardMeta: {
    flex: 1,
  },
  cardContent: {
    marginTop: VanshSpacing.md,
    gap: VanshSpacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: VanshRadius.md,
  },
});
