/**
 * 🌳 VRIKSHA STORE - Local-First Family Tree State
 * ═══════════════════════════════════════════════════════════
 * 
 * A completely offline-first family tree store that:
 * ✓ Stores all data locally using AsyncStorage
 * ✓ Uses graph-based adjacency list for relationships
 * ✓ Computes derived relationships via LCA algorithm
 * ✓ Supports CRUD operations with automatic bidirectional linking
 * ✓ NO BACKEND DEPENDENCY - works completely offline!
 * 
 * PHILOSOPHY: "The tree grows from within, rooted in local soil"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FamilyId, Gender, MemberId, Relationship, VrikshaMember } from '../../types';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type BasicRelationType = 'parent' | 'child' | 'spouse' | 'sibling';

export interface StoredRelation {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: BasicRelationType;
  subtype?: string; // Detailed type like 'father', 'mother', etc.
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentCity?: string;
  isAlive: boolean;
  avatarUri?: string;
  bio?: string;
  occupation?: string;
  nicknames?: string[];
  // Computed stats
  memoryCount: number;
  kathaCount: number;
  hasVoiceSamples: boolean;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface VrikshaState {
  // Core data
  members: Map<string, FamilyMember>;
  relations: StoredRelation[];
  rootMemberId: string | null;
  
  // Computed (not persisted)
  membersList: FamilyMember[];
  membersWithRelationships: VrikshaMember[];
  
  // UI State
  selectedMemberId: string | null;
  highlightedPath: string[];
  isLoading: boolean;
  
  // ═══════════ MEMBER CRUD ═══════════
  addMember: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt' | 'memoryCount' | 'kathaCount' | 'hasVoiceSamples'>) => string;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;
  getMember: (id: string) => FamilyMember | undefined;
  
  // ═══════════ RELATIONSHIP CRUD ═══════════
  addRelation: (fromId: string, toId: string, type: BasicRelationType, subtype?: string) => void;
  removeRelation: (fromId: string, toId: string) => void;
  getDirectRelatives: (id: string, type?: BasicRelationType) => FamilyMember[];
  getMemberRelationships: (id: string) => Array<{ memberId: string; type: BasicRelationType; subtype?: string }>;
  
  // ═══════════ COMPUTED RELATIONSHIPS ═══════════
  getParents: (id: string) => FamilyMember[];
  getChildren: (id: string) => FamilyMember[];
  getSpouses: (id: string) => FamilyMember[];
  getSiblings: (id: string) => FamilyMember[];
  getGrandparents: (id: string) => FamilyMember[];
  getGrandchildren: (id: string) => FamilyMember[];
  getUnclesAunts: (id: string) => FamilyMember[];
  getCousins: (id: string) => FamilyMember[];
  
  // ═══════════ RELATIONSHIP DETERMINATION ═══════════
  findRelationship: (fromId: string, toId: string) => { path: string[]; label: string } | null;
  
  // ═══════════ UI ACTIONS ═══════════
  setSelectedMember: (id: string | null) => void;
  setHighlightedPath: (path: string[]) => void;
  setRootMember: (id: string) => void;
  
  // ═══════════ DATA MANAGEMENT ═══════════
  clearAll: () => void;
  importData: (members: FamilyMember[], relations: StoredRelation[]) => void;
  exportData: () => { members: FamilyMember[]; relations: StoredRelation[] };
  
  // ═══════════ INTERNAL ═══════════
  _recomputeMembersList: () => void;
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function generateId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getReverseType(type: BasicRelationType): BasicRelationType {
  switch (type) {
    case 'parent': return 'child';
    case 'child': return 'parent';
    case 'spouse': return 'spouse';
    case 'sibling': return 'sibling';
  }
}

// Map detailed subtypes to basic types
function getBasicType(subtype: string): BasicRelationType {
  const PARENT_TYPES = ['father', 'mother', 'step_father', 'step_mother', 'paternal_grandfather', 'paternal_grandmother', 'maternal_grandfather', 'maternal_grandmother'];
  const CHILD_TYPES = ['son', 'daughter', 'step_son', 'step_daughter', 'grandson', 'granddaughter', 'adopted_son', 'adopted_daughter'];
  const SPOUSE_TYPES = ['husband', 'wife'];
  const SIBLING_TYPES = ['brother', 'sister', 'half_brother', 'half_sister'];
  
  if (PARENT_TYPES.includes(subtype)) return 'parent';
  if (CHILD_TYPES.includes(subtype)) return 'child';
  if (SPOUSE_TYPES.includes(subtype)) return 'spouse';
  if (SIBLING_TYPES.includes(subtype)) return 'sibling';
  
  return subtype as BasicRelationType;
}

// ═══════════════════════════════════════════════════════════
// LCA-BASED RELATIONSHIP FINDER (with spouse traversal)
// ═══════════════════════════════════════════════════════════

interface PathStep {
  type: 'up' | 'down' | 'across';
  memberId: string;
  relationLabel: string;
}

/**
 * BFS-based relationship finder that traverses BOTH parent and spouse links.
 * This handles in-law relationships properly:
 *   - Mother-in-law: spouse's mother
 *   - Daughter-in-law: son's wife
 *   - Sister-in-law: spouse's sister OR sibling's wife
 */
