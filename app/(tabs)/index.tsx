/**
 * 🪷 VANSH HOME — The Sacred Dashboard
 *
 * A soulful opening screen that reflects the heritage preservation mission.
 * Every element connects the user to their lineage and inspires action.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar } from '../../src/components';
import { API_URL } from '../../src/config/api';
import { useVrikshaStore } from '../../src/features/vriksha';
import { useFamilyData, useKathas, useMemories } from '../../src/hooks';
import { useAuthStore, useFamilyStore, useNimantranStore } from '../../src/state';
import { VanshColors } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { family, getMember, membersList } = useFamilyStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Vriksha stats
  const { members: treeMembers } = useVrikshaStore();
  const totalTreeMembers = treeMembers.size;
  const memberCount = totalTreeMembers || membersList.length;

  // Invitations
  const { invitations } = useNimantranStore();
  const upcomingInvitations = useMemo(
    () =>
      invitations.filter(
        (inv) => new Date(inv.eventDate).getTime() > Date.now(),
      ),
    [invitations],
  );

  // Data hooks
  const { refresh: refreshFamily } = useFamilyData();
  const { kathas, refresh: refreshKathas } = useKathas();
  const { memories, refresh: refreshMemories } = useMemories();

  const currentMember = user ? getMember(user.memberId) : null;
  const userName = currentMember
    ? currentMember.firstName
    : user?.email?.split('@')[0] || 'there';
  const familyName = family?.name || family?.surname || 'Your Family';

  useEffect(() => {
    if (user) {
      refreshFamily();
      refreshKathas();
      refreshMemories();
    }
  }, [user?.familyId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshFamily(), refreshKathas(), refreshMemories()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFamily, refreshKathas, refreshMemories]);

  // --- Recent memories for carousel ---
  const recentPhotos = useMemo(() => {
    if (!memories?.length) return [];
    return [...memories]
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 8)
      .map((m: any) => {
        let uri = m.uri || m.thumbnailUri;
        if (uri && !uri.startsWith('http')) {
          uri = `${API_URL.replace('/api', '')}${uri}`;
        }
        return { id: m.id, uri, title: m.title || '' };
      });
  }, [memories]);

  // --- Sanskrit / Heritage quote ---
  const dailyQuote = useMemo(() => {
    const quotes = [
      { text: 'कुलस्य आधारः स्मृतिः', translation: 'Memory is the foundation of lineage' },
      { text: 'वंशो हि धर्मस्य मूलम्', translation: 'Lineage is the root of Dharma' },
      { text: 'पूर्वजानां कथाः अमृतम्', translation: "Our ancestors' stories are nectar" },
      { text: 'एकं वृक्षं कुलं सर्वम्', translation: 'One tree, one whole family' },
      { text: 'स्मरणं जीवनस्य सारः', translation: 'Remembrance is the essence of life' },
      { text: 'परम्परा अस्माकं बलम्', translation: 'Tradition is our strength' },
      { text: 'गुरुवचनं अमूल्यम्', translation: "An elder's words are priceless" },
    ];
    const day = new Date().getDate();
    return quotes[day % quotes.length];
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={VanshColors.suvarna[500]}
          />
        }
      >
        {/* ═══════════════════════════════════════════════
            1. HERITAGE BANNER — warm, personal, soulful
           ═══════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={['#3D2B1A', '#5E3F24', '#7A5233']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Decorative lotus watermark */}
            <Text style={styles.lotusWatermark}>🪷</Text>

            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroGreeting}>{getGreeting()}</Text>
                <Text style={styles.heroName}>{userName}</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/explore')}>
                <MemberAvatar
                  uri={currentMember?.avatarUri}
                  name={userName}
                  size="md"
                />
              </Pressable>
            </View>

            {/* Family identity */}
            <View style={styles.familyBadge}>
              <MaterialIcons name="account-tree" size={14} color={VanshColors.suvarna[300]} />
              <Text style={styles.familyBadgeText}>{familyName}</Text>
              <View style={styles.familyDot} />
              <Text style={styles.familyBadgeText}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>

            {/* Daily heritage quote */}
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteSanskrit}>{dailyQuote.text}</Text>
              <Text style={styles.quoteTranslation}>— {dailyQuote.translation}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ═══════════════════════════════════════════════
            2. PILLARS OF HERITAGE — the 5 core features
           ═══════════════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Heritage</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillarScroll}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 12}
          >
            <PillarCard
              index={0}
              icon="photo-library"
              title="Smriti"
              subtitle="Memories"
              count={memories?.length || 0}
              countLabel="photos & videos"
              gradient={['#1E3A5F', '#2D5F8B']}
              onPress={() => router.push('/(tabs)/smriti')}
            />
            <PillarCard
              index={1}
              icon="mic"
              title="Katha"
              subtitle="Stories"
              count={kathas?.length || 0}
              countLabel="voice stories"
              gradient={['#4A2040', '#7B3F6B']}
              onPress={() => router.push('/(tabs)/smriti')}
            />
            <PillarCard
              index={2}
              icon="account-tree"
              title="Vriksha"
              subtitle="Family Tree"
              count={memberCount}
              countLabel="family members"
              gradient={['#1A4D2E', '#2E8B57']}
              onPress={() => router.push('/(tabs)/vriksha')}
            />
            <PillarCard
              index={3}
              icon="auto-stories"
              title="Parampara"
              subtitle="Traditions"
              count={0}
              countLabel="traditions saved"
              gradient={['#5E3A1A', '#9A6831']}
              onPress={() => router.push('/(tabs)/explore')}
            />
            <PillarCard
              index={4}
              icon="lock-clock"
              title="Vasiyat"
              subtitle="Wisdom Vault"
              count={0}
              countLabel="time-locked messages"
              gradient={['#3A1A5E', '#6B3FA0']}
              onPress={() => router.push('/(tabs)/explore')}
            />
          </ScrollView>
        </View>

        {/* ═══════════════════════════════════════════════
            3. RECENT MOMENTS — photo carousel
           ═══════════════════════════════════════════════ */}
        {recentPhotos.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recent Moments</Text>
              <Pressable onPress={() => router.push('/(tabs)/smriti')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.momentScroll}
              decelerationRate="fast"
            >
              {recentPhotos.map((photo, idx) => (
                <Animated.View key={photo.id} entering={FadeInRight.delay(idx * 60).duration(350)}>
                  <Pressable
                    style={styles.momentCard}
                    onPress={() => router.push('/(tabs)/smriti')}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.momentImage}
                      contentFit="cover"
                      recyclingKey={`home-moment-${photo.id}`}
                      cachePolicy="memory-disk"
                    />
                    {photo.title ? (
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.65)']}
                        style={styles.momentOverlay}
                      >
                        <Text style={styles.momentTitle} numberOfLines={1}>
                          {photo.title}
                        </Text>
                      </LinearGradient>
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════
            4. FAMILY PULSE — living family overview
           ═══════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Family Pulse</Text>
          <View style={styles.pulseGrid}>
            <PulseCard
              icon="people"
              value={String(memberCount)}
              label="Members in Tree"
              color={VanshColors.suvarna[600]}
              bg={VanshColors.suvarna[50]}
              onPress={() => router.push('/(tabs)/vriksha')}
            />
            <PulseCard
              icon="photo-library"
              value={String(memories?.length || 0)}
              label="Memories Preserved"
              color="#2D5F8B"
              bg="#EFF6FF"
              onPress={() => router.push('/(tabs)/smriti')}
            />
            <PulseCard
              icon="mic"
              value={String(kathas?.length || 0)}
              label="Stories Recorded"
              color="#7B3F6B"
              bg="#FDF2F8"
              onPress={() => router.push('/(tabs)/smriti')}
            />
            <PulseCard
              icon="celebration"
              value={String(upcomingInvitations.length)}
              label="Upcoming Events"
              color={VanshColors.sindoor[600]}
              bg={VanshColors.sindoor[50]}
              onPress={() => router.push('/(tabs)/explore')}
            />
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════
            5. QUICK ACTIONS — elegant contextual actions
           ═══════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Preserve Today</Text>
          <View style={styles.actionGrid}>
            <ActionTile
              icon="add-a-photo"
              label="Add Memory"
              desc="Photo or album"
              gradient={['#2563EB', '#3B82F6']}
              onPress={() => router.push('/(tabs)/smriti')}
            />
            <ActionTile
              icon="mic"
              label="Record Story"
              desc="Voice, video, or photo"
              gradient={['#7C3AED', '#8B5CF6']}
              onPress={() => router.push('/(tabs)/smriti')}
            />
            <ActionTile
              icon="person-add"
              label="Add Member"
              desc="Grow the tree"
              gradient={['#059669', '#10B981']}
              onPress={() => router.push('/(tabs)/vriksha')}
            />
            <ActionTile
              icon="mail-outline"
              label="Invite Family"
              desc="Send nimantran"
              gradient={['#DC2626', '#EF4444']}
              onPress={() => router.push('/(tabs)/explore')}
            />
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════
            6. FAMILY MEMBERS — quick glance (up to 12)
           ═══════════════════════════════════════════════ */}
        {memberCount > 0 && (
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Your Parivar</Text>
              <Pressable onPress={() => router.push('/(tabs)/vriksha')}>
                <Text style={styles.seeAll}>View tree</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.familyScroll}
            >
              {(membersList.length > 0
                ? membersList
                : Array.from(treeMembers.values())
              )
                .slice(0, 12)
                .map((m: any) => (
                  <View key={m.id} style={styles.familyChip}>
                    <MemberAvatar
                      uri={m.avatarUri}
                      name={`${m.firstName} ${m.lastName}`}
                      size="md"
                      isAlive={m.isAlive}
                    />
                    <Text style={styles.familyChipName} numberOfLines={1}>
                      {m.firstName}
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════
            7. FOOTER MANTRA
           ═══════════════════════════════════════════════ */}
        <View style={styles.footer}>
          <Text style={styles.footerLotus}>🪷</Text>
          <Text style={styles.footerText}>
            Every story you preserve today{'\n'}becomes a treasure for tomorrow
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

/* ---------- Pillar Card ---------- */
function PillarCard({
  index,
  icon,
  title,
  subtitle,
  count,
  countLabel,
  gradient,
  onPress,
}: {
  index: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  count: number;
  countLabel: string;
  gradient: [string, string];
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(400)}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillarCard}
        >
          <View style={styles.pillarIconBg}>
            <MaterialIcons name={icon} size={22} color="#FFF" />
          </View>
          <Text style={styles.pillarTitle}>{title}</Text>
          <Text style={styles.pillarSubtitle}>{subtitle}</Text>
          <View style={styles.pillarDivider} />
          <Text style={styles.pillarCount}>{count}</Text>
          <Text style={styles.pillarCountLabel}>{countLabel}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ---------- Pulse Card ---------- */
function PulseCard({
  icon,
  value,
  label,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pulseCard, { backgroundColor: bg }]}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={20} color={color} />
      <Text style={[styles.pulseValue, { color }]}>{value}</Text>
      <Text style={styles.pulseLabel}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Action Tile ---------- */
function ActionTile({
  icon,
  label,
  desc,
  gradient,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  desc: string;
  gradient: [string, string];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionTile}
      >
        <View style={styles.actionTileIconBg}>
          <MaterialIcons name={icon} size={20} color="#FFF" />
        </View>
        <Text style={styles.actionTileLabel}>{label}</Text>
        <Text style={styles.actionTileDesc}>{desc}</Text>
      </LinearGradient>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5)  return 'Still up?';
  if (hour >= 5 && hour < 7)  return 'Early bird,';
  if (hour >= 7 && hour < 12) return 'Good morning,';
  if (hour >= 12 && hour < 13) return 'Happy noon,';
  if (hour >= 13 && hour < 17) return 'Good afternoon,';
  if (hour >= 17 && hour < 20) return 'Good evening,';
  return 'Good night,';
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },

  // ── 1. Hero Banner ──────────────────────────────
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 24,
    padding: 24,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  lotusWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -20,
    fontSize: 120,
    opacity: 0.06,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroGreeting: {
    fontSize: 14,
    color: VanshColors.suvarna[300],
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  familyBadgeText: {
    fontSize: 12,
    color: VanshColors.suvarna[200],
    fontWeight: '600',
  },
  familyDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: VanshColors.suvarna[400],
  },
  quoteContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 14,
  },
  quoteSanskrit: {
    fontSize: 15,
    color: VanshColors.suvarna[300],
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  quoteTranslation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontWeight: '400',
  },

  // ── Sections ────────────────────────────────────
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: VanshColors.masi[800],
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },

  // ── 2. Pillar Cards ─────────────────────────────
  pillarScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  pillarCard: {
    width: CARD_WIDTH,
    borderRadius: 22,
    padding: 22,
    height: 180,
    justifyContent: 'flex-end',
  },
  pillarIconBg: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  pillarSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 1,
  },
  pillarDivider: {
    width: 28,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    marginVertical: 10,
  },
  pillarCount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  pillarCountLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 1,
  },

  // ── 3. Recent Moments ───────────────────────────
  momentScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 10,
  },
  momentCard: {
    width: 150,
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: VanshColors.khadi[200],
  },
  momentImage: {
    width: '100%',
    height: '100%',
  },
  momentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 30,
  },
  momentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── 4. Family Pulse ─────────────────────────────
  pulseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  pulseCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  pulseValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  pulseLabel: {
    fontSize: 12,
    color: VanshColors.masi[500],
    fontWeight: '500',
  },

  // ── 5. Actions ──────────────────────────────────
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  actionTile: {
    width: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 18,
    padding: 18,
    height: 110,
    justifyContent: 'flex-end',
  },
  actionTileIconBg: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  actionTileDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2,
  },

  // ── 6. Family Members ───────────────────────────
  familyScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 16,
  },
  familyChip: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  familyChipName: {
    fontSize: 11,
    fontWeight: '600',
    color: VanshColors.masi[600],
    textAlign: 'center',
  },

  // ── 7. Footer ───────────────────────────────────
  footer: {
    alignItems: 'center',
    marginTop: 36,
    paddingVertical: 24,
  },
  footerLotus: {
    fontSize: 28,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: VanshColors.masi[400],
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
