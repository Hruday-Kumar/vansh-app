/**
 * 🪷 DEMO DATA - Sample memories, kathas, and events for POC display
 *
 * Provides realistic-looking demo data that populates the Smriti and Katha
 * screens with sample photos (from picsum.photos), stories, and event folders.
 * Toggle demo mode from the Smriti header.
 */

import type {
    EventId,
    FamilyEvent,
    FamilyId,
    Katha,
    KathaId,
    MemberId,
    MemoryId,
    SmritiMedia,
} from '../../types';

// ─────────────────────────────────────────────────────────
// Demo Member IDs (referenced in tagged members)
// ─────────────────────────────────────────────────────────

const DEMO_MEMBER_IDS = {
  grandpa: 'demo-member-grandpa' as MemberId,
  grandma: 'demo-member-grandma' as MemberId,
  father: 'demo-member-father' as MemberId,
  mother: 'demo-member-mother' as MemberId,
  self: 'demo-member-self' as MemberId,
  sister: 'demo-member-sister' as MemberId,
  uncle: 'demo-member-uncle' as MemberId,
};

const FAMILY_ID = 'demo-family-001' as FamilyId;

// ─────────────────────────────────────────────────────────
// Demo Photos / Memories
// ─────────────────────────────────────────────────────────

// Using picsum.photos for placeholder images with consistent seeds
function picsum(seed: number, w = 400, h = 400): string {
  return `https://picsum.photos/seed/vansh${seed}/${w}/${h}`;
}

