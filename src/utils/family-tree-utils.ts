/**
 * 🌳 FAMILY TREE UTILITIES - Tree data structure and algorithms
 * 
 * This module provides:
 * 1. A proper tree data structure for family relationships
 * 2. Automatic inverse relationship inference
 * 3. Relationship path finding
 * 4. Tree layout algorithms
 */

import type { MemberId, RelationType, VrikshaMember } from '../types';

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP MAPPING - Inverse relationships
// ═══════════════════════════════════════════════════════════

/**
 * Maps a relationship type to its inverse
 * If A is B's "parent", then B is A's "child"
 */
export const INVERSE_RELATIONSHIPS: Record<RelationType, RelationType> = {
  'parent': 'child',
  'child': 'parent',
  'spouse': 'spouse',
  'sibling': 'sibling',
  'grandparent': 'grandchild',
  'grandchild': 'grandparent',
  'uncle': 'nephew',
  'aunt': 'niece',
  'nephew': 'uncle',
  'niece': 'aunt',
  'cousin': 'cousin',
  'in_law': 'in_law',
};

/**
 * Gender-aware relationship mapping
 * Provides gendered relationship names based on member's gender
 */
export const GENDERED_RELATIONSHIPS: Record<RelationType, { male: string; female: string; neutral: string }> = {
  'parent': { male: 'Father', female: 'Mother', neutral: 'Parent' },
  'child': { male: 'Son', female: 'Daughter', neutral: 'Child' },
  'spouse': { male: 'Husband', female: 'Wife', neutral: 'Spouse' },
  'sibling': { male: 'Brother', female: 'Sister', neutral: 'Sibling' },
  'grandparent': { male: 'Grandfather', female: 'Grandmother', neutral: 'Grandparent' },
  'grandchild': { male: 'Grandson', female: 'Granddaughter', neutral: 'Grandchild' },
  'uncle': { male: 'Uncle', female: 'Aunt', neutral: 'Uncle/Aunt' },
  'aunt': { male: 'Uncle', female: 'Aunt', neutral: 'Uncle/Aunt' },
  'nephew': { male: 'Nephew', female: 'Niece', neutral: 'Nephew/Niece' },
  'niece': { male: 'Nephew', female: 'Niece', neutral: 'Nephew/Niece' },
  'cousin': { male: 'Cousin', female: 'Cousin', neutral: 'Cousin' },
  'in_law': { male: 'In-law', female: 'In-law', neutral: 'In-law' },
};

// ═══════════════════════════════════════════════════════════
// TREE NODE - Core node structure
// ═══════════════════════════════════════════════════════════

export interface FamilyTreeNode {
  member: VrikshaMember;
  parent?: FamilyTreeNode;
  otherParent?: FamilyTreeNode;  // For two-parent support
  spouse?: FamilyTreeNode;
  children: FamilyTreeNode[];
  siblings: FamilyTreeNode[];
  // Layout properties
  x: number;
  y: number;
  generation: number;
  subtreeWidth: number;
}

export interface FamilyGraph {
  nodes: Map<MemberId, FamilyTreeNode>;
  root?: FamilyTreeNode;
  generations: Map<number, FamilyTreeNode[]>;
  maxGeneration: number;
  minGeneration: number;
}

// ═══════════════════════════════════════════════════════════
// TREE BUILDER - Build tree from flat member list
// ═══════════════════════════════════════════════════════════

/**
 * Builds a family tree graph from a flat list of members with relationships
 */
