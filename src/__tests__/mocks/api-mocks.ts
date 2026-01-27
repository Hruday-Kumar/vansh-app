/**
 * API Mocks
 * Comprehensive mocking for API calls
 */

// Simplified test types to avoid branded type issues
interface TestMember {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  generation: number;
  isAlive: boolean;
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
  type: string;
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

// API Response Types
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};

// Mock family member factory
export const createMockMember = (overrides: Partial<TestMember> = {}): TestMember => ({
  id: `mem_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Member',
  birthDate: '1990-01-15',
  gender: 'male',
  generation: 1,
  isAlive: true,
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'A test family member',
  occupation: 'Engineer',
  birthPlace: 'Mumbai, India',
  currentLocation: 'San Francisco, USA',
  relationships: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock memory factory
export const createMockMemory = (overrides: Partial<TestMemory> = {}): TestMemory => ({
  id: `memory_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Memory',
  description: 'A wonderful family memory',
  type: 'photo',
  mediaUrl: 'https://example.com/photo.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  date: '2023-06-15',
  location: 'Family Home',
  taggedMembers: [],
  createdBy: 'mem_123',
  isPrivate: false,
  viewCount: 42,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock tradition factory
export const createMockTradition = (overrides: Partial<TestTradition> = {}): TestTradition => ({
  id: `trad_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Annual Family Gathering',
  description: 'Our yearly reunion celebration',
  category: 'celebration',
  frequency: 'yearly',
  origin: 'Grandparents started this tradition in 1960',
  significance: 'Keeps the family bonded across generations',
  mediaUrls: [],
  associatedMembers: [],
  nextOccurrence: '2025-12-25',
  createdBy: 'mem_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock vasiyat factory  
export const createMockVasiyat = (overrides: Partial<TestVasiyat> = {}): TestVasiyat => ({
  id: `vas_${Math.random().toString(36).substr(2, 9)}`,
  title: 'My Final Words',
  type: 'message',
  content: 'Dear family, remember to stay united...',
  mediaUrl: undefined,
  scheduledDate: undefined,
  isSealed: true,
  canViewAfterDeath: true,
  recipients: ['mem_456', 'mem_789'],
  createdBy: 'mem_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API Mock handlers
export const apiMocks = {
  // Family Members
  getMembers: jest.fn((): Promise<ApiResponse<TestMember[]>> => 
    Promise.resolve({
      success: true,
      data: [createMockMember(), createMockMember({ name: 'Second Member' })],
    })
  ),

  getMemberById: jest.fn((id: string): Promise<ApiResponse<TestMember>> =>
    Promise.resolve({
      success: true,
      data: createMockMember({ id }),
    })
  ),

  createMember: jest.fn((data: Partial<TestMember>): Promise<ApiResponse<TestMember>> =>
    Promise.resolve({
      success: true,
      data: createMockMember(data),
    })
  ),

  updateMember: jest.fn((id: string, data: Partial<TestMember>): Promise<ApiResponse<TestMember>> =>
    Promise.resolve({
      success: true,
      data: createMockMember({ id, ...data }),
    })
  ),

  deleteMember: jest.fn((id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    Promise.resolve({
      success: true,
      data: { deleted: true },
    })
  ),

  // Memories
  getMemories: jest.fn((): Promise<ApiResponse<TestMemory[]>> =>
    Promise.resolve({
      success: true,
      data: [createMockMemory(), createMockMemory({ title: 'Second Memory' })],
    })
  ),

  uploadMemory: jest.fn((): Promise<ApiResponse<TestMemory>> =>
    Promise.resolve({
      success: true,
      data: createMockMemory(),
    })
  ),

  // Traditions
  getTraditions: jest.fn((): Promise<ApiResponse<TestTradition[]>> =>
    Promise.resolve({
      success: true,
      data: [createMockTradition(), createMockTradition({ title: 'Second Tradition' })],
    })
  ),

  // Vasiyat
  getVasiyat: jest.fn((): Promise<ApiResponse<TestVasiyat[]>> =>
    Promise.resolve({
      success: true,
      data: [createMockVasiyat()],
    })
  ),

  // Search
  globalSearch: jest.fn((query: string): Promise<ApiResponse<{
    members: TestMember[];
    memories: TestMemory[];
    traditions: TestTradition[];
  }>> =>
    Promise.resolve({
      success: true,
      data: {
        members: query ? [createMockMember({ name: query })] : [],
        memories: query ? [createMockMemory({ title: query })] : [],
        traditions: query ? [createMockTradition({ title: query })] : [],
      },
    })
  ),

  // Auth
  authenticate: jest.fn((): Promise<ApiResponse<{ token: string; user: TestMember }>> =>
    Promise.resolve({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: createMockMember({ name: 'Current User' }),
      },
    })
  ),

  // Error simulation
  simulateError: jest.fn((errorMessage: string): Promise<never> =>
    Promise.reject(new Error(errorMessage))
  ),

  simulateNetworkError: jest.fn((): Promise<never> =>
    Promise.reject(new Error('Network request failed'))
  ),

  simulateTimeout: jest.fn((): Promise<never> =>
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    )
  ),
};

// Reset all mocks
export const resetApiMocks = (): void => {
  Object.values(apiMocks).forEach(mock => {
    if (typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });
};

// Setup default implementations
export const setupApiMocks = (): void => {
  apiMocks.getMembers.mockResolvedValue({
    success: true,
    data: [createMockMember(), createMockMember({ name: 'Second Member' })],
  });
  
  apiMocks.getMemories.mockResolvedValue({
    success: true,
    data: [createMockMemory(), createMockMemory({ title: 'Second Memory' })],
  });
  
  apiMocks.getTraditions.mockResolvedValue({
    success: true,
    data: [createMockTradition()],
  });
};
