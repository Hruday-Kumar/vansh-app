/**
 * 🪷 VANSH IMAGE OPTIMIZATION SERVICE
 * Compress, resize, and optimize images for performance
 * 
 * Features:
 * - Image compression with quality control
 * - Resize images to appropriate dimensions
 * - Progressive loading with blur placeholders
 * - Lazy loading utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface OptimizationOptions {
  /** Maximum width (maintains aspect ratio) */
  maxWidth?: number;
  /** Maximum height (maintains aspect ratio) */
  maxHeight?: number;
  /** Quality 0-1 (default 0.8) */
  quality?: number;
  /** Output format */
  format?: 'jpeg' | 'png';
  /** Generate thumbnail */
  generateThumbnail?: boolean;
  /** Thumbnail size */
  thumbnailSize?: number;
}

export interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
  format: string;
  thumbnail?: {
    uri: string;
    width: number;
    height: number;
  };
}

export interface ImageCacheEntry {
  uri: string;
  localPath: string;
  cachedAt: number;
  accessed: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Default optimization settings
  defaultQuality: 0.8,
  defaultMaxWidth: 1920,
  defaultMaxHeight: 1080,
  thumbnailSize: 200,
  
  // Cache settings
  cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxCacheEntries: 100,
};

const CACHE_INDEX_KEY = '@vansh_image_cache_index';

// ============================================================================
// IMAGE SIZE DETECTION
// ============================================================================

/**
 * Get image dimensions
 */
export async function getImageDimensions(uri: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Optimize an image for upload/storage
 */
export async function optimizeImage(
  uri: string,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = CONFIG.defaultMaxWidth,
    maxHeight = CONFIG.defaultMaxHeight,
    quality = CONFIG.defaultQuality,
    format = 'jpeg',
    generateThumbnail = false,
    thumbnailSize = CONFIG.thumbnailSize,
  } = options;
  
  try {
    // Get original dimensions
    const originalDimensions = await getImageDimensions(uri);
    
    // Calculate new dimensions maintaining aspect ratio
    const { width, height } = calculateOptimalDimensions(
      originalDimensions,
      maxWidth,
      maxHeight
    );
    
    // Build manipulation actions
    const actions: ImageManipulator.Action[] = [];
    
    // Only resize if needed
    if (width < originalDimensions.width || height < originalDimensions.height) {
      actions.push({ resize: { width, height } });
    }
    
    // Determine save format
    const saveFormat = format === 'png' 
      ? ImageManipulator.SaveFormat.PNG 
      : ImageManipulator.SaveFormat.JPEG;
    
    // Apply optimizations
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: quality,
        format: saveFormat,
      }
    );
    
    // Generate thumbnail if requested
    let thumbnail: OptimizedImage['thumbnail'];
    if (generateThumbnail) {
      thumbnail = await generateImageThumbnail(uri, thumbnailSize);
    }
    
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      format,
      thumbnail,
    };
  } catch (error) {
    console.error('[ImageOptimization] Failed to optimize:', error);
    throw error;
  }
}

/**
 * Generate a thumbnail from an image
 */
export async function generateImageThumbnail(
  uri: string,
  size: number = CONFIG.thumbnailSize
): Promise<{ uri: string; width: number; height: number }> {
  const dimensions = await getImageDimensions(uri);
  const { width, height } = calculateOptimalDimensions(dimensions, size, size);
  
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  
  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateOptimalDimensions(
  original: ImageDimensions,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  let { width, height } = original;
  
  // Check if resize is needed
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  // Calculate aspect ratio
  const aspectRatio = width / height;
  
  // Determine limiting dimension
  if (width / maxWidth > height / maxHeight) {
    // Width is limiting
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  } else {
    // Height is limiting
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }
  
  return { width, height };
}

// ============================================================================
// IMAGE CACHING (Using AsyncStorage for index, Paths for files)
// ============================================================================

let cacheIndex: Map<string, ImageCacheEntry> = new Map();
let cacheDir: Directory | null = null;

/**
 * Get or create cache directory
 */
function getCacheDir(): Directory {
  if (!cacheDir) {
    cacheDir = new Directory(Paths.cache, 'vansh-images');
  }
  return cacheDir;
}

/**
 * Initialize the image cache
 */
export async function initializeImageCache(): Promise<void> {
  try {
    // Create cache directory if needed
    const dir = getCacheDir();
    if (!dir.exists) {
      dir.create();
    }
    
    // Load cache index from AsyncStorage
    await loadCacheIndex();
    
    // Clean up expired entries
    await cleanupCache();
    
    console.log('[ImageCache] Initialized');
  } catch (error) {
    console.error('[ImageCache] Init failed:', error);
  }
}

/**
 * Get a cached image or download it
 */
export async function getCachedImage(
  remoteUri: string,
  forceRefresh: boolean = false
): Promise<string> {
  const cacheKey = generateCacheKey(remoteUri);
  
  // Check if already cached
  if (!forceRefresh && cacheIndex.has(remoteUri)) {
    const entry = cacheIndex.get(remoteUri)!;
    const cachedFile = new File(getCacheDir(), cacheKey);
    
    if (cachedFile.exists) {
      // Update access time
      entry.accessed = Date.now();
      cacheIndex.set(remoteUri, entry);
      await saveCacheIndex();
      return cachedFile.uri;
    }
  }
  
  // Download and cache
  try {
    const cachedFile = new File(getCacheDir(), cacheKey);
    // Use static download method
    await File.downloadFileAsync(remoteUri, cachedFile, { idempotent: true });
    
    cacheIndex.set(remoteUri, {
      uri: remoteUri,
      localPath: cacheKey,
      cachedAt: Date.now(),
      accessed: Date.now(),
    });
    
    await saveCacheIndex();
    return cachedFile.uri;
  } catch (error) {
    console.error('[ImageCache] Download failed:', error);
    // Return original URI as fallback
    return remoteUri;
  }
}

/**
 * Generate a cache key from URL
 */
function generateCacheKey(url: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Get extension from URL
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  
  return `img_${Math.abs(hash)}.${ext}`;
}

/**
 * Load cache index from AsyncStorage
 */
async function loadCacheIndex(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (stored) {
      const entries = JSON.parse(stored);
      cacheIndex = new Map(Object.entries(entries));
    }
  } catch (error) {
    console.error('[ImageCache] Failed to load index:', error);
    cacheIndex = new Map();
  }
}

