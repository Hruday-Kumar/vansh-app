/**
 * 🪷 VANSH GLOBAL STATE - Zustand Stores
 * The living data layer for Digital Sanskriti
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import type {
    Era,
    Katha,
    KathaId,
    MemberId, MemoryId,
    SmritiMedia,
    TimeRiverItem,
    VanshFamily, VanshUser, VrikshaMember
} from '../types';

// ═══════════════════════════════════════════════════════════
// SECURE STORAGE ADAPTER FOR ZUSTAND
// ═══════════════════════════════════════════════════════════

/**
 * Secure storage adapter that uses expo-secure-store on native
 * and falls back to AsyncStorage on web
 */
const secureZustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(name);
    }
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

// ═══════════════════════════════════════════════════════════
// AUTH STORE (SECURE)
// ═══════════════════════════════════════════════════════════

interface AuthState {
  isAuthenticated: boolean;
  user: VanshUser | null;
  token: string | null;
  biometricEnabled: boolean;
  
  // Actions
  login: (user: VanshUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<VanshUser>) => void;
  setBiometricEnabled: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      biometricEnabled: false,
      
      login: (user, token) => set({ isAuthenticated: true, user, token }),
      logout: () => set({ isAuthenticated: false, user: null, token: null }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
    }),
    {
      name: 'vansh-auth-secure',
      storage: createJSONStorage(() => secureZustandStorage),
    }
  )
);

// ═══════════════════════════════════════════════════════════
// FAMILY STORE
// ═══════════════════════════════════════════════════════════