function findRelationshipBFS(
  fromId: string,
  toId: string,
  relations: StoredRelation[],
  members: Map<string, FamilyMember>,
): { path: string[]; label: string } | null {
  if (fromId === toId) return { path: [fromId], label: 'Self' };

  // Build adjacency: memberId -> { targetId, type }[]
  const adj = new Map<string, { targetId: string; type: BasicRelationType }[]>();
  for (const r of relations) {
    if (!adj.has(r.fromMemberId)) adj.set(r.fromMemberId, []);
    adj.get(r.fromMemberId)!.push({ targetId: r.toMemberId, type: r.type });
  }

  // BFS with path tracking
  interface BFSNode {
    id: string;
    path: string[];
    steps: { type: BasicRelationType }[];
  }

  const queue: BFSNode[] = [{ id: fromId, path: [fromId], steps: [] }];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.steps.length > 12) continue; // Max depth increased for complex relations

    const neighbors = adj.get(current.id) || [];
    for (const { targetId, type } of neighbors) {
      if (visited.has(targetId)) continue;
      visited.add(targetId);

      const newPath = [...current.path, targetId];
      const newSteps = [...current.steps, { type }];

      if (targetId === toId) {
        const label = resolveStepsToLabel(newSteps, members.get(fromId), members.get(toId));
        return { path: newPath, label };
      }

      queue.push({ id: targetId, path: newPath, steps: newSteps });
    }
  }

  return null;
}

/**
 * Resolve a sequence of relationship steps into a human-readable label.
 * Handles direct, in-law, compound, and Indian kinship relationships.
 * Supports up to 8+ step traversals for distant relatives.
 */