/**
 * Save cache index to AsyncStorage
 */
async function saveCacheIndex(): Promise<void> {
  try {
    const entries = Object.fromEntries(cacheIndex);
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[ImageCache] Failed to save index:', error);
  }
}

/**
 * Clean up expired or excess cached images
 */
async function cleanupCache(): Promise<void> {
  const now = Date.now();
  const toDelete: string[] = [];
  const dir = getCacheDir();
  
  // Find expired entries
  for (const [url, entry] of cacheIndex.entries()) {
    if (now - entry.cachedAt > CONFIG.cacheExpiry) {
      toDelete.push(url);
    }
  }
  
  // If too many entries, remove oldest accessed
  if (cacheIndex.size - toDelete.length > CONFIG.maxCacheEntries) {
    const sorted = Array.from(cacheIndex.entries())
      .filter(([url]) => !toDelete.includes(url))
      .sort((a, b) => a[1].accessed - b[1].accessed);
    
    const excess = cacheIndex.size - toDelete.length - CONFIG.maxCacheEntries;
    for (let i = 0; i < excess; i++) {
      toDelete.push(sorted[i][0]);
    }
  }
  
  // Delete entries
  for (const url of toDelete) {
    const entry = cacheIndex.get(url);
    if (entry) {
      try {
        const file = new File(dir, entry.localPath);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // Ignore deletion errors
      }
      cacheIndex.delete(url);
    }
  }
  
  if (toDelete.length > 0) {
    await saveCacheIndex();
    console.log(`[ImageCache] Cleaned up ${toDelete.length} entries`);
  }
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<void> {
  try {
    const dir = getCacheDir();
    if (dir.exists) {
      dir.delete();
    }
    cacheIndex = new Map();
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    cacheDir = null; // Reset to recreate on next use
    console.log('[ImageCache] Cleared');
  } catch (error) {
    console.error('[ImageCache] Clear failed:', error);
  }
}

/**
 * Get cache statistics
 */
export function getImageCacheStats(): {
  entryCount: number;
  oldestEntry: number | null;
} {
  let oldestEntry: number | null = null;
  
  for (const entry of cacheIndex.values()) {
    if (oldestEntry === null || entry.cachedAt < oldestEntry) {
      oldestEntry = entry.cachedAt;
    }
  }
  
  return {
    entryCount: cacheIndex.size,
    oldestEntry,
  };
}

// ============================================================================
// PROGRESSIVE LOADING
// ============================================================================

export interface ProgressiveImageSource {
  /** Low quality placeholder (blur-up) */
  placeholder?: string;
  /** Medium quality for fast load */
  preview?: string;
  /** Full quality image */
  full: string;
}

/**
 * Generate progressive loading sources from an image
 */
export async function generateProgressiveSources(
  uri: string
): Promise<ProgressiveImageSource> {
  try {
    // Generate tiny placeholder (for blur-up effect)
    const placeholder = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 20 } }],
      { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Generate preview (medium quality)
    const preview = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return {
      placeholder: placeholder.uri,
      preview: preview.uri,
      full: uri,
    };
  } catch (error) {
    console.error('[Progressive] Failed to generate sources:', error);
    return { full: uri };
  }
}

// ============================================================================
// PRESETS
// ============================================================================

export const ImagePresets = {
  /** For memory gallery thumbnails */
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.6,
    format: 'jpeg' as const,
  },
  
  /** For memory detail view */
  detail: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    format: 'jpeg' as const,
  },
  
  /** For profile avatars */
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    format: 'jpeg' as const,
  },
  
  /** For full-screen viewing */
  fullscreen: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.9,
    format: 'jpeg' as const,
  },
  
  /** For uploads (compressed for bandwidth) */
  upload: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.75,
    format: 'jpeg' as const,
    generateThumbnail: true,
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  optimizeImage,
  generateImageThumbnail,
  getImageDimensions,
  initializeImageCache,
  getCachedImage,
  clearImageCache,
  getImageCacheStats,
  generateProgressiveSources,
  ImagePresets,
};
