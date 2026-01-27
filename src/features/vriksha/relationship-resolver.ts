/**
 * 🌳 INDIAN RELATIONSHIP RESOLVER - Path-Token Inference Engine
 * ═══════════════════════════════════════════════════════════
 * 
 * ALGORITHM OVERVIEW:
 * ───────────────────
 * 1. BIDIRECTIONAL BFS: Find shortest path between two nodes
 *    - Search from both ends simultaneously
 *    - Meet in the middle for optimal performance
 * 
 * 2. PATH TOKENIZATION: Convert path to relationship tokens
 *    - Each step records: type (parent/child/spouse/sibling) + gender
 *    - The GENDER OF INTERMEDIATE PIVOTS determines the Hindi term
 * 
 * 3. PATTERN MATCHING: Match token pattern to Indian kinship term
 *    - Parent(M) → Sibling(M) = Chacha (Father's brother)
 *    - Parent(F) → Sibling(M) = Mama (Mother's brother)
 * 
 * KEY INSIGHT:
 * ────────────
 * Indian kinship is "descriptive" (Sudanese system), meaning:
 * - The GENDER of the PIVOT RELATIVE matters
 * - Father's brother ≠ Mother's brother (different terms)
 * - Elder vs Younger often distinguished (but requires birth dates)
 */

import { INDIAN_KINSHIP, type Gender, type IndianRelationship } from './types';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface PathStep {
  type: 'parent' | 'child' | 'spouse' | 'sibling';
  nodeId: string;
  gender: Gender;
}

export interface RelationshipPath {
  steps: PathStep[];
  fromId: string;
  toId: string;
}

export interface NodeRelations {
  parents: { id: string; gender: Gender }[];
  children: { id: string; gender: Gender }[];
  spouses: { id: string; gender: Gender }[];
  siblings: { id: string; gender: Gender }[];
}

// ═══════════════════════════════════════════════════════════
// BIDIRECTIONAL BFS PATH FINDER
// ═══════════════════════════════════════════════════════════
/**
 * Find the shortest relationship path between two people.
 * Uses bidirectional BFS for efficiency on large trees.
 * 
 * @param fromId - Starting person ID
 * @param toId - Target person ID
 * @param getRelations - Function to get a person's relations
 * @param getGender - Function to get a person's gender
 * @returns Array of path steps, or null if no path found
 */
export function findRelationshipPath(
  fromId: string,
  toId: string,
  getRelations: (id: string) => NodeRelations,
  getGender: (id: string) => Gender
): PathStep[] | null {
  // Same person = empty path
  if (fromId === toId) return [];
  
  // Bidirectional search structures
  const visitedForward = new Map<string, PathStep[]>();  // nodeId → path from start
  const visitedBackward = new Map<string, PathStep[]>(); // nodeId → path to end
  
  const queueForward: { id: string; path: PathStep[] }[] = [{ id: fromId, path: [] }];
  const queueBackward: { id: string; path: PathStep[] }[] = [{ id: toId, path: [] }];
  
  visitedForward.set(fromId, []);
  visitedBackward.set(toId, []);
  
  const MAX_DEPTH = 8; // Limit search depth to prevent infinite loops
  
  // Alternate between forward and backward search
  while (queueForward.length > 0 || queueBackward.length > 0) {
    // Forward step
    if (queueForward.length > 0) {
      const { id, path } = queueForward.shift()!;
      
      if (path.length >= MAX_DEPTH) continue;
      
      const neighbors = getNeighbors(id, getRelations, getGender);
      
      for (const neighbor of neighbors) {
        if (visitedForward.has(neighbor.nodeId)) continue;
        
        const newPath = [...path, neighbor];
        visitedForward.set(neighbor.nodeId, newPath);
        
        // Check if we've met the backward search
        if (visitedBackward.has(neighbor.nodeId)) {
          const backwardPath = visitedBackward.get(neighbor.nodeId)!;
          return mergePaths(newPath, backwardPath, getGender);
        }
        
        queueForward.push({ id: neighbor.nodeId, path: newPath });
      }
    }
    
    // Backward step
    if (queueBackward.length > 0) {
      const { id, path } = queueBackward.shift()!;
      
      if (path.length >= MAX_DEPTH) continue;
      
      const neighbors = getNeighbors(id, getRelations, getGender);
      
      for (const neighbor of neighbors) {
        if (visitedBackward.has(neighbor.nodeId)) continue;
        
        const newPath = [neighbor, ...path];
        visitedBackward.set(neighbor.nodeId, newPath);
        
        // Check if we've met the forward search
        if (visitedForward.has(neighbor.nodeId)) {
          const forwardPath = visitedForward.get(neighbor.nodeId)!;
          return mergePaths(forwardPath, newPath, getGender);
        }
        
        queueBackward.push({ id: neighbor.nodeId, path: newPath });
      }
    }
  }
  
  return null; // No path found
}

