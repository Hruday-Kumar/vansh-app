/**
 * 🪷 VANSH PERFORMANCE MONITORING SERVICE
 * Track app performance metrics for optimization
 * 
 * Features:
 * - Frame rate monitoring
 * - Memory usage tracking
 * - API latency measurement
 * - Render time tracking
 * - Startup performance
 * - Performance reports
 */

import * as Device from 'expo-device';
import { InteractionManager, Platform } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface APILatencyMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

export interface RenderMetric {
  component: string;
  renderTime: number;
  timestamp: number;
  type: 'mount' | 'update';
}

export interface MemoryMetric {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

export interface PerformanceReport {
  period: { start: number; end: number };
  device: {
    brand: string | null;
    model: string | null;
    os: string;
    osVersion: string | null;
  };
  metrics: {
    avgFPS: number;
    minFPS: number;
    avgAPILatency: number;
    p95APILatency: number;
    avgRenderTime: number;
    memoryPeakMB: number;
    slowRenderCount: number;
    apiErrorRate: number;
  };
  slowestAPIs: APILatencyMetric[];
  slowestRenders: RenderMetric[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Thresholds
  slowRenderThreshold: 16, // ms (60fps = 16.67ms per frame)
  slowAPIThreshold: 2000,  // ms
  lowFPSThreshold: 30,
  
  // Sampling
  fpsSamplingRate: 1000,   // ms
  memorySamplingRate: 5000, // ms
  
  // Retention
  maxMetrics: 1000,
  maxAPIMetrics: 200,
  maxRenderMetrics: 200,
  
  // Reporting
  reportPeriod: 60 * 60 * 1000, // 1 hour
};

// ============================================================================
// METRIC STORAGE
// ============================================================================

const metrics = {
  fps: [] as PerformanceMetric[],
  api: [] as APILatencyMetric[],
  render: [] as RenderMetric[],
  memory: [] as MemoryMetric[],
  custom: [] as PerformanceMetric[],
};

let startupTime: number | null = null;
let appReadyTime: number | null = null;

// ============================================================================
// STARTUP TRACKING
// ============================================================================

/**
 * Mark app startup time (call very early in app initialization)
 */
export function markStartupTime(): void {
  startupTime = Date.now();
}

/**
 * Mark app ready time (call when app is fully interactive)
 */
export function markAppReady(): void {
  appReadyTime = Date.now();
  
  if (startupTime) {
    const loadTime = appReadyTime - startupTime;
    recordMetric('startup_time', loadTime, 'ms');
    console.log(`[Performance] App ready in ${loadTime}ms`);
  }
}

/**
 * Get startup performance
 */
export function getStartupMetrics(): { startupTime: number | null; loadTime: number | null } {
  return {
    startupTime,
    loadTime: startupTime && appReadyTime ? appReadyTime - startupTime : null,
  };
}

// ============================================================================
// FPS MONITORING
// ============================================================================

let fpsMonitoringActive = false;
let fpsFrameCount = 0;
let fpsLastTime = 0;
let fpsAnimationFrame: number | null = null;
let fpsSamplingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start FPS monitoring
 */
export function startFPSMonitoring(): void {
  if (fpsMonitoringActive) return;
  fpsMonitoringActive = true;
  
  fpsLastTime = performance.now();
  fpsFrameCount = 0;
  
  const measureFrame = () => {
    if (!fpsMonitoringActive) return;
    fpsFrameCount++;
    fpsAnimationFrame = requestAnimationFrame(measureFrame);
  };
  
  fpsAnimationFrame = requestAnimationFrame(measureFrame);
  
  fpsSamplingInterval = setInterval(() => {
    const now = performance.now();
    const elapsed = now - fpsLastTime;
    const fps = Math.round((fpsFrameCount / elapsed) * 1000);
    
    recordFPSMetric(fps);
    
    fpsFrameCount = 0;
    fpsLastTime = now;
  }, CONFIG.fpsSamplingRate);
  
  console.log('[Performance] FPS monitoring started');
}

/**
 * Stop FPS monitoring
 */
export function stopFPSMonitoring(): void {
  fpsMonitoringActive = false;
  
  if (fpsAnimationFrame) {
    cancelAnimationFrame(fpsAnimationFrame);
    fpsAnimationFrame = null;
  }
  
  if (fpsSamplingInterval) {
    clearInterval(fpsSamplingInterval);
    fpsSamplingInterval = null;
  }
}

/**
 * Record FPS metric
 */
function recordFPSMetric(fps: number): void {
  const metric: PerformanceMetric = {
    name: 'fps',
    value: fps,
    unit: 'fps',
    timestamp: Date.now(),
  };
  
  metrics.fps.push(metric);
  
  // Trim old metrics
  if (metrics.fps.length > CONFIG.maxMetrics) {
    metrics.fps = metrics.fps.slice(-CONFIG.maxMetrics);
  }
  
  // Log if FPS drops
  if (fps < CONFIG.lowFPSThreshold) {
    console.warn(`[Performance] Low FPS detected: ${fps}`);
  }
}

// ============================================================================
// API LATENCY TRACKING
// ============================================================================

const pendingRequests = new Map<string, number>();

/**
 * Start tracking an API request
 */
export function startAPITracking(requestId: string): void {
  pendingRequests.set(requestId, Date.now());
}

/**
 * End tracking an API request
 */
export function endAPITracking(
  requestId: string,
  endpoint: string,
  method: string,
  status: number
): void {
  const startTime = pendingRequests.get(requestId);
  if (!startTime) return;
  
  pendingRequests.delete(requestId);
  
  const duration = Date.now() - startTime;
  
  const metric: APILatencyMetric = {
    endpoint,
    method,
    duration,
    status,
    timestamp: Date.now(),
  };
  
  metrics.api.push(metric);
  
  // Trim old metrics
  if (metrics.api.length > CONFIG.maxAPIMetrics) {
    metrics.api = metrics.api.slice(-CONFIG.maxAPIMetrics);
  }
  
  // Log slow requests
  if (duration > CONFIG.slowAPIThreshold) {
    console.warn(`[Performance] Slow API: ${method} ${endpoint} took ${duration}ms`);
  }
}

/**
 * Wrap fetch with automatic tracking
 */
export function createTrackedFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';
    