export function buildFamilyGraph(members: VrikshaMember[]): FamilyGraph {
  const nodes = new Map<MemberId, FamilyTreeNode>();
  
  // Phase 1: Create all nodes
  members.forEach(member => {
    nodes.set(member.id, {
      member,
      children: [],
      siblings: [],
      x: 0,
      y: 0,
      generation: 0,
      subtreeWidth: 1,
    });
  });
  
  // Phase 2: Link relationships
  members.forEach(member => {
    const node = nodes.get(member.id);
    if (!node || !member.relationships) return;
    
    member.relationships.forEach(rel => {
      const relatedNode = nodes.get(rel.memberId);
      if (!relatedNode) return;
      
      switch (rel.type) {
        case 'parent':
          if (!node.parent) {
            node.parent = relatedNode;
          } else if (!node.otherParent) {
            node.otherParent = relatedNode;
          }
          // Auto-add inverse: child
          if (!relatedNode.children.includes(node)) {
            relatedNode.children.push(node);
          }
          break;
          
        case 'child':
          if (!node.children.includes(relatedNode)) {
            node.children.push(relatedNode);
          }
          // Auto-add inverse: parent
          if (!relatedNode.parent) {
            relatedNode.parent = node;
          } else if (!relatedNode.otherParent && relatedNode.parent !== node) {
            relatedNode.otherParent = node;
          }
          break;
          
        case 'spouse':
          node.spouse = relatedNode;
          relatedNode.spouse = node;
          break;
          
        case 'sibling':
          if (!node.siblings.includes(relatedNode)) {
            node.siblings.push(relatedNode);
          }
          if (!relatedNode.siblings.includes(node)) {
            relatedNode.siblings.push(node);
          }
          break;
      }
    });
  });
  
  // Phase 3: Calculate generations
  const visited = new Set<MemberId>();
  const queue: { node: FamilyTreeNode; gen: number }[] = [];
  
  // Check if we have any real relationships defined
  let hasRelationships = false;
  nodes.forEach(node => {
    if (node.parent || node.spouse || node.children.length > 0 || node.siblings.length > 0) {
      hasRelationships = true;
    }
  });
  
  // If no relationships, use birth year to estimate generations
  if (!hasRelationships && nodes.size > 0) {
    const nodeArray = Array.from(nodes.values());
    
    // Sort by birth year (oldest first)
    nodeArray.sort((a, b) => {
      const yearA = a.member.birthDate ? new Date(a.member.birthDate).getFullYear() : 2000;
      const yearB = b.member.birthDate ? new Date(b.member.birthDate).getFullYear() : 2000;
      return yearA - yearB;
    });
    
    // Assign generations based on ~25 year gaps
    const baseYear = nodeArray[0].member.birthDate 
      ? new Date(nodeArray[0].member.birthDate).getFullYear() 
      : 1950;
    
    nodeArray.forEach(node => {
      const birthYear = node.member.birthDate 
        ? new Date(node.member.birthDate).getFullYear() 
        : 2000;
      node.generation = Math.floor((birthYear - baseYear) / 25);
      visited.add(node.member.id);
    });
  } else {
    // Find root nodes (members with no parents)
    nodes.forEach(node => {
      if (!node.parent) {
        queue.push({ node, gen: 0 });
        visited.add(node.member.id);
      }
    });
    
    // If no roots found, pick the eldest member
    if (queue.length === 0 && nodes.size > 0) {
      const eldestNode = Array.from(nodes.values()).reduce((oldest, current) => {
        const oldestYear = oldest.member.birthDate ? new Date(oldest.member.birthDate).getFullYear() : 3000;
        const currentYear = current.member.birthDate ? new Date(current.member.birthDate).getFullYear() : 3000;
        return currentYear < oldestYear ? current : oldest;
      });
      queue.push({ node: eldestNode, gen: 0 });
      visited.add(eldestNode.member.id);
    }
  
  let minGen = 0;
  let maxGen = 0;
  
  while (queue.length > 0) {
    const { node, gen } = queue.shift()!;
    node.generation = gen;
    minGen = Math.min(minGen, gen);
    maxGen = Math.max(maxGen, gen);
    
    // Children are next generation
    node.children.forEach(child => {
      if (!visited.has(child.member.id)) {
        visited.add(child.member.id);
        queue.push({ node: child, gen: gen + 1 });
      }
    });
    
    // Spouse is same generation
    if (node.spouse && !visited.has(node.spouse.member.id)) {
      visited.add(node.spouse.member.id);
      queue.push({ node: node.spouse, gen });
    }
    
    // Siblings are same generation
    node.siblings.forEach(sibling => {
      if (!visited.has(sibling.member.id)) {
        visited.add(sibling.member.id);
        queue.push({ node: sibling, gen });
      }
    });
    
    // Parents are previous generation
    if (node.parent && !visited.has(node.parent.member.id)) {
      visited.add(node.parent.member.id);
      queue.push({ node: node.parent, gen: gen - 1 });
    }
    if (node.otherParent && !visited.has(node.otherParent.member.id)) {
      visited.add(node.otherParent.member.id);
      queue.push({ node: node.otherParent, gen: gen - 1 });
    }
  }
  } // Close the hasRelationships else block
  
  // Phase 4: Group by generation
  const generations = new Map<number, FamilyTreeNode[]>();
  let minGen = 0;
  let maxGen = 0;
  
  nodes.forEach(node => {
    const gen = node.generation;
    minGen = Math.min(minGen, gen);
    maxGen = Math.max(maxGen, gen);
    if (!generations.has(gen)) {
      generations.set(gen, []);
    }
    generations.get(gen)!.push(node);
  });
  
  // Find root (first member in oldest generation)
  const oldestGen = Math.min(...Array.from(generations.keys()));
  const root = generations.get(oldestGen)?.[0];
  
  return { nodes, root, generations, maxGeneration: maxGen, minGeneration: minGen };
}