/**
 * Get all neighbors of a node with their relationship type
 */
function getNeighbors(
  id: string,
  getRelations: (id: string) => NodeRelations,
  getGender: (id: string) => Gender
): PathStep[] {
  const relations = getRelations(id);
  const neighbors: PathStep[] = [];
  
  relations.parents.forEach(r => {
    neighbors.push({ type: 'parent', nodeId: r.id, gender: r.gender });
  });
  
  relations.children.forEach(r => {
    neighbors.push({ type: 'child', nodeId: r.id, gender: r.gender });
  });
  
  relations.spouses.forEach(r => {
    neighbors.push({ type: 'spouse', nodeId: r.id, gender: r.gender });
  });
  
  relations.siblings.forEach(r => {
    neighbors.push({ type: 'sibling', nodeId: r.id, gender: r.gender });
  });
  
  return neighbors;
}

/**
 * Merge forward and backward paths, inverting the backward portion
 */
function mergePaths(
  forwardPath: PathStep[],
  backwardPath: PathStep[],
  getGender: (id: string) => Gender
): PathStep[] {
  // The backward path needs to be inverted (child ↔ parent, etc.)
  const invertedBackward = backwardPath.map(step => ({
    ...step,
    type: invertRelationType(step.type),
  }));
  
  // Remove the duplicate meeting point
  if (forwardPath.length > 0 && invertedBackward.length > 0) {
    const lastForward = forwardPath[forwardPath.length - 1];
    const firstBackward = invertedBackward[0];
    if (lastForward.nodeId === firstBackward.nodeId) {
      return [...forwardPath, ...invertedBackward.slice(1)];
    }
  }
  
  return [...forwardPath, ...invertedBackward];
}

function invertRelationType(type: PathStep['type']): PathStep['type'] {
  switch (type) {
    case 'parent': return 'child';
    case 'child': return 'parent';
    case 'spouse': return 'spouse';
    case 'sibling': return 'sibling';
  }
}

// ═══════════════════════════════════════════════════════════
// PATH-TOKEN PATTERN MATCHING
// ═══════════════════════════════════════════════════════════

/**
 * Main resolver function - converts path to Hindi kinship term
 * 
 * The key insight: we tokenize the path and match patterns.
 * The gender of intermediate nodes (pivots) determines the term.
 */
export function resolveRelationship(
  path: PathStep[],
  fromGender: Gender,
  toGender: Gender
): IndianRelationship | null {
  if (path.length === 0) {
    return INDIAN_KINSHIP.self;
  }
  
  // Try to match known patterns
  const match = matchPattern(path, fromGender, toGender);
  
  if (match) {
    return match;
  }
  
  // Fallback: describe the relationship path
  return createFallbackRelationship(path, toGender);
}

/**
 * Pattern matching for Indian kinship terms
 * 
 * Pattern notation:
 * - P(M) = Parent who is Male = Father
 * - P(F) = Parent who is Female = Mother
 * - S(M) = Sibling who is Male = Brother
 * - C(M) = Child who is Male = Son
 */