function resolveStepsToLabel(
  steps: { type: BasicRelationType }[],
  from: FamilyMember | undefined,
  to: FamilyMember | undefined,
): string {
  const toGender = to?.gender || 'other';
  const fromGender = from?.gender || 'other';
  const types = steps.map(s => s.type);
  const key = types.join('→');

  // ═══════════ 1-STEP ═══════════
  if (types.length === 1) {
    const t = types[0];
    if (t === 'spouse') return toGender === 'male' ? 'Husband (Pati)' : 'Wife (Patni)';
    if (t === 'parent') return toGender === 'male' ? 'Father (Pitaji)' : 'Mother (Mataji)';
    if (t === 'child') return toGender === 'male' ? 'Son (Beta)' : 'Daughter (Beti)';
    if (t === 'sibling') return toGender === 'male' ? 'Brother (Bhai)' : 'Sister (Behen)';
    return 'Relative';
  }

  // ═══════════ 2-STEP ═══════════
  if (types.length === 2) {
    const [a, b] = types;

    // Grandparent: parent → parent
    if (a === 'parent' && b === 'parent') {
      return toGender === 'male' ? 'Grandfather (Dadaji/Nanaji)' : 'Grandmother (Dadiji/Naniji)';
    }
    // Grandchild: child → child
    if (a === 'child' && b === 'child') {
      return toGender === 'male' ? 'Grandson (Pota/Navasa)' : 'Granddaughter (Poti/Navasi)';
    }
    // Sibling via parent→child
    if (a === 'parent' && b === 'child') {
      return toGender === 'male' ? 'Brother (Bhai)' : 'Sister (Behen)';
    }
    // Uncle/Aunt: parent → sibling
    if (a === 'parent' && b === 'sibling') {
      return toGender === 'male' ? 'Uncle (Chacha/Mama)' : 'Aunt (Chachi/Mami)';
    }
    // Nephew/Niece: sibling → child
    if (a === 'sibling' && b === 'child') {
      return toGender === 'male' ? 'Nephew (Bhatija/Bhanja)' : 'Niece (Bhatiji/Bhanji)';
    }
    // Father/Mother-in-law: spouse → parent
    if (a === 'spouse' && b === 'parent') {
      return toGender === 'male' ? 'Father-in-law (Sasur)' : 'Mother-in-law (Saas)';
    }
    // Son/Daughter-in-law: child → spouse
    if (a === 'child' && b === 'spouse') {
      return toGender === 'male' ? 'Son-in-law (Damaad)' : 'Daughter-in-law (Bahu)';
    }
    // Brother/Sister-in-law: spouse → sibling
    if (a === 'spouse' && b === 'sibling') {
      return toGender === 'male' ? 'Brother-in-law (Sala/Jeth/Devar)' : 'Sister-in-law (Sali/Jethani/Devrani)';
    }
    // Brother/Sister-in-law: sibling → spouse
    if (a === 'sibling' && b === 'spouse') {
      return toGender === 'male' ? 'Brother-in-law (Jijaji/Bahnoi)' : 'Sister-in-law (Bhabhi)';
    }
    // Spouse's child (stepchild): spouse → child
    if (a === 'spouse' && b === 'child') {
      return toGender === 'male' ? 'Stepson' : 'Stepdaughter';
    }
    // Parent's spouse (stepparent): parent → spouse
    if (a === 'parent' && b === 'spouse') {
      return toGender === 'male' ? 'Stepfather' : 'Stepmother';
    }
    // Child's sibling: child → sibling
    if (a === 'child' && b === 'sibling') {
      return toGender === 'male' ? 'Son' : 'Daughter';
    }
    // Sibling's sibling (could be self or another sibling)
    if (a === 'sibling' && b === 'sibling') {
      return toGender === 'male' ? 'Brother' : 'Sister';
    }
    // Child → parent (co-parent / spouse equiv)
    if (a === 'child' && b === 'parent') {
      return 'Co-Parent';
    }
    // Spouse → spouse (shouldn't happen normally)
    if (a === 'spouse' && b === 'spouse') {
      return 'Self';
    }
  }

  // ═══════════ 3-STEP ═══════════
  if (types.length === 3) {
    const [a, b, c] = types;

    // Great-grandparent: parent→parent→parent
    if (a === 'parent' && b === 'parent' && c === 'parent') {
      return 'Great-' + (toGender === 'male' ? 'Grandfather (Pardadaji)' : 'Grandmother (Pardadiji)');
    }
    // Great-grandchild: child→child→child
    if (a === 'child' && b === 'child' && c === 'child') {
      return 'Great-' + (toGender === 'male' ? 'Grandson' : 'Granddaughter');
    }
    // Cousin: parent→sibling→child
    if (a === 'parent' && b === 'sibling' && c === 'child') {
      return toGender === 'male' ? 'Cousin Brother' : 'Cousin Sister';
    }
    // Cousin via parent→parent→child (uncle/aunt's child)
    if (a === 'parent' && b === 'parent' && c === 'child') {
      return toGender === 'male' ? 'Uncle (Chacha/Tau)' : 'Aunt (Chachi/Tai)';
    }
    // Grand Uncle/Aunt: parent→parent→sibling
    if (a === 'parent' && b === 'parent' && c === 'sibling') {
      return toGender === 'male' ? 'Grand Uncle' : 'Grand Aunt';
    }
    // Grand Nephew/Niece: sibling→child→child
    if (a === 'sibling' && b === 'child' && c === 'child') {
      return toGender === 'male' ? 'Grand Nephew' : 'Grand Niece';
    }
    // Spouse's grandparent: spouse→parent→parent
    if (a === 'spouse' && b === 'parent' && c === 'parent') {
      return toGender === 'male' ? 'Grandfather-in-law' : 'Grandmother-in-law';
    }
    // Spouse's nephew/niece: spouse→sibling→child
    if (a === 'spouse' && b === 'sibling' && c === 'child') {
      return toGender === 'male' ? 'Nephew-in-law' : 'Niece-in-law';
    }
    // Samdhi: child→spouse→parent
    if (a === 'child' && b === 'spouse' && c === 'parent') {
      return toGender === 'male' ? 'Samdhi' : 'Samdhan';
    }
    // Uncle/Aunt's spouse: parent→sibling→spouse
    if (a === 'parent' && b === 'sibling' && c === 'spouse') {
      return toGender === 'male' ? 'Uncle (by marriage)' : 'Aunt (by marriage)';
    }
    // Nephew/Niece-in-law: sibling→child→spouse
    if (a === 'sibling' && b === 'child' && c === 'spouse') {
      return toGender === 'male' ? 'Nephew-in-law' : 'Niece-in-law';
    }
    // Grandchild-in-law: child→child→spouse
    if (a === 'child' && b === 'child' && c === 'spouse') {
      return toGender === 'male' ? 'Grandson-in-law' : 'Granddaughter-in-law';
    }
    // Spouse's uncle/aunt: spouse→parent→sibling
    if (a === 'spouse' && b === 'parent' && c === 'sibling') {
      return toGender === 'male' ? 'Uncle-in-law' : 'Aunt-in-law';
    }
    // Parent's parent's spouse (step-grandparent or grandparent)
    if (a === 'parent' && b === 'parent' && c === 'spouse') {
      return toGender === 'male' ? 'Grandfather' : 'Grandmother';
    }
    // Sibling's sibling's child
    if (a === 'sibling' && b === 'sibling' && c === 'child') {
      return toGender === 'male' ? 'Nephew' : 'Niece';
    }
    // Spouse→child→child (spouse's grandchild / step-grandchild)
    if (a === 'spouse' && b === 'child' && c === 'child') {
      return toGender === 'male' ? 'Step-Grandson' : 'Step-Granddaughter';
    }
    // Parent→child→spouse (sibling-in-law via parent)
    if (a === 'parent' && b === 'child' && c === 'spouse') {
      return toGender === 'male' ? 'Brother-in-law' : 'Sister-in-law';
    }
    // Parent→child→child (nephew/niece via parent path)
    if (a === 'parent' && b === 'child' && c === 'child') {
      return toGender === 'male' ? 'Nephew' : 'Niece';
    }
    // Child→parent→child (sibling via child path)
    if (a === 'child' && b === 'parent' && c === 'child') {
      return toGender === 'male' ? 'Son' : 'Daughter';
    }
    // Child→parent→parent (grandparent via child)
    if (a === 'child' && b === 'parent' && c === 'parent') {
      return toGender === 'male' ? 'Father-in-law' : 'Mother-in-law';
    }
    // Child→parent→sibling
    if (a === 'child' && b === 'parent' && c === 'sibling') {
      return toGender === 'male' ? 'Brother-in-law' : 'Sister-in-law';
    }
    // Spouse→spouse→* (shouldn't happen with normal data)
    // Child→spouse→child
    if (a === 'child' && b === 'spouse' && c === 'child') {
      return toGender === 'male' ? 'Grandson' : 'Granddaughter';
    }
    // Child→spouse→sibling
    if (a === 'child' && b === 'spouse' && c === 'sibling') {
      return toGender === 'male' ? 'Son-in-law\'s brother' : 'Daughter-in-law\'s sister';
    }
  }

  // ═══════════ 4-STEP ═══════════
  if (types.length === 4) {
    const [a, b, c, d] = types;

    // Great-great-grandparent: parent→parent→parent→parent
    if (a === 'parent' && b === 'parent' && c === 'parent' && d === 'parent') {
      return 'Great-Great-' + (toGender === 'male' ? 'Grandfather' : 'Grandmother');
    }
    // Great-great-grandchild: child→child→child→child
    if (a === 'child' && b === 'child' && c === 'child' && d === 'child') {
      return 'Great-Great-' + (toGender === 'male' ? 'Grandson' : 'Granddaughter');
    }
    // Second cousin: parent→parent→sibling→child
    if (a === 'parent' && b === 'parent' && c === 'sibling' && d === 'child') {
      return 'Second Cousin';
    }
    // Cousin once removed (up): parent→sibling→child→child
    if (a === 'parent' && b === 'sibling' && c === 'child' && d === 'child') {
      return 'Cousin Once Removed';
    }
    // First cousin (via parent→parent→child→child)
    if (a === 'parent' && b === 'parent' && c === 'child' && d === 'child') {
      return toGender === 'male' ? 'Cousin Brother' : 'Cousin Sister';
    }
    // Cousin-in-law: parent→sibling→child→spouse
    if (a === 'parent' && b === 'sibling' && c === 'child' && d === 'spouse') {
      return 'Cousin-in-law';
    }
    // Grand uncle/aunt's spouse: parent→parent→sibling→spouse
    if (a === 'parent' && b === 'parent' && c === 'sibling' && d === 'spouse') {
      return toGender === 'male' ? 'Grand Uncle' : 'Grand Aunt';
    }
    // Great uncle/aunt: parent→parent→parent→sibling
    if (a === 'parent' && b === 'parent' && c === 'parent' && d === 'sibling') {
      return toGender === 'male' ? 'Great Grand Uncle' : 'Great Grand Aunt';
    }
    // Spouse's cousin: spouse→parent→sibling→child
    if (a === 'spouse' && b === 'parent' && c === 'sibling' && d === 'child') {
      return 'Spouse\'s Cousin';
    }
    // Sibling's grandchild: sibling→child→child→child
    if (a === 'sibling' && b === 'child' && c === 'child' && d === 'child') {
      return toGender === 'male' ? 'Great Grand Nephew' : 'Great Grand Niece';
    }
    // Child→spouse→parent→parent (Samdhi's parent)
    if (a === 'child' && b === 'spouse' && c === 'parent' && d === 'parent') {
      return toGender === 'male' ? 'Samdhi\'s Father' : 'Samdhi\'s Mother';
    }
    // Child→spouse→parent→sibling (Samdhi's sibling)
    if (a === 'child' && b === 'spouse' && c === 'parent' && d === 'sibling') {
      return toGender === 'male' ? 'Samdhi\'s Brother' : 'Samdhi\'s Sister';
    }
    // Parent→child→spouse→parent (co-in-law)
    if (a === 'parent' && b === 'child' && c === 'spouse' && d === 'parent') {
      return toGender === 'male' ? 'Samdhi' : 'Samdhan';
    }
  }

  // ═══════════ 5-STEP ═══════════
  if (types.length === 5) {
    const [a, b, c, d, e] = types;

    // Second cousin once removed: parent→parent→sibling→child→child
    if (a === 'parent' && b === 'parent' && c === 'sibling' && d === 'child' && e === 'child') {
      return 'Second Cousin Once Removed';
    }
    // First cousin twice removed: parent→sibling→child→child→child
    if (a === 'parent' && b === 'sibling' && c === 'child' && d === 'child' && e === 'child') {
      return 'Cousin Twice Removed';
    }
    // Third cousin path: parent→parent→parent→sibling→child
    if (a === 'parent' && b === 'parent' && c === 'parent' && d === 'sibling' && e === 'child') {
      return 'Third Cousin (Parent)';
    }
    // parent→parent→child→child→child (uncle/aunt's grandchild)
    if (a === 'parent' && b === 'parent' && c === 'child' && d === 'child' && e === 'child') {
      return 'Cousin Once Removed';
    }
  }

  // ═══════════ 6-STEP ═══════════
  if (types.length === 6) {
    const [a, b, c, d, e, f] = types;

    // Third cousin: parent→parent→parent→sibling→child→child
    if (a === 'parent' && b === 'parent' && c === 'parent' && d === 'sibling' && e === 'child' && f === 'child') {
      return 'Third Cousin';
    }
  }

  // ═══════════ GENERIC FALLBACK ═══════════
  // Count the pattern to generate a descriptive label
  const parentCount = types.filter(t => t === 'parent').length;
  const childCount = types.filter(t => t === 'child').length;
  const spouseCount = types.filter(t => t === 'spouse').length;
  const siblingCount = types.filter(t => t === 'sibling').length;

  // Pure ancestor chain
  if (parentCount === types.length && parentCount > 4) {
    const greats = parentCount - 2;
    return `${greats}x Great-${toGender === 'male' ? 'Grandfather' : 'Grandmother'}`;
  }
  // Pure descendant chain
  if (childCount === types.length && childCount > 4) {
    const greats = childCount - 2;
    return `${greats}x Great-${toGender === 'male' ? 'Grandson' : 'Granddaughter'}`;
  }
  // In-law pattern (ends with spouse)
  if (spouseCount > 0 && types[types.length - 1] === 'spouse') {
    const baseTypes = types.slice(0, -1);
    const baseLabel = resolveStepsToLabel(
      baseTypes.map(t => ({ type: t })),
      from,
      to,
    );
    if (!baseLabel.includes('-in-law') && !baseLabel.includes('step')) {
      return baseLabel + '-in-law';
    }
  }

  return `${types.length}-step Relative`;
}

