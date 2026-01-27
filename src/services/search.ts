/**
 * 🪷 VANSH SEARCH SERVICE
 * Advanced search functionality with filters, recent searches, and caching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Katha, Parampara, SmritiMedia, Vasiyat, VrikshaMember } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type SearchResultType = 'memory' | 'katha' | 'member' | 'parampara' | 'vasiyat';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  icon: string;
  matchedText?: string;
  timestamp?: Date;
  data: SmritiMedia | Katha | VrikshaMember | Parampara | Vasiyat;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface SearchFilters {
  types: SearchResultType[];
  dateRange?: DateRange;
  memberId?: string;
}

export interface SearchQuery {
  text: string;
  filters?: SearchFilters;
}

export interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount: number;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  RECENT_SEARCHES: '@vansh_recent_searches',
  SEARCH_CACHE: '@vansh_search_cache',
} as const;

const MAX_RECENT_SEARCHES = 10;

// ============================================================================
// RECENT SEARCHES
// ============================================================================

/**
 * Get recent searches from storage
 */
export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('[Search] Failed to get recent searches:', error);
    return [];
  }
}

/**
 * Add a search query to recent searches
 */
export async function addRecentSearch(query: string, resultCount: number): Promise<void> {
  try {
    const recent = await getRecentSearches();
    
    // Remove if already exists
    const filtered = recent.filter(s => s.query.toLowerCase() !== query.toLowerCase());
    
    // Add new search at the beginning
    const updated: RecentSearch[] = [
      { query, timestamp: Date.now(), resultCount },
      ...filtered,
    ].slice(0, MAX_RECENT_SEARCHES);
    
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  } catch (error) {
    console.error('[Search] Failed to add recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  } catch (error) {
    console.error('[Search] Failed to clear recent searches:', error);
  }
}

/**
 * Remove a single recent search
 */
export async function removeRecentSearch(query: string): Promise<void> {
  try {
    const recent = await getRecentSearches();
    const filtered = recent.filter(s => s.query.toLowerCase() !== query.toLowerCase());
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(filtered));
  } catch (error) {
    console.error('[Search] Failed to remove recent search:', error);
  }
}

// ============================================================================
// SEARCH HELPERS
// ============================================================================

/**
 * Highlight matching text in search results
 */
export function highlightMatches(text: string, query: string): { text: string; highlighted: boolean }[] {
  if (!query.trim()) {
    return [{ text, highlighted: false }];
  }
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const result: { text: string; highlighted: boolean }[] = [];
  
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);
  
  while (index !== -1) {
    // Add non-matching text before
    if (index > lastIndex) {
      result.push({ text: text.slice(lastIndex, index), highlighted: false });
    }
    
    // Add matching text
    result.push({ text: text.slice(index, index + query.length), highlighted: true });
    
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), highlighted: false });
  }
  
  return result;
}

/**
 * Extract matched text snippet around the query match
 */
export function extractMatchedSnippet(text: string, query: string, snippetLength: number = 50): string | undefined {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return undefined;
  
  const start = Math.max(0, index - snippetLength);
  const end = Math.min(text.length, index + query.length + snippetLength);
  
  let snippet = text.slice(start, end);
  
  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

export const SEARCH_TYPE_CONFIG: Record<SearchResultType, { 
  icon: string; 
  label: string; 
  labelKey: string; // i18n key
  color: string;
}> = {
  memory: { 
    icon: '📸', 
    label: 'Memory', 
    labelKey: 'search.memories',
    color: '#E04545' 
  },
  katha: { 
    icon: '🎙️', 
    label: 'Story', 
    labelKey: 'search.stories',
    color: '#1565C0' 
  },
  member: { 
    icon: '👤', 
    label: 'Member', 
    labelKey: 'search.members',
    color: '#D4AF37' 
  },
  parampara: { 
    icon: '🪔', 
    label: 'Tradition', 
    labelKey: 'search.traditions',
    color: '#8D5524' 
  },
  vasiyat: { 
    icon: '💌', 
    label: 'Message', 
    labelKey: 'search.messages',
    color: '#FF6B8A' 
  },
};

// ============================================================================
// DATE HELPERS
// ============================================================================

export interface DatePreset {
  key: string;
  label: string;
  labelKey: string;
  getRange: () => DateRange;
}

export const DATE_PRESETS: DatePreset[] = [
  {
    key: 'today',
    label: 'Today',
    labelKey: 'search.datePresets.today',
    getRange: () => ({
      from: new Date(new Date().setHours(0, 0, 0, 0)),
      to: new Date(),
    }),
  },
  {
    key: 'week',
    label: 'This Week',
    labelKey: 'search.datePresets.thisWeek',
    getRange: () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return { from: startOfWeek, to: now };
    },
  },
  {
    key: 'month',
    label: 'This Month',
    labelKey: 'search.datePresets.thisMonth',
    getRange: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfMonth, to: now };
    },
  },
  {
    key: 'year',
    label: 'This Year',
    labelKey: 'search.datePresets.thisYear',
    getRange: () => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { from: startOfYear, to: now };
    },
  },
  {
    key: 'all',
    label: 'All Time',
    labelKey: 'search.datePresets.allTime',
    getRange: () => ({}),
  },
];

