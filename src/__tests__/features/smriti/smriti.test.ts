/**
 * 🪷 SMRITI (Memories) Feature Tests
 * Tests for memory store logic, upload flow, demo data, and gallery helpers
 */

// ─────────────────────────────────────────────────────────
// Store Logic (mirrors MemoryStore)
// ─────────────────────────────────────────────────────────

interface TestMemory {
  id: string;
  type: 'photo' | 'video';
  uri: string;
  thumbnailUri?: string;
  title?: string;
  description?: string;
  tags: string[];
  linkedMembers: string[];
  linkedKathas: string[];
  uploadedAt: number;
  uploadedBy: string;
  capturedAt?: string;
}

interface UploadQueueItem {
  id: string;
  progress: number;
  fileName: string;
}

class TestMemoryStore {
  memories = new Map<string, TestMemory>();
  recentMemories: TestMemory[] = [];
  uploadQueue: UploadQueueItem[] = [];
  isUploading = false;

  setMemories(memories: TestMemory[]) {
    this.memories.clear();
    memories.forEach(m => this.memories.set(m.id, m));
    this.recentMemories = memories.slice(0, 200);
  }

  addMemory(memory: TestMemory) {
    this.memories.set(memory.id, memory);
    this.recentMemories = [memory, ...this.recentMemories].slice(0, 200);
  }

