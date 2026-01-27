/**
 * 🪷 OFFLINE BANNER
 * Shows connectivity status and pending sync count
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { processSyncQueue, useNetworkState, useSyncStatus } from '../../services/sync';
import { useHaptics } from '../../utils/accessibility';

// ═══════════════════════════════════════════════════════════
// OFFLINE BANNER
// ═══════════════════════════════════════════════════════════

export function OfflineBanner(): React.ReactElement | null {
  const { isConnected, isInternetReachable } = useNetworkState();
  const { pending, processing } = useSyncStatus();
  const haptics = useHaptics();
  const translateY = useSharedValue(-100);
  const rotation = useSharedValue(0);

  const isOffline = !isConnected || !isInternetReachable;
  const showBanner = isOffline || pending > 0;

  useEffect(() => {
    translateY.value = withSpring(showBanner ? 0 : -100, {
      damping: 15,
      stiffness: 100,
    });
  }, [showBanner, translateY]);

  useEffect(() => {
    if (processing) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(360, { duration: 1000 }),
        ),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [processing, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleRetrySync = async () => {
    haptics.medium();
    await processSyncQueue();
    haptics.success();
  };

  if (!showBanner) return null;

  const bannerColor = isOffline ? '#DC2626' : '#D97706';
  const bannerText = isOffline
    ? 'ऑफ़लाइन - बदलाव सहेजे जाएंगे'
    : `${pending} बदलाव सिंक होने की प्रतीक्षा में`;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bannerColor }, animatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={iconStyle}>
          <Ionicons
            name={isOffline ? 'cloud-offline' : processing ? 'sync' : 'cloud-upload'}
            size={18}
            color="#fff"
          />
        </Animated.View>
        <Text style={styles.text}>{bannerText}</Text>
      </View>
      
      {!isOffline && pending > 0 && !processing && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetrySync}
          accessibilityLabel="पुनः प्रयास करें"
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>पुनः प्रयास</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// CONNECTION INDICATOR (For headers/footers)
// ═══════════════════════════════════════════════════════════

interface ConnectionIndicatorProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ConnectionIndicator({ 
  showLabel = false, 
  size = 'small' 
}: ConnectionIndicatorProps): React.ReactElement {
  const { isConnected, isInternetReachable } = useNetworkState();
  const isOnline = isConnected && isInternetReachable;

  const dotSize = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  return (
    <View style={styles.indicatorContainer}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: isOnline ? '#22C55E' : '#DC2626',
          },
        ]}
      />
      {showLabel && (
        <Text style={[styles.indicatorLabel, { fontSize }]}>
          {isOnline ? 'ऑनलाइन' : 'ऑफ़लाइन'}
        </Text>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// SYNC STATUS BADGE
// ═══════════════════════════════════════════════════════════

export function SyncStatusBadge(): React.ReactElement | null {
  const { pending, processing } = useSyncStatus();

  if (pending === 0) return null;

  return (
    <View style={styles.badge}>
      <Ionicons
        name={processing ? 'sync' : 'cloud-upload-outline'}
        size={12}
        color="#fff"
      />
      <Text style={styles.badgeText}>{pending}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 50, // Account for safe area
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    borderRadius: 999,
  },
  indicatorLabel: {
    color: '#666',
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