export const DEMO_MEMORIES: SmritiMedia[] = [
  // ── Wedding album ──
  {
    id: 'demo-mem-001' as MemoryId,
    type: 'photo',
    uri: picsum(101, 800, 600),
    thumbnailUri: picsum(101, 400, 300),
    capturedAt: '1985-03-15T10:00:00Z',
    uploadedAt: Date.now() - 86400000 * 365 * 2,
    uploadedBy: DEMO_MEMBER_IDS.father,
    title: 'Wedding Day - Mandap Ceremony',
    description: 'Baba and Aai during the mandap ceremony. The whole village was there.',
    tags: ['wedding', 'mandap', 'ceremony'],
    linkedMembers: [DEMO_MEMBER_IDS.grandpa, DEMO_MEMBER_IDS.grandma],
    linkedKathas: [],
    era: { name: '1980s', startYear: 1980, endYear: 1989, color: '#D4A574' },
  },
  {
    id: 'demo-mem-002' as MemoryId,
    type: 'photo',
    uri: picsum(102, 800, 600),
    thumbnailUri: picsum(102, 400, 300),
    capturedAt: '1985-03-15T14:00:00Z',
    uploadedAt: Date.now() - 86400000 * 365 * 2,
    uploadedBy: DEMO_MEMBER_IDS.father,
    title: 'Wedding Reception',
    description: 'Family photo at the reception. Everyone dressed in their best.',
    tags: ['wedding', 'family', 'reception'],
    linkedMembers: [DEMO_MEMBER_IDS.grandpa, DEMO_MEMBER_IDS.grandma, DEMO_MEMBER_IDS.uncle],
    linkedKathas: [],
    era: { name: '1980s', startYear: 1980, endYear: 1989, color: '#D4A574' },
  },

  // ── Childhood ──
  {
    id: 'demo-mem-003' as MemoryId,
    type: 'photo',
    uri: picsum(103, 600, 800),
    thumbnailUri: picsum(103, 300, 400),
    capturedAt: '1992-06-10T08:00:00Z',
    uploadedAt: Date.now() - 86400000 * 300,
    uploadedBy: DEMO_MEMBER_IDS.mother,
    title: 'First Day of School',
    description: 'Nervous but excited. Aai packed extra rotis in my tiffin.',
    tags: ['school', 'childhood', 'milestone'],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.mother],
    linkedKathas: [],
    era: { name: '1990s', startYear: 1990, endYear: 1999, color: '#8B7355' },
  },
  {
    id: 'demo-mem-004' as MemoryId,
    type: 'photo',
    uri: picsum(104, 800, 600),
    thumbnailUri: picsum(104, 400, 300),
    capturedAt: '1995-11-14T10:00:00Z',
    uploadedAt: Date.now() - 86400000 * 250,
    uploadedBy: DEMO_MEMBER_IDS.father,
    title: "Children's Day Celebration",
    description: 'School cultural program performance.',
    tags: ['school', 'performance', 'childhood'],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.sister],
    linkedKathas: [],
    era: { name: '1990s', startYear: 1990, endYear: 1999, color: '#8B7355' },
  },

  // ── Family gatherings ──
  {
    id: 'demo-mem-005' as MemoryId,
    type: 'photo',
    uri: picsum(105, 800, 600),
    thumbnailUri: picsum(105, 400, 300),
    capturedAt: '2005-10-20T18:00:00Z',
    uploadedAt: Date.now() - 86400000 * 200,
    uploadedBy: DEMO_MEMBER_IDS.self,
    title: 'Diwali Celebration',
    description: 'The whole family gathered at Baba house for Diwali. Grandma made the best ladoos.',
    tags: ['diwali', 'festival', 'family'],
    linkedMembers: [DEMO_MEMBER_IDS.grandpa, DEMO_MEMBER_IDS.grandma, DEMO_MEMBER_IDS.father, DEMO_MEMBER_IDS.mother],
    linkedKathas: ['demo-katha-001' as KathaId],
    era: { name: '2000s', startYear: 2000, endYear: 2009, color: '#6B8E23' },
  },
  {
    id: 'demo-mem-006' as MemoryId,
    type: 'photo',
    uri: picsum(106, 600, 800),
    thumbnailUri: picsum(106, 300, 400),
    capturedAt: '2008-01-26T11:00:00Z',
    uploadedAt: Date.now() - 86400000 * 180,
    uploadedBy: DEMO_MEMBER_IDS.uncle,
    title: 'Republic Day Parade',
    description: 'Watching the parade together on the rooftop with chai.',
    tags: ['republic-day', 'family', 'tradition'],
    linkedMembers: [DEMO_MEMBER_IDS.grandpa, DEMO_MEMBER_IDS.uncle, DEMO_MEMBER_IDS.self],
    linkedKathas: [],
  },
  {
    id: 'demo-mem-007' as MemoryId,
    type: 'photo',
    uri: picsum(107, 800, 600),
    thumbnailUri: picsum(107, 400, 300),
    capturedAt: '2010-05-15T09:00:00Z',
    uploadedAt: Date.now() - 86400000 * 150,
    uploadedBy: DEMO_MEMBER_IDS.self,
    title: 'Graduation Day',
    description: 'Finally graduated! Baba was so proud, he told everyone in the neighborhood.',
    tags: ['graduation', 'milestone', 'education'],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.father, DEMO_MEMBER_IDS.mother],
    linkedKathas: ['demo-katha-002' as KathaId],
    era: { name: '2010s', startYear: 2010, endYear: 2019, color: '#4169E1' },
  },
  {
    id: 'demo-mem-008' as MemoryId,
    type: 'photo',
    uri: picsum(108, 800, 800),
    thumbnailUri: picsum(108, 400, 400),
    capturedAt: '2015-12-25T16:00:00Z',
    uploadedAt: Date.now() - 86400000 * 120,
    uploadedBy: DEMO_MEMBER_IDS.sister,
    title: 'Family Portrait',
    description: 'Three generations together. A rare and precious moment.',
    tags: ['family', 'portrait', 'three-generations'],
    linkedMembers: Object.values(DEMO_MEMBER_IDS),
    linkedKathas: [],
    era: { name: '2010s', startYear: 2010, endYear: 2019, color: '#4169E1' },
  },

  // ── Recent memories ──
  {
    id: 'demo-mem-009' as MemoryId,
    type: 'photo',
    uri: picsum(109, 800, 600),
    thumbnailUri: picsum(109, 400, 300),
    capturedAt: '2023-08-15T07:00:00Z',
    uploadedAt: Date.now() - 86400000 * 30,
    uploadedBy: DEMO_MEMBER_IDS.self,
    title: 'Independence Day at Home',
    description: 'Hoisted the flag on our terrace. Grandpa saluted.',
    tags: ['independence-day', 'tradition', 'patriotic'],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.grandpa],
    linkedKathas: [],
  },
  {
    id: 'demo-mem-010' as MemoryId,
    type: 'photo',
    uri: picsum(110, 800, 600),
    thumbnailUri: picsum(110, 400, 300),
    capturedAt: '2024-01-14T12:00:00Z',
    uploadedAt: Date.now() - 86400000 * 10,
    uploadedBy: DEMO_MEMBER_IDS.mother,
    title: 'Makar Sankranti - Kite Flying',
    description: 'Colorful kites filling the sky. The kids loved it.',
    tags: ['sankranti', 'festival', 'kites'],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.sister],
    linkedKathas: [],
  },
  {
    id: 'demo-mem-011' as MemoryId,
    type: 'photo',
    uri: picsum(111, 600, 800),
    thumbnailUri: picsum(111, 300, 400),
    capturedAt: '2024-03-25T10:00:00Z',
    uploadedAt: Date.now() - 86400000 * 5,
    uploadedBy: DEMO_MEMBER_IDS.self,
    title: 'Holi Celebration',
    description: 'Colors, laughter, and thandai. Best Holi in years.',
    tags: ['holi', 'festival', 'colors'],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.sister, DEMO_MEMBER_IDS.father],
    linkedKathas: [],
  },
  {
    id: 'demo-mem-012' as MemoryId,
    type: 'video',
    uri: picsum(112, 800, 450),
    thumbnailUri: picsum(112, 400, 225),
    capturedAt: '2024-04-10T18:00:00Z',
    uploadedAt: Date.now() - 86400000 * 2,
    uploadedBy: DEMO_MEMBER_IDS.self,
    title: 'Grandma Singing Bhajan',
    description: 'Grandma singing her favorite evening bhajan. Her voice is still so beautiful.',
    tags: ['bhajan', 'grandma', 'music'],
    linkedMembers: [DEMO_MEMBER_IDS.grandma],
    linkedKathas: ['demo-katha-003' as KathaId],
  },
];