// ═══════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════

export const useVrikshaStore = create<VrikshaState>()(
  persist(
    (set, get) => ({
      // Initial state
      members: new Map(),
      relations: [],
      rootMemberId: null,
      membersList: [],
      membersWithRelationships: [],
      selectedMemberId: null,
      highlightedPath: [],
      isLoading: false,
      
      // ═══════════ MEMBER CRUD ═══════════
      
      addMember: (memberData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const member: FamilyMember = {
          ...memberData,
          id,
          memoryCount: 0,
          kathaCount: 0,
          hasVoiceSamples: false,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => {
          const newMembers = new Map(state.members);
          newMembers.set(id, member);
          
          // Set as root if first member
          const newRoot = state.rootMemberId || id;
          
          return { 
            members: newMembers, 
            rootMemberId: newRoot,
          };
        });
        
        get()._recomputeMembersList();
        return id;
      },
      
      updateMember: (id, updates) => {
        set((state) => {
          const existing = state.members.get(id);
          if (!existing) return state;
          
          const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          const newMembers = new Map(state.members);
          newMembers.set(id, updated);
          
          return { members: newMembers };
        });
        
        get()._recomputeMembersList();
      },
      
      deleteMember: (id) => {
        set((state) => {
          const newMembers = new Map(state.members);
          newMembers.delete(id);
          
          // Remove all relations involving this member
          const newRelations = state.relations.filter(
            r => r.fromMemberId !== id && r.toMemberId !== id
          );
          
          // Update root if needed
          const newRoot = state.rootMemberId === id 
            ? (newMembers.keys().next().value || null)
            : state.rootMemberId;
          
          return { 
            members: newMembers, 
            relations: newRelations,
            rootMemberId: newRoot,
          };
        });
        
        get()._recomputeMembersList();
      },
      
      getMember: (id) => get().members.get(id),
      
      // ═══════════ RELATIONSHIP CRUD ═══════════
      
      addRelation: (fromId, toId, type, subtype) => {
        if (fromId === toId) return;
        
        const id = generateId();
        const reverseId = generateId();
        
        set((state) => {
          // Check if this exact relation already exists
          const exists = state.relations.some(
            r => (r.fromMemberId === fromId && r.toMemberId === toId && r.type === type)
          );
          if (exists) return state;
          
          // Create bidirectional relations
          const newRelation: StoredRelation = {
            id,
            fromMemberId: fromId,
            toMemberId: toId,
            type,
            subtype,
            createdAt: new Date().toISOString(),
          };
          
          const reverseRelation: StoredRelation = {
            id: reverseId,
            fromMemberId: toId,
            toMemberId: fromId,
            type: getReverseType(type),
            subtype,
            createdAt: new Date().toISOString(),
          };
          
          const newRelations = [...state.relations, newRelation, reverseRelation];
          
          // ═══════════ AUTO-INFERENCE ═══════════
          const inferred: StoredRelation[] = [];
          
          // If adding SPOUSE relationship:
          // - If spouse has children, auto-add parent/child with the new spouse
          if (type === 'spouse') {
            // Find existing children of the spouse (toId)
            const spouseChildren = state.relations
              .filter(r => r.fromMemberId === toId && r.type === 'child')
              .map(r => r.toMemberId);
            
            // For each child of the spouse, add parent/child with fromId if not exists
            for (const childId of spouseChildren) {
              const alreadyLinked = [...newRelations, ...inferred].some(
                r => r.fromMemberId === fromId && r.toMemberId === childId && r.type === 'child'
              );
              if (!alreadyLinked && childId !== fromId) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: fromId,
                  toMemberId: childId,
                  type: 'child',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: childId,
                  toMemberId: fromId,
                  type: 'parent',
                  createdAt: new Date().toISOString(),
                });
              }
            }
            
            // Same for children of fromId
            const myChildren = state.relations
              .filter(r => r.fromMemberId === fromId && r.type === 'child')
              .map(r => r.toMemberId);
            
            for (const childId of myChildren) {
              const alreadyLinked = [...newRelations, ...inferred].some(
                r => r.fromMemberId === toId && r.toMemberId === childId && r.type === 'child'
              );
              if (!alreadyLinked && childId !== toId) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: toId,
                  toMemberId: childId,
                  type: 'child',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: childId,
                  toMemberId: toId,
                  type: 'parent',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
          
          // If adding PARENT/CHILD relationship:
          // - Auto-infer sibling relationships between children of same parent
          // - Auto-infer spouse between co-parents
          if (type === 'child') {
            // fromId just got a new child (toId). 
            // Find all other children of fromId
            const otherChildren = state.relations
              .filter(r => r.fromMemberId === fromId && r.type === 'child' && r.toMemberId !== toId)
              .map(r => r.toMemberId);
            
            for (const siblingId of otherChildren) {
              const alreadySiblings = [...newRelations, ...inferred].some(
                r => r.fromMemberId === toId && r.toMemberId === siblingId && r.type === 'sibling'
              );
              if (!alreadySiblings) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: toId,
                  toMemberId: siblingId,
                  type: 'sibling',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: siblingId,
                  toMemberId: toId,
                  type: 'sibling',
                  createdAt: new Date().toISOString(),
                });
              }
            }
            
            // Also add the spouse of fromId as parent of toId
            const spouses = state.relations
              .filter(r => r.fromMemberId === fromId && r.type === 'spouse')
              .map(r => r.toMemberId);
            
            for (const spouseId of spouses) {
              const alreadyParent = [...newRelations, ...inferred].some(
                r => r.fromMemberId === spouseId && r.toMemberId === toId && r.type === 'child'
              );
              if (!alreadyParent) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: spouseId,
                  toMemberId: toId,
                  type: 'child',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: toId,
                  toMemberId: spouseId,
                  type: 'parent',
                  createdAt: new Date().toISOString(),
                });
              }
            }
            
            // AUTO-SPOUSE: if the child (toId) already has other parents,
            // link them as spouses of the new parent (fromId)
            const existingParentsOfChild = state.relations
              .filter(r => r.fromMemberId === toId && r.type === 'parent' && r.toMemberId !== fromId)
              .map(r => r.toMemberId);
            
            for (const existingParentId of existingParentsOfChild) {
              const alreadySpouse = [...newRelations, ...inferred].some(
                r => r.fromMemberId === fromId && r.toMemberId === existingParentId && r.type === 'spouse'
              );
              if (!alreadySpouse) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: fromId,
                  toMemberId: existingParentId,
                  type: 'spouse',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: existingParentId,
                  toMemberId: fromId,
                  type: 'spouse',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
          
          if (type === 'parent') {
            // fromId just got a new parent (toId).
            // Find all other children of toId
            const otherChildren = state.relations
              .filter(r => r.fromMemberId === toId && r.type === 'child' && r.toMemberId !== fromId)
              .map(r => r.toMemberId);
            
            for (const siblingId of otherChildren) {
              const alreadySiblings = [...newRelations, ...inferred].some(
                r => r.fromMemberId === fromId && r.toMemberId === siblingId && r.type === 'sibling'
              );
              if (!alreadySiblings) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: fromId,
                  toMemberId: siblingId,
                  type: 'sibling',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: siblingId,
                  toMemberId: fromId,
                  type: 'sibling',
                  createdAt: new Date().toISOString(),
                });
              }
            }
            
            // Also add the spouse of toId as parent of fromId
            const spouses = state.relations
              .filter(r => r.fromMemberId === toId && r.type === 'spouse')
              .map(r => r.toMemberId);
            
            for (const spouseId of spouses) {
              const alreadyParent = [...newRelations, ...inferred].some(
                r => r.fromMemberId === fromId && r.toMemberId === spouseId && r.type === 'parent'
              );
              if (!alreadyParent) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: fromId,
                  toMemberId: spouseId,
                  type: 'parent',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: spouseId,
                  toMemberId: fromId,
                  type: 'child',
                  createdAt: new Date().toISOString(),
                });
              }
            }
            
            // AUTO-SPOUSE: if fromId already has other parents,
            // link them as spouses of the new parent (toId)
            const existingParentsOfFrom = state.relations
              .filter(r => r.fromMemberId === fromId && r.type === 'parent' && r.toMemberId !== toId)
              .map(r => r.toMemberId);
            
            for (const existingParentId of existingParentsOfFrom) {
              const alreadySpouse = [...newRelations, ...inferred].some(
                r => r.fromMemberId === toId && r.toMemberId === existingParentId && r.type === 'spouse'
              );
              if (!alreadySpouse) {
                inferred.push({
                  id: generateId(),
                  fromMemberId: toId,
                  toMemberId: existingParentId,
                  type: 'spouse',
                  createdAt: new Date().toISOString(),
                });
                inferred.push({
                  id: generateId(),
                  fromMemberId: existingParentId,
                  toMemberId: toId,
                  type: 'spouse',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
          
          return {
            relations: [...newRelations, ...inferred],
          };
        });
        
        get()._recomputeMembersList();
      },
      
      removeRelation: (fromId, toId) => {
        set((state) => ({
          relations: state.relations.filter(
            r => !((r.fromMemberId === fromId && r.toMemberId === toId) ||
                   (r.fromMemberId === toId && r.toMemberId === fromId))
          ),
        }));
        
        get()._recomputeMembersList();
      },
      
      getDirectRelatives: (id, type) => {
        const state = get();
        const relations = state.relations.filter(
          r => r.fromMemberId === id && (!type || r.type === type)
        );
        
        return relations
          .map(r => state.members.get(r.toMemberId))
          .filter(Boolean) as FamilyMember[];
      },
      
      getMemberRelationships: (id) => {
        const state = get();
        return state.relations
          .filter(r => r.fromMemberId === id)
          .map(r => ({
            memberId: r.toMemberId,
            type: r.type,
            subtype: r.subtype,
          }));
      },
      
      // ═══════════ COMPUTED RELATIONSHIPS ═══════════
      
      getParents: (id) => get().getDirectRelatives(id, 'parent'),
      getChildren: (id) => get().getDirectRelatives(id, 'child'),
      getSpouses: (id) => get().getDirectRelatives(id, 'spouse'),
      
      getSiblings: (id) => {
        const state = get();
        const parents = state.getParents(id);
        const siblingSet = new Set<string>();
        
        for (const parent of parents) {
          const children = state.getChildren(parent.id);
          for (const child of children) {
            if (child.id !== id) siblingSet.add(child.id);
          }
        }
        
        // Also include directly linked siblings
        const directSiblings = state.getDirectRelatives(id, 'sibling');
        for (const sib of directSiblings) {
          siblingSet.add(sib.id);
        }
        
        return Array.from(siblingSet)
          .map(sId => state.members.get(sId))
          .filter(Boolean) as FamilyMember[];
      },
      
      getGrandparents: (id) => {
        const state = get();
        const parents = state.getParents(id);
        const grandparents: FamilyMember[] = [];
        
        for (const parent of parents) {
          grandparents.push(...state.getParents(parent.id));
        }
        
        return grandparents;
      },
      
      getGrandchildren: (id) => {
        const state = get();
        const children = state.getChildren(id);
        const grandchildren: FamilyMember[] = [];
        
        for (const child of children) {
          grandchildren.push(...state.getChildren(child.id));
        }
        
        return grandchildren;
      },
      
      getUnclesAunts: (id) => {
        const state = get();
        const parents = state.getParents(id);
        const unclesAunts: FamilyMember[] = [];
        
        for (const parent of parents) {
          const parentSiblings = state.getSiblings(parent.id);
          unclesAunts.push(...parentSiblings);
          
          // Include their spouses
          for (const sibling of parentSiblings) {
            unclesAunts.push(...state.getSpouses(sibling.id));
          }
        }
        
        return unclesAunts;
      },
      
      getCousins: (id) => {
        const state = get();
        const unclesAunts = state.getUnclesAunts(id);
        const cousins: FamilyMember[] = [];
        
        for (const ua of unclesAunts) {
          cousins.push(...state.getChildren(ua.id));
        }
        
        return cousins;
      },
      
      // ═══════════ RELATIONSHIP DETERMINATION ═══════════
      
      findRelationship: (fromId, toId) => {
        if (fromId === toId) return { path: [fromId], label: 'Self' };
        
        const state = get();
        const fromMember = state.members.get(fromId);
        const toMember = state.members.get(toId);
        
        if (!fromMember || !toMember) return null;
        
        // Use BFS-based relationship finder that traverses ALL links
        // including spouse links, which enables in-law relationship detection
        return findRelationshipBFS(fromId, toId, state.relations, state.members);
      },
      
      // ═══════════ UI ACTIONS ═══════════
      
      setSelectedMember: (id) => set({ selectedMemberId: id }),
      setHighlightedPath: (path) => set({ highlightedPath: path }),
      setRootMember: (id) => set({ rootMemberId: id }),
      
      // ═══════════ DATA MANAGEMENT ═══════════
      
      clearAll: () => {
        set({
          members: new Map(),
          relations: [],
          rootMemberId: null,
          membersList: [],
          membersWithRelationships: [],
          selectedMemberId: null,
          highlightedPath: [],
        });
      },
      
      importData: (members, relations) => {
        const membersMap = new Map<string, FamilyMember>();
        members.forEach(m => membersMap.set(m.id, m));
        
        set({
          members: membersMap,
          relations,
          rootMemberId: members[0]?.id || null,
        });
        
        get()._recomputeMembersList();
      },
      
      exportData: () => {
        const state = get();
        return {
          members: Array.from(state.members.values()),
          relations: state.relations,
        };
      },
      
      // ═══════════ INTERNAL ═══════════
      
      _recomputeMembersList: () => {
        const state = get();
        const membersList = Array.from(state.members.values());
        
        // Build membersWithRelationships for compatibility with existing components
        const membersWithRelationships: VrikshaMember[] = membersList.map(m => {
          const relationships: Relationship[] = state.relations
            .filter(r => r.fromMemberId === m.id)
            .map(r => ({
              memberId: r.toMemberId as MemberId,
              type: r.type,
              prana: {
                strength: 1,
                sharedMemories: [],
                sharedKathas: [],
                pulseIntensity: 1,
                glowColor: '#FFD700',
              },
            }));
          
          return {
            id: m.id as MemberId,
            familyId: m.familyId as FamilyId,
            firstName: m.firstName,
            lastName: m.lastName,
            maidenName: m.maidenName,
            gender: m.gender,
            birthDate: m.birthDate,
            deathDate: m.deathDate,
            birthPlace: m.birthPlace,
            currentCity: m.currentCity,
            isAlive: m.isAlive,
            avatarUri: m.avatarUri,
            bio: m.bio,
            occupation: m.occupation,
            nicknames: m.nicknames || [],
            memoryCount: m.memoryCount,
            kathaCount: m.kathaCount,
            hasVoiceSamples: m.hasVoiceSamples,
            relationships,
          };
        });
        
        set({ membersList, membersWithRelationships });
      },
    }),
    {
      name: 'vansh-vriksha-local',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        members: Array.from(state.members.entries()),
        relations: state.relations,
        rootMemberId: state.rootMemberId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert members array back to Map
          if (Array.isArray(state.members)) {
            state.members = new Map(state.members as [string, FamilyMember][]);
          }
          state._recomputeMembersList();
        }
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════
// DEMO DATA GENERATOR
// ═══════════════════════════════════════════════════════════

