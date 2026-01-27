/**
 * 🪷 KATHA TAB - Voice stories screen
 */

import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText, SilkButton } from '../../src/components';
import { API_URL } from '../../src/config/api';
import { KathaPlayer, KathaRecorder } from '../../src/features/katha';
import { useKathas } from '../../src/hooks';
import { useAuthStore, useFamilyStore, useKathaStore } from '../../src/state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../src/theme';
import type { Katha } from '../../src/types';

type ViewMode = 'list' | 'recorder' | 'player';

export default function KathaScreen() {
  const insets = useSafeAreaInsets();
  const { recentKathas, addKatha } = useKathaStore();
  const { getMember } = useFamilyStore();
  const { user, token } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  
  // Use API hook
  const { kathas, isLoading, refresh } = useKathas();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedKatha, setSelectedKatha] = useState<Katha | null>(null);
  
  // Use API kathas if available, otherwise fall back to local store
  const displayKathas = kathas.length > 0 ? kathas : recentKathas;
  
  const handleKathaPress = useCallback((katha: Katha) => {
    setSelectedKatha(katha);
    setViewMode('player');
  }, []);
  
  const handleRecordComplete = useCallback(async (audioUri: string, duration: number) => {
    // Upload the audio to backend
    setIsUploading(true);
    try {
      console.log('📤 Uploading audio:', audioUri);
      
      // Use fetch with FormData for upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('title', `Story - ${new Date().toLocaleDateString()}`);
      formData.append('narratorId', user?.memberId || '');
      formData.append('type', 'standalone_story');
      formData.append('duration', String(duration));
      
      // Don't set Content-Type header for FormData - let React Native set it with boundary
      const response = await fetch(`${API_URL}/kathas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('📥 Upload status:', response.status);
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success!', 'Your story has been saved.', [
          { text: 'OK', onPress: () => {
            setViewMode('list');
            refresh();
          }}
        ]);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Could not save your story. Please try again.');
      setViewMode('list');
    } finally {
      setIsUploading(false);
    }
  }, [token, user, refresh]);
  
  const renderKatha = useCallback(({ item, index }: { item: Katha; index: number }) => {
    const narrator = getMember(item.narratorId);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <Pressable onPress={() => handleKathaPress(item)}>
          <HeritageCard variant="elevated" style={styles.kathaCard}>
            <View style={styles.kathaHeader}>
              <MemberAvatar
                uri={narrator?.avatarUri}
                name={narrator ? `${narrator.firstName} ${narrator.lastName}` : 'Narrator'}
                size="md"
              />
              <View style={styles.kathaMeta}>
                <SacredText variant="subhead" color="primary" numberOfLines={1}>
                  {item.type === 'song' ? '🎵' : '🎙️'} {item.transcript?.slice(0, 30) || 'Voice Story'}...
                </SacredText>
                <SacredText variant="caption" color="muted">
                  {narrator ? `${narrator.firstName} ${narrator.lastName}` : 'Family Member'} • {formatDuration(item.duration)}
                </SacredText>
              </View>
            </View>
            
            {/* Topics */}
            {item.topics && item.topics.length > 0 && (
              <View style={styles.topicsRow}>
                {item.topics.slice(0, 3).map(topic => (
                  <View key={topic} style={styles.topicTag}>
                    <SacredText variant="caption" color="gold">{topic}</SacredText>
                  </View>
                ))}
              </View>
            )}
            
            {/* Play button */}
            <View style={styles.playHint}>
              <SacredText variant="caption" color="muted">Tap to listen →</SacredText>
            </View>
          </HeritageCard>
        </Pressable>
      </Animated.View>
    );
  }, [getMember]);
  
  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <SacredText variant="hero" color="gold">🎙️</SacredText>
      <SacredText variant="title" color="primary" align="center">
        No Stories Yet
      </SacredText>
      <SacredText variant="body" color="secondary" align="center" style={styles.emptyText}>
        Record your first family story. Share memories, traditions, and wisdom in your own voice.
      </SacredText>
      <SilkButton
        variant="primary"
        label="Record a Story"
        onPress={() => setViewMode('recorder')}
      />
    </View>
  ), []);
  
  if (viewMode === 'recorder') {
    return (
      <KathaRecorder
        onComplete={handleRecordComplete}
        onCancel={() => setViewMode('list')}
      />
    );
  }
  
  if (viewMode === 'player' && selectedKatha) {
    return (
      <KathaPlayer
        katha={selectedKatha}
        onClose={() => setViewMode('list')}
      />
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <SacredText variant="displaySmall" color="gold">Katha</SacredText>
          <SacredText variant="caption" color="muted">कथा - Voice Stories</SacredText>
        </View>
        <SilkButton
          variant="secondary"
          label="+ Record"
          onPress={() => setViewMode('recorder')}
        />
      </View>
      
      {/* Stories List */}
      <FlatList
        data={displayKathas}
        renderItem={renderKatha}
        keyExtractor={item => item.id}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refresh}
      />
    </View>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  listContent: {
    padding: VanshSpacing.lg,
    flexGrow: 1,
  },
  kathaCard: {
    marginBottom: VanshSpacing.md,
  },
  kathaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.md,
  },
  kathaMeta: {
    flex: 1,
    gap: VanshSpacing.xs,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VanshSpacing.xs,
    marginTop: VanshSpacing.sm,
  },
  topicTag: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
  },
  playHint: {
    marginTop: VanshSpacing.sm,
    alignItems: 'flex-end',
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