// ─────────────────────────────────────────────────────────
// Demo Kathas (Stories)
// ─────────────────────────────────────────────────────────

export const DEMO_KATHAS: Katha[] = [
  {
    id: 'demo-katha-001' as KathaId,
    type: 'standalone_story',
    audioUri: '', // No real audio in demo mode
    duration: 185,
    waveform: generateDemoWaveform(60),
    narratorId: DEMO_MEMBER_IDS.grandpa,
    recordedAt: new Date('2023-10-20T10:00:00Z').getTime(),
    transcript:
      'That Diwali of 2005, I remember it so clearly. The entire family was here — your father, your uncle, all the children. Your grandmother spent two days making ladoos. She must have made over two hundred. The neighbors kept coming, and she kept giving them away. I said to her, "You\'ll have none left for us!" But she just laughed. That\'s how she was — always giving.',
    language: 'en',
    linkedMedia: ['demo-mem-005' as MemoryId],
    linkedMembers: [DEMO_MEMBER_IDS.grandma, DEMO_MEMBER_IDS.father, DEMO_MEMBER_IDS.uncle],
    topics: ['diwali', 'family', 'grandmother'],
    emotions: [
      { emotion: 'nostalgia', intensity: 0.9, timestamp: 10 },
      { emotion: 'joy', intensity: 0.8, timestamp: 60 },
      { emotion: 'love', intensity: 0.95, timestamp: 150 },
    ],
  },
  {
    id: 'demo-katha-002' as KathaId,
    type: 'standalone_story',
    audioUri: '',
    duration: 120,
    waveform: generateDemoWaveform(40),
    narratorId: DEMO_MEMBER_IDS.father,
    recordedAt: new Date('2023-11-15T14:00:00Z').getTime(),
    transcript:
      'When you graduated, I couldn\'t stop smiling. I told the paan-wala, the auto-driver, everyone — "My son graduated today!" Your mother had tears in her eyes. You were the first in our family to get a degree. Your grandfather would have been so proud.',
    language: 'en',
    linkedMedia: ['demo-mem-007' as MemoryId],
    linkedMembers: [DEMO_MEMBER_IDS.self, DEMO_MEMBER_IDS.mother],
    topics: ['graduation', 'pride', 'education'],
    emotions: [
      { emotion: 'pride', intensity: 0.95, timestamp: 30 },
      { emotion: 'joy', intensity: 0.9, timestamp: 60 },
      { emotion: 'love', intensity: 0.85, timestamp: 90 },
    ],
  },
  {
    id: 'demo-katha-003' as KathaId,
    type: 'song',
    audioUri: '',
    duration: 240,
    waveform: generateDemoWaveform(80),
    narratorId: DEMO_MEMBER_IDS.grandma,
    recordedAt: new Date('2024-04-10T18:30:00Z').getTime(),
    transcript: 'ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे...',
    language: 'hi',
    linkedMedia: ['demo-mem-012' as MemoryId],
    linkedMembers: [],
    topics: ['bhajan', 'prayer', 'tradition'],
  },
  {
    id: 'demo-katha-004' as KathaId,
    type: 'interview',
    audioUri: '',
    duration: 310,
    waveform: generateDemoWaveform(100),
    narratorId: DEMO_MEMBER_IDS.grandpa,
    recordedAt: new Date('2024-01-20T16:00:00Z').getTime(),
    transcript:
      'We came to the city in 1962. There was nothing here then — just open land and a few houses. Your great-grandfather had 40 rupees in his pocket and a letter of introduction to a mill owner. He got work the very first day. We lived in one room for five years before we could afford a proper house.',
    language: 'en',
    linkedMedia: [],
    linkedMembers: [DEMO_MEMBER_IDS.grandma],
    topics: ['migration', 'history', 'origins', 'hardship'],
    emotions: [
      { emotion: 'wisdom', intensity: 0.9, timestamp: 50 },
      { emotion: 'pride', intensity: 0.7, timestamp: 200 },
      { emotion: 'nostalgia', intensity: 0.85, timestamp: 280 },
    ],
  },
  {
    id: 'demo-katha-005' as KathaId,
    type: 'video',
    audioUri: '',
    videoUri: '',
    duration: 90,
    waveform: [],
    narratorId: DEMO_MEMBER_IDS.mother,
    recordedAt: new Date('2024-02-14T09:00:00Z').getTime(),
    transcript: 'This is the recipe for our family\'s signature dish. My mother-in-law taught me, and her mother taught her. You must never rush the tempering...',
    language: 'en',
    linkedMedia: [],
    linkedMembers: [DEMO_MEMBER_IDS.grandma],
    topics: ['recipe', 'cooking', 'tradition'],
  },
];

