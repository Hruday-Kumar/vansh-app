/**
 * 🪷 VANSH API HOOKS
 * React hooks for data fetching and mutations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config/api';
import { useVrikshaStore } from '../features/vriksha';
import { api } from '../services/api';
import { useAuthStore, useEventStore, useFamilyStore, useKathaStore, useMemoryStore, useNimantranStore } from '../state';
import type { Katha, Nimantran, Vasiyat, VrikshaMember } from '../types';

// ─── Helpers ──────────────────────────────────────────────

/** Fetch with an AbortController timeout (default 8 s). Prevents indefinite loading when backend is down. */
function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 8000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() => clearTimeout(id));
}

// ═══════════════════════════════════════════════════════════
// AUTH HOOKS
// ═══════════════════════════════════════════════════════════

export function useAuth() {
  const { isAuthenticated, user, token, login: setAuth, logout: clearAuth } = useAuthStore();
  const { setFamily, setMembers } = useFamilyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Attempting login to:', `${API_URL}/auth/login`);
      
      // Call the login API directly with fetch since we need email/password
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        let message = `Login failed (${response.status})`;
        try { const parsed = JSON.parse(text); message = parsed.error?.message || message; } catch {}
        setError(message);
        return false;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        api.setToken(data.data.token);
        setAuth(
          {
            id: data.data.user.id as any,
            memberId: data.data.user.memberId as any,
            familyId: data.data.user.familyId,
            email: data.data.user.email || '',
            role: data.data.user.role,
            language: 'en',
            notifications: { 
              newMemory: true, 
              newKatha: true, 
              vasiyatUnlocked: true, 
              familyMilestone: true, 
              smaranNudge: true,
              nimantranReminder: true 
            },
            lastLogin: new Date().toISOString() as any,
            deviceTokens: [],
          },
          data.data.token
        );
        return true;
      } else {
        setError(data.error?.message || 'Login failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);
  
  const logout = useCallback(() => {
    api.setToken(null);
    clearAuth();
  }, [clearAuth]);
  
  const register = useCallback(async (
    email: string, 
    password: string, 
    familyName: string,
    surname: string,
    memberName: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📝 Attempting registration to:', `${API_URL}/auth/register`);
      
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          familyName,
          surname,
          memberName 
        }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        let message = `Registration failed (${response.status})`;
        try { const parsed = JSON.parse(text); message = parsed.error?.message || message; } catch {}
        setError(message);
        return false;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        api.setToken(data.data.token);
        setAuth(
          {
            id: data.data.user.id as any,
            memberId: data.data.user.memberId as any,
            familyId: data.data.user.familyId,
            email: data.data.user.email || '',
            role: data.data.user.role,
            language: 'en',
            notifications: { 
              newMemory: true, 
              newKatha: true, 
              vasiyatUnlocked: true, 
              familyMilestone: true, 
              smaranNudge: true,
              nimantranReminder: true 
            },
            lastLogin: new Date().toISOString() as any,
            deviceTokens: [],
          },
          data.data.token
        );
        return true;
      } else {
        setError(data.error?.message || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);
  
  // Auto-set token on app start if we have one
  useEffect(() => {
    if (token) {
      api.setToken(token);
    }
  }, [token]);
  
  return { isAuthenticated, user, isLoading, error, login, logout, register };
}

// ═══════════════════════════════════════════════════════════
// FAMILY HOOKS
// ═══════════════════════════════════════════════════════════

export function useFamilyData() {
  const { user } = useAuthStore();
  const { family, membersList, setFamily, setMembers, isLoading, setLoading, error, setError } = useFamilyStore();
  
  const loadFamilyData = useCallback(async () => {
    if (!user?.familyId) return;
    
    setLoading(true);
    try {
      // Load family info
      const familyRes = await fetchWithTimeout(`${API_URL}/families`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (!familyRes.ok) throw new Error(`Family fetch failed (${familyRes.status})`);
      const familyData = await familyRes.json();
      
      if (familyData.success) {
        setFamily({
          id: familyData.data.id,
          name: familyData.data.name,
          surname: familyData.data.surname,
          createdAt: familyData.data.createdAt,
        } as any);
      }
      
      // Load members
      const membersRes = await fetchWithTimeout(`${API_URL}/members`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (!membersRes.ok) throw new Error(`Members fetch failed (${membersRes.status})`);
      const membersData = await membersRes.json();
      
      if (membersData.success) {
        // Build a map of member data first
        const memberMap = new Map<string, any>();
        for (const m of membersData.data) {
          memberMap.set(m.id, {
            id: m.id,
            familyId: user?.familyId || '',
            firstName: m.firstName,
            lastName: m.lastName,
            maidenName: m.maidenName,
            nicknames: m.nicknames || [],
            gender: m.gender,
            birthDate: m.birthDate,
            birthPlace: m.birthPlace,
            deathDate: m.deathDate,
            isAlive: m.isAlive,
            avatarUri: m.avatarUri,
            bio: m.bio,
            occupation: m.occupation,
            currentCity: m.currentCity,
            memoryCount: m.memoryCount || 0,
            kathaCount: m.kathaCount || 0,
            relationships: [],
          });
        }
        
        // Load all relationships in one batch call per member (limit concurrency to 3)
        const memberIds = membersData.data.map((m: any) => m.id);
        const batchSize = 3;
        for (let i = 0; i < memberIds.length; i += batchSize) {
          const batch = memberIds.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (id: string) => {
              try {
                const relRes = await fetchWithTimeout(`${API_URL}/members/${id}/relationships`, {
                  headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
                });
                const relData = await relRes.json();
                return { id, data: relData };
              } catch {
                return { id, data: { success: false, data: [] } };
              }
            })
          );
          for (const { id, data: relData } of results) {
            const member = memberMap.get(id);
            if (member && relData.success) {
              member.relationships = relData.data.map((r: any) => {
                const relatedMemberId = r.fromMember?.id === id ? r.toMember?.id : r.fromMember?.id;
                return {
                  type: r.type,
                  memberId: relatedMemberId,
                  prana: { strength: r.pranaStrength || 0, sharedMemories: [], sharedKathas: [], pulseIntensity: 0, glowColor: '#6366F1' }
                };
              }).filter((r: any) => r.memberId);
            }
          }
        }
        
        setMembers(Array.from(memberMap.values()));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family data');
      // Fallback: sync from Vriksha (local family tree) store if API fails
      syncFromVriksha(setMembers);
    } finally {
      setLoading(false);
    }
  }, [user?.familyId, setFamily, setMembers, setLoading, setError]);
  
  useEffect(() => {
    if (user?.familyId) {
      loadFamilyData();
    }
  }, [user?.familyId, loadFamilyData]);

  // If membersList is still empty after initial load, sync from Vriksha store
  useEffect(() => {
    if (!isLoading && membersList.length === 0) {
      syncFromVriksha(setMembers);
    }
  }, [isLoading, membersList.length, setMembers]);
  
  return { family, membersList, isLoading, error, refresh: loadFamilyData };
}

/**
 * Sync members from the local Vriksha (family tree) store into useFamilyStore.
 * This ensures features like memory tagging, invitations, and wisdom
 * can see the same members that exist in the family tree when the API is unavailable.
 */
function syncFromVriksha(setMembers: (members: VrikshaMember[]) => void) {
  const vrikshaMembers = useVrikshaStore.getState().members;
  if (vrikshaMembers.size === 0) return;

  const mapped: VrikshaMember[] = Array.from(vrikshaMembers.values()).map((m) => ({
    id: m.id as any,
    familyId: (m.familyId || '') as any,
    firstName: m.firstName,
    lastName: m.lastName,
    maidenName: m.maidenName,
    nicknames: m.nicknames || [],
    gender: m.gender as any,
    birthDate: m.birthDate as any,
    birthPlace: m.birthPlace,
    deathDate: m.deathDate as any,
    isAlive: m.isAlive,
    avatarUri: m.avatarUri,
    bio: m.bio,
    currentCity: m.currentCity,
    occupation: m.occupation,
    relationships: [],
    memoryCount: m.memoryCount || 0,
    kathaCount: m.kathaCount || 0,
    hasVoiceSamples: m.hasVoiceSamples || false,
  }));
  setMembers(mapped);
}

// ═══════════════════════════════════════════════════════════
// MEMORY HOOKS
// ═══════════════════════════════════════════════════════════

export function useMemories() {
  const { recentMemories, setMemories, addMemory } = useMemoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<{
    totalMemories: number;
    contributors: number;
    lastSyncAt: string | null;
  }>({ totalMemories: 0, contributors: 0, lastSyncAt: null });

  // Ref keeps the latest lastSyncAt accessible inside the stable interval callback
  const lastSyncAtRef = useRef<string | null>(null);
  
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/memories`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (!res.ok) throw new Error(`Memories fetch failed (${res.status})`);
      const data = await res.json();
      
      if (data.success) {
        setMemories(data.data);
        setSyncInfo(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, [setMemories]);
  
  // Keep the ref in sync with state so the stable interval callback reads latest value
  useEffect(() => {
    lastSyncAtRef.current = syncInfo.lastSyncAt;
  }, [syncInfo.lastSyncAt]);

  // Check for new family memories (lightweight polling)
  // Only depends on loadMemories (stable) — reads lastSyncAt via ref to avoid
  // re-creating the interval every time syncInfo changes.
  const checkFamilySync = useCallback(async () => {
    try {
      const since = lastSyncAtRef.current || new Date(0).toISOString();
      const res = await fetchWithTimeout(`${API_URL}/memories/sync/check?since=${encodeURIComponent(since)}`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (!res.ok) return; // e.g. rate limit hit — skip silently
      const data = await res.json();

      if (data.success && data.data) {
        setSyncInfo(prev => ({
          ...prev,
          totalMemories: data.data.totalMemories,
          contributors: data.data.contributors,
        }));

        // Auto-refresh only when family has genuinely added new memories
        if (data.data.hasNewMemories && data.data.newCount > 0) {
          await loadMemories();
        }
      }
    } catch {
      // Silently fail sync check — not critical
    }
  }, [loadMemories]); // stable — does NOT depend on syncInfo
  
  const uploadMemory = useCallback(async (
    file: Blob,
    metadata: { title?: string; description?: string; taggedMembers?: string[] }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.taggedMembers) formData.append('taggedMembers', JSON.stringify(metadata.taggedMembers));
    
    const res = await fetchWithTimeout(`${API_URL}/memories`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
      body: formData,
      timeout: 30000,
    });
    const data = await res.json();
    
    if (data.success) {
      loadMemories(); // Refresh list for all family members on next sync
      return data.data;
    }
    throw new Error(data.error?.message || 'Upload failed');
  }, [loadMemories]);
  
  // Initial load
  useEffect(() => {
    loadMemories();
  }, [loadMemories]);
  
  // Poll for family sync every 5 minutes while screen is active.
  // checkFamilySync is now stable so this effect runs exactly once.
  useEffect(() => {
    const interval = setInterval(checkFamilySync, 300_000); // 5 minutes
    return () => clearInterval(interval);
  }, [checkFamilySync]);
  
  return {
    memories: recentMemories,
    isLoading,
    error,
    refresh: loadMemories,
    uploadMemory,
    syncInfo,
    checkFamilySync,
  };
}

// ═══════════════════════════════════════════════════════════
// KATHA HOOKS
// ═══════════════════════════════════════════════════════════

export function useKathas() {
  const { recentKathas, setKathas, addKatha } = useKathaStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadKathas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/kathas`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (!res.ok) throw new Error(`Kathas fetch failed (${res.status})`);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Merge API kathas with local ones (keep locally recorded kathas)
        const apiKathas: Katha[] = data.data;
        const localKathas = useKathaStore.getState().recentKathas.filter(
          (local) => !apiKathas.some((api) => api.id === local.id)
        );
        setKathas([...apiKathas, ...localKathas]);
      }
    } catch (err) {
      // Silently fail - local kathas persist via store
      setError(err instanceof Error ? err.message : 'Failed to load kathas');
    } finally {
      setIsLoading(false);
    }
  }, [setKathas]);
  
  const uploadKatha = useCallback(async (
    audioBlob: Blob,
    metadata: { title?: string; narratorId?: string; type?: string }
  ) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.narratorId) formData.append('narratorId', metadata.narratorId);
    if (metadata.type) formData.append('type', metadata.type);
    
    const res = await fetchWithTimeout(`${API_URL}/kathas`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
      body: formData,
      timeout: 30000,
    });
    const data = await res.json();
    
    if (data.success) {
      loadKathas(); // Refresh list
      return data.data;
    }
    throw new Error(data.error?.message || 'Upload failed');
  }, [loadKathas]);
  
  useEffect(() => {
    loadKathas();
  }, [loadKathas]);
  
  return { kathas: recentKathas, isLoading, error, refresh: loadKathas, uploadKatha };
}

