/**
 * 🪷 KATHA (Stories) Feature Tests
 * Tests for katha store logic, recording helpers, transcription, waveform,
 * sync point management, and audio metering conversion
 */

// ─────────────────────────────────────────────────────────
// Store Logic (mirrors KathaStore)
// ─────────────────────────────────────────────────────────

interface TestKatha {
  id: string;
  type: 'voice_overlay' | 'standalone_story' | 'interview' | 'song' | 'video' | 'photo_story';
  audioUri: string;
  videoUri?: string;
  duration: number;
  waveform: number[];
  narratorId: string;
  recordedAt: number;
  transcript?: string;
  language: string;
  linkedMedia: string[];
  linkedMembers: string[];
  syncPoints?: TestSyncPoint[];
}

interface TestSyncPoint {
  audioTime: number;
  mediaId: string;
  action: 'show' | 'zoom' | 'highlight';
  target?: { x: number; y: number };
}

class TestKathaStore {
  kathas = new Map<string, TestKatha>();
  recentKathas: TestKatha[] = [];
  isRecording = false;
  recordingDuration = 0;
  recordingWaveform: number[] = [];
  isPlaying = false;
  playbackKathaId: string | null = null;
  playbackPosition = 0;

  setKathas(kathas: TestKatha[]) {
    this.kathas.clear();
    kathas.forEach(k => this.kathas.set(k.id, k));
    this.recentKathas = kathas.slice(0, 100);
  }

  addKatha(katha: TestKatha) {
    this.kathas.set(katha.id, katha);
    this.recentKathas = [katha, ...this.recentKathas].slice(0, 100);
  }

  startRecording() {
    this.isRecording = true;
    this.recordingDuration = 0;
    this.recordingWaveform = [];
  }

  stopRecording() {
    this.isRecording = false;
  }

  updateRecording(duration: number, waveform: number[]) {
    this.recordingDuration = duration;
    this.recordingWaveform = waveform;
  }

  play(kathaId: string) {
    this.isPlaying = true;
    this.playbackKathaId = kathaId;
  }

  pause() {
    this.isPlaying = false;
  }

  seek(position: number) {
    this.playbackPosition = position;
  }
}

// ─────────────────────────────────────────────────────────
// Helper: create a test katha
// ─────────────────────────────────────────────────────────