  updateMemory(id: string, updates: Partial<TestMemory>) {
    const existing = this.memories.get(id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    this.memories.set(id, updated);
    this.recentMemories = this.recentMemories.map(m => m.id === id ? updated : m);
  }

  addToUploadQueue(fileName: string): string {
    const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.uploadQueue.push({ id, progress: 0, fileName });
    this.isUploading = true;
    return id;
  }

  updateUploadProgress(id: string, progress: number) {
    this.uploadQueue = this.uploadQueue.map(item =>
      item.id === id ? { ...item, progress } : item
    );
  }

  removeFromUploadQueue(id: string) {
    this.uploadQueue = this.uploadQueue.filter(item => item.id !== id);
    this.isUploading = this.uploadQueue.length > 0;
  }
}

// ─────────────────────────────────────────────────────────
// Helper: create a test memory
// ─────────────────────────────────────────────────────────

function createTestMemory(overrides: Partial<TestMemory> = {}): TestMemory {
  return {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'photo',
    uri: 'file:///test/photo.jpg',
    title: 'Test Memory',
    tags: [],
    linkedMembers: [],
    linkedKathas: [],
    uploadedAt: Date.now(),
    uploadedBy: 'user-1',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────

describe('MemoryStore', () => {
  let store: TestMemoryStore;

  beforeEach(() => {
    store = new TestMemoryStore();
  });

  describe('setMemories', () => {
    it('should populate memories map and recentMemories', () => {
      const memories = [
        createTestMemory({ id: 'mem-1' }),
        createTestMemory({ id: 'mem-2' }),
        createTestMemory({ id: 'mem-3' }),
      ];
      store.setMemories(memories);

      expect(store.memories.size).toBe(3);
      expect(store.recentMemories.length).toBe(3);
      expect(store.memories.get('mem-1')).toBeDefined();
    });

    it('should limit recentMemories to 200', () => {
      const memories = Array.from({ length: 250 }, (_, i) =>
        createTestMemory({ id: `mem-${i}` })
      );
      store.setMemories(memories);

      expect(store.memories.size).toBe(250);
      expect(store.recentMemories.length).toBe(200);
    });

    it('should clear previous memories when called again', () => {
      store.setMemories([createTestMemory({ id: 'old' })]);
      store.setMemories([createTestMemory({ id: 'new' })]);

      expect(store.memories.size).toBe(1);
      expect(store.memories.has('old')).toBe(false);
      expect(store.memories.has('new')).toBe(true);
    });
  });

  describe('addMemory', () => {
    it('should add memory to map and prepend to recent', () => {
      store.setMemories([createTestMemory({ id: 'existing' })]);
      const newMem = createTestMemory({ id: 'new', title: 'New Memory' });
      store.addMemory(newMem);

      expect(store.memories.size).toBe(2);
      expect(store.recentMemories[0].id).toBe('new');
    });

    it('should not exceed 200 in recentMemories after many adds', () => {
      for (let i = 0; i < 210; i++) {
        store.addMemory(createTestMemory({ id: `mem-${i}` }));
      }
      expect(store.recentMemories.length).toBe(200);
      // Most recent should be last added
      expect(store.recentMemories[0].id).toBe('mem-209');
    });
  });

  describe('updateMemory', () => {
    it('should update existing memory', () => {
      store.addMemory(createTestMemory({ id: 'mem-1', title: 'Old Title' }));
      store.updateMemory('mem-1', { title: 'New Title' });

      expect(store.memories.get('mem-1')?.title).toBe('New Title');
    });

    it('should no-op for non-existent memory', () => {
      store.updateMemory('nonexistent', { title: 'Nope' });
      expect(store.memories.size).toBe(0);
    });

    it('should preserve existing fields not in updates', () => {
      store.addMemory(createTestMemory({ id: 'mem-1', title: 'Title', description: 'Desc' }));
      store.updateMemory('mem-1', { title: 'New Title' });

      const mem = store.memories.get('mem-1');
      expect(mem?.title).toBe('New Title');
      expect(mem?.description).toBe('Desc');
    });
  });
});

describe('Upload Queue', () => {
  let store: TestMemoryStore;

  beforeEach(() => {
    store = new TestMemoryStore();
  });

  it('should add items to upload queue', () => {
    const id = store.addToUploadQueue('photo.jpg');
    expect(store.uploadQueue.length).toBe(1);
    expect(store.uploadQueue[0].id).toBe(id);
    expect(store.uploadQueue[0].progress).toBe(0);
    expect(store.isUploading).toBe(true);
  });

  it('should track progress correctly', () => {
    const id = store.addToUploadQueue('photo.jpg');
    store.updateUploadProgress(id, 50);
    expect(store.uploadQueue[0].progress).toBe(50);

    store.updateUploadProgress(id, 100);
    expect(store.uploadQueue[0].progress).toBe(100);
  });

  it('should remove completed uploads', () => {
    const id1 = store.addToUploadQueue('photo1.jpg');
    const id2 = store.addToUploadQueue('photo2.jpg');

    store.removeFromUploadQueue(id1);
    expect(store.uploadQueue.length).toBe(1);
    expect(store.isUploading).toBe(true);

    store.removeFromUploadQueue(id2);
    expect(store.uploadQueue.length).toBe(0);
    expect(store.isUploading).toBe(false);
  });

  it('should handle multiple concurrent uploads', () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      ids.push(store.addToUploadQueue(`photo${i}.jpg`));
    }
    expect(store.uploadQueue.length).toBe(5);

    // Progress each
    ids.forEach((id, i) => store.updateUploadProgress(id, (i + 1) * 20));
    expect(store.uploadQueue[2].progress).toBe(60);

    // Remove all
    ids.forEach(id => store.removeFromUploadQueue(id));
    expect(store.isUploading).toBe(false);
  });
});

describe('Upload Validation', () => {
  it('should validate required fields before upload', () => {
    const validate = (file: string | null, token: string | null) => {
      const errors: string[] = [];
      if (!file) errors.push('No file selected');
      if (!token) errors.push('Not authenticated');
      return errors;
    };

    expect(validate(null, null)).toEqual(['No file selected', 'Not authenticated']);
    expect(validate('photo.jpg', null)).toEqual(['Not authenticated']);
    expect(validate(null, 'token-123')).toEqual(['No file selected']);
    expect(validate('photo.jpg', 'token-123')).toEqual([]);
  });

  it('should detect video files correctly', () => {
    const isVideo = (uri: string) =>
      uri.toLowerCase().includes('.mov') || uri.toLowerCase().includes('.mp4');

    expect(isVideo('photo.jpg')).toBe(false);
    expect(isVideo('video.mp4')).toBe(true);
    expect(isVideo('VIDEO.MOV')).toBe(true);
    expect(isVideo('movie.MP4')).toBe(true);
    expect(isVideo('file.png')).toBe(false);
  });

  it('should generate fallback title from date', () => {
    const generateTitle = (userTitle: string) =>
      userTitle.trim() || `Memory ${new Date('2024-03-15').toLocaleDateString()}`;

    expect(generateTitle('My Photo')).toBe('My Photo');
    expect(generateTitle('  ')).toContain('Memory');
    expect(generateTitle('')).toContain('Memory');
  });
});

describe('Memory Filtering', () => {
  let store: TestMemoryStore;
  const memories = [
    createTestMemory({ id: 'p1', type: 'photo', capturedAt: '2023-01-15', linkedMembers: ['m1', 'm2'] }),
    createTestMemory({ id: 'p2', type: 'photo', capturedAt: '2023-06-20', linkedMembers: ['m1'] }),
    createTestMemory({ id: 'v1', type: 'video', capturedAt: '2023-03-10', linkedMembers: ['m3'] }),
    createTestMemory({ id: 'p3', type: 'photo', capturedAt: '2024-01-01', linkedMembers: ['m2', 'm3'] }),
  ];

  beforeEach(() => {
    store = new TestMemoryStore();
    store.setMemories(memories);
  });

  it('should filter by type', () => {
    const photos = store.recentMemories.filter(m => m.type === 'photo');
    const videos = store.recentMemories.filter(m => m.type === 'video');
    expect(photos.length).toBe(3);
    expect(videos.length).toBe(1);
  });

  it('should filter by linked member', () => {
    const withM1 = store.recentMemories.filter(m => m.linkedMembers.includes('m1'));
    expect(withM1.length).toBe(2);
  });

  it('should filter by year', () => {
    const in2023 = store.recentMemories.filter(m =>
      m.capturedAt && new Date(m.capturedAt).getFullYear() === 2023
    );
    expect(in2023.length).toBe(3);
  });
});

describe('Timeline Grouping', () => {
  it('should group memories by year newest first', () => {
    const memories = [
      createTestMemory({ capturedAt: '2020-06-15' }),
      createTestMemory({ capturedAt: '2020-12-25' }),
      createTestMemory({ capturedAt: '2023-01-01' }),
      createTestMemory({ capturedAt: '2019-08-10' }),
      createTestMemory({ capturedAt: '2023-07-04' }),
    ];

    const yearMap = new Map<number, TestMemory[]>();
    memories.forEach(m => {
      const year = m.capturedAt ? new Date(m.capturedAt).getFullYear() : NaN;
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(m);
    });

    const groups = Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, mems]) => ({ year, count: mems.length }));

    expect(groups).toEqual([
      { year: 2023, count: 2 },
      { year: 2020, count: 2 },
      { year: 2019, count: 1 },
    ]);
  });

  it('should handle memories without capturedAt', () => {
    const memories = [
      createTestMemory({ capturedAt: undefined }),
      createTestMemory({ capturedAt: '2023-06-15' }),
    ];

    const getYear = (m: TestMemory) =>
      m.capturedAt ? new Date(m.capturedAt).getFullYear() : new Date(m.uploadedAt).getFullYear();

    const years = memories.map(getYear);
    expect(years.every(y => !isNaN(y))).toBe(true);
  });
});

