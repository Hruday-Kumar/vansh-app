/**
 * 🪷 VANSH ANALYTICS SERVICE
 * Privacy-first usage analytics for understanding user engagement
 * 
 * Features:
 * - Screen view tracking
 * - Feature usage metrics
 * - Engagement tracking (time spent, interactions)
 * - Error reporting integration
 * - Privacy controls (opt-out support)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { AppState, Dimensions, Platform } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export type AnalyticsEventType = 
  | 'screen_view'
  | 'feature_use'
  | 'content_create'
  | 'content_view'
  | 'search'
  | 'share'
  | 'error'
  | 'engagement';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

export interface ScreenViewEvent {
  screenName: string;
  previousScreen?: string;
  duration?: number; // ms
}

export interface FeatureUseEvent {
  feature: string;
  action: string;
  value?: number | string;
}

export interface ContentEvent {
  contentType: 'memory' | 'katha' | 'member' | 'tradition' | 'vasiyat';
  contentId?: string;
  action: 'create' | 'view' | 'edit' | 'delete' | 'share';
}

export interface SearchEvent {
  query: string;
  resultCount: number;
  filters?: string[];
  selectedResult?: string;
}

export interface EngagementMetrics {
  sessionsCount: number;
  totalTimeSpent: number; // ms
  featuresUsed: Record<string, number>;
  contentCreated: Record<string, number>;
  lastActive: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number; // ms
  endpoint?: string;
  apiKey?: string;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  ANALYTICS_ENABLED: '@vansh_analytics_enabled',
  SESSION_ID: '@vansh_session_id',
  EVENT_QUEUE: '@vansh_event_queue',
  ENGAGEMENT_METRICS: '@vansh_engagement_metrics',
  INSTALL_ID: '@vansh_install_id',
} as const;

// ============================================================================
// STATE
// ============================================================================

let config: AnalyticsConfig = {
  enabled: true,
  debug: __DEV__,
  batchSize: 20,
  flushInterval: 60000, // 1 minute
};

let sessionId: string = '';
let currentScreen: string = '';
let screenStartTime: number = 0;
let appStartTime: number = Date.now();
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the analytics service
 */
export async function initializeAnalytics(customConfig?: Partial<AnalyticsConfig>): Promise<void> {
  if (customConfig) {
    config = { ...config, ...customConfig };
  }
  
  // Check if analytics is enabled by user preference
  const storedEnabled = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_ENABLED);
  if (storedEnabled !== null) {
    config.enabled = storedEnabled === 'true';
  }
  
  if (!config.enabled) {
    console.log('[Analytics] Disabled by user preference');
    return;
  }
  
  // Generate or retrieve session ID
  sessionId = await getOrCreateSessionId();
  
  // Load any queued events from previous session
  await loadEventQueue();
  
  // Start flush timer
  startFlushTimer();
  
  // Track app lifecycle
  AppState.addEventListener('change', handleAppStateChange);
  
  // Track session start
  trackEvent('engagement', 'session_start', {
    platform: Platform.OS,
    version: Application.nativeApplicationVersion,
    device: Device.modelName,
  });
  
  if (config.debug) {
    console.log('[Analytics] Initialized with session:', sessionId);
  }
}

/**
 * Get or create a unique session ID
 */