// ═══════════════════════════════════════════════════════════
// LAYOUT ALGORITHM - Position nodes in tree
// ═══════════════════════════════════════════════════════════

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  screenWidth: number;
}

/**
 * Calculates positions for all nodes using a modified Reingold-Tilford algorithm
 */
export function calculateTreeLayout(graph: FamilyGraph, config: LayoutConfig): void {
  const { nodeWidth, nodeHeight, horizontalGap, verticalGap, screenWidth } = config;
  
  // Step 1: Calculate subtree widths (bottom-up)
  const calculateSubtreeWidth = (node: FamilyTreeNode): number => {
    if (node.children.length === 0) {
      node.subtreeWidth = 1;
      return 1;
    }
    
    let totalWidth = 0;
    node.children.forEach(child => {
      totalWidth += calculateSubtreeWidth(child);
    });
    
    // Spouse counts as part of same unit
    if (node.spouse && !node.children.includes(node.spouse)) {
      totalWidth = Math.max(totalWidth, 2);
    }
    
    node.subtreeWidth = Math.max(totalWidth, 1);
    return node.subtreeWidth;
  };
  
  // Calculate from all roots
  graph.nodes.forEach(node => {
    if (!node.parent) {
      calculateSubtreeWidth(node);
    }
  });
  
  // Step 2: Position nodes (top-down)
  const positionNode = (node: FamilyTreeNode, x: number, y: number) => {
    node.x = x;
    node.y = y;
    
    // Position spouse next to node
    if (node.spouse && node.spouse.x === 0 && node.spouse.y === 0) {
      node.spouse.x = x + nodeWidth + horizontalGap / 2;
      node.spouse.y = y;
    }
    
    // Position children below
    if (node.children.length > 0) {
      const childY = y + nodeHeight + verticalGap;
      const totalChildWidth = node.children.reduce((sum, c) => sum + c.subtreeWidth, 0);
      const startX = x + (node.subtreeWidth * (nodeWidth + horizontalGap) - totalChildWidth * (nodeWidth + horizontalGap)) / 2;
      
      let currentX = startX;
      node.children.forEach(child => {
        const childCenterX = currentX + (child.subtreeWidth * (nodeWidth + horizontalGap)) / 2 - nodeWidth / 2;
        positionNode(child, childCenterX, childY);
        currentX += child.subtreeWidth * (nodeWidth + horizontalGap);
      });
    }
  };
  
  // Start positioning from roots or by generation
  const sortedGens = Array.from(graph.generations.keys()).sort((a, b) => a - b);
  
  // Position each generation as a row
  sortedGens.forEach((gen, genIndex) => {
    const nodesInGen = graph.generations.get(gen) || [];
    const y = genIndex * (nodeHeight + verticalGap) + verticalGap;
    
    // Calculate total width needed for this generation
    const totalWidth = nodesInGen.length * (nodeWidth + horizontalGap) - horizontalGap;
    const startX = Math.max(horizontalGap, (screenWidth - totalWidth) / 2);
    
    nodesInGen.forEach((node, nodeIndex) => {
      // Only position if not already positioned by parent
      if (node.x === 0 && node.y === 0) {
        node.x = startX + nodeIndex * (nodeWidth + horizontalGap);
        node.y = y;
      }
    });
  });
  
  // Normalize generations (oldest = 0)
  const minGen = graph.minGeneration;
  if (minGen !== 0) {
    graph.nodes.forEach(node => {
      node.generation -= minGen;
    });
    graph.maxGeneration -= minGen;
    graph.minGeneration = 0;
  }
}

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP INFERENCE - Auto-derive relationships
// ═══════════════════════════════════════════════════════════