function matchPattern(
  path: PathStep[],
  fromGender: Gender,
  toGender: Gender
): IndianRelationship | null {
  const len = path.length;
  
  // ═══════════ DIRECT RELATIONSHIPS (1 step) ═══════════
  if (len === 1) {
    const step = path[0];
    return matchDirectRelationship(step);
  }
  
  // ═══════════ 2-STEP RELATIONSHIPS ═══════════
  if (len === 2) {
    return match2StepPattern(path, fromGender, toGender);
  }
  
  // ═══════════ 3-STEP RELATIONSHIPS ═══════════
  if (len === 3) {
    return match3StepPattern(path, fromGender, toGender);
  }
  
  // ═══════════ 4-STEP RELATIONSHIPS ═══════════
  if (len === 4) {
    return match4StepPattern(path, fromGender, toGender);
  }
  
  return null;
}

function matchDirectRelationship(step: PathStep): IndianRelationship | null {
  const { type, gender } = step;
  
  switch (type) {
    case 'parent':
      return gender === 'male' ? INDIAN_KINSHIP.father : INDIAN_KINSHIP.mother;
    case 'child':
      return gender === 'male' ? INDIAN_KINSHIP.son : INDIAN_KINSHIP.daughter;
    case 'spouse':
      return gender === 'male' ? INDIAN_KINSHIP.husband : INDIAN_KINSHIP.wife;
    case 'sibling':
      // Default to elder (would need birth dates for accuracy)
      return gender === 'male' ? INDIAN_KINSHIP.elder_brother : INDIAN_KINSHIP.elder_sister;
  }
}

function match2StepPattern(
  path: PathStep[],
  _fromGender: Gender,
  _toGender: Gender
): IndianRelationship | null {
  const [step1, step2] = path;
  
  // ─────────── GRANDPARENTS: P → P ───────────
  if (step1.type === 'parent' && step2.type === 'parent') {
    const pivotGender = step1.gender; // Father's side or Mother's side
    const gpGender = step2.gender;    // Grandfather or Grandmother
    
    if (pivotGender === 'male') {
      return gpGender === 'male' 
        ? INDIAN_KINSHIP.paternal_grandfather 
        : INDIAN_KINSHIP.paternal_grandmother;
    } else {
      return gpGender === 'male' 
        ? INDIAN_KINSHIP.maternal_grandfather 
        : INDIAN_KINSHIP.maternal_grandmother;
    }
  }
  
  // ─────────── GRANDCHILDREN: C → C ───────────
  if (step1.type === 'child' && step2.type === 'child') {
    return step2.gender === 'male' 
      ? INDIAN_KINSHIP.grandson 
      : INDIAN_KINSHIP.granddaughter;
  }
  
  // ─────────── UNCLE/AUNT: P → S ───────────
  // Father's brother = Chacha/Tau
  // Father's sister = Bua
  // Mother's brother = Mama
  // Mother's sister = Mausi
  if (step1.type === 'parent' && step2.type === 'sibling') {
    const pivotGender = step1.gender; // Father or Mother
    const uncleAuntGender = step2.gender;
    
    if (pivotGender === 'male') {
      // Father's side (paternal)
      if (uncleAuntGender === 'male') {
        return INDIAN_KINSHIP.paternal_uncle_younger; // Chacha (default to younger)
      } else {
        return INDIAN_KINSHIP.paternal_aunt; // Bua
      }
    } else {
      // Mother's side (maternal)
      if (uncleAuntGender === 'male') {
        return INDIAN_KINSHIP.maternal_uncle; // Mama
      } else {
        return INDIAN_KINSHIP.maternal_aunt; // Mausi
      }
    }
  }
  
  // ─────────── NEPHEW/NIECE: S → C ───────────
  if (step1.type === 'sibling' && step2.type === 'child') {
    const siblingGender = step1.gender;
    const childGender = step2.gender;
    
    if (siblingGender === 'male') {
      return childGender === 'male' 
        ? INDIAN_KINSHIP.brother_son 
        : INDIAN_KINSHIP.brother_daughter;
    } else {
      return childGender === 'male' 
        ? INDIAN_KINSHIP.sister_son 
        : INDIAN_KINSHIP.sister_daughter;
    }
  }
  
  // ─────────── IN-LAWS: SPOUSE → PARENT ───────────
  if (step1.type === 'spouse' && step2.type === 'parent') {
    return step2.gender === 'male' 
      ? INDIAN_KINSHIP.father_in_law 
      : INDIAN_KINSHIP.mother_in_law;
  }
  
  // ─────────── IN-LAWS: SPOUSE → SIBLING ───────────
  if (step1.type === 'spouse' && step2.type === 'sibling') {
    const spouseGender = step1.gender;
    const siblingGender = step2.gender;
    
    if (spouseGender === 'male') {
      // Husband's siblings
      return siblingGender === 'male' 
        ? INDIAN_KINSHIP.husband_younger_brother 
        : INDIAN_KINSHIP.husband_sister;
    } else {
      // Wife's siblings
      return siblingGender === 'male' 
        ? INDIAN_KINSHIP.wife_brother 
        : INDIAN_KINSHIP.wife_sister;
    }
  }
  
  // ─────────── IN-LAWS: SIBLING → SPOUSE ───────────
  if (step1.type === 'sibling' && step2.type === 'spouse') {
    const siblingGender = step1.gender;
    const spouseGender = step2.gender;
    
    if (siblingGender === 'male' && spouseGender === 'female') {
      return INDIAN_KINSHIP.brother_wife; // Bhabhi
    }
    if (siblingGender === 'female' && spouseGender === 'male') {
      return INDIAN_KINSHIP.sister_husband; // Jija
    }
  }
  
  // ─────────── CHILD'S SPOUSE: C → SPOUSE ───────────
  if (step1.type === 'child' && step2.type === 'spouse') {
    const childGender = step1.gender;
    const spouseGender = step2.gender;
    
    if (childGender === 'male' && spouseGender === 'female') {
      return INDIAN_KINSHIP.son_wife; // Bahu
    }
    if (childGender === 'female' && spouseGender === 'male') {
      return INDIAN_KINSHIP.daughter_husband; // Damad
    }
  }
  
  return null;
}