// ─────────────────────────────────────────────────────────
// Demo Events (Album Folders)
// ─────────────────────────────────────────────────────────

export const DEMO_EVENTS: FamilyEvent[] = [
  {
    id: 'demo-event-001' as EventId,
    familyId: FAMILY_ID,
    name: 'Wedding of Baba & Aai',
    description: 'The grand wedding ceremony in 1985. A three-day celebration with the whole village.',
    eventType: 'wedding',
    eventDate: '1985-03-15',
    location: 'Pune, Maharashtra',
    coverUri: picsum(101, 800, 600),
    coverType: 'photo',
    createdBy: DEMO_MEMBER_IDS.father,
    creatorName: 'Father',
    memoryCount: 2,
    videoCount: 0,
    createdAt: Date.now() - 86400000 * 365,
  },
  {
    id: 'demo-event-002' as EventId,
    familyId: FAMILY_ID,
    name: 'Diwali 2005',
    description: 'The whole family under one roof. Grandma\'s famous ladoos.',
    eventType: 'festival',
    eventDate: '2005-10-20',
    location: 'Home',
    coverUri: picsum(105, 800, 600),
    coverType: 'photo',
    createdBy: DEMO_MEMBER_IDS.self,
    creatorName: 'You',
    memoryCount: 1,
    videoCount: 0,
    createdAt: Date.now() - 86400000 * 200,
  },
  {
    id: 'demo-event-003' as EventId,
    familyId: FAMILY_ID,
    name: 'Graduation Day',
    description: 'First graduate in the family. A proud moment.',
    eventType: 'milestone',
    eventDate: '2010-05-15',
    location: 'University of Mumbai',
    coverUri: picsum(107, 800, 600),
    coverType: 'photo',
    createdBy: DEMO_MEMBER_IDS.self,
    creatorName: 'You',
    memoryCount: 1,
    videoCount: 0,
    createdAt: Date.now() - 86400000 * 150,
  },
  {
    id: 'demo-event-004' as EventId,
    familyId: FAMILY_ID,
    name: 'Holi 2024',
    description: 'Colors, music, and thandai. The best Holi celebration.',
    eventType: 'festival',
    eventDate: '2024-03-25',
    location: 'Home',
    coverUri: picsum(111, 800, 600),
    coverType: 'photo',
    createdBy: DEMO_MEMBER_IDS.self,
    creatorName: 'You',
    memoryCount: 1,
    videoCount: 0,
    createdAt: Date.now() - 86400000 * 5,
  },
];

