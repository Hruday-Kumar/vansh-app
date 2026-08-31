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
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KathaPlayer, KathaRecorder, PhotoStoryRecorder, TranscriptionPanel, VideoKathaRecorder } from '../../src/features/katha';
import { CreateEventModal, EventAlbum, EventList, MemoryGallery, MemoryUpload, MemoryViewer, MosaicGallery, TimelineGallery, UploadProgressOverlay } from '../../src/features/smriti';
import { DEMO_EVENTS, DEMO_KATHAS, DEMO_MEMBERS, DEMO_MEMORIES } from '../../src/features/smriti/demo-data';
import { useEvents, useKathas, useMemories } from '../../src/hooks';
import { useAuthStore, useFamilyStore, useKathaStore, useMemoryStore } from '../../src/state';
import { VanshColors } from '../../src/theme';
import type { FamilyEvent, Katha, MemberId, SmritiMedia } from '../../src/types';

type ViewMode = 'gallery' | 'viewer' | 'upload' | 'katha_list' | 'katha_recorder' | 'katha_player' | 'event_album' | 'video_recorder' | 'photo_story_recorder' | 'transcription';
type StoryRecordType = 'voice' | 'video' | 'photo_story';
type MediaTab = 'photos' | 'stories';
type GalleryLayout = 'grid' | 'mosaic' | 'timeline';