interface FamilyState {
  family: VanshFamily | null;
  members: Map<MemberId, VrikshaMember>;
  membersList: VrikshaMember[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFamily: (family: VanshFamily) => void;
  setMembers: (members: VrikshaMember[]) => void;
  addMember: (member: VrikshaMember) => void;
  updateMember: (id: MemberId, updates: Partial<VrikshaMember>) => void;
  getMember: (id: MemberId) => VrikshaMember | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFamilyStore = create<FamilyState>()((set, get) => ({
  family: null,
  members: new Map(),
  membersList: [],
  isLoading: false,
  error: null,
  
  setFamily: (family) => set({ family }),
  
  setMembers: (members) => {
    const membersMap = new Map<MemberId, VrikshaMember>();
    members.forEach((m) => membersMap.set(m.id, m));
    set({ members: membersMap, membersList: members });
  },
  
  addMember: (member) => set((state) => {
    const newMap = new Map(state.members);
    newMap.set(member.id, member);
    return { members: newMap, membersList: [...state.membersList, member] };
  }),
  
  updateMember: (id, updates) => set((state) => {
    const existing = state.members.get(id);
    if (!existing) return state;
    
    const updated = { ...existing, ...updates };
    const newMap = new Map(state.members);
    newMap.set(id, updated);
    
    return {
      members: newMap,
      membersList: state.membersList.map((m) => (m.id === id ? updated : m)),
    };
  }),
  
  getMember: (id) => get().members.get(id),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// ═══════════════════════════════════════════════════════════
// MEMORY STORE (Smriti)
// ═══════════════════════════════════════════════════════════

interface MemoryState {
  memories: Map<MemoryId, SmritiMedia>;
  recentMemories: SmritiMedia[];
  selectedMemory: SmritiMedia | null;
  
  // Filters
  filters: {
    memberIds: MemberId[];
    types: SmritiMedia['type'][];
    tags: string[];
    era: Era | null;
    dateRange: { from: string; to: string } | null;
  };
  
  // Upload state
  uploadQueue: Array<{ id: string; progress: number; file: Blob }>;
  isUploading: boolean;
  
  // Actions
  setMemories: (memories: SmritiMedia[]) => void;
  addMemory: (memory: SmritiMedia) => void;
  updateMemory: (id: MemoryId, updates: Partial<SmritiMedia>) => void;
  selectMemory: (memory: SmritiMedia | null) => void;
  setFilters: (filters: Partial<MemoryState['filters']>) => void;
  clearFilters: () => void;
  addToUploadQueue: (file: Blob) => string;
  updateUploadProgress: (id: string, progress: number) => void;
  removeFromUploadQueue: (id: string) => void;
}

export const useMemoryStore = create<MemoryState>()((set, get) => ({
  memories: new Map(),
  recentMemories: [],
  selectedMemory: null,
  
  filters: {
    memberIds: [],
    types: [],
    tags: [],
    era: null,
    dateRange: null,
  },
  
  uploadQueue: [],
  isUploading: false,
  
  setMemories: (memories) => {
    const memoriesMap = new Map<MemoryId, SmritiMedia>();
    memories.forEach((m) => memoriesMap.set(m.id, m));
    set({ memories: memoriesMap, recentMemories: memories.slice(0, 20) });
  },
  
  addMemory: (memory) => set((state) => {
    const newMap = new Map(state.memories);
    newMap.set(memory.id, memory);
    return {
      memories: newMap,
      recentMemories: [memory, ...state.recentMemories].slice(0, 20),
    };
  }),
  
  updateMemory: (id, updates) => set((state) => {
    const existing = state.memories.get(id);
    if (!existing) return state;
    
    const updated = { ...existing, ...updates };
    const newMap = new Map(state.memories);
    newMap.set(id, updated);
    
    return { memories: newMap };
  }),
  
  selectMemory: (memory) => set({ selectedMemory: memory }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  
  clearFilters: () => set({
    filters: { memberIds: [], types: [], tags: [], era: null, dateRange: null },
  }),
  
  addToUploadQueue: (file) => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      uploadQueue: [...state.uploadQueue, { id, progress: 0, file }],
      isUploading: true,
    }));
    return id;
  },
  
  updateUploadProgress: (id, progress) => set((state) => ({
    uploadQueue: state.uploadQueue.map((item) =>
      item.id === id ? { ...item, progress } : item
    ),
  })),
  
  removeFromUploadQueue: (id) => set((state) => {
    const newQueue = state.uploadQueue.filter((item) => item.id !== id);
    return { uploadQueue: newQueue, isUploading: newQueue.length > 0 };
  }),
}));

// ═══════════════════════════════════════════════════════════
// KATHA STORE (Voice)
// ═══════════════════════════════════════════════════════════

interface KathaState {
  kathas: Map<KathaId, Katha>;
  recentKathas: Katha[];
  selectedKatha: Katha | null;
  
  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  recordingWaveform: number[];
  
  // Playback state
  isPlaying: boolean;
  playbackKathaId: KathaId | null;
  playbackPosition: number;
  
  // Actions
  setKathas: (kathas: Katha[]) => void;
  addKatha: (katha: Katha) => void;
  selectKatha: (katha: Katha | null) => void;
  startRecording: () => void;
  stopRecording: () => void;
  updateRecording: (duration: number, waveform: number[]) => void;
  play: (kathaId: KathaId) => void;
  pause: () => void;
  seek: (position: number) => void;
}

export const useKathaStore = create<KathaState>()((set) => ({
  kathas: new Map(),
  recentKathas: [],
  selectedKatha: null,
  
  isRecording: false,
  recordingDuration: 0,
  recordingWaveform: [],
  
  isPlaying: false,
  playbackKathaId: null,
  playbackPosition: 0,
  
  setKathas: (kathas) => {
    const kathasMap = new Map<KathaId, Katha>();
    kathas.forEach((k) => kathasMap.set(k.id, k));
    set({ kathas: kathasMap, recentKathas: kathas.slice(0, 10) });
  },
  
  addKatha: (katha) => set((state) => {
    const newMap = new Map(state.kathas);
    newMap.set(katha.id, katha);
    return {
      kathas: newMap,
      recentKathas: [katha, ...state.recentKathas].slice(0, 10),
    };
  }),
  
  selectKatha: (katha) => set({ selectedKatha: katha }),
  
  startRecording: () => set({
    isRecording: true,
    recordingDuration: 0,
    recordingWaveform: [],
  }),
  
  stopRecording: () => set({ isRecording: false }),
  
  updateRecording: (duration, waveform) => set({
    recordingDuration: duration,
    recordingWaveform: waveform,
  }),
  
  play: (kathaId) => set({
    isPlaying: true,
    playbackKathaId: kathaId,
  }),
  
  pause: () => set({ isPlaying: false }),
  
  seek: (position) => set({ playbackPosition: position }),
}));

// ═══════════════════════════════════════════════════════════
// TIME-RIVER STORE (Main Feed)
// ═══════════════════════════════════════════════════════════

interface TimeRiverState {
  items: TimeRiverItem[];
  eras: Era[];
  currentEra: Era | null;
  
  // Scroll state
  scrollPosition: number;
  visibleDateRange: { start: string; end: string } | null;
  
  // Ambient
  ambientSoundUrl: string | null;
  isAmbientPlaying: boolean;
  
  // Loading
  isLoading: boolean;
  hasMore: boolean;
  cursor: string | null;
  
  // Actions
  setItems: (items: TimeRiverItem[]) => void;
  appendItems: (items: TimeRiverItem[]) => void;
  setEras: (eras: Era[]) => void;
  setCurrentEra: (era: Era) => void;
  setScrollPosition: (position: number) => void;
  setAmbient: (url: string | null) => void;
  toggleAmbient: () => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCursor: (cursor: string | null) => void;
}

export const useTimeRiverStore = create<TimeRiverState>()((set) => ({
  items: [],
  eras: [],
  currentEra: null,
  
  scrollPosition: 0,
  visibleDateRange: null,
  
  ambientSoundUrl: null,
  isAmbientPlaying: false,
  
  isLoading: false,
  hasMore: true,
  cursor: null,
  
  setItems: (items) => set({ items }),
  appendItems: (newItems) => set((state) => ({ items: [...state.items, ...newItems] })),
  setEras: (eras) => set({ eras }),
  setCurrentEra: (era) => set({ currentEra: era }),
  setScrollPosition: (position) => set({ scrollPosition: position }),
  setAmbient: (url) => set({ ambientSoundUrl: url }),
  toggleAmbient: () => set((state) => ({ isAmbientPlaying: !state.isAmbientPlaying })),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setCursor: (cursor) => set({ cursor }),
}));

// ═══════════════════════════════════════════════════════════
// UI STATE STORE
// ═══════════════════════════════════════════════════════════

type ModalType = 
  | 'memory-viewer'
  | 'katha-player'
  | 'member-profile'
  | 'vasiyat-create'
  | 'vasiyat-view'
  | 'upload'
  | 'record';

interface UIState {
  // Modal state
  activeModal: ModalType | null;
  modalData: Record<string, unknown>;
  
  // Navigation
  currentTab: 'home' | 'smriti' | 'katha' | 'vriksha' | 'vasiyat';
  
  // Theme
  colorScheme: 'light' | 'dark' | 'system';
  
  // Actions
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setCurrentTab: (tab: UIState['currentTab']) => void;
  setColorScheme: (scheme: UIState['colorScheme']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeModal: null,
      modalData: {},
      currentTab: 'home',
      colorScheme: 'system',
      
      openModal: (type, data = {}) => set({ activeModal: type, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: {} }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    {
      name: 'vansh-ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ colorScheme: state.colorScheme }),
    }
  )
);
