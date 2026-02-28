/**
 * 🪷 VANSH API HOOKS
 * React hooks for data fetching and mutations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config/api';
import { api } from '../services/api';
import { useAuthStore, useFamilyStore, useKathaStore, useMemoryStore } from '../state';
import type { Katha, Vasiyat, VrikshaMember } from '../types';

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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('📡 Response status:', response.status);
      
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
              smaranNudge: true 
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
      
      const response = await fetch(`${API_URL}/auth/register`, {
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
              smaranNudge: true 
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
      const familyRes = await fetch(`${API_URL}/families`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
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
      const membersRes = await fetch(`${API_URL}/members`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      const membersData = await membersRes.json();
      
      if (membersData.success) {
        // Build a map of member data first
        const memberMap = new Map<string, any>();
        for (const m of membersData.data) {
          memberMap.set(m.id, {
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            maidenName: m.maidenName,
            gender: m.gender,
            birthDate: m.birthDate,
            birthPlace: m.birthPlace,
            deathDate: m.deathDate,
            isAlive: m.isAlive,
            avatarUri: m.avatarUri,
            bio: m.bio,
            occupation: m.occupation,
            currentCity: m.currentCity,
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
                const relRes = await fetch(`${API_URL}/members/${id}/relationships`, {
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
    } finally {
      setLoading(false);
    }
  }, [user?.familyId, setFamily, setMembers, setLoading, setError]);
  
  useEffect(() => {
    if (user?.familyId) {
      loadFamilyData();
    }
  }, [user?.familyId, loadFamilyData]);
  
  return { family, membersList, isLoading, error, refresh: loadFamilyData };
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
      const res = await fetch(`${API_URL}/memories`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
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
      const res = await fetch(`${API_URL}/memories/sync/check?since=${encodeURIComponent(since)}`, {
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
    
    const res = await fetch(`${API_URL}/memories`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
      body: formData
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
  
  // Poll for family sync every 60 seconds while screen is active.
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
      const res = await fetch(`${API_URL}/kathas`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
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
    
    const res = await fetch(`${API_URL}/kathas`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
      body: formData
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
      const createdRes = await fetch(`${API_URL}/vasiyats`, {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      const createdData = await createdRes.json();
      
      if (createdData.success) {
        setVasiyats(createdData.data);
      }
      
      // Load received vasiyats
      const receivedRes = await fetch(`${API_URL}/vasiyats?received=true`, {
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
    recipients: Array<{ memberId: string; relationshipLabel?: string }>;
    triggerType: string;
    triggerDate?: string;
    triggerEvent?: string;
    mood?: string;
  }) => {
    const res = await fetch(`${API_URL}/vasiyats`, {
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
    const res = await fetch(`${API_URL}/vasiyats/${vasiyatId}/unlock`, {
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
      const res = await fetch(`${API_URL}/families/${user.familyId}/traditions`, {
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
    
    const res = await fetch(`${API_URL}/families/${user.familyId}/traditions`, {
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
      const res = await fetch(`${API_URL}/members`, {
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
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          gender: memberData.gender,
          birthDate: memberData.birthDate,
          isAlive: memberData.isAlive !== false,
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
    const res = await fetch(`${API_URL}/members/${fromMemberId}/relationships`, {
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