    startAPITracking(requestId);
    
    try {
      const response = await baseFetch(input, init);
      endAPITracking(requestId, url, method, response.status);
      return response;
    } catch (error) {
      endAPITracking(requestId, url, method, 0);
      throw error;
    }
  };
}

// ============================================================================
// RENDER TRACKING
// ============================================================================

/**
 * Track component render time
 */
export function trackRender(
  component: string,
  renderTime: number,
  type: 'mount' | 'update' = 'update'
): void {
  const metric: RenderMetric = {
    component,
    renderTime,
    timestamp: Date.now(),
    type,
  };
  
  metrics.render.push(metric);
  
  // Trim old metrics
  if (metrics.render.length > CONFIG.maxRenderMetrics) {
    metrics.render = metrics.render.slice(-CONFIG.maxRenderMetrics);
  }
  
  // Log slow renders
  if (renderTime > CONFIG.slowRenderThreshold) {
    console.warn(`[Performance] Slow render: ${component} took ${renderTime.toFixed(2)}ms`);
  }
}

/**
 * Create a render tracker HOC helper
 * Usage: const endTracking = startRenderTracking('MyComponent'); ... endTracking();
 */
export function startRenderTracking(component: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const renderTime = performance.now() - startTime;
    trackRender(component, renderTime);
  };
}

/**
 * Track interaction completion
 */
export function trackInteraction(name: string): Promise<void> {
  const startTime = performance.now();
  
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      const duration = performance.now() - startTime;
      recordMetric(`interaction_${name}`, duration, 'ms');
      resolve();
    });
  });
}

// ============================================================================
// MEMORY TRACKING
// ============================================================================

let memoryMonitoringActive = false;
let memoryInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start memory monitoring
 */
export function startMemoryMonitoring(): void {
  if (memoryMonitoringActive) return;
  memoryMonitoringActive = true;
  
  memoryInterval = setInterval(() => {
    // Note: React Native doesn't expose direct memory APIs
    // This is a placeholder for platform-specific implementations
    // In production, you'd use native modules or Hermes runtime APIs
    const metric: MemoryMetric = {
      used: 0, // Would need native implementation
      total: 0,
      percentage: 0,
      timestamp: Date.now(),
    };
    
    metrics.memory.push(metric);
    
    if (metrics.memory.length > CONFIG.maxMetrics) {
      metrics.memory = metrics.memory.slice(-CONFIG.maxMetrics);
    }
  }, CONFIG.memorySamplingRate);
  
  console.log('[Performance] Memory monitoring started');
}

/**
 * Stop memory monitoring
 */
export function stopMemoryMonitoring(): void {
  memoryMonitoringActive = false;
  
  if (memoryInterval) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
}

// ============================================================================
// CUSTOM METRICS
// ============================================================================

/**
 * Record a custom metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: string,
  tags?: Record<string, string>
): void {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    tags,
  };
  
  metrics.custom.push(metric);
  
  if (metrics.custom.length > CONFIG.maxMetrics) {
    metrics.custom = metrics.custom.slice(-CONFIG.maxMetrics);
  }
}

/**
 * Measure async function execution time
 */