// ═══════════════════════════════════════════════════════════
// EVENT HOOKS (Family Album Folders)
// ═══════════════════════════════════════════════════════════

export function useEvents() {
  const { events, setEvents, addEvent, removeEvent, setLoading } = useEventStore();
  const [isLoading, setIsLoadingLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoadingLocal(true);
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/events`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
      });
      if (!res.ok) throw new Error(`Events fetch failed (${res.status})`);
      const data = await res.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoadingLocal(false);
      setLoading(false);
    }
  }, [setEvents, setLoading]);

  const createEvent = useCallback(async (eventData: {
    name: string;
    description?: string;
    eventType?: string;
    eventDate?: string;
    eventEndDate?: string;
    location?: string;
    coverMemoryId?: string;
    memoryIds?: string[];
  }) => {
    const res = await fetchWithTimeout(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    const data = await res.json();

    if (data.success) {
      // Refresh full list to get formatted data with cover URI etc.
      await loadEvents();
      return data.data;
    }
    throw new Error(data.error?.message || 'Create event failed');
  }, [loadEvents]);

  const updateEvent = useCallback(async (eventId: string, updates: Record<string, any>) => {
    const res = await fetchWithTimeout(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();

    if (data.success) {
      await loadEvents();
      return data.data;
    }
    throw new Error(data.error?.message || 'Update event failed');
  }, [loadEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    const res = await fetchWithTimeout(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
    });
    const data = await res.json();

    if (data.success) {
      removeEvent(eventId as any);
      return true;
    }
    throw new Error(data.error?.message || 'Delete event failed');
  }, [removeEvent]);

  const addMemoriesToEvent = useCallback(async (eventId: string, memoryIds: string[]) => {
    const res = await fetchWithTimeout(`${API_URL}/events/${eventId}/memories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memoryIds }),
    });
    const data = await res.json();

    if (data.success) {
      await loadEvents(); // Refresh counts
      return data.data;
    }
    throw new Error(data.error?.message || 'Add memories failed');
  }, [loadEvents]);

  const loadEventMemories = useCallback(async (eventId: string, filters?: { type?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.page) params.set('page', filters.page.toString());

    const res = await fetchWithTimeout(`${API_URL}/events/${eventId}/memories?${params}`, {
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
    });
    const data = await res.json();

    if (data.success) {
      return { memories: data.data, meta: data.meta };
    }
    throw new Error(data.error?.message || 'Load event memories failed');
  }, []);

  const removeMemoryFromEvent = useCallback(async (eventId: string, memoryId: string) => {
    const res = await fetchWithTimeout(`${API_URL}/events/${eventId}/memories/${memoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
    });
    const data = await res.json();

    if (data.success) {
      await loadEvents();
      return true;
    }
    throw new Error(data.error?.message || 'Remove memory failed');
  }, [loadEvents]);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    isLoading,
    error,
    refresh: loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    addMemoriesToEvent,
    loadEventMemories,
    removeMemoryFromEvent,
  };
}

// ═══════════════════════════════════════════════════════════
// VASIYAT HOOKS
// ═══════════════════════════════════════════════════════════

export function useVasiyats() {
  const [vasiyats, setVasiyats] = useState<Vasiyat[]>([]);
  const [receivedVasiyats, setReceivedVasiyats] = useState<Vasiyat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadVasiyats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load created vasiyats
      const createdRes = await fetchWithTimeout(`${API_URL}/vasiyats`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      const createdData = await createdRes.json();
      
      if (createdData.success) {
        setVasiyats(createdData.data);
      }
      
      // Load received vasiyats
      const receivedRes = await fetchWithTimeout(`${API_URL}/vasiyats?received=true`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      const receivedData = await receivedRes.json();
      
      if (receivedData.success) {
        setReceivedVasiyats(receivedData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vasiyats');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createVasiyat = useCallback(async (vasiyatData: {
    title: string;
    contentText: string;
    recipients: { memberId: string; relationshipLabel?: string }[];
    triggerType: string;
    triggerDate?: string;
    triggerEvent?: string;
    mood?: string;
  }) => {
    const res = await fetchWithTimeout(`${API_URL}/vasiyats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vasiyatData)
    });
    const data = await res.json();
    
    if (data.success) {
      loadVasiyats();
      return data.data;
    }
    throw new Error(data.error?.message || 'Create failed');
  }, [loadVasiyats]);
  
  const unlockVasiyat = useCallback(async (vasiyatId: string) => {
    const res = await fetchWithTimeout(`${API_URL}/vasiyats/${vasiyatId}/unlock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
    });
    const data = await res.json();
    
    if (data.success) {
      loadVasiyats();
      return true;
    }
    throw new Error(data.error?.message || 'Unlock failed');
  }, [loadVasiyats]);
  
  useEffect(() => {
    loadVasiyats();
  }, [loadVasiyats]);
  
  return {
    vasiyats,
    receivedVasiyats,
    isLoading,
    error,
    refresh: loadVasiyats,
    createVasiyat,
    unlockVasiyat
  };
}

// ═══════════════════════════════════════════════════════════
// TRADITION HOOKS
// ═══════════════════════════════════════════════════════════

export function useTraditions() {
  const [traditions, setTraditions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  
  const loadTraditions = useCallback(async () => {
    if (!user?.familyId) return;
    
    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/families/${user.familyId}/traditions`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setTraditions(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traditions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.familyId]);
  
  const createTradition = useCallback(async (traditionData: {
    name: string;
    description?: string;
    category?: string;
    frequency?: string;
    dateOrOccasion?: string;
  }) => {
    if (!user?.familyId) return;
    
    const res = await fetchWithTimeout(`${API_URL}/families/${user.familyId}/traditions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(traditionData)
    });
    const data = await res.json();
    
    if (data.success) {
      loadTraditions();
      return data.data;
    }
    throw new Error(data.error?.message || 'Create failed');
  }, [user?.familyId, loadTraditions]);
  
  useEffect(() => {
    loadTraditions();
  }, [loadTraditions]);
  
  return { traditions, isLoading, error, refresh: loadTraditions, createTradition };
}

// ═══════════════════════════════════════════════════════════
// MEMBER HOOKS
// ═══════════════════════════════════════════════════════════

export function useAddMember() {
  const { addMember } = useFamilyStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const createMember = useCallback(async (memberData: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    birthDate?: string;
    birthPlace?: string;
    bio?: string;
    isAlive?: boolean;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      });
      const data = await res.json();
      
      if (data.success) {
        addMember({
          id: data.data.id,
          familyId: useAuthStore.getState().user?.familyId || '',
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          nicknames: [],
          gender: memberData.gender,
          birthDate: memberData.birthDate,
          isAlive: memberData.isAlive !== false,
          memoryCount: 0,
          kathaCount: 0,
          hasVoiceSamples: false,
          relationships: [],
        } as VrikshaMember);
        return data.data;
      }
      throw new Error(data.error?.message || 'Create failed');
    } finally {
      setIsLoading(false);
    }
  }, [addMember]);
  
  const addRelationship = useCallback(async (
    fromMemberId: string,
    toMemberId: string,
    relationshipType: string
  ) => {
    const res = await fetchWithTimeout(`${API_URL}/members/${fromMemberId}/relationships`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ toMemberId, relationshipType })
    });
    const data = await res.json();
    
    if (data.success) {
      // Update local state immediately so tree re-renders with relationships
      const { membersList, setMembers } = useFamilyStore.getState();
      const updatedMembers = membersList.map(m => {
        if (m.id === fromMemberId) {
          const existingRels = m.relationships || [];
          return {
            ...m,
            relationships: [...existingRels, { 
              type: relationshipType as any,
              memberId: toMemberId,
              prana: {
                strength: 0,
                sharedMemories: [],
                sharedKathas: [],
                pulseIntensity: 0,
                glowColor: '#6366F1',
              }
            }]
          };
        }
        return m;
      });
      setMembers(updatedMembers as any);
    }
    
    return data.success;
  }, []);
  
  return { createMember, addRelationship, isLoading };
}

// ═══════════════════════════════════════════════════════════
// NIMANTRAN (INVITATION) HOOKS
// ═══════════════════════════════════════════════════════════

export function useInvitations() {
  const { invitations, setInvitations, addInvitation, removeInvitation } = useNimantranStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadInvitations = useCallback(async () => {
    if (!user?.familyId) return;

    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/families/${user.familyId}/invitations`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      const data = await res.json();

      if (data.success) {
        setInvitations(data.data);
      }
    } catch (err) {
      // API may not exist yet - use local store data
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.familyId, setInvitations]);

  const createInvitation = useCallback(async (invitationData: {
    title: string;
    description?: string;
    ceremonyType: string;
    venue: string;
    venueAddress?: string;
    eventDate: string;
    eventTime?: string;
    mediaType: string;
    cardUri?: string;
    videoUri?: string;
    recipientIds: string[];
    reminders: any[];
    dressCode?: string;
    specialInstructions?: string;
    contactPhone?: string;
  }) => {
    if (!user?.familyId || !user?.memberId) return;

    setIsLoading(true);
    try {
      // Try API first
      const res = await fetchWithTimeout(`${API_URL}/families/${user.familyId}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      });
      const data = await res.json();

      if (data.success) {
        addInvitation(data.data);
        return data.data;
      }
      throw new Error(data.error?.message || 'Create failed');
    } catch (err) {
      // Fallback: create locally
      const localInvitation: Nimantran = {
        id: `inv_${Date.now()}` as any,
        familyId: user.familyId,
        title: invitationData.title,
        description: invitationData.description,
        ceremonyType: invitationData.ceremonyType as any,
        venue: invitationData.venue,
        venueAddress: invitationData.venueAddress,
        eventDate: invitationData.eventDate,
        eventTime: invitationData.eventTime,
        mediaType: invitationData.mediaType as any,
        cardUri: invitationData.cardUri,
        videoUri: invitationData.videoUri,
        createdBy: user.memberId,
        createdAt: Date.now(),
        status: 'sent',
        sentAt: Date.now(),
        recipients: invitationData.recipientIds.map((mid) => ({
          memberId: mid as any,
          rsvpStatus: 'pending' as const,
          viewed: false,
        })),
        reminders: invitationData.reminders || [],
        dressCode: invitationData.dressCode,
        specialInstructions: invitationData.specialInstructions,
        contactPhone: invitationData.contactPhone,
      };
      addInvitation(localInvitation);
      return localInvitation;
    } finally {
      setIsLoading(false);
    }
  }, [user?.familyId, user?.memberId, addInvitation]);

  const deleteInvitation = useCallback(async (id: string) => {
    try {
      await fetchWithTimeout(`${API_URL}/families/${user?.familyId}/invitations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
    } catch {
      // Remove locally regardless
    }
    removeInvitation(id as any);
  }, [user?.familyId, removeInvitation]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return { invitations, isLoading, error, refresh: loadInvitations, createInvitation, deleteInvitation };
}