// ─────────────────────────────────────────────────────────
// Demo Members (minimal data for display)
// ─────────────────────────────────────────────────────────

export const DEMO_MEMBERS = [
  {
    id: DEMO_MEMBER_IDS.grandpa,
    firstName: 'Raghunath',
    lastName: 'Sharma',
    gender: 'male' as const,
    birthDate: '1940-08-15',
    isAlive: true,
    avatarUri: picsum(201, 200, 200),
    bio: 'Family patriarch. Retired schoolteacher. Loves telling stories about the old days.',
    relationships: [],
  },
  {
    id: DEMO_MEMBER_IDS.grandma,
    firstName: 'Savitri',
    lastName: 'Sharma',
    gender: 'female' as const,
    birthDate: '1944-01-26',
    isAlive: true,
    avatarUri: picsum(202, 200, 200),
    bio: 'The heart of the family. Known for her cooking, especially ladoos and puran poli.',
    relationships: [],
  },
  {
    id: DEMO_MEMBER_IDS.father,
    firstName: 'Vijay',
    lastName: 'Sharma',
    gender: 'male' as const,
    birthDate: '1960-03-10',
    isAlive: true,
    avatarUri: picsum(203, 200, 200),
    bio: 'Government officer. Quiet but deeply caring.',
    relationships: [],
  },
  {
    id: DEMO_MEMBER_IDS.mother,
    firstName: 'Sunita',
    lastName: 'Sharma',
    maidenName: 'Deshmukh',
    gender: 'female' as const,
    birthDate: '1963-09-05',
    isAlive: true,
    avatarUri: picsum(204, 200, 200),
    bio: 'Teacher at the local school. Keeps the family organized.',
    relationships: [],
  },
  {
    id: DEMO_MEMBER_IDS.self,
    firstName: 'Arjun',
    lastName: 'Sharma',
    gender: 'male' as const,
    birthDate: '1988-07-22',
    isAlive: true,
    avatarUri: picsum(205, 200, 200),
    bio: 'Software engineer. Using technology to preserve family heritage.',
    relationships: [],
  },
  {
    id: DEMO_MEMBER_IDS.sister,
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: 'female' as const,
    birthDate: '1991-12-01',
    isAlive: true,
    avatarUri: picsum(206, 200, 200),
    bio: 'Doctor at a city hospital. Always the responsible one.',
    relationships: [],
  },
  {
    id: DEMO_MEMBER_IDS.uncle,
    firstName: 'Suresh',
    lastName: 'Sharma',
    gender: 'male' as const,
    birthDate: '1962-11-14',
    isAlive: true,
    avatarUri: picsum(207, 200, 200),
    bio: 'Runs the family business. The jokester of the clan.',
    relationships: [],
  },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Generate a realistic-looking waveform array for demo display */
function generateDemoWaveform(points: number): number[] {
  const waveform: number[] = [];
  let prev = 0.3;
  for (let i = 0; i < points; i++) {
    // Smooth random walk between 0.1 and 1.0
    const delta = (Math.random() - 0.5) * 0.3;
    prev = Math.max(0.1, Math.min(1.0, prev + delta));
    waveform.push(prev);
  }
  return waveform;
}
