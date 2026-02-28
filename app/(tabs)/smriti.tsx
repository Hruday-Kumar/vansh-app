/**
 * 🪷 MEMORIES TAB - Beautiful Digital Family Album
 * 
 * Gorgeous photo & voice story gallery with:
 * - Masonry photo layout grouped by month
 * - Full-screen viewer with tagged member names
 * - Family sync indicator showing shared album status
 * - Elegant tab switcher between Photos & Stories
 * - Smooth animations throughout
 */

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KathaPlayer, KathaRecorder } from '../../src/features/katha';
import { MemoryGallery, MemoryUpload, MemoryViewer } from '../../src/features/smriti';
import { useKathas, useMemories } from '../../src/hooks';
import { useFamilyStore, useKathaStore } from '../../src/state';
import { VanshColors } from '../../src/theme';
import type { Katha, SmritiMedia } from '../../src/types';

type ViewMode = 'gallery' | 'viewer' | 'upload' | 'katha_list' | 'katha_recorder' | 'katha_player';
type MediaTab = 'photos' | 'stories';

export default function SmritiScreen() {
  const insets = useSafeAreaInsets();
  
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedMemory, setSelectedMemory] = useState<SmritiMedia | null>(null);
  const [selectedKatha, setSelectedKatha] = useState<Katha | null>(null);
  const [activeTab, setActiveTab] = useState<MediaTab>('photos');
  const [isUploading, setIsUploading] = useState(false);
  
  const { memories, isLoading, refresh, syncInfo } = useMemories();
  const { kathas, refresh: refreshKathas } = useKathas();
  const { recentKathas, addKatha } = useKathaStore();
  const { getMember, family } = useFamilyStore();
  
  const displayKathas = kathas.length > 0 ? kathas : recentKathas;
  
  const handleMemoryPress = useCallback((memory: SmritiMedia) => {
    setSelectedMemory(memory);
    setViewMode('viewer');
  }, []);
  
  const handleUploadComplete = useCallback((_memoryId: string) => {
    setViewMode('gallery');
    refresh();
  }, [refresh]);

  const handleRecordComplete = useCallback(async (audioUri: string, duration: number) => {
    setIsUploading(true);
    try {
      addKatha({
        id: `katha-${Date.now()}`,
        audioUri,
        duration,
        transcript: '',
        narratorId: '',
        type: 'standalone_story',
        recordedAt: new Date().toISOString(),
        language: 'en',
        waveform: [],
        linkedMedia: [],
        linkedMembers: [],
      } as any);
      Alert.alert('Saved!', 'Your story has been recorded.', [
        { text: 'OK', onPress: () => { setViewMode('gallery'); setActiveTab('stories'); refreshKathas(); } }
      ]);
    } catch (_error) {
      Alert.alert('Save Failed', 'Could not save your story. Please try again.');
      setViewMode('gallery');
      setActiveTab('stories');
    } finally {
      setIsUploading(false);
    }
  }, [addKatha, refreshKathas]);
  
  // ─── Sub-views ───────────────────────────────────────
  
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
      <View style={styles.container}>
        <View style={[styles.backHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backButton} onPress={() => setViewMode('gallery')} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={VanshColors.masi[700]} />
          </Pressable>
          <Text style={styles.backHeaderTitle}>Add Memory</Text>
          <View style={{ width: 40 }} />
        </View>
        <MemoryUpload
          onCancel={() => setViewMode('gallery')}
          onComplete={() => handleUploadComplete('')}
        />
      </View>
    );
  }

  if (viewMode === 'katha_recorder') {
    return <KathaRecorder onComplete={handleRecordComplete} onCancel={() => { setViewMode('gallery'); setActiveTab('stories'); }} />;
  }

  if (viewMode === 'katha_player' && selectedKatha) {
    return <KathaPlayer katha={selectedKatha} onClose={() => { setViewMode('gallery'); setActiveTab('stories'); }} />;
  }
  
  // ─── Main Gallery View ──────────────────────────────
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Memories</Text>
          <Text style={styles.subtitle}>
            {(memories?.length || 0)} photos · {displayKathas.length} stories
          </Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            if (activeTab === 'stories') {
              setViewMode('katha_recorder');
            } else {
              setViewMode('upload');
            }
          }}
        >
          <LinearGradient
            colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <MaterialIcons
              name={activeTab === 'stories' ? 'mic' : 'add-photo-alternate'}
              size={18}
              color="#FFF"
            />
            <Text style={styles.addButtonText}>
              {activeTab === 'stories' ? 'Record' : 'Add'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
      
      {/* ── Family Sync Banner ── */}
      {syncInfo.contributors > 1 && (
        <Pressable style={styles.syncBanner} onPress={refresh}>
            <View style={styles.syncIcon}>
              <MaterialIcons name="family-restroom" size={16} color={VanshColors.suvarna[600]} />
            </View>
            <Text style={styles.syncText}>
              Shared album · {syncInfo.contributors} family members contributing
            </Text>
            <MaterialIcons name="sync" size={16} color={VanshColors.masi[400]} />
          </Pressable>
      )}
      
      {/* ── Tab Switcher ── */}
      <View style={styles.tabSwitcher}>
        <Pressable
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
        >
          <MaterialIcons
            name="photo-library"
            size={18}
            color={activeTab === 'photos' ? VanshColors.suvarna[600] : VanshColors.masi[400]}
          />
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
            Photos
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'stories' && styles.tabActive]}
          onPress={() => setActiveTab('stories')}
        >
          <MaterialIcons
            name="mic"
            size={18}
            color={activeTab === 'stories' ? VanshColors.suvarna[600] : VanshColors.masi[400]}
          />
          <Text style={[styles.tabText, activeTab === 'stories' && styles.tabTextActive]}>
            Stories
          </Text>
        </Pressable>
      </View>
      
      {/* ── Content ── */}
      {activeTab === 'photos' ? (
        <MemoryGallery
          onMemoryPress={handleMemoryPress}
          onRefresh={async () => { await refresh(); }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.storiesList} showsVerticalScrollIndicator={false}>
          {displayKathas.length === 0 ? (
            <View style={styles.emptyStories}>
              <View style={styles.emptyStoriesIcon}>
                <MaterialIcons name="mic-none" size={40} color={VanshColors.suvarna[300]} />
              </View>
              <Text style={styles.emptyStoriesTitle}>No Stories Yet</Text>
              <Text style={styles.emptyStoriesSubtitle}>
                Record the voices of your family.{'\n'}Stories are preserved and shared forever.
              </Text>
              <Pressable style={styles.recordBtn} onPress={() => setViewMode('katha_recorder')}>
                <LinearGradient
                  colors={[VanshColors.suvarna[400], VanshColors.suvarna[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recordBtnGradient}
                >
                  <MaterialIcons name="mic" size={18} color="#FFF" />
                  <Text style={styles.recordBtnText}>Record a Story</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            displayKathas.map((katha, i) => {
              const narrator = getMember(katha.narratorId);
              return (
                <Pressable
                  key={katha.id}
                  style={styles.kathaCard}
                    onPress={() => { setSelectedKatha(katha); setViewMode('katha_player'); }}
                  >
                    <View style={styles.kathaCardLeft}>
                      <View style={styles.kathaPlayBtn}>
                        <MaterialIcons name="play-arrow" size={20} color="#FFF" />
                      </View>
                    </View>
                    <View style={styles.kathaCardContent}>
                      <Text style={styles.kathaCardTitle} numberOfLines={1}>
                        {katha.transcript?.slice(0, 40) || 'Voice Story'}
                      </Text>
                      <Text style={styles.kathaCardSubtitle}>
                        {narrator ? `${narrator.firstName} ${narrator.lastName}` : 'Family Member'} · {formatDuration(katha.duration)}
                      </Text>
                    </View>
                    <View style={styles.kathaWave}>
                      {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 0.9, 0.3, 0.6].map((h, idx) => (
                        <View
                          key={idx}
                          style={[styles.waveBar, { height: h * 20, backgroundColor: VanshColors.suvarna[300 + (idx % 3) * 100 as 300 | 400 | 500] }]}
                        />
                      ))}
                    </View>
                  </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {},
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: VanshColors.masi[900],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  addButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: VanshColors.suvarna[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Family sync banner
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: VanshColors.suvarna[50],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: VanshColors.suvarna[100],
  },
  syncIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: VanshColors.suvarna[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: VanshColors.masi[600],
  },
  
  // Back header
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFAF8',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  backHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  
  // Tab switcher
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: VanshColors.khadi[200],
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[400],
  },
  tabTextActive: {
    color: VanshColors.suvarna[600],
  },
  
  // Stories list
  storiesList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  kathaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kathaCardLeft: {},
  kathaPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: VanshColors.suvarna[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: VanshColors.suvarna[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  kathaCardContent: {
    flex: 1,
  },
  kathaCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  kathaCardSubtitle: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginTop: 3,
  },
  kathaWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  
  // Empty stories
  emptyStories: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStoriesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: VanshColors.suvarna[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: VanshColors.suvarna[100],
    borderStyle: 'dashed',
  },
  emptyStoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: VanshColors.masi[700],
  },
  emptyStoriesSubtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 24,
    shadowColor: VanshColors.suvarna[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  recordBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  recordBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
