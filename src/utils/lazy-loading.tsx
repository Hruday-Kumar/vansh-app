/**
 * 🪷 VANSH LAZY LOADING UTILITIES
 * Code splitting and lazy loading for performance
 * 
 * Features:
 * - React.lazy with preloading
 * - Route prefetching
 * - Component preloading on visibility
 * - Suspense fallbacks
 */

import React, { ComponentType, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { VanshColors } from '../theme/colors';

// ============================================================================
// TYPES
// ============================================================================

type LazyComponentModule<T> = { default: ComponentType<T> };
type LazyComponentLoader<T> = () => Promise<LazyComponentModule<T>>;

export interface PreloadableComponent<T> extends React.LazyExoticComponent<ComponentType<T>> {
  preload: () => Promise<LazyComponentModule<T>>;
}

export interface LazyLoadOptions {
  /** Fallback component during loading */
  fallback?: React.ReactNode;
  /** Error boundary fallback */
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Minimum loading time (prevents flash) */
  minLoadTime?: number;
}

export interface ViewportObserverOptions {
  /** Root margin for intersection */
  rootMargin?: number;
  /** Threshold for visibility */
  threshold?: number;
  /** Only trigger once */
  once?: boolean;
}

// ============================================================================
// LAZY COMPONENT WITH PRELOAD
// ============================================================================

/**
 * Create a lazy component with preload capability
 */
export function lazyWithPreload<T extends object>(
  loader: LazyComponentLoader<T>
): PreloadableComponent<T> {
  let modulePromise: Promise<LazyComponentModule<T>> | null = null;
  
  const preload = () => {
    if (!modulePromise) {
      modulePromise = loader();
    }
    return modulePromise;
  };
  
  const LazyComponent = React.lazy(() => {
    if (modulePromise) {
      return modulePromise;
    }
    return preload();
  }) as PreloadableComponent<T>;
  
  LazyComponent.preload = preload;
  
  return LazyComponent;
}

/**
 * Preload multiple components
 */
export function preloadComponents(
  components: PreloadableComponent<unknown>[]
): Promise<unknown[]> {
  return Promise.all(components.map(c => c.preload()));
}

// ============================================================================
// SUSPENSE FALLBACKS
// ============================================================================

interface LoadingFallbackProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  minHeight?: number;
}

/**
 * Default loading fallback component
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  size = 'large',
  color = VanshColors.suvarna[500],
  style,
  minHeight = 200,
}) => (
  <View style={[styles.fallbackContainer, { minHeight }, style]}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

/**
 * Skeleton loading fallback
 */
export const SkeletonFallback: React.FC<{ height?: number; style?: ViewStyle }> = ({
  height = 200,
  style,
}) => (
  <View style={[styles.skeletonContainer, { height }, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

/**
 * Create a screen-specific loading fallback
 */
export function createScreenFallback(title?: string): React.FC {
  return function ScreenFallback() {
    return (
      <View style={styles.screenFallback}>
        <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
        {title && (
          <View style={styles.screenFallbackText}>
            {/* Text would be here but keeping minimal */}
          </View>
        )}
      </View>
    );
  };
}

// ============================================================================
// ERROR BOUNDARY FOR LAZY COMPONENTS
// ============================================================================

interface LazyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for lazy-loaded components
 */
export class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }
  
  retry = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }
    
    return this.props.children;
  }
}

/**
 * Default error fallback
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({
  retry,
}) => (
  <View style={styles.errorContainer}>
    <ActivityIndicator size="small" color={VanshColors.masi[500]} />
    <View style={styles.errorRetry} onTouchEnd={retry} />
  </View>
);

// ============================================================================
// LAZY WRAPPER COMPONENT
// ============================================================================

interface LazyWrapperProps<T extends object> {
  component: React.LazyExoticComponent<ComponentType<T>>;
  props: T;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Wrapper for lazy components with error boundary
 */
export function LazyWrapper<T extends object>({
  component: Component,
  props,
  fallback = <LoadingFallback />,
  errorFallback,
}: LazyWrapperProps<T>): React.ReactElement {
  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
}

// ============================================================================
// VIEWPORT VISIBILITY HOOK
// ============================================================================

/**
 * Hook to detect when a component enters the viewport
 * (Simplified version for React Native - uses scroll position estimation)
 */
