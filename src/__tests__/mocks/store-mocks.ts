/**
 * Store Mocks
 * Mock Zustand stores for testing
 */

import { create } from 'zustand';

// Mock user store state
interface MockUserState {
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: MockUserState['currentUser']) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const createMockUserStore = (initialState: Partial<MockUserState> = {}) =>
  create<MockUserState>((set) => ({
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
    clearUser: () => set({ currentUser: null, isAuthenticated: false }),
    setLoading: (isLoading) => set({ isLoading }),
    ...initialState,
  }));

// Mock family store state
interface MockFamilyState {
  members: Array<{ id: string; name: string; generation: number }>;
  selectedMemberId: string | null;
  isLoading: boolean;
  error: string | null;
  setMembers: (members: MockFamilyState['members']) => void;
  selectMember: (id: string | null) => void;
  addMember: (member: MockFamilyState['members'][0]) => void;
  removeMember: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const createMockFamilyStore = (initialState: Partial<MockFamilyState> = {}) =>
  create<MockFamilyState>((set) => ({
    members: [],
    selectedMemberId: null,
    isLoading: false,
    error: null,
    setMembers: (members) => set({ members }),
    selectMember: (id) => set({ selectedMemberId: id }),
    addMember: (member) => set((state) => ({ members: [...state.members, member] })),
    removeMember: (id) => set((state) => ({ members: state.members.filter(m => m.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    ...initialState,
  }));

// Mock memory store state
interface MockMemoryState {
  memories: Array<{
    id: string;
    title: string;
    type: 'photo' | 'video' | 'audio' | 'document';
    thumbnailUrl?: string;
  }>;
  isUploading: boolean;
  uploadProgress: number;
  setMemories: (memories: MockMemoryState['memories']) => void;
  addMemory: (memory: MockMemoryState['memories'][0]) => void;
  removeMemory: (id: string) => void;
  setUploadProgress: (progress: number) => void;
}

export const createMockMemoryStore = (initialState: Partial<MockMemoryState> = {}) =>
  create<MockMemoryState>((set) => ({
    memories: [],
    isUploading: false,
    uploadProgress: 0,
    setMemories: (memories) => set({ memories }),
    addMemory: (memory) => set((state) => ({ memories: [...state.memories, memory] })),
    removeMemory: (id) => set((state) => ({ memories: state.memories.filter(m => m.id !== id) })),
    setUploadProgress: (uploadProgress) => set({ 
      uploadProgress, 
      isUploading: uploadProgress > 0 && uploadProgress < 100 
    }),
    ...initialState,
  }));

// Mock app settings store
interface MockSettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi' | 'te';
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  setTheme: (theme: MockSettingsState['theme']) => void;
  setLanguage: (language: MockSettingsState['language']) => void;
  toggleNotifications: () => void;
  toggleBiometrics: () => void;
}

export const createMockSettingsStore = (initialState: Partial<MockSettingsState> = {}) =>
  create<MockSettingsState>((set) => ({
    theme: 'system',
    language: 'en',
    notificationsEnabled: true,
    biometricsEnabled: false,
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
    toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
    toggleBiometrics: () => set((state) => ({ biometricsEnabled: !state.biometricsEnabled })),
    ...initialState,
  }));

// Store reset utilities
export const mockStoreResetFns: Array<() => void> = [];

export const resetAllMockStores = (): void => {
  mockStoreResetFns.forEach((resetFn) => resetFn());
};

// Pre-configured stores for common test scenarios
export const mockStores = {
  authenticatedUser: createMockUserStore({
    currentUser: {
      id: 'user_123',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    isAuthenticated: true,
    isLoading: false,
  }),

  unauthenticatedUser: createMockUserStore({
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  loadingUser: createMockUserStore({
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
  }),

  familyWithMembers: createMockFamilyStore({
    members: [
      { id: 'mem_1', name: 'Grandfather', generation: 0 },
      { id: 'mem_2', name: 'Father', generation: 1 },
      { id: 'mem_3', name: 'Mother', generation: 1 },
      { id: 'mem_4', name: 'User', generation: 2 },
    ],
    selectedMemberId: null,
    isLoading: false,
    error: null,
  }),

  emptyFamily: createMockFamilyStore({
    members: [],
    selectedMemberId: null,
    isLoading: false,
    error: null,
  }),

  memoriesWithContent: createMockMemoryStore({
    memories: [
      { id: 'mem_1', title: 'Family Photo 2023', type: 'photo', thumbnailUrl: 'https://example.com/thumb1.jpg' },
      { id: 'mem_2', title: 'Wedding Video', type: 'video', thumbnailUrl: 'https://example.com/thumb2.jpg' },
      { id: 'mem_3', title: 'Grandfather\'s Story', type: 'audio' },
    ],
    isUploading: false,
    uploadProgress: 0,
  }),
};

// Zustand mock provider wrapper
export const createMockStoreWrapper = (stores: Record<string, any>) => {
  return ({ children }: { children: React.ReactNode }) => {
    // In real implementation, you'd use React context
    return children;
  };
};

import React from 'react';
