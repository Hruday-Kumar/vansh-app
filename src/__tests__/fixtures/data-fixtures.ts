/**
 * Test Fixtures
 * Reusable test data fixtures using simplified types for testing
 */

// Simplified types for test fixtures (avoiding branded types)
interface TestFamilyMember {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  generation: number;
  isAlive: boolean;
  deathDate?: string;
  avatarUrl?: string;
  bio?: string;
  occupation?: string;
  birthPlace?: string;
  currentLocation?: string;
  relationships: Array<{ memberId: string; type: string }>;
  createdAt: string;
  updatedAt: string;
}

interface TestMemory {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  mediaUrl: string;
  thumbnailUrl?: string;
  date: string;
  location: string;
  taggedMembers: string[];
  createdBy: string;
  isPrivate: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TestTradition {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: string;
  origin: string;
  significance: string;
  mediaUrls: string[];
  associatedMembers: string[];
  nextOccurrence?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TestVasiyat {
  id: string;
  title: string;
  type: string;
  content: string;
  mediaUrl?: string;
  scheduledDate?: string;
  isSealed: boolean;
  canViewAfterDeath: boolean;
  recipients: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Family tree fixture - 3 generations
export const familyTreeFixture: TestFamilyMember[] = [
  // Generation 0 - Grandparents
  {
    id: 'mem_g0_1',
    name: 'Ramesh Kumar',
    birthDate: '1940-05-15',
    gender: 'male',
    generation: 0,
    isAlive: false,
    deathDate: '2015-03-20',
    avatarUrl: 'https://example.com/avatars/ramesh.jpg',
    bio: 'Family patriarch, retired government officer',
    occupation: 'Government Officer',
    birthPlace: 'Hyderabad, India',
    currentLocation: undefined,
    relationships: [
      { memberId: 'mem_g0_2', type: 'spouse' },
      { memberId: 'mem_g1_1', type: 'child' },
      { memberId: 'mem_g1_2', type: 'child' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_g0_2',
    name: 'Lakshmi Kumar',
    birthDate: '1945-08-22',
    gender: 'female',
    generation: 0,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/lakshmi.jpg',
    bio: 'Family matriarch, homemaker and spiritual guide',
    occupation: 'Homemaker',
    birthPlace: 'Vizag, India',
    currentLocation: 'Hyderabad, India',
    relationships: [
      { memberId: 'mem_g0_1', type: 'spouse' },
      { memberId: 'mem_g1_1', type: 'child' },
      { memberId: 'mem_g1_2', type: 'child' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  
  // Generation 1 - Parents
  {
    id: 'mem_g1_1',
    name: 'Suresh Kumar',
    birthDate: '1970-02-14',
    gender: 'male',
    generation: 1,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/suresh.jpg',
    bio: 'Software Engineer turned entrepreneur',
    occupation: 'Entrepreneur',
    birthPlace: 'Hyderabad, India',
    currentLocation: 'San Francisco, USA',
    relationships: [
      { memberId: 'mem_g0_1', type: 'parent' },
      { memberId: 'mem_g0_2', type: 'parent' },
      { memberId: 'mem_g1_3', type: 'spouse' },
      { memberId: 'mem_g2_1', type: 'child' },
      { memberId: 'mem_g2_2', type: 'child' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_g1_2',
    name: 'Priya Sharma',
    birthDate: '1972-11-08',
    gender: 'female',
    generation: 1,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/priya.jpg',
    bio: 'Cardiologist at Apollo Hospital',
    occupation: 'Doctor',
    birthPlace: 'Hyderabad, India',
    currentLocation: 'Mumbai, India',
    relationships: [
      { memberId: 'mem_g0_1', type: 'parent' },
      { memberId: 'mem_g0_2', type: 'parent' },
      { memberId: 'mem_g1_4', type: 'spouse' },
      { memberId: 'mem_g2_3', type: 'child' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_g1_3',
    name: 'Meera Kumar',
    birthDate: '1975-06-30',
    gender: 'female',
    generation: 1,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/meera.jpg',
    bio: 'Artist and art teacher',
    occupation: 'Artist',
    birthPlace: 'Chennai, India',
    currentLocation: 'San Francisco, USA',
    relationships: [
      { memberId: 'mem_g1_1', type: 'spouse' },
      { memberId: 'mem_g2_1', type: 'child' },
      { memberId: 'mem_g2_2', type: 'child' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_g1_4',
    name: 'Vikram Sharma',
    birthDate: '1968-04-12',
    gender: 'male',
    generation: 1,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/vikram.jpg',
    bio: 'Investment banker',
    occupation: 'Banker',
    birthPlace: 'Delhi, India',
    currentLocation: 'Mumbai, India',
    relationships: [
      { memberId: 'mem_g1_2', type: 'spouse' },
      { memberId: 'mem_g2_3', type: 'child' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  
  // Generation 2 - Current generation
  {
    id: 'mem_g2_1',
    name: 'Arjun Kumar',
    birthDate: '1998-09-25',
    gender: 'male',
    generation: 2,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/arjun.jpg',
    bio: 'App creator, keeping family traditions alive through technology',
    occupation: 'Software Developer',
    birthPlace: 'San Francisco, USA',
    currentLocation: 'San Francisco, USA',
    relationships: [
      { memberId: 'mem_g1_1', type: 'parent' },
      { memberId: 'mem_g1_3', type: 'parent' },
      { memberId: 'mem_g2_2', type: 'sibling' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_g2_2',
    name: 'Ananya Kumar',
    birthDate: '2002-12-03',
    gender: 'female',
    generation: 2,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/ananya.jpg',
    bio: 'Medical student, following aunt Priya\'s footsteps',
    occupation: 'Student',
    birthPlace: 'San Francisco, USA',
    currentLocation: 'New York, USA',
    relationships: [
      { memberId: 'mem_g1_1', type: 'parent' },
      { memberId: 'mem_g1_3', type: 'parent' },
      { memberId: 'mem_g2_1', type: 'sibling' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_g2_3',
    name: 'Rohan Sharma',
    birthDate: '2000-07-18',
    gender: 'male',
    generation: 2,
    isAlive: true,
    avatarUrl: 'https://example.com/avatars/rohan.jpg',
    bio: 'Finance graduate, working at Goldman Sachs',
    occupation: 'Financial Analyst',
    birthPlace: 'Mumbai, India',
    currentLocation: 'London, UK',
    relationships: [
      { memberId: 'mem_g1_2', type: 'parent' },
      { memberId: 'mem_g1_4', type: 'parent' },
    ],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
];

// Memories fixture
export const memoriesFixture: TestMemory[] = [
  {
    id: 'memory_001',
    title: 'Diwali Celebration 2023',
    description: 'The whole family gathered at grandmother\'s house for Diwali. We lit diyas, shared sweets, and played cards till midnight.',
    type: 'photo',
    mediaUrl: 'https://example.com/memories/diwali2023.jpg',
    thumbnailUrl: 'https://example.com/memories/diwali2023_thumb.jpg',
    date: '2023-11-12',
    location: 'Hyderabad, India',
    taggedMembers: ['mem_g0_2', 'mem_g1_1', 'mem_g1_2', 'mem_g2_1', 'mem_g2_2'],
    createdBy: 'mem_g2_1',
    isPrivate: false,
    viewCount: 156,
    createdAt: '2023-11-13T10:00:00.000Z',
    updatedAt: '2023-11-13T10:00:00.000Z',
  },
  {
    id: 'memory_002',
    title: 'Grandfather\'s 75th Birthday',
    description: 'A surprise party for Thatha\'s 75th birthday. He was so moved seeing everyone together.',
    type: 'video',
    mediaUrl: 'https://example.com/memories/bday75.mp4',
    thumbnailUrl: 'https://example.com/memories/bday75_thumb.jpg',
    date: '2015-05-15',
    location: 'Hyderabad, India',
    taggedMembers: ['mem_g0_1', 'mem_g0_2', 'mem_g1_1', 'mem_g1_2'],
    createdBy: 'mem_g1_1',
    isPrivate: false,
    viewCount: 89,
    createdAt: '2015-05-16T08:00:00.000Z',
    updatedAt: '2015-05-16T08:00:00.000Z',
  },
  {
    id: 'memory_003',
    title: 'Grandmother\'s Biryani Recipe',
    description: 'Ammamma teaching her secret biryani recipe to the grandchildren',
    type: 'audio',
    mediaUrl: 'https://example.com/memories/biryani_recipe.m4a',
    thumbnailUrl: undefined,
    date: '2022-06-20',
    location: 'Hyderabad, India',
    taggedMembers: ['mem_g0_2', 'mem_g2_1', 'mem_g2_2'],
    createdBy: 'mem_g2_1',
    isPrivate: false,
    viewCount: 42,
    createdAt: '2022-06-21T14:00:00.000Z',
    updatedAt: '2022-06-21T14:00:00.000Z',
  },
  {
    id: 'memory_004',
    title: 'Family Wedding Album - Suresh & Meera',
    description: 'Complete wedding album from 1997',
    type: 'document',
    mediaUrl: 'https://example.com/memories/wedding_album.pdf',
    thumbnailUrl: 'https://example.com/memories/wedding_cover.jpg',
    date: '1997-02-22',
    location: 'Chennai, India',
    taggedMembers: ['mem_g0_1', 'mem_g0_2', 'mem_g1_1', 'mem_g1_3'],
    createdBy: 'mem_g1_1',
    isPrivate: false,
    viewCount: 234,
    createdAt: '2020-02-22T00:00:00.000Z',
    updatedAt: '2020-02-22T00:00:00.000Z',
  },
];

// Traditions fixture
export const traditionsFixture: TestTradition[] = [
  {
    id: 'trad_001',
    title: 'Sankranti Kite Festival',
    description: 'Every Makar Sankranti, our family gathers on the terrace to fly kites. Children and adults compete for the most kite cuts.',
    category: 'festival',
    frequency: 'yearly',
    origin: 'Started by grandfather in the 1960s when he was a young father',
    significance: 'Celebrates the harvest season and brings together all generations in friendly competition',
    mediaUrls: ['https://example.com/traditions/sankranti1.jpg', 'https://example.com/traditions/sankranti2.jpg'],
    associatedMembers: ['mem_g0_1', 'mem_g0_2', 'mem_g1_1', 'mem_g1_2'],
    nextOccurrence: '2025-01-14',
    createdBy: 'mem_g1_1',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'trad_002',
    title: 'Sunday Family Video Call',
    description: 'Every Sunday at 10 AM IST, the whole family joins a video call regardless of timezone',
    category: 'routine',
    frequency: 'weekly',
    origin: 'Started during COVID-19 lockdown in 2020 to stay connected',
    significance: 'Keeps the family connected across continents and timezones',
    mediaUrls: [],
    associatedMembers: familyTreeFixture.filter(m => m.isAlive).map(m => m.id),
    nextOccurrence: undefined,
    createdBy: 'mem_g2_1',
    createdAt: '2020-04-01T00:00:00.000Z',
    updatedAt: '2020-04-01T00:00:00.000Z',
  },
  {
    id: 'trad_003',
    title: 'Grandmother\'s Recipe Sunday',
    description: 'Once a month, grandmother teaches one traditional recipe via video call',
    category: 'culinary',
    frequency: 'monthly',
    origin: 'Idea from Arjun to preserve grandmother\'s cooking knowledge',
    significance: 'Preserves family recipes and cooking techniques for future generations',
    mediaUrls: ['https://example.com/traditions/cooking1.jpg'],
    associatedMembers: ['mem_g0_2', 'mem_g2_1', 'mem_g2_2'],
    nextOccurrence: undefined,
    createdBy: 'mem_g2_1',
    createdAt: '2022-01-15T00:00:00.000Z',
    updatedAt: '2022-01-15T00:00:00.000Z',
  },
];

// Vasiyat fixture
export const vasiyatFixture: TestVasiyat[] = [
  {
    id: 'vas_001',
    title: 'To My Grandchildren',
    type: 'message',
    content: 'My dear grandchildren, by the time you read this, I may no longer be with you physically, but my love for you is eternal. Always remember: family is the greatest wealth...',
    mediaUrl: undefined,
    scheduledDate: undefined,
    isSealed: true,
    canViewAfterDeath: true,
    recipients: ['mem_g2_1', 'mem_g2_2', 'mem_g2_3'],
    createdBy: 'mem_g0_2',
    createdAt: '2022-08-15T00:00:00.000Z',
    updatedAt: '2022-08-15T00:00:00.000Z',
  },
  {
    id: 'vas_002',
    title: 'Life Lessons Video',
    type: 'video',
    content: 'A video recording of life lessons and blessings',
    mediaUrl: 'https://example.com/vasiyat/lessons.mp4',
    scheduledDate: undefined,
    isSealed: true,
    canViewAfterDeath: true,
    recipients: ['mem_g1_1', 'mem_g1_2', 'mem_g2_1', 'mem_g2_2', 'mem_g2_3'],
    createdBy: 'mem_g0_2',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
];

// Search results fixture
export const searchResultsFixture = {
  query: 'grandmother',
  members: familyTreeFixture.filter(m => m.bio?.toLowerCase().includes('grandmother') || m.id === 'mem_g0_2'),
  memories: memoriesFixture.filter(m => m.title.toLowerCase().includes('grandmother') || m.description.toLowerCase().includes('grandmother')),
  traditions: traditionsFixture.filter(t => t.title.toLowerCase().includes('grandmother') || t.description.toLowerCase().includes('grandmother')),
};

// Empty state fixtures
export const emptyStateFixtures = {
  noMembers: [] as TestFamilyMember[],
  noMemories: [] as TestMemory[],
  noTraditions: [] as TestTradition[],
  noVasiyat: [] as TestVasiyat[],
  noSearchResults: { query: 'xyz123', members: [], memories: [], traditions: [] },
};

// Error state fixtures
export const errorStateFixtures = {
  networkError: new Error('Network request failed'),
  authError: new Error('Authentication required'),
  permissionError: new Error('You do not have permission to access this resource'),
  notFoundError: new Error('Resource not found'),
  validationError: new Error('Invalid input data'),
  serverError: new Error('Internal server error'),
};

// Fixture helpers
export const getRandomMember = (): TestFamilyMember =>
  familyTreeFixture[Math.floor(Math.random() * familyTreeFixture.length)];

export const getRandomMemory = (): TestMemory =>
  memoriesFixture[Math.floor(Math.random() * memoriesFixture.length)];

export const getMembersByGeneration = (generation: number): TestFamilyMember[] =>
  familyTreeFixture.filter(m => m.generation === generation);

export const getAliveMembers = (): TestFamilyMember[] =>
  familyTreeFixture.filter(m => m.isAlive);