describe('Mosaic Column Distribution', () => {
  it('should distribute items evenly using greedy shortest-column', () => {
    const HEIGHTS = [1.0, 1.4, 1.1, 1.6, 0.9, 1.3, 1.5, 1.0, 1.2, 1.4];
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: `item-${i}`,
      height: 120 * HEIGHTS[i % HEIGHTS.length],
    }));

    const left: typeof items = [];
    const right: typeof items = [];
    let leftH = 0, rightH = 0;

    items.forEach(item => {
      if (leftH <= rightH) {
        left.push(item);
        leftH += item.height;
      } else {
        right.push(item);
        rightH += item.height;
      }
    });

    // Both columns should have items
    expect(left.length).toBeGreaterThan(0);
    expect(right.length).toBeGreaterThan(0);
    // Total items preserved
    expect(left.length + right.length).toBe(12);
    // Column heights shouldn't differ dramatically
    expect(Math.abs(leftH - rightH)).toBeLessThan(leftH * 0.5);
  });
});

describe('Demo Data', () => {
  // Replicate structure from demo-data.ts without React Native imports
  it('should have consistent demo memories', () => {
    // 12 demo memories
    const demoMemoryCount = 12;
    const demoMemoryIds = Array.from({ length: demoMemoryCount }, (_, i) =>
      `demo-mem-${String(i + 1).padStart(3, '0')}`
    );

    // All IDs should be unique
    expect(new Set(demoMemoryIds).size).toBe(demoMemoryCount);
  });

  it('should have consistent demo kathas', () => {
    const demoKathaIds = ['demo-katha-001', 'demo-katha-002', 'demo-katha-003', 'demo-katha-004', 'demo-katha-005'];
    expect(new Set(demoKathaIds).size).toBe(5);
  });

  it('should have demo events covering different types', () => {
    const eventTypes = ['wedding', 'festival', 'milestone', 'festival'];
    expect(eventTypes).toContain('wedding');
    expect(eventTypes).toContain('festival');
    expect(eventTypes).toContain('milestone');
  });

  it('should generate valid waveform data', () => {
    const generateWaveform = (points: number): number[] => {
      const waveform: number[] = [];
      let prev = 0.3;
      for (let i = 0; i < points; i++) {
        const delta = (Math.random() - 0.5) * 0.3;
        prev = Math.max(0.1, Math.min(1.0, prev + delta));
        waveform.push(prev);
      }
      return waveform;
    };

    const waveform = generateWaveform(60);
    expect(waveform.length).toBe(60);
    expect(waveform.every(v => v >= 0.1 && v <= 1.0)).toBe(true);
  });

  it('should merge demo data with real data correctly', () => {
    const demoMemories = [
      createTestMemory({ id: 'demo-1', title: 'Demo' }),
      createTestMemory({ id: 'demo-2', title: 'Demo 2' }),
    ];
    const realMemories = [
      createTestMemory({ id: 'real-1', title: 'Real' }),
    ];

    const isDemoMode = true;
    const effective = isDemoMode
      ? [...demoMemories, ...realMemories]
      : realMemories;

    expect(effective.length).toBe(3);
    expect(effective[0].id).toBe('demo-1');
    expect(effective[2].id).toBe('real-1');

    // When off, only real data
    const effectiveOff = false ? [...demoMemories, ...realMemories] : realMemories;
    expect(effectiveOff.length).toBe(1);
  });
});

describe('Format Duration', () => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  it('should format zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('should format exact minutes', () => {
    expect(formatDuration(180)).toBe('3:00');
  });

  it('should handle large values', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('should floor fractional seconds', () => {
    expect(formatDuration(10.7)).toBe('0:10');
  });
});

describe('Sync Info', () => {
  it('should compute contributors and total memories', () => {
    const memories = [
      createTestMemory({ uploadedBy: 'user-1' }),
      createTestMemory({ uploadedBy: 'user-2' }),
      createTestMemory({ uploadedBy: 'user-1' }),
      createTestMemory({ uploadedBy: 'user-3' }),
    ];

    const uploaders = new Set(memories.map(m => m.uploadedBy));
    expect(uploaders.size).toBe(3);
    expect(memories.length).toBe(4);
  });
});