/**
 * Given a relationship from A to B, compute the inverse relationship from B to A
 */
export function getInverseRelationship(type: RelationType): RelationType {
  return INVERSE_RELATIONSHIPS[type] || type;
}

// Simple relationship structure for inferred relationships
interface InferredRelationship {
  memberId: MemberId;
  type: RelationType;
}

/**
 * Infer additional relationships based on existing ones
 * For example: If A is B's parent and C is B's spouse, then A is C's parent-in-law
 */
export function inferRelationships(members: VrikshaMember[]): InferredRelationship[] {
  const inferred: InferredRelationship[] = [];
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  members.forEach(member => {
    if (!member.relationships) return;
    
    member.relationships.forEach(rel => {
      const related = memberMap.get(rel.memberId);
      if (!related) return;
      
      // Check if inverse relationship exists on the related member
      const inverseType = getInverseRelationship(rel.type);
      const hasInverse = related.relationships?.some(
        r => r.memberId === member.id && r.type === inverseType
      );
      
      if (!hasInverse) {
        inferred.push({
          memberId: member.id,
          type: inverseType,
        });
      }
      
      // Infer sibling relationships through shared parents
      if (rel.type === 'parent') {
        // Find other children of this parent
        const parent = memberMap.get(rel.memberId);
        if (parent?.relationships) {
          parent.relationships
            .filter(r => r.type === 'child' && r.memberId !== member.id)
            .forEach(siblingRel => {
              const hasSibling = member.relationships?.some(
                r => r.memberId === siblingRel.memberId && r.type === 'sibling'
              );
              if (!hasSibling) {
                inferred.push({
                  memberId: siblingRel.memberId,
                  type: 'sibling',
                });
              }
            });
        }
      }
    });
  });
  
  return inferred;
}

/**
 * Creates a complete relationship set with all inferred relationships
 */