export default function SmritiScreen() {
  const insets = useSafeAreaInsets();
  
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedMemory, setSelectedMemory] = useState<SmritiMedia | null>(null);
  const [selectedKatha, setSelectedKatha] = useState<Katha | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null);
  const [activeTab, setActiveTab] = useState<MediaTab>('photos');
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState<{ audioUri: string; duration: number } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { memories, isLoading, refresh, syncInfo } = useMemories();
  const { kathas, refresh: refreshKathas, uploadKatha } = useKathas();
  const { events, createEvent, loadEventMemories, refresh: refreshEvents } = useEvents();
  const { recentKathas, addKatha } = useKathaStore();
  const { getMember: getStoreMember, family } = useFamilyStore();
  const { recentMemories, setMemories: setStoreMemories } = useMemoryStore();
  const { setKathas: setStoreKathas } = useKathaStore();
  
  const displayKathas = kathas.length > 0 ? kathas : recentKathas;

  // Demo mode: overlay demo data onto real data (local only — never modifies family store)
  const effectiveMemories = isDemoMode
    ? [...DEMO_MEMORIES, ...recentMemories]
    : recentMemories;
  const effectiveKathas = isDemoMode
    ? [...DEMO_KATHAS, ...displayKathas]
    : displayKathas;
  const effectiveEvents = isDemoMode
    ? [...DEMO_EVENTS, ...events]
    : events;

  // Local demo member lookup — falls back to real store, never mutates it
  const demoMemberMap = useMemo(() => {
    const map = new Map<string, (typeof DEMO_MEMBERS)[number]>();
    for (const m of DEMO_MEMBERS) map.set(m.id, m);
    return map;
  }, []);

  const getMember = useCallback((id: MemberId) => {
    if (isDemoMode) {
      const demo = demoMemberMap.get(id as string);
      if (demo) return demo as any;
    }
    return getStoreMember(id);
  }, [isDemoMode, demoMemberMap, getStoreMember]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);
  
  const handleMemoryPress = useCallback((memory: SmritiMedia) => {
    setSelectedMemory(memory);
    setViewMode('viewer');
  }, []);
  
  const handleUploadComplete = useCallback((_memoryId: string) => {
    setViewMode('gallery');
    refresh();
  }, [refresh]);

  const handleRecordComplete = useCallback(async (audioUri: string, duration: number) => {
    // Go to transcription panel instead of saving immediately
    setPendingTranscription({ audioUri, duration });
    setViewMode('transcription');
  }, []);

  const handleTranscriptionComplete = useCallback(async (text: string) => {
    if (!pendingTranscription) return;
    const { audioUri, duration } = pendingTranscription;
    
    // Save locally immediately so it appears in the UI right away
    addKatha({
      id: `katha-${Date.now()}`,
      audioUri,
      duration,
      transcript: text,
      narratorId: useAuthStore.getState().user?.memberId || '',
      type: 'standalone_story',
      recordedAt: Date.now(),
      language: 'en',
      waveform: [],
      linkedMedia: [],
      linkedMembers: [],
    } as any);
    setPendingTranscription(null);
    
    // Also upload to backend for persistence across devices
    try {
      const blob = await fetch(audioUri).then(r => r.blob());
      await uploadKatha(blob, {
        title: text.slice(0, 60) || `Story - ${new Date().toLocaleDateString()}`,
        narratorId: useAuthStore.getState().user?.memberId || '',
        type: 'standalone_story',
      });
    } catch {
      // Local save already succeeded — backend sync will catch up later
    }
    
    Alert.alert('Saved!', 'Your story has been recorded and transcribed.', [
      { text: 'OK', onPress: () => { setViewMode('gallery'); setActiveTab('stories'); refreshKathas(); } }
    ]);
  }, [pendingTranscription, addKatha, refreshKathas, uploadKatha]);

  const handleTranscriptionSkip = useCallback(async () => {
    if (!pendingTranscription) return;
    const { audioUri, duration } = pendingTranscription;
    
    addKatha({
      id: `katha-${Date.now()}`,
      audioUri,
      duration,
      transcript: '',
      narratorId: useAuthStore.getState().user?.memberId || '',
      type: 'standalone_story',
      recordedAt: Date.now(),
      language: 'en',
      waveform: [],
      linkedMedia: [],
      linkedMembers: [],
    } as any);
    setPendingTranscription(null);
    
    try {
      const blob = await fetch(audioUri).then(r => r.blob());
      await uploadKatha(blob, {
        title: `Story - ${new Date().toLocaleDateString()}`,
        narratorId: useAuthStore.getState().user?.memberId || '',
        type: 'standalone_story',
      });
    } catch {
      // Local save already succeeded
    }
    
    Alert.alert('Saved!', 'Your story has been recorded.', [
      { text: 'OK', onPress: () => { setViewMode('gallery'); setActiveTab('stories'); refreshKathas(); } }
    ]);
  }, [pendingTranscription, addKatha, refreshKathas, uploadKatha]);

  const handleEventPress = useCallback((event: FamilyEvent) => {
    setSelectedEvent(event);
    setViewMode('event_album');
  }, []);

  const handleCreateEvent = useCallback(async (data: {
    name: string;
    description?: string;
    eventType: string;
    eventDate?: string;
    location?: string;
  }) => {
    await createEvent(data);
    setShowCreateEvent(false);
    refreshEvents();
  }, [createEvent, refreshEvents]);

  const handleVideoStoryComplete = useCallback((videoUri: string, duration: number) => {
    addKatha({
      id: `katha-video-${Date.now()}`,
      audioUri: videoUri, // Video URI stored as audioUri for playback
      videoUri,
      duration,
      transcript: '',
      narratorId: '',
      type: 'video',
      recordedAt: Date.now(),
      language: 'en',
      waveform: [],
      linkedMedia: [],
      linkedMembers: [],
    } as any);
    Alert.alert('Saved!', 'Your video story has been recorded.', [
      { text: 'OK', onPress: () => { setViewMode('gallery'); setActiveTab('stories'); refreshKathas(); } }
    ]);
  }, [addKatha, refreshKathas]);

  const handlePhotoStoryComplete = useCallback((data: {
    audioUri: string;
    duration: number;
    syncPoints: any[];
    linkedMedia: string[];
    waveform: number[];
  }) => {
    addKatha({
      id: `katha-photostory-${Date.now()}`,
      audioUri: data.audioUri,
      duration: data.duration,
      transcript: '',
      narratorId: '',
      type: 'photo_story',
      recordedAt: Date.now(),
      language: 'en',
      waveform: data.waveform,
      syncPoints: data.syncPoints,
      linkedMedia: data.linkedMedia,
      linkedMembers: [],
    } as any);
    Alert.alert('Saved!', 'Your photo story has been recorded.', [
      { text: 'OK', onPress: () => { setViewMode('gallery'); setActiveTab('stories'); refreshKathas(); } }
    ]);
  }, [addKatha, refreshKathas]);

  const handleAddMemoryPress = useCallback(() => {
    Alert.alert(
      'Add to Memories',
      'What would you like to add?',
      [
        { text: '📷 Add Photo / Video', onPress: () => setViewMode('upload') },
        { text: '📁 Create Album', onPress: () => setShowCreateEvent(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleStoryRecordPress = useCallback(() => {
    Alert.alert(
      'Record a Story',
      'What kind of story would you like to record?',
      [
        { text: '🎙️ Voice Story', onPress: () => setViewMode('katha_recorder') },
        { text: '🎬 Video Story', onPress: () => setViewMode('video_recorder') },
        { text: '📸 Photo Story', onPress: () => setViewMode('photo_story_recorder') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);
  
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

  if (viewMode === 'video_recorder') {
    return (
      <VideoKathaRecorder
        onComplete={handleVideoStoryComplete}
        onCancel={() => { setViewMode('gallery'); setActiveTab('stories'); }}
      />
    );
  }

  if (viewMode === 'photo_story_recorder') {
    return (
      <PhotoStoryRecorder
        onComplete={handlePhotoStoryComplete}
        onCancel={() => { setViewMode('gallery'); setActiveTab('stories'); }}
      />
    );
  }

  if (viewMode === 'transcription' && pendingTranscription) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.backHeader}>
          <Pressable style={styles.backButton} onPress={handleTranscriptionSkip} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={VanshColors.masi[700]} />
          </Pressable>
          <Text style={styles.backHeaderTitle}>Transcribe</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TranscriptionPanel
            audioUri={pendingTranscription.audioUri}
            duration={pendingTranscription.duration}
            familyName={family?.name}
            onTranscriptionComplete={handleTranscriptionComplete}
            onSkip={handleTranscriptionSkip}
          />
        </ScrollView>
      </View>
    );
  }

  if (viewMode === 'event_album' && selectedEvent) {
    return (
      <EventAlbum
        event={selectedEvent}
        onClose={() => { setViewMode('gallery'); refreshEvents(); }}
        onMemoryPress={(memory) => {
          setSelectedMemory(memory);
          setViewMode('viewer');
        }}
        onAddMedia={() => setViewMode('upload')}
        loadEventMemories={loadEventMemories}
      />
    );
  }
  
  // ─── Main Gallery View ──────────────────────────────
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Memories</Text>
          <Text style={styles.subtitle}>
            {(effectiveMemories?.length || 0)} photos · {effectiveKathas.length} stories
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Demo Mode Toggle */}
          <Pressable
            style={[styles.demoToggle, isDemoMode && styles.demoToggleActive]}
            onPress={toggleDemoMode}
            hitSlop={8}
          >
            <MaterialIcons
              name={isDemoMode ? 'visibility' : 'visibility-off'}
              size={16}
              color={isDemoMode ? '#FFF' : VanshColors.masi[400]}
            />
            <Text style={[styles.demoToggleText, isDemoMode && styles.demoToggleTextActive]}>
              {isDemoMode ? 'Demo' : 'Demo'}
            </Text>
          </Pressable>
          <Pressable
          style={styles.addButton}
          onPress={() => {
            if (activeTab === 'stories') {
              handleStoryRecordPress();
            } else {
              handleAddMemoryPress();
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

      {/* ── Layout Switcher (photos only) ── */}
      {activeTab === 'photos' && (
        <View style={styles.layoutSwitcher}>
          {([
            { key: 'grid' as GalleryLayout, icon: 'grid-view' as const, label: 'Grid' },
            { key: 'mosaic' as GalleryLayout, icon: 'dashboard' as const, label: 'Mosaic' },
            { key: 'timeline' as GalleryLayout, icon: 'timeline' as const, label: 'Timeline' },
          ]).map((layout) => (
            <Pressable
              key={layout.key}
              style={[styles.layoutBtn, galleryLayout === layout.key && styles.layoutBtnActive]}
              onPress={() => setGalleryLayout(layout.key)}
            >
              <MaterialIcons
                name={layout.icon}
                size={16}
                color={galleryLayout === layout.key ? VanshColors.suvarna[600] : VanshColors.masi[400]}
              />
              <Text style={[styles.layoutBtnText, galleryLayout === layout.key && styles.layoutBtnTextActive]}>
                {layout.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      
      {/* ── Content ── */}
      {activeTab === 'photos' ? (
        galleryLayout === 'mosaic' ? (
          <MosaicGallery
            memories={effectiveMemories}
            onMemoryPress={handleMemoryPress}
            onRefresh={async () => { await refresh(); }}
            ListHeaderComponent={
              <EventList
                events={effectiveEvents}
                onEventPress={handleEventPress}
                onCreatePress={() => setShowCreateEvent(true)}
              />
            }
          />
        ) : galleryLayout === 'timeline' ? (
          <TimelineGallery
            memories={effectiveMemories}
            onMemoryPress={handleMemoryPress}
            onRefresh={async () => { await refresh(); }}
            ListHeaderComponent={
              <EventList
                events={effectiveEvents}
                onEventPress={handleEventPress}
                onCreatePress={() => setShowCreateEvent(true)}
              />
            }
          />
        ) : (
          <MemoryGallery
            onMemoryPress={handleMemoryPress}
            onRefresh={async () => { await refresh(); }}
            memories={effectiveMemories}
            ListHeaderComponent={
              <EventList
                events={effectiveEvents}
                onEventPress={handleEventPress}
                onCreatePress={() => setShowCreateEvent(true)}
              />
            }
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.storiesList} showsVerticalScrollIndicator={false}>
          {effectiveKathas.length === 0 ? (
            <View style={styles.emptyStories}>
              <View style={styles.emptyStoriesIcon}>
                <MaterialIcons name="mic-none" size={40} color={VanshColors.suvarna[300]} />
              </View>
              <Text style={styles.emptyStoriesTitle}>No Stories Yet</Text>
              <Text style={styles.emptyStoriesSubtitle}>
                Record the voices of your family.{'\n'}Stories are preserved and shared forever.
              </Text>
              <Pressable style={styles.recordBtn} onPress={handleStoryRecordPress}>
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
            effectiveKathas.map((katha, i) => {
              const narrator = getMember(katha.narratorId);
              const typeIcon = katha.type === 'video' ? 'videocam' : katha.type === 'photo_story' ? 'photo-library' : 'mic';
              const typeLabel = katha.type === 'video' ? 'Video Story' : katha.type === 'photo_story' ? 'Photo Story' : (katha.transcript?.slice(0, 40) || 'Voice Story');
              return (
                <Pressable
                  key={katha.id}
                  style={styles.kathaCard}
                    onPress={() => { setSelectedKatha(katha); setViewMode('katha_player'); }}
                  >
                    <View style={styles.kathaCardLeft}>
                      <View style={[styles.kathaPlayBtn, katha.type === 'video' && { backgroundColor: VanshColors.sindoor[500] }, katha.type === 'photo_story' && { backgroundColor: VanshColors.suvarna[700] }]}>
                        <MaterialIcons name={katha.type === 'video' ? 'videocam' : 'play-arrow'} size={20} color="#FFF" />
                      </View>
                    </View>
                    <View style={styles.kathaCardContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.kathaCardTitle} numberOfLines={1}>
                          {typeLabel}
                        </Text>
                        {katha.type !== 'voice_overlay' && katha.type !== 'standalone_story' && (
                          <View style={styles.kathaTypeBadge}>
                            <MaterialIcons name={typeIcon as any} size={10} color={VanshColors.suvarna[600]} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.kathaCardSubtitle}>
                        {narrator ? `${narrator.firstName} ${narrator.lastName}` : 'Family Member'} · {formatDuration(katha.duration)}
                      </Text>
                    </View>
                    <View style={styles.kathaWave}>
                      {katha.type === 'video' ? (
                        <MaterialIcons name="movie" size={24} color={VanshColors.sindoor[300]} />
                      ) : katha.type === 'photo_story' ? (
                        <MaterialIcons name="burst-mode" size={24} color={VanshColors.suvarna[400]} />
                      ) : (
                        [0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 0.9, 0.3, 0.6].map((h, idx) => (
                          <View
                            key={idx}
                            style={[styles.waveBar, { height: h * 20, backgroundColor: VanshColors.suvarna[300 + (idx % 3) * 100 as 300 | 400 | 500] }]}
                          />
                        ))
                      )}
                    </View>
                  </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Create Event Modal ── */}
      <CreateEventModal
        visible={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSubmit={handleCreateEvent}
      />

      {/* ── Upload Progress Overlay ── */}
      <UploadProgressOverlay bottomOffset={80} />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: VanshColors.khadi[200],
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
  },
  demoToggleActive: {
    backgroundColor: VanshColors.suvarna[500],
    borderColor: VanshColors.suvarna[600],
  },
  demoToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: VanshColors.masi[400],
  },
  demoToggleTextActive: {
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
  
  // Layout switcher
  layoutSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 6,
  },
  layoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: VanshColors.khadi[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layoutBtnActive: {
    backgroundColor: VanshColors.suvarna[50],
    borderColor: VanshColors.suvarna[300],
  },
  layoutBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: VanshColors.masi[400],
  },
  layoutBtnTextActive: {
    color: VanshColors.suvarna[600],
    fontWeight: '600',
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
  kathaTypeBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
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