function match3StepPattern(
  path: PathStep[],
  _fromGender: Gender,
  _toGender: Gender
): IndianRelationship | null {
  const [step1, step2, step3] = path;
  
  // ─────────── UNCLE/AUNT SPOUSE: P → S → SPOUSE ───────────
  if (step1.type === 'parent' && step2.type === 'sibling' && step3.type === 'spouse') {
    const pivotGender = step1.gender;
    const uncleAuntGender = step2.gender;
    const spouseGender = step3.gender;
    
    if (pivotGender === 'male') {
      // Father's side
      if (uncleAuntGender === 'male' && spouseGender === 'female') {
        return INDIAN_KINSHIP.paternal_aunt_younger_wife; // Chachi
      }
      if (uncleAuntGender === 'female' && spouseGender === 'male') {
        return INDIAN_KINSHIP.paternal_aunt_husband; // Fufa
      }
    } else {
      // Mother's side
      if (uncleAuntGender === 'male' && spouseGender === 'female') {
        return INDIAN_KINSHIP.maternal_uncle_wife; // Mami
      }
      if (uncleAuntGender === 'female' && spouseGender === 'male') {
        return INDIAN_KINSHIP.maternal_aunt_husband; // Mausa
      }
    }
  }
  
  // ─────────── COUSINS: P → S → C ───────────
  if (step1.type === 'parent' && step2.type === 'sibling' && step3.type === 'child') {
    const pivotGender = step1.gender;
    const cousinGender = step3.gender;
    
    if (pivotGender === 'male') {
      return cousinGender === 'male' 
        ? INDIAN_KINSHIP.cousin_paternal_male 
        : INDIAN_KINSHIP.cousin_paternal_female;
    } else {
      return cousinGender === 'male' 
        ? INDIAN_KINSHIP.cousin_maternal_male 
        : INDIAN_KINSHIP.cousin_maternal_female;
    }
  }
  
  // ─────────── GREAT-GRANDPARENTS: P → P → P ───────────
  if (step1.type === 'parent' && step2.type === 'parent' && step3.type === 'parent') {
    return step3.gender === 'male'
      ? { english: 'Great-grandfather', hindi: 'Par-dada', hindiScript: 'परदादा', description: "Great-grandfather", gender: 'male' }
      : { english: 'Great-grandmother', hindi: 'Par-dadi', hindiScript: 'परदादी', description: "Great-grandmother", gender: 'female' };
  }
  
  // ─────────── GREAT-GRANDCHILDREN: C → C → C ───────────
  if (step1.type === 'child' && step2.type === 'child' && step3.type === 'child') {
    return step3.gender === 'male'
      ? { english: 'Great-grandson', hindi: 'Par-pota', hindiScript: 'परपोता', description: "Great-grandson", gender: 'male' }
      : { english: 'Great-granddaughter', hindi: 'Par-poti', hindiScript: 'परपोती', description: "Great-granddaughter", gender: 'female' };
  }
  
  return null;
}