function createTestKatha(overrides: Partial<TestKatha> = {}): TestKatha {
  return {
    id: `katha-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'standalone_story',
    audioUri: 'file:///test/audio.m4a',
    duration: 60,
    waveform: [0.3, 0.5, 0.8, 0.4, 0.6],
    narratorId: 'member-1',
    recordedAt: Date.now(),
    language: 'en',
    linkedMedia: [],
    linkedMembers: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────

describe('KathaStore', () => {
  let store: TestKathaStore;

  beforeEach(() => {
    store = new TestKathaStore();
  });

  describe('setKathas', () => {
    it('should populate kathas map and recentKathas', () => {
      const kathas = [
        createTestKatha({ id: 'k1' }),
        createTestKatha({ id: 'k2' }),
      ];
      store.setKathas(kathas);

      expect(store.kathas.size).toBe(2);
      expect(store.recentKathas.length).toBe(2);
    });

    it('should limit recentKathas to 100', () => {
      const kathas = Array.from({ length: 120 }, (_, i) =>
        createTestKatha({ id: `k${i}` })
      );
      store.setKathas(kathas);

      expect(store.kathas.size).toBe(120);
      expect(store.recentKathas.length).toBe(100);
    });
  });

  describe('addKatha', () => {
    it('should prepend to recentKathas', () => {
      store.addKatha(createTestKatha({ id: 'old' }));
      store.addKatha(createTestKatha({ id: 'new' }));

      expect(store.recentKathas[0].id).toBe('new');
      expect(store.recentKathas[1].id).toBe('old');
    });
  });

  describe('recording state', () => {
    it('should toggle recording state', () => {
      expect(store.isRecording).toBe(false);

      store.startRecording();
      expect(store.isRecording).toBe(true);
      expect(store.recordingDuration).toBe(0);

      store.updateRecording(5, [0.3, 0.5]);
      expect(store.recordingDuration).toBe(5);

      store.stopRecording();
      expect(store.isRecording).toBe(false);
    });
  });

  describe('playback state', () => {
    it('should manage playback', () => {
      store.play('k1');
      expect(store.isPlaying).toBe(true);
      expect(store.playbackKathaId).toBe('k1');

      store.seek(0.5);
      expect(store.playbackPosition).toBe(0.5);

      store.pause();
      expect(store.isPlaying).toBe(false);
    });
  });
});

describe('Audio Metering Conversion', () => {
  // Mirrors dbToAmplitude from katha-recorder.tsx
  const dbToAmplitude = (db: number): number => {
    const minDb = -60;
    const clamped = Math.max(minDb, Math.min(0, db));
    return (clamped - minDb) / (0 - minDb);
  };

  it('should return 0 for silence (-60 dB)', () => {
    expect(dbToAmplitude(-60)).toBeCloseTo(0);
  });

  it('should return 1 for maximum (0 dB)', () => {
    expect(dbToAmplitude(0)).toBeCloseTo(1);
  });

  it('should return ~0.5 for midpoint (-30 dB)', () => {
    expect(dbToAmplitude(-30)).toBeCloseTo(0.5);
  });

  it('should clamp values below -60 to 0', () => {
    expect(dbToAmplitude(-160)).toBeCloseTo(0);
    expect(dbToAmplitude(-100)).toBeCloseTo(0);
  });

  it('should clamp values above 0 to 1', () => {
    expect(dbToAmplitude(10)).toBeCloseTo(1);
  });

  it('should be monotonically increasing', () => {
    const values = [-60, -50, -40, -30, -20, -10, 0].map(dbToAmplitude);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('Sync Point Management', () => {
  it('should create initial sync point at time 0', () => {
    const photos = [{ id: 'photo-1' }, { id: 'photo-2' }];
    const syncPoints: TestSyncPoint[] = [{
      audioTime: 0,
      mediaId: photos[0].id,
      action: 'show',
    }];

    expect(syncPoints.length).toBe(1);
    expect(syncPoints[0].audioTime).toBe(0);
    expect(syncPoints[0].mediaId).toBe('photo-1');
  });

  it('should add sync points on photo tap', () => {
    const syncPoints: TestSyncPoint[] = [
      { audioTime: 0, mediaId: 'photo-1', action: 'show' },
    ];

    // Simulate tapping at 5 seconds
    syncPoints.push({ audioTime: 5, mediaId: 'photo-2', action: 'show' });
    // Simulate tapping at 12 seconds
    syncPoints.push({ audioTime: 12, mediaId: 'photo-3', action: 'show' });

    expect(syncPoints.length).toBe(3);
    expect(syncPoints[1].audioTime).toBe(5);
    expect(syncPoints[2].mediaId).toBe('photo-3');
  });

  it('should find current sync point from playback position', () => {
    const syncPoints: TestSyncPoint[] = [
      { audioTime: 0, mediaId: 'photo-1', action: 'show' },
      { audioTime: 5, mediaId: 'photo-2', action: 'show' },
      { audioTime: 12, mediaId: 'photo-3', action: 'show' },
    ];

    const findSyncIndex = (currentTime: number): number => {
      return syncPoints.findIndex((sp, i) => {
        const next = syncPoints[i + 1];
        return currentTime >= sp.audioTime && (!next || currentTime < next.audioTime);
      });
    };

    expect(findSyncIndex(0)).toBe(0);
    expect(findSyncIndex(3)).toBe(0);
    expect(findSyncIndex(5)).toBe(1);
    expect(findSyncIndex(8)).toBe(1);
    expect(findSyncIndex(12)).toBe(2);
    expect(findSyncIndex(100)).toBe(2);
  });

  it('should handle empty sync points', () => {
    const syncPoints: TestSyncPoint[] = [];
    const findSyncIndex = (currentTime: number): number => {
      return syncPoints.findIndex((sp, i) => {
        const next = syncPoints[i + 1];
        return currentTime >= sp.audioTime && (!next || currentTime < next.audioTime);
      });
    };

    expect(findSyncIndex(5)).toBe(-1);
  });
});

describe('Katha Type Classification', () => {
  it('should classify katha types correctly', () => {
    const getTypeLabel = (type: TestKatha['type']): string => {
      switch (type) {
        case 'video': return 'Video Story';
        case 'photo_story': return 'Photo Story';
        case 'song': return 'Family Song';
        case 'interview': return 'Interview';
        case 'voice_overlay': return 'Voice Overlay';
        case 'standalone_story': return 'Voice Story';
        default: return 'Story';
      }
    };

    expect(getTypeLabel('video')).toBe('Video Story');
    expect(getTypeLabel('photo_story')).toBe('Photo Story');
    expect(getTypeLabel('song')).toBe('Family Song');
    expect(getTypeLabel('standalone_story')).toBe('Voice Story');
  });

  it('should get correct icon for each type', () => {
    const getTypeIcon = (type: TestKatha['type']): string => {
      switch (type) {
        case 'video': return 'videocam';
        case 'photo_story': return 'photo-library';
        default: return 'mic';
      }
    };

    expect(getTypeIcon('video')).toBe('videocam');
    expect(getTypeIcon('photo_story')).toBe('photo-library');
    expect(getTypeIcon('standalone_story')).toBe('mic');
    expect(getTypeIcon('song')).toBe('mic');
  });
});

describe('Transcription', () => {
  it('should handle transcript preview truncation', () => {
    const transcript = 'This is a very long transcript that goes on and on about family history and memories and traditions.';
    const preview = transcript.slice(0, 40) || 'Voice Story';
    expect(preview.length).toBe(40);
    expect(preview).toBe('This is a very long transcript that goes');
  });

  it('should use fallback for empty transcript', () => {
    const transcript = '';
    const preview = transcript.slice(0, 40) || 'Voice Story';
    expect(preview).toBe('Voice Story');
  });

  it('should support multiple languages', () => {
    const SUPPORTED_LANGUAGES = ['en', 'hi', 'te', 'auto'];
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('hi');
    expect(SUPPORTED_LANGUAGES).toContain('auto');
  });
});

describe('Waveform Generation', () => {
  it('should generate waveform of requested length', () => {
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

    expect(generateWaveform(0).length).toBe(0);
    expect(generateWaveform(10).length).toBe(10);
    expect(generateWaveform(100).length).toBe(100);
  });

  it('should keep values within bounds', () => {
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

    const waveform = generateWaveform(500);
    expect(waveform.every(v => v >= 0.1 && v <= 1.0)).toBe(true);
  });

  it('should slice waveform for display window', () => {
    const fullWaveform = Array.from({ length: 100 }, (_, i) => (i + 1) / 100);
    const displayWindow = 30;
    const visible = fullWaveform.slice(-displayWindow);

    expect(visible.length).toBe(30);
    expect(visible[visible.length - 1]).toBeCloseTo(1.0);
  });
});

describe('KathaStore Persistence Format', () => {
  it('should serialize kathas Map to entries array', () => {
    const store = new TestKathaStore();
    store.addKatha(createTestKatha({ id: 'k1' }));
    store.addKatha(createTestKatha({ id: 'k2' }));

    // Simulate partialize (what zustand persist does)
    const serialized = {
      kathas: Array.from(store.kathas.entries()),
      recentKathas: store.recentKathas,
    };

    expect(serialized.kathas.length).toBe(2);
    expect(serialized.kathas[0][0]).toBe('k1');

    // Simulate rehydrate
    const rehydrated = new Map<string, TestKatha>(serialized.kathas);
    expect(rehydrated.size).toBe(2);
    expect(rehydrated.get('k1')?.id).toBe('k1');
  });
});

describe('Playback Position Calculation', () => {
  it('should calculate position as ratio', () => {
    const duration = 120; // 2 minutes
    const positionMillis = 60000; // 1 minute

    const durationMs = duration * 1000;
    const position = durationMs > 0 ? positionMillis / durationMs : 0;

    expect(position).toBeCloseTo(0.5);
  });

  it('should handle zero duration safely', () => {
    const duration = 0;
    const positionMillis = 5000;

    const durationMs = duration * 1000;
    const position = durationMs > 0 ? positionMillis / durationMs : 0;

    expect(position).toBe(0); // No division by zero
  });

  it('should convert position ratio back to millis', () => {
    const duration = 120;
    const position = 0.75;
    const positionMillis = position * duration * 1000;

    expect(positionMillis).toBe(90000);
  });
});

describe('Katha Merging (API + Local)', () => {
  it('should merge API kathas with local ones keeping local-only', () => {
    const apiKathas = [
      createTestKatha({ id: 'api-1' }),
      createTestKatha({ id: 'api-2' }),
    ];
    const localKathas = [
      createTestKatha({ id: 'api-1' }), // duplicate
      createTestKatha({ id: 'local-1' }), // local-only
    ];

    const localOnly = localKathas.filter(
      local => !apiKathas.some(api => api.id === local.id)
    );

    const merged = [...apiKathas, ...localOnly];
    expect(merged.length).toBe(3);
    expect(merged.map(k => k.id)).toEqual(['api-1', 'api-2', 'local-1']);
  });

  it('should prefer API data for duplicates', () => {
    const apiKathas = [
      createTestKatha({ id: 'k1', transcript: 'API version' }),
    ];
    const localKathas = [
      createTestKatha({ id: 'k1', transcript: 'Local version' }),
    ];

    const localOnly = localKathas.filter(
      local => !apiKathas.some(api => api.id === local.id)
    );
    const merged = [...apiKathas, ...localOnly];

    expect(merged.length).toBe(1);
    expect(merged[0].transcript).toBe('API version');
  });
});