async function getOrCreateSessionId(): Promise<string> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
  const lastSessionTime = stored ? parseInt(stored.split('_')[0], 10) : 0;
  const now = Date.now();
  
  // Create new session if more than 30 minutes have passed
  if (now - lastSessionTime > 30 * 60 * 1000 || !stored) {
    const newSessionId = `${now}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
    return newSessionId;
  }
  
  return stored;
}

/**
 * Get or create a unique install ID (persists across sessions)
 */
export async function getInstallId(): Promise<string> {
  let installId = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_ID);
  
  if (!installId) {
    installId = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_ID, installId);
  }
  
  return installId;
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track a generic event
 */
export function trackEvent(
  type: AnalyticsEventType,
  name: string,
  properties?: Record<string, unknown>
): void {
  if (!config.enabled) return;
  
  const event: AnalyticsEvent = {
    type,
    name,
    properties: {
      ...properties,
      screen: currentScreen,
    },
    timestamp: Date.now(),
    sessionId,
  };
  
  eventQueue.push(event);
  
  if (config.debug) {
    console.log('[Analytics] Event:', type, name, properties);
  }
  
  // Auto-flush if queue is full
  if (eventQueue.length >= config.batchSize) {
    flushEvents();
  }
}

/**
 * Track screen view
 */
export function trackScreenView(screenName: string): void {
  const previousScreen = currentScreen;
  const now = Date.now();
  
  // Calculate duration on previous screen
  const duration = screenStartTime > 0 ? now - screenStartTime : 0;
  
  // Track previous screen duration
  if (previousScreen && duration > 0) {
    trackEvent('screen_view', previousScreen, {
      action: 'leave',
      duration,
    });
  }
  
  // Update current screen
  currentScreen = screenName;
  screenStartTime = now;
  
  // Track new screen view
  trackEvent('screen_view', screenName, {
    action: 'enter',
    previousScreen,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUse(feature: string, action: string, value?: number | string): void {
  trackEvent('feature_use', feature, {
    action,
    value,
  });
  
  // Update engagement metrics
  updateEngagementMetrics('featuresUsed', feature);
}

/**
 * Track content creation
 */
export function trackContentCreate(
  contentType: ContentEvent['contentType'],
  contentId?: string
): void {
  trackEvent('content_create', contentType, {
    contentId,
  });
  
  // Update engagement metrics
  updateEngagementMetrics('contentCreated', contentType);
}

/**
 * Track content view
 */
export function trackContentView(
  contentType: ContentEvent['contentType'],
  contentId: string,
  duration?: number
): void {
  trackEvent('content_view', contentType, {
    contentId,
    duration,
  });
}

/**
 * Track search
 */
export function trackSearch(event: SearchEvent): void {
  trackEvent('search', 'global_search', {
    query: event.query.substring(0, 50), // Limit for privacy
    resultCount: event.resultCount,
    filters: event.filters,
    hasSelectedResult: !!event.selectedResult,
  });
}

/**
 * Track share
 */
export function trackShare(
  contentType: string,
  method: string,
  success: boolean
): void {
  trackEvent('share', contentType, {
    method,
    success,
  });
}

/**
 * Track error
 */
export function trackError(
  errorName: string,
  errorMessage: string,
  context?: Record<string, unknown>
): void {
  trackEvent('error', errorName, {
    message: errorMessage,
    ...context,
  });
}

// ============================================================================
// ENGAGEMENT METRICS
// ============================================================================

/**
 * Update engagement metrics
 */
async function updateEngagementMetrics(
  category: 'featuresUsed' | 'contentCreated',
  item: string
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENGAGEMENT_METRICS);
    const metrics: EngagementMetrics = stored ? JSON.parse(stored) : {
      sessionsCount: 0,
      totalTimeSpent: 0,
      featuresUsed: {},
      contentCreated: {},
      lastActive: Date.now(),
    };
    
    if (!metrics[category]) {
      metrics[category] = {};
    }
    
    metrics[category][item] = (metrics[category][item] || 0) + 1;
    metrics.lastActive = Date.now();
    
    await AsyncStorage.setItem(STORAGE_KEYS.ENGAGEMENT_METRICS, JSON.stringify(metrics));
  } catch (error) {
    console.error('[Analytics] Failed to update engagement metrics:', error);
  }
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics(): Promise<EngagementMetrics> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENGAGEMENT_METRICS);
    return stored ? JSON.parse(stored) : {
      sessionsCount: 0,
      totalTimeSpent: 0,
      featuresUsed: {},
      contentCreated: {},
      lastActive: Date.now(),
    };
  } catch (error) {
    console.error('[Analytics] Failed to get engagement metrics:', error);
    return {
      sessionsCount: 0,
      totalTimeSpent: 0,
      featuresUsed: {},
      contentCreated: {},
      lastActive: Date.now(),
    };
  }
}

// ============================================================================
// EVENT FLUSHING
// ============================================================================

/**
 * Flush events to storage/backend
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const eventsToFlush = [...eventQueue];
  eventQueue = [];
  
  try {
    // If we have an endpoint configured, send to backend
    if (config.endpoint && config.apiKey) {
      await sendEventsToBackend(eventsToFlush);
    } else {
      // Otherwise, just log locally
      await storeEventsLocally(eventsToFlush);
    }
    
    if (config.debug) {
      console.log(`[Analytics] Flushed ${eventsToFlush.length} events`);
    }
  } catch (error) {
    // Put events back in queue on failure
    eventQueue = [...eventsToFlush, ...eventQueue];
    console.error('[Analytics] Failed to flush events:', error);
  }
}

/**
 * Send events to backend
 */
async function sendEventsToBackend(events: AnalyticsEvent[]): Promise<void> {
  if (!config.endpoint || !config.apiKey) return;
  
  const installId = await getInstallId();
  
  await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      installId,
      events,
      metadata: {
        platform: Platform.OS,
        version: Application.nativeApplicationVersion,
        device: Device.modelName,
        screenDimensions: Dimensions.get('window'),
      },
    }),
  });
}

/**
 * Store events locally for debugging
 */
async function storeEventsLocally(events: AnalyticsEvent[]): Promise<void> {
  // In debug mode, just log to console
  if (config.debug) {
    console.log('[Analytics] Local events:', events.length);
  }
}

/**
 * Load event queue from storage
 */
async function loadEventQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EVENT_QUEUE);
    if (stored) {
      const storedEvents = JSON.parse(stored);
      eventQueue = [...storedEvents, ...eventQueue];
      await AsyncStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE);
    }
  } catch (error) {
    console.error('[Analytics] Failed to load event queue:', error);
  }
}

/**
 * Start the flush timer
 */
function startFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
  }
  
  flushTimer = setInterval(() => {
    flushEvents();
  }, config.flushInterval);
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

/**
 * Handle app state changes
 */
function handleAppStateChange(nextState: string): void {
  if (nextState === 'background' || nextState === 'inactive') {
    // Save events when app goes to background
    const timeSpent = Date.now() - appStartTime;
    
    trackEvent('engagement', 'session_end', {
      duration: timeSpent,
    });
    
    // Immediately flush and save queue
    flushEvents();
    AsyncStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(eventQueue));
  } else if (nextState === 'active') {
    appStartTime = Date.now();
    trackEvent('engagement', 'session_resume');
  }
}

// ============================================================================
// PRIVACY CONTROLS
// ============================================================================

/**
 * Enable analytics
 */
export async function enableAnalytics(): Promise<void> {
  config.enabled = true;
  await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS_ENABLED, 'true');
  
  // Initialize if not already
  if (!sessionId) {
    await initializeAnalytics();
  }
}

/**
 * Disable analytics
 */
export async function disableAnalytics(): Promise<void> {
  config.enabled = false;
  await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS_ENABLED, 'false');
  
  // Clear queued events
  eventQueue = [];
  
  // Stop flush timer
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return config.enabled;
}

/**
 * Clear all analytics data
 */
export async function clearAnalyticsData(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.SESSION_ID,
    STORAGE_KEYS.EVENT_QUEUE,
    STORAGE_KEYS.ENGAGEMENT_METRICS,
  ]);
  
  eventQueue = [];
  sessionId = '';
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  initializeAnalytics,
  trackEvent,
  trackScreenView,
  trackFeatureUse,
  trackContentCreate,
  trackContentView,
  trackSearch,
  trackShare,
  trackError,
  getEngagementMetrics,
  enableAnalytics,
  disableAnalytics,
  isAnalyticsEnabled,
  clearAnalyticsData,
  getInstallId,
};
