/**
 * 🪷 SKELETON COMPONENTS
 * Beautiful loading placeholders with shimmer animation
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { VanshColors, VanshRadius, VanshSpacing } from '../../theme';

// ═══════════════════════════════════════════════════════════
// SHIMMER EFFECT
// ═══════════════════════════════════════════════════════════

function useShimmer() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  return shimmer;
}

// ═══════════════════════════════════════════════════════════
// BASE SKELETON
// ═══════════════════════════════════════════════════════════

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = VanshRadius.sm,
  style,
}: SkeletonProps) {
  const shimmer = useShimmer();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// SKELETON VARIANTS
// ═══════════════════════════════════════════════════════════

/**
 * Circle skeleton for avatars
 */
export function SkeletonCircle({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

/**
 * Text line skeleton
 */
export function SkeletonText({
  width = '100%',
  lines = 1,
  spacing = VanshSpacing.xs,
}: {
  width?: number | `${number}%`;
  lines?: number;
  spacing?: number;
}) {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? '70%' : width}
          height={14}
        />
      ))}
    </View>
  );
}

/**
 * Card skeleton - common card layout
 */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonCircle size={48} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton height={120} borderRadius={VanshRadius.md} style={{ marginTop: VanshSpacing.md }} />
      <SkeletonText lines={2} width="100%" />
    </View>
  );
}

/**
 * Memory card skeleton
 */
export function SkeletonMemoryCard() {
  return (
    <View style={styles.memoryCard}>
      <Skeleton height={180} borderRadius={VanshRadius.lg} />
      <View style={styles.memoryCardContent}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/**
 * List item skeleton
 */
export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <SkeletonCircle size={44} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={VanshRadius.full} />
    </View>
  );
}

/**
 * Family member skeleton for tree
 */
export function SkeletonFamilyMember() {
  return (
    <View style={styles.familyMember}>
      <SkeletonCircle size={64} />
      <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
      <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

/**
 * Katha (story) skeleton
 */
export function SkeletonKatha() {
  return (
    <View style={styles.katha}>
      <View style={styles.kathaHeader}>
        <SkeletonCircle size={40} />
        <View style={styles.kathaHeaderText}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton height={60} borderRadius={VanshRadius.md} style={{ marginTop: VanshSpacing.sm }} />
      <View style={styles.kathaWaveform}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton
            key={i}
            width={4}
            height={10 + Math.random() * 20}
            borderRadius={2}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Settings section skeleton
 */
export function SkeletonSettings() {
  return (
    <View style={styles.settings}>
      <Skeleton width={120} height={12} style={{ marginBottom: VanshSpacing.md }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Skeleton width={24} height={24} borderRadius={6} />
            <Skeleton width={100 + Math.random() * 60} height={14} style={{ marginLeft: VanshSpacing.md }} />
          </View>
          <Skeleton width={44} height={26} borderRadius={13} />
        </View>
      ))}
    </View>
  );
}

/**
 * Full page skeleton
 */
export function SkeletonPage({ type = 'list' }: { type?: 'list' | 'grid' | 'detail' }) {
  if (type === 'grid') {
    return (
      <View style={styles.page}>
        <View style={styles.pageHeader}>
          <Skeleton width={150} height={28} />
          <Skeleton width={80} height={36} borderRadius={VanshRadius.full} />
        </View>
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonMemoryCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (type === 'detail') {
    return (
      <View style={styles.page}>
        <Skeleton height={250} borderRadius={0} />
        <View style={styles.detailContent}>
          <SkeletonCircle size={80} />
          <Skeleton width="60%" height={24} style={{ marginTop: VanshSpacing.md }} />
          <Skeleton width="40%" height={14} style={{ marginTop: VanshSpacing.xs }} />
          <SkeletonText lines={4} width="100%" />
        </View>
      </View>
    );
  }

  // Default: list
  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Skeleton width={150} height={28} />
        <Skeleton width={80} height={36} borderRadius={VanshRadius.full} />
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: VanshColors.khadi[300],
  },
  card: {
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.md,
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: VanshSpacing.md,
  },
  memoryCard: {
    width: '48%',
    marginBottom: VanshSpacing.md,
  },
  memoryCardContent: {
    marginTop: VanshSpacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: VanshSpacing.md,
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.md,
    marginBottom: VanshSpacing.sm,
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
  },
  listItemContent: {
    flex: 1,
    marginLeft: VanshSpacing.md,
  },
  familyMember: {
    alignItems: 'center',
    padding: VanshSpacing.md,
  },
  katha: {
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.md,
    borderWidth: 1,
    borderColor: VanshColors.khadi[200],
  },
  kathaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kathaHeaderText: {
    marginLeft: VanshSpacing.sm,
  },
  kathaWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: VanshSpacing.sm,
    height: 40,
  },
  settings: {
    backgroundColor: VanshColors.khadi[50],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: VanshSpacing.sm,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  page: {
    flex: 1,
    padding: VanshSpacing.lg,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: VanshSpacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailContent: {
    padding: VanshSpacing.lg,
    alignItems: 'center',
  },
});