export function completeRelationships(
  fromMemberId: MemberId,
  toMemberId: MemberId,
  relationshipType: RelationType,
  members: VrikshaMember[]
): { from: InferredRelationship; to: InferredRelationship } {
  const toMember = members.find(m => m.id === toMemberId);
  const inverseType = getInverseRelationship(relationshipType);
  
  return {
    from: {
      memberId: toMemberId,
      type: relationshipType,
    },
    to: {
      memberId: fromMemberId,
      type: inverseType,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP PATH FINDING - How are two members related?
// ═══════════════════════════════════════════════════════════

export interface RelationshipPath {
  from: MemberId;
  to: MemberId;
  path: Array<{ memberId: MemberId; relationship: RelationType }>;
  description: string;
}

/**
 * Finds the relationship path between two members using BFS
 */
export function findRelationshipPath(
  graph: FamilyGraph,
  fromId: MemberId,
  toId: MemberId
): RelationshipPath | null {
  const fromNode = graph.nodes.get(fromId);
  const toNode = graph.nodes.get(toId);
  
  if (!fromNode || !toNode) return null;
  if (fromId === toId) {
    return { from: fromId, to: toId, path: [], description: 'Self' };
  }
  
  // BFS to find shortest path
  const visited = new Set<MemberId>();
  const queue: Array<{
    node: FamilyTreeNode;
    path: Array<{ memberId: MemberId; relationship: RelationType }>;
  }> = [{ node: fromNode, path: [] }];
  
  visited.add(fromId);
  
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    
    // Get all adjacent nodes with relationship types
    const adjacents: Array<{ node: FamilyTreeNode; rel: RelationType }> = [];
    
    if (node.parent) adjacents.push({ node: node.parent, rel: 'parent' });
    if (node.otherParent) adjacents.push({ node: node.otherParent, rel: 'parent' });
    if (node.spouse) adjacents.push({ node: node.spouse, rel: 'spouse' });
    node.children.forEach(c => adjacents.push({ node: c, rel: 'child' }));
    node.siblings.forEach(s => adjacents.push({ node: s, rel: 'sibling' }));
    
    for (const { node: adj, rel } of adjacents) {
      if (visited.has(adj.member.id)) continue;
      
      const newPath = [...path, { memberId: adj.member.id, relationship: rel }];
      
      if (adj.member.id === toId) {
        return {
          from: fromId,
          to: toId,
          path: newPath,
          description: describeRelationship(newPath),
        };
      }
      
      visited.add(adj.member.id);
      queue.push({ node: adj, path: newPath });
    }
  }
  
  return null;
}

/**
 * Describes a relationship path in human-readable form
 */
function describeRelationship(
  path: Array<{ memberId: MemberId; relationship: RelationType }>
): string {
  if (path.length === 0) return 'Self';
  if (path.length === 1) {
    return capitalizeFirst(path[0].relationship);
  }
  
  // Common patterns
  const relSequence = path.map(p => p.relationship);
  
  // Parent's parent = Grandparent
  if (relSequence.join(',') === 'parent,parent') return 'Grandparent';
  if (relSequence.join(',') === 'child,child') return 'Grandchild';
  
  // Parent's sibling = Uncle/Aunt
  if (relSequence.join(',') === 'parent,sibling') return 'Uncle/Aunt';
  
  // Sibling's child = Nephew/Niece
  if (relSequence.join(',') === 'sibling,child') return 'Nephew/Niece';
  
  // Parent's sibling's child = Cousin
  if (relSequence.join(',') === 'parent,sibling,child') return 'Cousin';
  
  // Spouse's parent = Parent-in-law
  if (relSequence.join(',') === 'spouse,parent') return 'Parent-in-law';
  
  // Child's spouse = Child-in-law
  if (relSequence.join(',') === 'child,spouse') return 'Child-in-law';
  
  // Fallback: list the path
  return relSequence.map(r => capitalizeFirst(r)).join(' → ');
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ═══════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get display name for a relationship type based on target member's gender
 */
export function getRelationshipDisplayName(
  type: RelationType,
  targetGender?: 'male' | 'female' | 'other'
): string {
  const genderMapping = GENDERED_RELATIONSHIPS[type];
  if (!genderMapping) return capitalizeFirst(type);
  
  if (targetGender === 'male') return genderMapping.male;
  if (targetGender === 'female') return genderMapping.female;
  return genderMapping.neutral;
}

/**
 * Get all possible relationship types for UI selection
 */
export function getAllRelationTypes(): Array<{ value: RelationType; label: string }> {
  return [
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'nephew', label: 'Nephew' },
    { value: 'niece', label: 'Niece' },
    { value: 'cousin', label: 'Cousin' },
    { value: 'in_law', label: 'In-law' },
  ];
}