function match4StepPattern(
  path: PathStep[],
  _fromGender: Gender,
  _toGender: Gender
): IndianRelationship | null {
  const [step1, step2, step3, step4] = path;
  
  // ─────────── COUSIN'S CHILD: P → S → C → C ───────────
  if (step1.type === 'parent' && step2.type === 'sibling' && 
      step3.type === 'child' && step4.type === 'child') {
    return step4.gender === 'male'
      ? { english: "Cousin's son", hindi: 'Bhatija/Bhanja', hindiScript: 'भतीजा', description: "Cousin's son", gender: 'male' }
      : { english: "Cousin's daughter", hindi: 'Bhatiji/Bhanji', hindiScript: 'भतीजी', description: "Cousin's daughter", gender: 'female' };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════
// FALLBACK FOR UNKNOWN PATTERNS
// ═══════════════════════════════════════════════════════════

function createFallbackRelationship(
  path: PathStep[],
  toGender: Gender
): IndianRelationship {
  // Generate a descriptive term based on the path
  const description = path.map(s => {
    switch (s.type) {
      case 'parent': return s.gender === 'male' ? "Father's" : "Mother's";
      case 'child': return s.gender === 'male' ? "Son's" : "Daughter's";
      case 'spouse': return s.gender === 'male' ? "Husband's" : "Wife's";
      case 'sibling': return s.gender === 'male' ? "Brother's" : "Sister's";
    }
  }).join(' ');
  
  // Clean up trailing possessive
  const cleanDescription = description.replace(/'s$/, '');
  
  return {
    english: 'Relative',
    hindi: 'Rishtedar',
    hindiScript: 'रिश्तेदार',
    description: cleanDescription || 'Related',
    gender: toGender,
  };
}

// ═══════════════════════════════════════════════════════════
// QUICK HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get Hindi term for a direct relationship type
 */
export function getDirectRelationshipTerm(
  type: 'parent' | 'child' | 'spouse' | 'sibling',
  gender: Gender
): IndianRelationship {
  switch (type) {
    case 'parent':
      return gender === 'male' ? INDIAN_KINSHIP.father : INDIAN_KINSHIP.mother;
    case 'child':
      return gender === 'male' ? INDIAN_KINSHIP.son : INDIAN_KINSHIP.daughter;
    case 'spouse':
      return gender === 'male' ? INDIAN_KINSHIP.husband : INDIAN_KINSHIP.wife;
    case 'sibling':
      return gender === 'male' ? INDIAN_KINSHIP.elder_brother : INDIAN_KINSHIP.elder_sister;
  }
}

/**
 * Format relationship for display
 */
export function formatRelationship(rel: IndianRelationship): string {
  return `${rel.hindiScript} (${rel.hindi})`;
}

/**
 * Get a simple relationship description
 */
export function getRelationshipDescription(rel: IndianRelationship): string {
  return `${rel.english} - ${rel.hindi} (${rel.hindiScript})`;
}
