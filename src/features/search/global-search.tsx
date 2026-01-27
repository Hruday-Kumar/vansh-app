/**
 * 🪷 VANSH - Global Search
 * Search across all pillars - memories, stories, traditions, family members
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { VanshColors, VanshRadius, VanshSpacing, VanshTextStyles } from '../../theme';
import type { Katha, Parampara, SmritiMedia, Vasiyat, VrikshaMember } from '../../types';

// ============================================================================
// Types
// ============================================================================

type SearchResultType = 'memory' | 'katha' | 'member' | 'parampara' | 'vasiyat';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  icon: string;
  matchedText?: string;
  data: SmritiMedia | Katha | VrikshaMember | Parampara | Vasiyat;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'suggestion';
}

// ============================================================================
// Result Type Config
// ============================================================================

const typeConfig: Record<SearchResultType, { icon: string; label: string; color: string }> = {
  memory: { icon: '📸', label: 'Memory', color: VanshColors.sindoor[500] },
  katha: { icon: '🎙️', label: 'Story', color: VanshColors.neelam[600] },
  member: { icon: '👤', label: 'Member', color: VanshColors.suvarna[600] },
  parampara: { icon: '🪔', label: 'Tradition', color: VanshColors.chandan[600] },
  vasiyat: { icon: '💌', label: 'Message', color: VanshColors.padma[600] },
};

// ============================================================================
// Search Result Item
// ============================================================================

interface SearchResultItemProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
  delay?: number;
}

function SearchResultItem({ result, onPress, delay = 0 }: SearchResultItemProps) {
  const config = typeConfig[result.type];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => onPress(result)}
        activeOpacity={0.7}
      >
        <View style={[styles.resultIcon, { backgroundColor: config.color + '20' }]}>
          <Text style={styles.resultIconText}>{result.icon}</Text>
        </View>
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {result.title}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {result.subtitle}
          </Text>
          {result.matchedText && (
            <Text style={styles.matchedText} numberOfLines={2}>
              "...{result.matchedText}..."
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Search Filters
// ============================================================================

interface FilterChipProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, icon, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.filterIcon}>{icon}</Text>
      <Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Main Search Component
// ============================================================================

interface GlobalSearchProps {
  onClose?: () => void;
  onResultPress?: (result: SearchResult) => void;
}

export function GlobalSearch({ onClose, onResultPress }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchResultType[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock suggestions
  const suggestions: SearchSuggestion[] = [
    { text: 'Grandma\'s recipes', type: 'recent' },
    { text: 'Wedding photos', type: 'recent' },
    { text: 'Diwali traditions', type: 'suggestion' },
    { text: 'Family stories', type: 'suggestion' },
  ];

  // Toggle filter
  const toggleFilter = useCallback((filter: SearchResultType) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  // Perform search (mock implementation)
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'memory',
          title: 'Grandma\'s 80th Birthday',
          subtitle: 'August 15, 2023 • 24 photos',
          icon: '🎂',
          matchedText: `...celebrating ${searchQuery} with the whole family...`,
          data: {} as SmritiMedia,
        },
        {
          id: '2',
          type: 'katha',
          title: 'The Story of Our Village',
          subtitle: 'Narrated by Dadi • 15 min',
          icon: '🎙️',
          matchedText: `...${searchQuery} was always important to us...`,
          data: {} as Katha,
        },
        {
          id: '3',
          type: 'parampara',
          title: 'Secret Kheer Recipe',
          subtitle: 'Passed down 4 generations',
          icon: '🍲',
          data: {} as Parampara,
        },
        {
          id: '4',
          type: 'member',
          title: 'Shanti Devi',
          subtitle: 'Grandmother • 1943-2020',
          icon: '👵',
          data: {} as VrikshaMember,
        },
        {
          id: '5',
          type: 'vasiyat',
          title: 'Letter to My Grandchildren',
          subtitle: 'From Nana • Unlocks 2025',
          icon: '💌',
          data: {} as Vasiyat,
        },
      ];

      // Filter results if filters are active
      const filtered = activeFilters.length > 0
        ? mockResults.filter(r => activeFilters.includes(r.type))
        : mockResults;

      setResults(filtered);
      setIsSearching(false);
    }, 500);
  }, [activeFilters]);

  // Handle search input
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    performSearch(text);
  }, [performSearch]);

  // Handle suggestion press
  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    performSearch(suggestion.text);
  }, [performSearch]);

  // Handle result press
  const handleResultPress = useCallback((result: SearchResult) => {
    onResultPress?.(result);
  }, [onResultPress]);

  // Filtered results based on active filters
  const filteredResults = useMemo(() => {
    if (activeFilters.length === 0) return results;
    return results.filter(r => activeFilters.includes(r.type));
  }, [results, activeFilters]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories, stories, family..."
            placeholderTextColor={VanshColors.masi[400]}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterChip
          label="Memories"
          icon="📸"
          selected={activeFilters.includes('memory')}
          onPress={() => toggleFilter('memory')}
        />
        <FilterChip
          label="Stories"
          icon="🎙️"
          selected={activeFilters.includes('katha')}
          onPress={() => toggleFilter('katha')}
        />
        <FilterChip
          label="Family"
          icon="👤"
          selected={activeFilters.includes('member')}
          onPress={() => toggleFilter('member')}
        />
        <FilterChip
          label="Traditions"
          icon="🪔"
          selected={activeFilters.includes('parampara')}
          onPress={() => toggleFilter('parampara')}
        />
        <FilterChip
          label="Messages"
          icon="💌"
          selected={activeFilters.includes('vasiyat')}
          onPress={() => toggleFilter('vasiyat')}
        />
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={VanshColors.suvarna[500]} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Suggestions (when no query) */}
        {!query && !isSearching && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.sectionTitle}>Recent & Suggestions</Text>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionIcon}>
                  {suggestion.type === 'recent' ? '🕐' : '💡'}
                </Text>
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}

            {/* Quick Access */}
            <Text style={[styles.sectionTitle, { marginTop: VanshSpacing.lg }]}>
              Quick Access
            </Text>
            <View style={styles.quickAccessGrid}>
              {[
                { icon: '📸', label: 'All Photos' },
                { icon: '🎙️', label: 'All Stories' },
                { icon: '🌳', label: 'Family Tree' },
                { icon: '🪔', label: 'Traditions' },
              ].map((item, index) => (
                <TouchableOpacity key={index} style={styles.quickAccessItem}>
                  <Text style={styles.quickAccessIcon}>{item.icon}</Text>
                  <Text style={styles.quickAccessLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Search Results */}
        {query && !isSearching && filteredResults.length > 0 && (
          <View>
            <Text style={styles.resultsCount}>
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{query}"
            </Text>
            {filteredResults.map((result, index) => (
              <SearchResultItem
                key={result.id}
                result={result}
                onPress={handleResultPress}
                delay={index * 50}
              />
            ))}
          </View>
        )}

        {/* No Results */}
        {query && !isSearching && filteredResults.length === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try different keywords or remove filters
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.md,
    paddingTop: VanshSpacing.xl,
    paddingBottom: VanshSpacing.sm,
    backgroundColor: VanshColors.khadi[50],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    paddingHorizontal: VanshSpacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
  },
  searchIcon: {
    fontSize: 18,
    marginRight: VanshSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...VanshTextStyles.body,
    color: VanshColors.masi[900],
    height: '100%',
  },
  clearIcon: {
    fontSize: 16,
    color: VanshColors.masi[400],
    padding: VanshSpacing.xs,
  },
  cancelButton: {
    marginLeft: VanshSpacing.sm,
    paddingHorizontal: VanshSpacing.xs,
  },
  cancelText: {
    ...VanshTextStyles.body,
    color: VanshColors.suvarna[600],
  },
  filtersContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  filtersContent: {
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    gap: VanshSpacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.sm,
    paddingVertical: VanshSpacing.xs,
    borderRadius: VanshRadius.full,
    backgroundColor: VanshColors.khadi[100],
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    marginRight: VanshSpacing.xs,
  },
  filterChipSelected: {
    backgroundColor: VanshColors.suvarna[100],
    borderColor: VanshColors.suvarna[400],
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterLabel: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[600],
  },
  filterLabelSelected: {
    color: VanshColors.suvarna[700],
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: VanshSpacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: VanshSpacing.xl,
  },
  loadingText: {
    ...VanshTextStyles.body,
    color: VanshColors.masi[500],
    marginLeft: VanshSpacing.sm,
  },
  sectionTitle: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: VanshSpacing.md,
    marginBottom: VanshSpacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: VanshColors.khadi[200],
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: VanshSpacing.sm,
  },
  suggestionText: {
    ...VanshTextStyles.body,
    color: VanshColors.masi[700],
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -VanshSpacing.xs,
  },
  quickAccessItem: {
    width: '25%',
    alignItems: 'center',
    padding: VanshSpacing.md,
  },
  quickAccessIcon: {
    fontSize: 28,
    marginBottom: VanshSpacing.xs,
  },
  quickAccessLabel: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[600],
    textAlign: 'center',
  },
  resultsCount: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
    marginTop: VanshSpacing.md,
    marginBottom: VanshSpacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.lg,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.sm,
    shadowColor: VanshColors.masi[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: VanshRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: VanshSpacing.sm,
  },
  resultIconText: {
    fontSize: 24,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  resultTitle: {
    ...VanshTextStyles.subhead,
    fontWeight: '600',
    color: VanshColors.masi[900],
    flex: 1,
    marginRight: VanshSpacing.sm,
  },
  typeBadge: {
    paddingHorizontal: VanshSpacing.xs,
    paddingVertical: 2,
    borderRadius: VanshRadius.sm,
  },
  typeBadgeText: {
    ...VanshTextStyles.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  resultSubtitle: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
  },
  matchedText: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[600],
    fontStyle: 'italic',
    marginTop: VanshSpacing.xs,
    backgroundColor: VanshColors.suvarna[50],
    padding: VanshSpacing.xs,
    borderRadius: VanshRadius.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: VanshSpacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: VanshSpacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    ...VanshTextStyles.title,
    color: VanshColors.masi[700],
    marginBottom: VanshSpacing.xs,
  },
  emptySubtitle: {
    ...VanshTextStyles.body,
    color: VanshColors.masi[500],
    textAlign: 'center',
  },
});
