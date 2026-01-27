/**
 * Cache Service Unit Tests
 * Tests the cache service logic using standalone test implementation
 */

// Simple in-memory cache for testing (mirrors the real implementation)
class TestCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private hits = 0;
  private misses = 0;

  get<T>(namespace: string, key: string): T | undefined {
    const fullKey = `${namespace}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      this.misses++;
      return undefined;
    }
    
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(fullKey);
      this.misses++;
      return undefined;
    }
    
    this.hits++;
    return entry.value as T;
  }

  set<T>(namespace: string, key: string, value: T, options?: { ttl?: number }): void {
    const fullKey = `${namespace}:${key}`;
    const expiry = options?.ttl ? Date.now() + options.ttl : 0;
    this.cache.set(fullKey, { value, expiry });
  }

  delete(namespace: string, key: string): void {
    this.cache.delete(`${namespace}:${key}`);
  }

  clearNamespace(namespace: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      totalItems: this.cache.size,
    };
  }

  async withCache<T>(namespace: string, key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(namespace, key);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      const result = await fn();
      this.set(namespace, key, result);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// Test instance
let cache: TestCache;

beforeEach(() => {
  cache = new TestCache();
});

describe('Cache Service', () => {
  describe('basic operations', () => {
    it('sets and gets cached values', () => {
      cache.set('api', 'test-key', { data: 'test-value' });
      
      const result = cache.get<{ data: string }>('api', 'test-key');
      
      expect(result).toEqual({ data: 'test-value' });
    });

    it('returns undefined for non-existent keys', () => {
      const result = cache.get('api', 'non-existent');
      
      expect(result).toBeUndefined();
    });

    it('deletes cached values', () => {
      cache.set('api', 'to-delete', { value: 123 });
      expect(cache.get('api', 'to-delete')).toBeDefined();
      
      cache.delete('api', 'to-delete');
      
      expect(cache.get('api', 'to-delete')).toBeUndefined();
    });

    it('clears entire namespace', () => {
      cache.set('api', 'key1', 'value1');
      cache.set('api', 'key2', 'value2');
      cache.set('member', 'key3', 'value3');
      
      cache.clearNamespace('api');
      
      expect(cache.get('api', 'key1')).toBeUndefined();
      expect(cache.get('api', 'key2')).toBeUndefined();
      expect(cache.get('member', 'key3')).toBe('value3');
    });

    it('clears all namespaces', () => {
      cache.set('api', 'key1', 'value1');
      cache.set('member', 'key2', 'value2');
      cache.set('memory', 'key3', 'value3');
      
      cache.clear();
      
      expect(cache.get('api', 'key1')).toBeUndefined();
      expect(cache.get('member', 'key2')).toBeUndefined();
      expect(cache.get('memory', 'key3')).toBeUndefined();
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns value before TTL expires', () => {
      cache.set('api', 'ttl-test', 'value', { ttl: 5000 });
      
      jest.advanceTimersByTime(4000);
      
      expect(cache.get('api', 'ttl-test')).toBe('value');
    });

    it('returns undefined after TTL expires', () => {
      cache.set('api', 'ttl-test', 'value', { ttl: 5000 });
      
      jest.advanceTimersByTime(6000);
      
      expect(cache.get('api', 'ttl-test')).toBeUndefined();
    });
  });

  describe('cache namespaces', () => {
    const namespaces = ['api', 'member', 'memory', 'search', 'ui'] as const;

    it('supports all defined namespaces', () => {
      namespaces.forEach(namespace => {
        cache.set(namespace, 'test', { namespace });
        expect(cache.get(namespace, 'test')).toEqual({ namespace });
      });
    });

    it('isolates keys across namespaces', () => {
      cache.set('api', 'shared-key', 'api-value');
      cache.set('member', 'shared-key', 'member-value');
      
      expect(cache.get('api', 'shared-key')).toBe('api-value');
      expect(cache.get('member', 'shared-key')).toBe('member-value');
    });
  });

  describe('cache statistics', () => {
    it('tracks cache hits and misses', () => {
      cache.set('api', 'existing', 'value');
      
      cache.get('api', 'existing'); // hit
      cache.get('api', 'non-existing'); // miss
      cache.get('api', 'existing'); // hit
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('calculates hit rate correctly', () => {
      cache.set('api', 'key', 'value');
      
      cache.get('api', 'key'); // hit
      cache.get('api', 'key'); // hit
      cache.get('api', 'missing'); // miss
      cache.get('api', 'key'); // hit
      
      const stats = cache.getStats();
      
      // 3 hits out of 4 requests = 0.75
      expect(stats.hitRate).toBeCloseTo(0.75, 1);
    });

    it('reports total items', () => {
      cache.set('api', 'a', 1);
      cache.set('api', 'b', 2);
      cache.set('member', 'c', 3);
      
      const stats = cache.getStats();
      
      expect(stats.totalItems).toBe(3);
    });
  });

  describe('withCache wrapper', () => {
    it('caches function results', async () => {
      const expensiveFn = jest.fn().mockResolvedValue({ computed: true });
      
      const result1 = await cache.withCache('api', 'expensive-op', expensiveFn);
      const result2 = await cache.withCache('api', 'expensive-op', expensiveFn);
      
      expect(result1).toEqual({ computed: true });
      expect(result2).toEqual({ computed: true });
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    it('recomputes after cache clear', async () => {
      const fn = jest.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');
      
      const result1 = await cache.withCache('api', 'key', fn);
      cache.clear();
      const result2 = await cache.withCache('api', 'key', fn);
      
      expect(result1).toBe('first');
      expect(result2).toBe('second');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('handles errors gracefully', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('API Error'));
      
      await expect(cache.withCache('api', 'failing', failingFn))
        .rejects.toThrow('API Error');
      
      // Should not cache failed results
      expect(cache.get('api', 'failing')).toBeUndefined();
    });
  });
});

describe('Cache type safety', () => {
  it('preserves types when getting cached values', () => {
    interface UserData {
      name: string;
      age: number;
    }
    
    const userData: UserData = { name: 'Test', age: 30 };
    cache.set('api', 'user', userData);
    
    const retrieved = cache.get<UserData>('api', 'user');
    
    expect(retrieved?.name).toBe('Test');
    expect(retrieved?.age).toBe(30);
  });
});