export function generateDemoFamily(): { members: FamilyMember[]; relations: StoredRelation[] } {
  const now = new Date().toISOString();
  const familyId = 'demo-family';
  
  const members: FamilyMember[] = [
    {
      id: 'grandpa',
      familyId,
      firstName: 'Ramesh',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '1945-03-15',
      isAlive: false,
      deathDate: '2020-01-10',
      birthPlace: 'Jaipur',
      currentCity: 'Jaipur',
      bio: 'A retired teacher who loved gardening',
      memoryCount: 5,
      kathaCount: 2,
      hasVoiceSamples: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'grandma',
      familyId,
      firstName: 'Kamla',
      lastName: 'Sharma',
      maidenName: 'Devi',
      gender: 'female',
      birthDate: '1950-08-20',
      isAlive: true,
      birthPlace: 'Udaipur',
      currentCity: 'Jaipur',
      bio: 'The heart of our family',
      memoryCount: 8,
      kathaCount: 4,
      hasVoiceSamples: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dad',
      familyId,
      firstName: 'Vijay',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '1975-06-12',
      isAlive: true,
      birthPlace: 'Jaipur',
      currentCity: 'Delhi',
      occupation: 'Software Engineer',
      memoryCount: 12,
      kathaCount: 3,
      hasVoiceSamples: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mom',
      familyId,
      firstName: 'Priya',
      lastName: 'Sharma',
      maidenName: 'Kapoor',
      gender: 'female',
      birthDate: '1980-11-25',
      isAlive: true,
      birthPlace: 'Mumbai',
      currentCity: 'Delhi',
      occupation: 'Doctor',
      memoryCount: 15,
      kathaCount: 5,
      hasVoiceSamples: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uncle',
      familyId,
      firstName: 'Ajay',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '1978-02-14',
      isAlive: true,
      birthPlace: 'Jaipur',
      currentCity: 'Bangalore',
      occupation: 'Business Owner',
      memoryCount: 6,
      kathaCount: 1,
      hasVoiceSamples: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'me',
      familyId,
      firstName: 'Arjun',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '2000-04-18',
      isAlive: true,
      birthPlace: 'Delhi',
      currentCity: 'Delhi',
      occupation: 'Student',
      memoryCount: 20,
      kathaCount: 2,
      hasVoiceSamples: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sister',
      familyId,
      firstName: 'Ananya',
      lastName: 'Sharma',
      gender: 'female',
      birthDate: '2003-09-08',
      isAlive: true,
      birthPlace: 'Delhi',
      currentCity: 'Delhi',
      occupation: 'Student',
      memoryCount: 18,
      kathaCount: 3,
      hasVoiceSamples: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cousin',
      familyId,
      firstName: 'Rohan',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '2001-12-05',
      isAlive: true,
      birthPlace: 'Bangalore',
      currentCity: 'Bangalore',
      occupation: 'Designer',
      memoryCount: 8,
      kathaCount: 1,
      hasVoiceSamples: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
  
  const relations: StoredRelation[] = [
    // Grandpa & Grandma are spouses
    { id: 'r1', fromMemberId: 'grandpa', toMemberId: 'grandma', type: 'spouse', createdAt: now },
    { id: 'r2', fromMemberId: 'grandma', toMemberId: 'grandpa', type: 'spouse', createdAt: now },
    
    // Grandpa & Grandma are parents of Dad & Uncle
    { id: 'r3', fromMemberId: 'dad', toMemberId: 'grandpa', type: 'parent', subtype: 'father', createdAt: now },
    { id: 'r4', fromMemberId: 'grandpa', toMemberId: 'dad', type: 'child', createdAt: now },
    { id: 'r5', fromMemberId: 'dad', toMemberId: 'grandma', type: 'parent', subtype: 'mother', createdAt: now },
    { id: 'r6', fromMemberId: 'grandma', toMemberId: 'dad', type: 'child', createdAt: now },
    { id: 'r7', fromMemberId: 'uncle', toMemberId: 'grandpa', type: 'parent', subtype: 'father', createdAt: now },
    { id: 'r8', fromMemberId: 'grandpa', toMemberId: 'uncle', type: 'child', createdAt: now },
    { id: 'r9', fromMemberId: 'uncle', toMemberId: 'grandma', type: 'parent', subtype: 'mother', createdAt: now },
    { id: 'r10', fromMemberId: 'grandma', toMemberId: 'uncle', type: 'child', createdAt: now },
    
    // Dad & Uncle are siblings
    { id: 'r11', fromMemberId: 'dad', toMemberId: 'uncle', type: 'sibling', createdAt: now },
    { id: 'r12', fromMemberId: 'uncle', toMemberId: 'dad', type: 'sibling', createdAt: now },
    
    // Dad & Mom are spouses
    { id: 'r13', fromMemberId: 'dad', toMemberId: 'mom', type: 'spouse', createdAt: now },
    { id: 'r14', fromMemberId: 'mom', toMemberId: 'dad', type: 'spouse', createdAt: now },
    
    // Dad & Mom are parents of Me & Sister
    { id: 'r15', fromMemberId: 'me', toMemberId: 'dad', type: 'parent', subtype: 'father', createdAt: now },
    { id: 'r16', fromMemberId: 'dad', toMemberId: 'me', type: 'child', createdAt: now },
    { id: 'r17', fromMemberId: 'me', toMemberId: 'mom', type: 'parent', subtype: 'mother', createdAt: now },
    { id: 'r18', fromMemberId: 'mom', toMemberId: 'me', type: 'child', createdAt: now },
    { id: 'r19', fromMemberId: 'sister', toMemberId: 'dad', type: 'parent', subtype: 'father', createdAt: now },
    { id: 'r20', fromMemberId: 'dad', toMemberId: 'sister', type: 'child', createdAt: now },
    { id: 'r21', fromMemberId: 'sister', toMemberId: 'mom', type: 'parent', subtype: 'mother', createdAt: now },
    { id: 'r22', fromMemberId: 'mom', toMemberId: 'sister', type: 'child', createdAt: now },
    
    // Me & Sister are siblings
    { id: 'r23', fromMemberId: 'me', toMemberId: 'sister', type: 'sibling', createdAt: now },
    { id: 'r24', fromMemberId: 'sister', toMemberId: 'me', type: 'sibling', createdAt: now },
    
    // Cousin is child of Uncle
    { id: 'r25', fromMemberId: 'cousin', toMemberId: 'uncle', type: 'parent', subtype: 'father', createdAt: now },
    { id: 'r26', fromMemberId: 'uncle', toMemberId: 'cousin', type: 'child', createdAt: now },
  ];
  
  return { members, relations };
}