export async function measure<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    recordMetric(name, duration, 'ms');
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    recordMetric(`${name}_error`, duration, 'ms');
    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const startTime = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    recordMetric(name, duration, 'ms');
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    recordMetric(`${name}_error`, duration, 'ms');
    throw error;
  }
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Generate performance report
 */
export function generateReport(periodMs: number = CONFIG.reportPeriod): PerformanceReport {
  const now = Date.now();
  const start = now - periodMs;
  
  // Filter metrics to period
  const periodFPS = metrics.fps.filter(m => m.timestamp >= start);
  const periodAPI = metrics.api.filter(m => m.timestamp >= start);
  const periodRender = metrics.render.filter(m => m.timestamp >= start);
  const periodMemory = metrics.memory.filter(m => m.timestamp >= start);
  
  // Calculate FPS stats
  const fpsValues = periodFPS.map(m => m.value);
  const avgFPS = fpsValues.length > 0 
    ? fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length 
    : 0;
  const minFPS = fpsValues.length > 0 ? Math.min(...fpsValues) : 0;
  
  // Calculate API stats
  const apiLatencies = periodAPI.map(m => m.duration).sort((a, b) => a - b);
  const avgAPILatency = apiLatencies.length > 0
    ? apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length
    : 0;
  const p95APILatency = percentile(apiLatencies, 95);
  const apiErrors = periodAPI.filter(m => m.status === 0 || m.status >= 400);
  const apiErrorRate = periodAPI.length > 0 
    ? apiErrors.length / periodAPI.length 
    : 0;
  
  // Calculate render stats
  const renderTimes = periodRender.map(m => m.renderTime);
  const avgRenderTime = renderTimes.length > 0
    ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
    : 0;
  const slowRenderCount = periodRender.filter(
    m => m.renderTime > CONFIG.slowRenderThreshold
  ).length;
  
  // Calculate memory stats
  const memoryPeakMB = periodMemory.length > 0
    ? Math.max(...periodMemory.map(m => m.used)) / (1024 * 1024)
    : 0;
  
  // Get slowest items
  const slowestAPIs = [...periodAPI]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
  
  const slowestRenders = [...periodRender]
    .sort((a, b) => b.renderTime - a.renderTime)
    .slice(0, 5);
  
  return {
    period: { start, end: now },
    device: {
      brand: Device.brand,
      model: Device.modelName,
      os: Platform.OS,
      osVersion: Device.osVersion,
    },
    metrics: {
      avgFPS: Math.round(avgFPS),
      minFPS: Math.round(minFPS),
      avgAPILatency: Math.round(avgAPILatency),
      p95APILatency: Math.round(p95APILatency),
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      memoryPeakMB: Math.round(memoryPeakMB * 100) / 100,
      slowRenderCount,
      apiErrorRate: Math.round(apiErrorRate * 10000) / 100, // percentage
    },
    slowestAPIs,
    slowestRenders,
  };
}

/**
 * Get raw metrics for analysis
 */
export function getRawMetrics(): typeof metrics {
  return { ...metrics };
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.fps = [];
  metrics.api = [];
  metrics.render = [];
  metrics.memory = [];
  metrics.custom = [];
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(options: {
  fps?: boolean;
  memory?: boolean;
  logReport?: boolean;
} = {}): void {
  const { fps = true, memory = false, logReport = true } = options;
  
  if (fps) {
    startFPSMonitoring();
  }
  
  if (memory) {
    startMemoryMonitoring();
  }
  
  if (logReport) {
    // Log report every hour in development
    if (__DEV__) {
      setInterval(() => {
        const report = generateReport();
        console.log('[Performance Report]', JSON.stringify(report.metrics, null, 2));
      }, CONFIG.reportPeriod);
    }
  }
  
  console.log('[Performance] Monitoring initialized');
}

/**
 * Stop all performance monitoring
 */
export function stopPerformanceMonitoring(): void {
  stopFPSMonitoring();
  stopMemoryMonitoring();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Startup
  markStartupTime,
  markAppReady,
  getStartupMetrics,
  
  // Monitoring
  initializePerformanceMonitoring,
  stopPerformanceMonitoring,
  startFPSMonitoring,
  stopFPSMonitoring,
  startMemoryMonitoring,
  stopMemoryMonitoring,
  
  // Tracking
  startAPITracking,
  endAPITracking,
  createTrackedFetch,
  trackRender,
  startRenderTracking,
  trackInteraction,
  
  // Metrics
  recordMetric,
  measure,
  measureSync,
  
  // Reporting
  generateReport,
  getRawMetrics,
  clearMetrics,
};
