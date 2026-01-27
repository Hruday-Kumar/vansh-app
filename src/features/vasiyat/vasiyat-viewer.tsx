/**
 * 🪷 VASIYAT VIEWER - View and unlock time-locked messages
 */

import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText, SilkButton, WisdomEnvelope } from '../../components';
import { useVasiyats } from '../../hooks/use-api';
import { useAuthStore, useFamilyStore } from '../../state';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';
import type { Vasiyat } from '../../types';

interface VasiyatViewerProps {
  vasiyat: Vasiyat;
  onClose: () => void;
}

export function VasiyatViewer({ vasiyat, onClose }: VasiyatViewerProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { getMember } = useFamilyStore();
  const { unlockVasiyat } = useVasiyats();
  
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [localUnlocked, setLocalUnlocked] = useState(vasiyat.isUnlocked);
  
  const author = getMember(vasiyat.creatorId);
  const isOwnMessage = vasiyat.creatorId === user?.memberId;
  
  // Animation values for unlocking
  const envelopeScale = useSharedValue(1);
  const contentOpacity = useSharedValue(localUnlocked ? 1 : 0);
  const contentTranslateY = useSharedValue(localUnlocked ? 0 : 30);
  
  const handleUnlock = async () => {
    setIsUnlocking(true);
    setUnlockError(null);
    
    try {
      // Call unlock API - returns true on success, throws on failure
      await unlockVasiyat(vasiyat.id);
      
      // Animate envelope "opening"
      envelopeScale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(0.95, { duration: 150 }),
        withTiming(0, { duration: 400 })
      );
      
      // Show content after envelope disappears
      setTimeout(() => {
        setLocalUnlocked(true);
        contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
        contentTranslateY.value = withDelay(200, withTiming(0, { duration: 500 }));
      }, 600);
    } catch (error: any) {
      setUnlockError(error.message || 'Cannot unlock yet - conditions not met');
    } finally {
      setIsUnlocking(false);
    }
  };
  
  // Manual unlock for message author
  const handleManualUnlock = () => {
    Alert.alert(
      'Unlock Message',
      'Are you sure you want to unlock this message now? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlock', 
          style: 'destructive',
          onPress: async () => {
            try {
              await unlockVasiyat(vasiyat.id);
              setLocalUnlocked(true);
              contentOpacity.value = withTiming(1, { duration: 500 });
              contentTranslateY.value = withTiming(0, { duration: 500 });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Could not unlock');
            }
          }
        }
      ]
    );
  };
  
  const envelopeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: envelopeScale.value }],
  }));
  
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));
  
  const formatUnlockInfo = () => {
    const trigger = vasiyat.trigger;
    if (!trigger) return 'Opens when conditions are met';
    
    switch (trigger.type) {
      case 'date':
        return trigger.date
          ? `Opens on ${new Date(trigger.date).toLocaleDateString()}`
          : 'Opens on a specific date';
      case 'event':
        return trigger.event
          ? `Opens when: ${trigger.event}`
          : 'Opens on a life event';
      case 'death':
        return 'Opens after the author\'s passing';
      case 'manual':
        return 'Opens when unlocked by author';
      case 'age':
        return `Opens when recipient turns ${trigger.recipientAge}`;
      default:
        return '';
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="✕" onPress={onClose} />
        <View style={styles.headerCenter}>
          {author && (
            <MemberAvatar
              uri={author.avatarUri}
              name={`${author.firstName} ${author.lastName}`}
              size="sm"
            />
          )}
          <View>
            <SacredText variant="caption" color="muted">From</SacredText>
            <SacredText variant="body" color="primary">
              {author ? `${author.firstName} ${author.lastName}` : 'Family Member'}
            </SacredText>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!localUnlocked ? (
          // SEALED STATE
          <Animated.View style={[styles.sealedContainer, envelopeStyle]}>
            <WisdomEnvelope
              title={vasiyat.title || 'A Message for You'}
              fromName={author ? `${author.firstName} ${author.lastName}` : 'Family Member'}
              toName="You"
              mood={vasiyat.mood || 'wisdom'}
              isLocked={true}
              unlockDate={vasiyat.trigger?.type === 'date' ? vasiyat.trigger.date : undefined}
            />
            
            <SacredText variant="title" color="primary" align="center" style={styles.sealedTitle}>
              {vasiyat.title || 'A Message for You'}
            </SacredText>
            
            <SacredText variant="body" color="secondary" align="center" style={styles.sealedDesc}>
              {formatUnlockInfo()}
            </SacredText>
            
            {isOwnMessage ? (
              // Author can view and unlock their own message
              <View style={styles.authorActions}>
                <SilkButton
                  variant="secondary"
                  label="👁️ View Your Message"
                  onPress={() => setLocalUnlocked(true)}
                />
                <SilkButton
                  variant="ghost"
                  label="🔓 Unlock for Recipients"
                  onPress={handleManualUnlock}
                  style={{ marginTop: VanshSpacing.sm }}
                />
              </View>
            ) : (
              <>
                <SilkButton
                  variant="primary"
                  label={isUnlocking ? 'Checking...' : '🔓 Try to Unlock'}
                  onPress={handleUnlock}
                  disabled={isUnlocking}
                />
                
                {unlockError && (
                  <HeritageCard variant="outlined" style={styles.errorCard}>
                    <SacredText variant="caption" color="vermilion" align="center">
                      {unlockError}
                    </SacredText>
                  </HeritageCard>
                )}
              </>
            )}
          </Animated.View>
        ) : (
          // UNLOCKED STATE
          <Animated.View style={[styles.unlockedContainer, contentStyle]}>
            <Animated.View entering={ZoomIn.delay(200)}>
              <SacredText variant="displaySmall" color="gold" align="center">
                🪷
              </SacredText>
            </Animated.View>
            
            <SacredText variant="heading" color="primary" align="center" style={styles.unlockedTitle}>
              {vasiyat.title || 'A Message of Love'}
            </SacredText>
            
            <SacredText variant="caption" color="muted" align="center">
              {`Created ${new Date(vasiyat.createdAt).toLocaleDateString()}`}
            </SacredText>
            
            {/* Message content */}
            <HeritageCard variant="elevated" style={styles.messageCard}>
              <SacredText variant="quote" color="secondary" style={styles.messageText}>
                {vasiyat.content?.text || 'No message content'}
              </SacredText>
              
              {/* Signature */}
              <View style={styles.signature}>
                <SacredText variant="hand" color="primary">
                  — {author ? author.firstName : 'With love'}
                </SacredText>
              </View>
            </HeritageCard>
            
            {/* Attachments preview */}
            {vasiyat.content?.documents && vasiyat.content.documents.length > 0 && (
              <View style={styles.attachments}>
                <SacredText variant="caption" color="muted">
                  📎 {vasiyat.content.documents.length} document(s) included
                </SacredText>
              </View>
            )}
            
            {/* Recipient info */}
            <View style={styles.recipientInfo}>
              <SacredText variant="caption" color="muted">
                {`Shared with ${vasiyat.recipients?.length || 0} family members`}
              </SacredText>
            </View>
          </Animated.View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VanshSpacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: VanshSpacing.lg,
    flexGrow: 1,
  },
  sealedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: VanshSpacing.lg,
    paddingVertical: VanshSpacing.xl,
  },
  sealedTitle: {
    marginTop: VanshSpacing.md,
  },
  sealedDesc: {
    marginBottom: VanshSpacing.md,
    maxWidth: 280,
  },
  authorActions: {
    alignItems: 'center',
    width: '100%',
  },
  errorCard: {
    marginTop: VanshSpacing.md,
    backgroundColor: VanshColors.sindoor[50],
  },
  unlockedContainer: {
    flex: 1,
    alignItems: 'center',
    gap: VanshSpacing.md,
  },
  unlockedTitle: {
    marginTop: VanshSpacing.sm,
  },
  messageCard: {
    width: '100%',
    marginTop: VanshSpacing.lg,
    padding: VanshSpacing.xl,
    backgroundColor: VanshColors.khadi[100],
    borderLeftWidth: 4,
    borderLeftColor: VanshColors.suvarna[500],
  },
  messageText: {
    lineHeight: 28,
  },
  signature: {
    marginTop: VanshSpacing.lg,
    alignItems: 'flex-end',
  },
  attachments: {
    marginTop: VanshSpacing.lg,
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  recipientInfo: {
    marginTop: VanshSpacing.md,
  },
});
