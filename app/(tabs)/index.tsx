/**
 * VANSH HOME - Dashboard Feed
 * Modern card-based home with quick actions and activity
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar } from '../../src/components';
import { API_URL } from '../../src/config/api';
import { useVrikshaStore } from '../../src/features/vriksha';
import { useFamilyData, useKathas, useMemories } from '../../src/hooks';
import { useAuthStore, useFamilyStore } from '../../src/state';
import { VanshColors } from '../../src/theme';

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
  const router = useRouter();
  const { user } = useAuthStore();
  const { family, getMember, membersList } = useFamilyStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Vriksha stats
  const { members: treeMembers } = useVrikshaStore();
  const totalTreeMembers = treeMembers.size;
  
  // Load family data on mount
  const { refresh: refreshFamily } = useFamilyData();
  const { kathas, refresh: refreshKathas } = useKathas();
  const { memories, refresh: refreshMemories } = useMemories();
  
  // Build feed items from recent activity only
  const feedItems = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];
    
    (kathas || []).forEach((katha: any) => {
      items.push({
        id: `katha-${katha.id}`,
        type: 'katha',
        date: katha.createdAt || new Date().toISOString(),
        preview: katha.title || katha.transcript?.slice(0, 100) || 'Voice story',
        members: katha.narratorId ? [katha.narratorId] : [],
      });
    });
    
    (memories || []).forEach((memory: any) => {
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
    
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 50); // Cap feed items
  }, [kathas, memories]);
  
  const currentMember = user ? getMember(user.memberId) : null;
  const userName = currentMember 
    ? currentMember.firstName
    : user?.email?.split('@')[0] || 'there';
  
  useEffect(() => {
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
  
  const renderItem = useCallback(({ item }: { item: FeedItem; index: number }) => {
    const primaryMemberId = item.members?.[0];
    const member = primaryMemberId ? getMember(primaryMemberId as any) : null;
    
    return (
      <ActivityCard
        item={item}
        memberName={member ? `${member.firstName} ${member.lastName}` : 'Family Member'}
        memberAvatar={member?.avatarUri}
      />
    );
  }, [getMember]);
  
  const ListHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingTime}>{getGreeting()}</Text>
          <Text style={styles.greetingName}>{userName}</Text>
        </View>
        <MemberAvatar
          uri={currentMember?.avatarUri}
          name={userName}
          size="md"
        />
      </View>
      
      {/* Family Stats Bar */}
      {(family || totalTreeMembers > 0) && (
        <View style={styles.statsBar}>
          <View style={styles.statsBarInner}>
            <StatBubble value={totalTreeMembers || membersList.length} label="Members" icon="people" />
            <StatBubble value={memories?.length || 0} label="Memories" icon="photo-library" />
            <StatBubble value={kathas?.length || 0} label="Stories" icon="mic" />
          </View>
        </View>
      )}
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <QuickAction icon="add-a-photo" label="Add Memory" color="#3B82F6" onPress={() => router.push('/(tabs)/smriti')} />
          <QuickAction icon="person-add" label="Add Member" color="#10B981" onPress={() => router.push('/(tabs)/vriksha')} />
          <QuickAction icon="mic" label="Record" color="#8B5CF6" onPress={() => router.push('/(tabs)/explore')} />
          <QuickAction icon="account-tree" label="View Tree" color="#F59E0B" onPress={() => router.push('/(tabs)/vriksha')} />
        </View>
      </View>
      
      {/* Activity Section */}
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>
    </View>
  ), [userName, family, totalTreeMembers, membersList.length, memories?.length, kathas?.length, currentMember]);
  
  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={48} color={VanshColors.masi[200]} />
      <Text style={styles.emptyTitle}>No Activity Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding memories, stories, and family members to see your activity here.
      </Text>
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
        removeClippedSubviews={true}
        windowSize={7}
        maxToRenderPerBatch={5}
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

// ─── Sub Components ──────────────────────────────────────

function StatBubble({ value, label, icon }: { 
  value: number; label: string; icon: keyof typeof MaterialIcons.glyphMap 
}) {
  return (
    <View style={styles.statBubble}>
      <MaterialIcons name={icon} size={18} color={VanshColors.suvarna[600]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { 
  icon: keyof typeof MaterialIcons.glyphMap; label: string; color: string; onPress: () => void 
}) {
  return (
    <Pressable style={styles.quickActionItem} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '12' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

interface ActivityCardProps {
  item: FeedItem;
  memberName: string;
  memberAvatar?: string;
}

function ActivityCard({ item, memberName, memberAvatar }: ActivityCardProps) {
  const getIconConfig = () => {
    switch (item.type) {
      case 'memory': return { name: 'photo' as const, color: '#3B82F6', bg: '#EFF6FF' };
      case 'katha': return { name: 'mic' as const, color: '#8B5CF6', bg: '#F5F3FF' };
      case 'member_joined': return { name: 'person-add' as const, color: '#10B981', bg: '#ECFDF5' };
      default: return { name: 'star' as const, color: '#F59E0B', bg: '#FFF7ED' };
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
  
  const iconConfig = getIconConfig();
  
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityCardRow}>
        <MemberAvatar uri={memberAvatar} name={memberName} size="sm" />
        <View style={styles.activityMeta}>
          <Text style={styles.activityName} numberOfLines={1}>{memberName}</Text>
          <Text style={styles.activityAction}>{getAction()} · {formatTimeAgo(item.date)}</Text>
        </View>
        <View style={[styles.activityTypeBadge, { backgroundColor: iconConfig.bg }]}>
          <MaterialIcons name={iconConfig.name} size={16} color={iconConfig.color} />
        </View>
      </View>
      
      {item.thumbnailUri && (
        <Image
          source={{ uri: item.thumbnailUri }}
          style={styles.activityImage}
          contentFit="cover"
          recyclingKey={`feed-${item.id}`}
          cachePolicy="memory-disk"
        />
      )}
      {item.preview && !item.thumbnailUri && (
        <Text style={styles.activityPreview} numberOfLines={2}>{item.preview}</Text>
      )}
      {item.preview && item.thumbnailUri && (
        <Text style={styles.activityCaption} numberOfLines={1}>{item.preview}</Text>
      )}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
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
    backgroundColor: '#FAFAF9',
  },
  listContent: {
    flexGrow: 1,
  },
  
  // Header
  headerContainer: {
    paddingHorizontal: 20,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingTime: {
    fontSize: 15,
    color: VanshColors.masi[400],
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: VanshColors.masi[800],
    letterSpacing: -0.5,
    marginTop: 2,
  },
  
  // Stats
  statsBar: {
    marginBottom: 20,
  },
  statsBarInner: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statBubble: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
  },
  statLabel: {
    fontSize: 11,
    color: VanshColors.masi[400],
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[700],
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: VanshColors.masi[600],
    textAlign: 'center',
  },
  
  // Activity
  activityHeader: {
    marginBottom: 4,
  },
  activityCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  activityCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityMeta: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  activityAction: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginTop: 1,
  },
  activityTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginTop: 12,
  },
  activityPreview: {
    fontSize: 14,
    color: VanshColors.masi[600],
    lineHeight: 20,
    marginTop: 10,
  },
  activityCaption: {
    fontSize: 13,
    color: VanshColors.masi[500],
    marginTop: 8,
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[600],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
});
