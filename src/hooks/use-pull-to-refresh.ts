/**
 * 🪷 PULL TO REFRESH HOOK
 * Reusable hook for pull-to-refresh functionality with loading state
 */

import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';

export interface UsePullToRefreshOptions {
  /** Minimum refresh duration for UX (prevents flash) */
  minDuration?: number;
  /** Enable haptic feedback */
  hapticFeedback?: boolean;
  /** Callback when refresh completes */
  onComplete?: () => void;
  /** Callback when refresh fails */
  onError?: (error: Error) => void;
}

export interface UsePullToRefreshReturn {
  /** Whether refresh is in progress */
  refreshing: boolean;
  /** Handler to pass to RefreshControl */
  onRefresh: () => void;
  /** Manually trigger refresh */
  triggerRefresh: () => void;
  /** Last refresh timestamp */
  lastRefreshTime: Date | null;
}

/**
 * Hook for pull-to-refresh with loading state, haptics, and minimum duration
 * 
 * @example
 * ```tsx
 * const { refreshing, onRefresh } = usePullToRefresh(async () => {
 *   await fetchData();
 * });
 * 
 * <ScrollView
 *   refreshControl={
 *     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *   }
 * >
 * ```
 */
export function usePullToRefresh(
  refreshFn: () => Promise<void>,
  options: UsePullToRefreshOptions = {}
): UsePullToRefreshReturn {
  const {
    minDuration = 500,
    hapticFeedback = true,
    onComplete,
    onError,
  } = options;

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const isRefreshingRef = useRef(false);

  const executeRefresh = useCallback(async () => {
    // Prevent double-refresh
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    setRefreshing(true);
    
    // Haptic feedback at start
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const startTime = Date.now();

    try {
      await refreshFn();
      
      // Ensure minimum duration for better UX
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      setLastRefreshTime(new Date());
      
      // Success haptic
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      onComplete?.();
    } catch (error) {
      // Error haptic
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      onError?.(error instanceof Error ? error : new Error('Refresh failed'));
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [refreshFn, minDuration, hapticFeedback, onComplete, onError]);

  return {
    refreshing,
    onRefresh: executeRefresh,
    triggerRefresh: executeRefresh,
    lastRefreshTime,
  };
}

// ═══════════════════════════════════════════════════════════
// PAGINATION HOOK
// ═══════════════════════════════════════════════════════════

export interface UsePaginationOptions<T> {
  /** Items per page */
  pageSize?: number;
  /** Initial data */
  initialData?: T[];
}

export interface UsePaginationReturn<T> {
  /** Current data */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Loading more state */
  loadingMore: boolean;
  /** Whether there are more items */
  hasMore: boolean;
  /** Current page */
  page: number;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Load more items */
  loadMore: () => Promise<void>;
  /** Set data directly */
  setData: (data: T[]) => void;
}

/**
 * Hook for paginated data with pull-to-refresh and infinite scroll
 */
export function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: UsePaginationOptions<T> = {}
): UsePaginationReturn<T> {
  const { pageSize = 20, initialData = [] } = options;

  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const isLoadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    try {
      const result = await fetchFn(1, pageSize);
      setData(result.data);
      setHasMore(result.hasMore);
      setPage(1);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchFn, pageSize]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await fetchFn(nextPage, pageSize);
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [fetchFn, page, pageSize, hasMore]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    page,
    refresh,
    loadMore,
    setData,
  };
}

// ═══════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE HOOK
// ═══════════════════════════════════════════════════════════

export interface UseOptimisticReturn<T> {
  /** Current value (optimistic or real) */
  value: T;
  /** Whether an optimistic update is pending */
  isPending: boolean;
  /** Apply optimistic update */
  optimisticUpdate: (newValue: T, persistFn: () => Promise<void>) => Promise<void>;
  /** Rollback to previous value */
  rollback: () => void;
}

/**
 * Hook for optimistic updates with automatic rollback on failure
 * 
 * @example
 * ```tsx
 * const { value: likes, optimisticUpdate } = useOptimistic(initialLikes);
 * 
 * const handleLike = () => {
 *   optimisticUpdate(likes + 1, () => api.likePost(postId));
 * };
 * ```
 */
export function useOptimistic<T>(initialValue: T): UseOptimisticReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const previousValue = useRef<T>(initialValue);

  const optimisticUpdate = useCallback(async (newValue: T, persistFn: () => Promise<void>) => {
    previousValue.current = value;
    setValue(newValue);
    setIsPending(true);

    try {
      await persistFn();
    } catch (error) {
      // Rollback on failure
      setValue(previousValue.current);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [value]);

  const rollback = useCallback(() => {
    setValue(previousValue.current);
  }, []);

  return {
    value,
    isPending,
    optimisticUpdate,
    rollback,
  };
}