/**
 * Check if a date is within the given range
 */
export function isDateInRange(date: Date | string | undefined, range: DateRange): boolean {
  if (!date) return true;
  if (!range.from && !range.to) return true;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  
  return true;
}

// ============================================================================
// MOCK SEARCH (Replace with API later)
// ============================================================================

export async function performSearch(
  query: SearchQuery,
  options?: { signal?: AbortSignal }
): Promise<SearchResult[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (options?.signal?.aborted) {
    throw new Error('Search aborted');
  }
  
  const { text, filters } = query;
  
  if (!text.trim()) {
    return [];
  }
  
  // Mock results - Replace with actual API call
  const mockResults: SearchResult[] = [
    {
      id: 'mem-1',
      type: 'memory',
      title: 'Grandma\'s 80th Birthday',
      subtitle: 'August 15, 2023 • 24 photos',
      icon: '🎂',
      timestamp: new Date('2023-08-15'),
      matchedText: extractMatchedSnippet(
        `The whole family gathered to celebrate grandma's birthday. ${text} was the highlight of the day.`,
        text
      ),
      data: {} as SmritiMedia,
    },
    {
      id: 'katha-1',
      type: 'katha',
      title: 'The Story of Our Village',
      subtitle: 'Narrated by Dadi • 15 min',
      icon: '🎙️',
      timestamp: new Date('2023-06-20'),
      matchedText: extractMatchedSnippet(
        `Long ago, when our ancestors first came to this land, they brought with them the traditions of ${text}.`,
        text
      ),
      data: {} as Katha,
    },
    {
      id: 'param-1',
      type: 'parampara',
      title: 'Secret Kheer Recipe',
      subtitle: 'Passed down 4 generations',
      icon: '🍲',
      timestamp: new Date('2023-01-01'),
      data: {} as Parampara,
    },
    {
      id: 'member-1',
      type: 'member',
      title: 'Shanti Devi',
      subtitle: 'Grandmother • 1943-2020',
      icon: '👵',
      data: {} as VrikshaMember,
    },
    {
      id: 'vasiyat-1',
      type: 'vasiyat',
      title: 'Letter to My Grandchildren',
      subtitle: 'From Nana • Unlocks 2025',
      icon: '💌',
      timestamp: new Date('2024-01-01'),
      data: {} as Vasiyat,
    },
  ];
  
  // Apply filters
  let filtered = mockResults;
  
  // Type filter
  if (filters?.types && filters.types.length > 0) {
    filtered = filtered.filter(r => filters.types.includes(r.type));
  }
  
  // Date range filter
  if (filters?.dateRange) {
    filtered = filtered.filter(r => isDateInRange(r.timestamp, filters.dateRange!));
  }
  
  // Save to recent searches
  if (text.trim().length >= 2) {
    await addRecentSearch(text.trim(), filtered.length);
  }
  
  return filtered;
}

export default {
  performSearch,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
  highlightMatches,
  extractMatchedSnippet,
};