export function useInViewport(options: ViewportObserverOptions = {}): {
  ref: React.RefObject<View | null>;
  isInViewport: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
} {
  const { threshold = 0, once = true } = options;
  const ref = useRef<View>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [layout, setLayout] = useState<{ y: number; height: number } | null>(null);
  const hasTriggered = useRef(false);
  
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setLayout({ y, height });
  }, []);
  
  useEffect(() => {
    if (!layout) return;
    if (once && hasTriggered.current) return;
    
    const screenHeight = Dimensions.get('window').height;
    const visibleThreshold = screenHeight * (1 - threshold);
    
    // Simple check: if the element's top is within the visible area
    if (layout.y < visibleThreshold) {
      setIsInViewport(true);
      hasTriggered.current = true;
    }
  }, [layout, threshold, once]);
  
  return { ref, isInViewport, onLayout };
}

// ============================================================================
// LAZY LOAD ON VISIBILITY
// ============================================================================

interface LazyOnVisibleProps<T extends object> {
  component: PreloadableComponent<T>;
  props: T;
  placeholder?: React.ReactNode;
  preloadOnMount?: boolean;
}

/**
 * Lazy load a component when it becomes visible
 */
export function LazyOnVisible<T extends object>({
  component: Component,
  props,
  placeholder = <SkeletonFallback />,
  preloadOnMount = false,
}: LazyOnVisibleProps<T>): React.ReactElement {
  const { ref, isInViewport, onLayout } = useInViewport({ once: true });
  const [isPreloaded, setIsPreloaded] = useState(false);
  
  useEffect(() => {
    if (preloadOnMount) {
      Component.preload().then(() => setIsPreloaded(true));
    }
  }, [preloadOnMount]);
  
  useEffect(() => {
    if (isInViewport && !isPreloaded) {
      Component.preload().then(() => setIsPreloaded(true));
    }
  }, [isInViewport, isPreloaded]);
  
  return (
    <View ref={ref} onLayout={onLayout} collapsable={false}>
      {isInViewport || isPreloaded ? (
        <Suspense fallback={placeholder}>
          <Component {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </View>
  );
}

// ============================================================================
// ROUTE PRELOADING
// ============================================================================

type RouteComponentMap = Record<string, PreloadableComponent<unknown>>;

let registeredRoutes: RouteComponentMap = {};

/**
 * Register routes for preloading
 */
export function registerRoutes(routes: RouteComponentMap): void {
  registeredRoutes = { ...registeredRoutes, ...routes };
}

/**
 * Preload a specific route
 */
export function preloadRoute(routeName: string): Promise<unknown> | undefined {
  const component = registeredRoutes[routeName];
  if (component) {
    return component.preload();
  }
  console.warn(`[LazyLoading] Route "${routeName}" not registered for preloading`);
  return undefined;
}

/**
 * Preload multiple routes
 */
export function preloadRoutes(routeNames: string[]): Promise<unknown[]> {
  return Promise.all(
    routeNames
      .map(name => preloadRoute(name))
      .filter((p): p is Promise<unknown> => p !== undefined)
  );
}

/**
 * Preload adjacent routes (for navigation prediction)
 */
export function preloadAdjacentRoutes(
  currentRoute: string,
  adjacencyMap: Record<string, string[]>
): void {
  const adjacent = adjacencyMap[currentRoute];
  if (adjacent) {
    preloadRoutes(adjacent);
  }
}

// ============================================================================
// DEFERRED IMPORT
// ============================================================================

/**
 * Defer import until idle time
 */
export function deferredImport<T>(
  loader: () => Promise<T>,
  timeoutMs: number = 2000
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Use requestIdleCallback-like behavior
    const timeout = setTimeout(() => {
      loader().then(resolve).catch(reject);
    }, 0);
    
    // Max timeout
    setTimeout(() => {
      clearTimeout(timeout);
      loader().then(resolve).catch(reject);
    }, timeoutMs);
  });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    backgroundColor: VanshColors.chandan[400],
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: VanshColors.khadi[200],
    opacity: 0.5,
  },
  screenFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[50],
  },
  screenFallbackText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorRetry: {
    marginTop: 16,
    padding: 12,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  lazyWithPreload,
  preloadComponents,
  LoadingFallback,
  SkeletonFallback,
  createScreenFallback,
  LazyErrorBoundary,
  LazyWrapper,
  LazyOnVisible,
  useInViewport,
  registerRoutes,
  preloadRoute,
  preloadRoutes,
  preloadAdjacentRoutes,
  deferredImport,
};
