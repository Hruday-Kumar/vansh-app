/**
 * MORE HUB - Central access to all features
 * Traditions, Vault, Invitations, Settings, and more
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MemberAvatar } from '../../src/components';
import { InvitationCreator, InvitationDetail, InvitationsList } from '../../src/features/nimantran';
import { TraditionCreator, TraditionDetail, TraditionsList } from '../../src/features/parampara';
import { VasiyatCreator, VasiyatViewer, WisdomVault } from '../../src/features/vasiyat';
import { useVrikshaStore } from '../../src/features/vriksha';
import { useAuth, useInvitations, useTraditions, useVasiyats } from '../../src/hooks';
import { useAuthStore, useFamilyStore } from '../../src/state';
import { VanshColors } from '../../src/theme';
import type { Nimantran, Parampara, Vasiyat } from '../../src/types';

type ActiveView = 
  | 'hub' 
  | 'nimantran_list' | 'nimantran_creator' | 'nimantran_detail'
  | 'parampara_list' | 'parampara_detail' | 'parampara_create'
  | 'vasiyat_vault' | 'vasiyat_creator' | 'vasiyat_viewer'
  | 'settings';

// Mock traditions data (same as before)
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
    atRisk: true,
  },
];

export default function MoreHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { user, token } = useAuthStore();
  const { family, membersList, getMember } = useFamilyStore();
  const { members: treeMembers } = useVrikshaStore();

  const [activeView, setActiveView] = useState<ActiveView>('hub');
  const [selectedTradition, setSelectedTradition] = useState<Parampara | null>(null);
  const [selectedVasiyat, setSelectedVasiyat] = useState<Vasiyat | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<Nimantran | null>(null);

  // Hooks for data
  const { traditions: apiTraditions, refresh: refreshTraditions } = useTraditions();
  const { vasiyats, receivedVasiyats, refresh: refreshVasiyats, createVasiyat } = useVasiyats();
  const { invitations, refresh: refreshInvitations, createInvitation, deleteInvitation } = useInvitations();

  const traditions = apiTraditions.length > 0 ? apiTraditions : mockTraditions;
  const allVasiyats = [...vasiyats, ...receivedVasiyats];

  // ── Invitation handlers ──
  const handleInvitationCreated = useCallback(async (invitationData: any) => {
    try {
      await createInvitation(invitationData);
      Alert.alert('Success!', 'Your invitation has been sent to the family.', [
        { text: 'OK', onPress: () => { setActiveView('nimantran_list'); refreshInvitations(); } }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not create invitation. Please try again.');
      setActiveView('nimantran_list');
    }
  }, [createInvitation, refreshInvitations]);

  const handleDeleteInvitation = useCallback((invitation: Nimantran) => {
    Alert.alert('Delete Invitation', `Are you sure you want to delete "${invitation.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteInvitation(invitation.id as string);
        setActiveView('nimantran_list');
      }},
    ]);
  }, [deleteInvitation]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/login' as any);
      }},
    ]);
  };

  // ── SUB-VIEWS (full-screen feature views) ──

  // Nimantran Creator
  if (activeView === 'nimantran_creator') {
    return (
      <InvitationCreator
        onClose={() => setActiveView('nimantran_list')}
        onCreated={handleInvitationCreated}
      />
    );
  }

  // Nimantran Detail
  if (activeView === 'nimantran_detail' && selectedInvitation) {
    return (
      <InvitationDetail
        invitation={selectedInvitation}
        onClose={() => setActiveView('nimantran_list')}
        onDelete={() => handleDeleteInvitation(selectedInvitation)}
      />
    );
  }

  // Parampara Detail
  if (activeView === 'parampara_detail' && selectedTradition) {
    return (
      <TraditionDetail
        tradition={selectedTradition}
        onClose={() => setActiveView('parampara_list')}
        onEdit={(updates) => {
          setSelectedTradition(prev => prev ? { ...prev, ...updates } : null);
          refreshTraditions();
        }}
        onAddMemory={() => {}}
        onAddKatha={() => {}}
      />
    );
  }

  // Parampara Creator
  if (activeView === 'parampara_create') {
    return (
      <TraditionCreator
        onClose={() => setActiveView('parampara_list')}
        onCreated={() => { refreshTraditions(); setActiveView('parampara_list'); }}
      />
    );
  }

  // Vasiyat Creator
  if (activeView === 'vasiyat_creator') {
    return (
      <VasiyatCreator
        onClose={() => setActiveView('vasiyat_vault')}
        onCreated={() => { setActiveView('vasiyat_vault'); refreshVasiyats(); }}
      />
    );
  }

  // Vasiyat Viewer
  if (activeView === 'vasiyat_viewer' && selectedVasiyat) {
    return <VasiyatViewer vasiyat={selectedVasiyat} onClose={() => setActiveView('vasiyat_vault')} />;
  }

  // Vasiyat Vault
  if (activeView === 'vasiyat_vault') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SubViewHeader title="Wisdom Vault" onBack={() => setActiveView('hub')} />
        <WisdomVault
          vasiyatList={allVasiyats}
          onVasiyatPress={(v: Vasiyat) => { setSelectedVasiyat(v); setActiveView('vasiyat_viewer'); }}
          onCreateNew={() => setActiveView('vasiyat_creator')}
        />
      </View>
    );
  }

  // Nimantran List (sub-view within More)
  if (activeView === 'nimantran_list') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SubViewHeader title="Invitations" onBack={() => setActiveView('hub')} />
        <View style={styles.subHeaderActions}>
          <Pressable style={styles.actionChip} onPress={() => setActiveView('nimantran_creator')}>
            <MaterialIcons name="add" size={16} color="#FFF" />
            <Text style={styles.actionChipText}>New Invitation</Text>
          </Pressable>
        </View>
        <InvitationsList
          invitations={invitations}
          onInvitationPress={(inv: Nimantran) => { setSelectedInvitation(inv); setActiveView('nimantran_detail'); }}
          onCreateNew={() => setActiveView('nimantran_creator')}
        />
      </View>
    );
  }

  // Parampara List (sub-view within More)
  if (activeView === 'parampara_list') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SubViewHeader title="Traditions" onBack={() => setActiveView('hub')} />
        <View style={styles.subHeaderActions}>
          <Pressable style={styles.actionChip} onPress={() => setActiveView('parampara_create')}>
            <MaterialIcons name="add" size={16} color="#FFF" />
            <Text style={styles.actionChipText}>Add Tradition</Text>
          </Pressable>
        </View>
        <TraditionsList
          traditions={traditions}
          onTraditionPress={(t: Parampara) => { setSelectedTradition(t); setActiveView('parampara_detail'); }}
          onAddNew={() => setActiveView('parampara_create')}
        />
      </View>
    );
  }

  // Settings sub-view
  if (activeView === 'settings') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SubViewHeader title="Settings" onBack={() => setActiveView('hub')} />
        <ScrollView contentContainerStyle={styles.settingsContent}>
          {/* Profile */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={styles.profileCard}>
              <MemberAvatar uri={undefined} name={user?.email || 'User'} size="lg" />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Family Stats */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.statsCard}>
              <Text style={styles.statsCardTitle}>Family Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{treeMembers.size}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{family?.name || '-'}</Text>
                  <Text style={styles.statLabel}>Family</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.versionText}>Vansh v1.0.0</Text>
        </ScrollView>
      </View>
    );
  }

  // ── MAIN HUB VIEW ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={[styles.hubContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.hubHeader}>
          <Text style={styles.hubTitle}>More</Text>
          <Text style={styles.hubSubtitle}>All features in one place</Text>
        </Animated.View>

        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          <FeatureCard 
            icon="mail-outline" 
            label="Invitations" 
            subtitle="Weddings, events & more"
            color="#E11D48"
            delay={100}
            onPress={() => setActiveView('nimantran_list')} 
          />
          <FeatureCard 
            icon="auto-stories" 
            label="Traditions" 
            subtitle="Family recipes & rituals"
            color="#F59E0B"
            delay={150}
            onPress={() => setActiveView('parampara_list')} 
          />
          <FeatureCard 
            icon="mail" 
            label="Wisdom Vault" 
            subtitle="Time-locked messages"
            color="#EC4899"
            delay={200}
            onPress={() => setActiveView('vasiyat_vault')} 
          />
          <FeatureCard 
            icon="settings" 
            label="Settings" 
            subtitle="Profile & preferences"
            color="#6B7280"
            delay={250}
            onPress={() => setActiveView('settings')} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-Components ──────────────────────────────────────

function SubViewHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.subViewHeader}>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={22} color={VanshColors.masi[700]} />
      </Pressable>
      <Text style={styles.subViewTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function FeatureCard({ icon, label, subtitle, color, delay, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle: string;
  color: string;
  delay: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.featureCardWrapper}>
      <Pressable style={styles.featureCard} onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.05)' }}>
        <View style={[styles.featureIconContainer, { backgroundColor: color + '15' }]}>
          <MaterialIcons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },

  // Hub
  hubContent: {
    paddingHorizontal: 20,
  },
  hubHeader: {
    paddingVertical: 24,
  },
  hubTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: VanshColors.masi[800],
    letterSpacing: -0.5,
  },
  hubSubtitle: {
    fontSize: 15,
    color: VanshColors.masi[400],
    marginTop: 4,
  },

  // Feature Grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCardWrapper: {
    width: '48%',
    flexGrow: 1,
  },
  featureCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  featureSubtitle: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginTop: 2,
  },

  // Sub-view header
  subViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.khadi[100],
  },
  subViewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  subHeaderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VanshColors.suvarna[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },

  // Settings
  settingsContent: {
    padding: 20,
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  profileEmail: {
    fontSize: 13,
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
    letterSpacing: 0.5,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.masi[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: VanshColors.suvarna[600],
  },
  statLabel: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: VanshColors.khadi[200],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionText: {
    fontSize: 12,
    color: VanshColors.masi[300],
    textAlign: 'center',
    marginTop: 24,
  },
});
