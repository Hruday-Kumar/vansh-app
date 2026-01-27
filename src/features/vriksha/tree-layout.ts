/**
 * 🌳 SUBTREE WIDTH LAYOUT ALGORITHM
 * ═══════════════════════════════════════════════════════════
 * 
 * A proper hierarchical tree layout using SUBTREE WIDTH calculation.
 * 
 * ALGORITHM OVERVIEW:
 * ───────────────────
 * 1. Build parent→child adjacency from direct relationships only
 * 2. Calculate GENERATION via topological sort (parents above children)
 * 3. Group nodes by generation, pair spouses together
 * 4. BOTTOM-UP: Calculate subtree width for each family unit
 * 5. TOP-DOWN: Assign X positions using subtree widths
 * 6. Create orthogonal "bracket" connectors
 * 
 * KEY PRINCIPLES:
 * ───────────────
 * ✓ Parents ABOVE children (smaller Y)
 * ✓ Spouses side-by-side as a UNIT
 * ✓ Children centered below their parents
 * ✓ NO OVERLAP between subtrees
 * ✓ Orthogonal H-Layout connections
 */

import type { Connector, FamilyNode, LayoutNode, PersonData, TreeLayout } from './types';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

export const NODE_WIDTH = 110;
export const NODE_HEIGHT = 130;
export const SPOUSE_GAP = 30;          // Horizontal gap between spouses
export const SIBLING_GAP = 50;         // Horizontal gap between siblings
export const GENERATION_GAP = 120;     // Vertical gap between generations
export const SUBTREE_GAP = 40;         // Gap between separate family subtrees

// ═══════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════

interface FamilyUnit {
  id: string;                    // Unique ID for this unit
  members: FamilyNode[];         // 1 or 2 members (single or couple)
  children: string[];            // Child node IDs (combined from all members)
  subtreeWidth: number;          // Calculated width of entire subtree
  x: number;                     // Center X position of this unit
  y: number;                     // Y position (generation row)
}

// ═══════════════════════════════════════════════════════════
// MAIN LAYOUT FUNCTION
// ═══════════════════════════════════════════════════════════

export function calculateTreeLayout(
  nodes: FamilyNode[],
  personData: Map<string, PersonData>,
  rootId: string
): TreeLayout {
  if (nodes.length === 0) {
    return emptyLayout();
  }
  
  // Build lookup map
  const nodeMap = new Map<string, FamilyNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  // Validate root exists
  if (!nodeMap.has(rootId)) {
    rootId = nodes[0].id;
  }
  
  // ═══════════ STEP 1: Calculate Generations ═══════════
  const generations = calculateGenerations(nodes, nodeMap, rootId);
  
  // ═══════════ STEP 2: Create Family Units ═══════════
  const { familyUnits, nodeToUnit } = createFamilyUnits(nodes, nodeMap, generations);
  
  // ═══════════ STEP 3: Build Parent→Child Unit Graph ═══════════
  const childrenByUnit = buildUnitGraph(familyUnits, nodeToUnit, nodeMap, generations);
  
  // ═══════════ STEP 4: Calculate Subtree Widths (Bottom-Up) ═══════════
  calculateSubtreeWidths(familyUnits, childrenByUnit);
  
  // ═══════════ STEP 5: Assign X,Y Positions (Top-Down) ═══════════
  const positions = assignPositions(familyUnits, childrenByUnit, generations, rootId, nodeToUnit);
  
  // ═══════════ STEP 6: Create Layout Nodes ═══════════
  const layoutNodes = createLayoutNodes(nodes, positions, generations, personData, rootId);
  
  // ═══════════ STEP 7: Create Connectors ═══════════
  const connectors = createConnectors(layoutNodes, familyUnits, nodeToUnit, nodeMap);
  
  // ═══════════ STEP 8: Calculate Bounds ═══════════
  const bounds = calculateBounds(layoutNodes);
  
  return { nodes: layoutNodes, connectors, bounds };
}

function emptyLayout(): TreeLayout {
  return { 
    nodes: [], 
    connectors: [], 
    bounds: { width: 0, height: 0, minX: 0, minY: 0 } 
  };
}

// ═══════════════════════════════════════════════════════════
// STEP 1: GENERATION CALCULATION (Topological Sort)
// ═══════════════════════════════════════════════════════════

function calculateGenerations(
  nodes: FamilyNode[],
  nodeMap: Map<string, FamilyNode>,
  rootId: string
): Map<string, number> {
  const generations = new Map<string, number>();
  
  // SIMPLIFIED APPROACH: Use BFS from root, following ONLY children arrays
  // This handles cycles by tracking visited nodes
  
  console.log('🌳 [Generations] Using BFS from root:', rootId.substring(0, 8));
  
  const visited = new Set<string>();
  const queue: { id: string; gen: number }[] = [];
  
  // Start from root at generation 0
  queue.push({ id: rootId, gen: 0 });
  generations.set(rootId, 0);
  visited.add(rootId);
  
  while (queue.length > 0) {
    const { id: currentId, gen: currentGen } = queue.shift()!;
    const node = nodeMap.get(currentId);
    
    if (!node) continue;
    
    // Process PARENTS - they go to generation-1 (older = smaller generation number)
    node.parents.forEach(parentRel => {
      if (!nodeMap.has(parentRel.id)) return;
      if (visited.has(parentRel.id)) {
        console.log(`🌳 [Generations] ⚠️ Skipping parent cycle: ${currentId.substring(0, 8)} → ${parentRel.id.substring(0, 8)}`);
        return;
      }
      
      visited.add(parentRel.id);
      const parentGen = currentGen - 1;  // Parents are one generation ABOVE (smaller number)
      generations.set(parentRel.id, parentGen);
      queue.push({ id: parentRel.id, gen: parentGen });
      console.log(`🌳 [Generations] Parent ${parentRel.id.substring(0, 8)} → gen ${parentGen}`);
    });
    
    // Process CHILDREN - they go to generation+1 (younger = larger generation number)
    node.children.forEach(childRel => {
      if (!nodeMap.has(childRel.id)) return;
      if (visited.has(childRel.id)) {
        console.log(`🌳 [Generations] ⚠️ Skipping child cycle: ${currentId.substring(0, 8)} → ${childRel.id.substring(0, 8)}`);
        return;
      }
      
      visited.add(childRel.id);
      const childGen = currentGen + 1;  // Children are one generation BELOW (larger number)
      generations.set(childRel.id, childGen);
      queue.push({ id: childRel.id, gen: childGen });
      console.log(`🌳 [Generations] Child ${childRel.id.substring(0, 8)} → gen ${childGen}`);
    });
    
    // Process SPOUSES - same generation
    node.spouses.forEach(spouseRel => {
      if (!nodeMap.has(spouseRel.id)) return;
      if (visited.has(spouseRel.id)) return;
      
      visited.add(spouseRel.id);
      generations.set(spouseRel.id, currentGen);
      queue.push({ id: spouseRel.id, gen: currentGen });
      console.log(`🌳 [Generations] Spouse ${spouseRel.id.substring(0, 8)} → gen ${currentGen}`);
    });
    
    // Process SIBLINGS - same generation (share at least one parent)
    node.siblings.forEach(siblingRel => {
      if (!nodeMap.has(siblingRel.id)) return;
      if (visited.has(siblingRel.id)) return;
      
      visited.add(siblingRel.id);
      generations.set(siblingRel.id, currentGen);
      queue.push({ id: siblingRel.id, gen: currentGen });
      console.log(`🌳 [Generations] Sibling ${siblingRel.id.substring(0, 8)} → gen ${currentGen}`);
    });
  }
  
  console.log(`🌳 [Generations] Visited ${visited.size} nodes from root`);
  
  // Handle disconnected nodes - put them at generation 0
  nodes.forEach(node => {
    if (!generations.has(node.id)) {
      generations.set(node.id, 0);
      console.log(`🌳 [Generations] Disconnected node ${node.id.substring(0, 8)} → gen 0`);
    }
  });
  
  console.log('🌳 [Generations] Final:', Array.from(generations.entries()).map(([id, gen]) => `${id.substring(0, 8)}=${gen}`).join(', '));
  
  // Normalize so minimum generation is 0
  const minGen = Math.min(...Array.from(generations.values()));
  if (minGen !== 0) {
    generations.forEach((gen, id) => {
      generations.set(id, gen - minGen);
    });
  }
  
  return generations;
}

// ═══════════════════════════════════════════════════════════
// STEP 2: CREATE FAMILY UNITS (Spouse pairs)
// ═══════════════════════════════════════════════════════════

function createFamilyUnits(
  nodes: FamilyNode[],
  nodeMap: Map<string, FamilyNode>,
  generations: Map<string, number>
): { familyUnits: Map<string, FamilyUnit>; nodeToUnit: Map<string, string> } {
  const familyUnits = new Map<string, FamilyUnit>();
  const nodeToUnit = new Map<string, string>();
  const processed = new Set<string>();
  
  nodes.forEach(node => {
    if (processed.has(node.id)) return;
    
    const members: FamilyNode[] = [node];
    processed.add(node.id);
    
    // Find spouse in same generation
    node.spouses.forEach(spouseRel => {
      const spouse = nodeMap.get(spouseRel.id);
      if (!spouse || processed.has(spouse.id)) return;
      
      // Only pair if same generation
      const nodeGen = generations.get(node.id) ?? 0;
      const spouseGen = generations.get(spouse.id) ?? 0;
      if (nodeGen === spouseGen) {
        members.push(spouse);
        processed.add(spouse.id);
      }
    });
    
    // Sort: male first (consistent ordering)
    members.sort((a, b) => {
      if (a.gender === 'male' && b.gender !== 'male') return -1;
      if (a.gender !== 'male' && b.gender === 'male') return 1;
      return 0;
    });
    
    // Collect all children from all members
    const childrenSet = new Set<string>();
    members.forEach(m => {
      m.children.forEach(c => {
        if (nodeMap.has(c.id)) {
          childrenSet.add(c.id);
        }
      });
    });
    
    // Create unit
    const unitId = members.map(m => m.id).join('+');
    const unit: FamilyUnit = {
      id: unitId,
      members,
      children: Array.from(childrenSet),
      subtreeWidth: 0,
      x: 0,
      y: (generations.get(node.id) ?? 0) * (NODE_HEIGHT + GENERATION_GAP),
    };
    
    familyUnits.set(unitId, unit);
    members.forEach(m => nodeToUnit.set(m.id, unitId));
  });
  
  return { familyUnits, nodeToUnit };
}

// ═══════════════════════════════════════════════════════════
// STEP 3: BUILD UNIT GRAPH (Parent Unit → Child Units)
// ═══════════════════════════════════════════════════════════

function buildUnitGraph(
  familyUnits: Map<string, FamilyUnit>,
  nodeToUnit: Map<string, string>,
  _nodeMap: Map<string, FamilyNode>,
  generations: Map<string, number>
): Map<string, string[]> {
  const childrenByUnit = new Map<string, string[]>();
  
  familyUnits.forEach((unit, unitId) => {
    const childUnitIds = new Set<string>();
    
    // Get parent's generation (use first member)
    const parentGen = unit.members[0] ? (generations.get(unit.members[0].id) ?? 0) : 0;
    
    unit.children.forEach(childId => {
      const childUnitId = nodeToUnit.get(childId);
      if (!childUnitId || childUnitId === unitId) return;
      
      // IMPORTANT: Only add if child is in a LATER generation
      // This prevents cycles where parent-child relationships are bidirectional
      const childGen = generations.get(childId) ?? 0;
      if (childGen > parentGen) {
        childUnitIds.add(childUnitId);
      }
    });
    
    childrenByUnit.set(unitId, Array.from(childUnitIds));
  });
  
  return childrenByUnit;
}

// ═══════════════════════════════════════════════════════════
// STEP 4: CALCULATE SUBTREE WIDTHS (Bottom-Up Recursion)
// ═══════════════════════════════════════════════════════════

function calculateSubtreeWidths(
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>
): void {
  const calculated = new Set<string>();
  const visiting = new Set<string>(); // Cycle detection
  
  function calcWidth(unitId: string): number {
    // Already calculated - return cached
    if (calculated.has(unitId)) {
      return familyUnits.get(unitId)?.subtreeWidth || 0;
    }
    
    // CYCLE DETECTION: If we're currently visiting this node, we have a cycle
    if (visiting.has(unitId)) {
      // Break the cycle by returning the unit's own width
      const unit = familyUnits.get(unitId);
      if (unit) {
        const memberCount = unit.members.length;
        return memberCount * NODE_WIDTH + (memberCount - 1) * SPOUSE_GAP;
      }
      return NODE_WIDTH;
    }
    
    const unit = familyUnits.get(unitId);
    if (!unit) return 0;
    
    // Mark as currently visiting
    visiting.add(unitId);
    
    // This unit's own width
    const memberCount = unit.members.length;
    const ownWidth = memberCount * NODE_WIDTH + (memberCount - 1) * SPOUSE_GAP;
    
    // Children's subtree widths
    const childUnitIds = childrenByUnit.get(unitId) || [];
    
    if (childUnitIds.length === 0) {
      // Leaf node: width = own width
      unit.subtreeWidth = ownWidth;
    } else {
      // Sum of children widths + gaps between them
      let childrenTotalWidth = 0;
      childUnitIds.forEach((childUnitId, index) => {
        childrenTotalWidth += calcWidth(childUnitId);
        if (index < childUnitIds.length - 1) {
          childrenTotalWidth += SIBLING_GAP;
        }
      });
      
      // Subtree width = MAX(own width, children width)
      unit.subtreeWidth = Math.max(ownWidth, childrenTotalWidth);
    }
    
    // Done visiting
    visiting.delete(unitId);
    calculated.add(unitId);
    return unit.subtreeWidth;
  }
  
  // Calculate for all units
  familyUnits.forEach((_, unitId) => {
    calcWidth(unitId);
  });
}

// ═══════════════════════════════════════════════════════════
// STEP 5: ASSIGN POSITIONS (Top-Down Placement)
// ═══════════════════════════════════════════════════════════

function assignPositions(
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>,
  generations: Map<string, number>,
  rootId: string,
  nodeToUnit: Map<string, string>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const unitPositioned = new Set<string>();
  
  // Find root unit
  const rootUnitId = nodeToUnit.get(rootId);
  if (!rootUnitId) {
    // Fallback: position all units left-to-right
    return fallbackPositioning(familyUnits, generations);
  }
  
  // Find all root-level units (units with no parents in the tree)
  const rootUnits = findRootUnits(familyUnits, childrenByUnit);
  
  // Position root units side by side
  let currentX = 0;
  rootUnits.forEach(unitId => {
    const unit = familyUnits.get(unitId);
    if (!unit) return;
    
    const halfWidth = unit.subtreeWidth / 2;
    unit.x = currentX + halfWidth;
    unitPositioned.add(unitId);
    
    // Position children recursively
    positionChildren(unitId, unit.x, familyUnits, childrenByUnit, unitPositioned);
    
    currentX += unit.subtreeWidth + SUBTREE_GAP;
  });
  
  // Convert unit positions to node positions
  familyUnits.forEach(unit => {
    const memberCount = unit.members.length;
    const totalMemberWidth = memberCount * NODE_WIDTH + (memberCount - 1) * SPOUSE_GAP;
    const startX = unit.x - totalMemberWidth / 2;
    
    unit.members.forEach((member, index) => {
      const x = startX + index * (NODE_WIDTH + SPOUSE_GAP);
      const y = unit.y;
      positions.set(member.id, { x, y });
    });
  });
  
  return positions;
}

function findRootUnits(
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>
): string[] {
  // Units that are not children of any other unit
  const allChildren = new Set<string>();
  childrenByUnit.forEach(children => {
    children.forEach(c => allChildren.add(c));
  });
  
  const rootUnits: string[] = [];
  familyUnits.forEach((_, unitId) => {
    if (!allChildren.has(unitId)) {
      rootUnits.push(unitId);
    }
  });
  
  return rootUnits;
}

function positionChildren(
  parentUnitId: string,
  parentCenterX: number,
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>,
  unitPositioned: Set<string>
): void {
  const childUnitIds = childrenByUnit.get(parentUnitId) || [];
  if (childUnitIds.length === 0) return;
  
  // Calculate total width of children
  let totalChildWidth = 0;
  childUnitIds.forEach((childUnitId, index) => {
    const childUnit = familyUnits.get(childUnitId);
    if (childUnit) {
      totalChildWidth += childUnit.subtreeWidth;
      if (index < childUnitIds.length - 1) {
        totalChildWidth += SIBLING_GAP;
      }
    }
  });
  
  // Start position: center children under parent
  let currentX = parentCenterX - totalChildWidth / 2;
  
  childUnitIds.forEach(childUnitId => {
    if (unitPositioned.has(childUnitId)) return;
    
    const childUnit = familyUnits.get(childUnitId);
    if (!childUnit) return;
    
    // Position this child unit
    const halfWidth = childUnit.subtreeWidth / 2;
    childUnit.x = currentX + halfWidth;
    unitPositioned.add(childUnitId);
    
    // Recursively position grandchildren
    positionChildren(childUnitId, childUnit.x, familyUnits, childrenByUnit, unitPositioned);
    
    currentX += childUnit.subtreeWidth + SIBLING_GAP;
  });
}

function fallbackPositioning(
  familyUnits: Map<string, FamilyUnit>,
  generations: Map<string, number>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group by generation
  const genGroups = new Map<number, FamilyUnit[]>();
  familyUnits.forEach(unit => {
    const gen = unit.members[0] ? (generations.get(unit.members[0].id) ?? 0) : 0;
    if (!genGroups.has(gen)) genGroups.set(gen, []);
    genGroups.get(gen)!.push(unit);
  });
  
  // Position each generation row
  genGroups.forEach((units, gen) => {
    let x = 0;
    units.forEach(unit => {
      unit.members.forEach((member, idx) => {
        positions.set(member.id, { 
          x: x + idx * (NODE_WIDTH + SPOUSE_GAP),
          y: gen * (NODE_HEIGHT + GENERATION_GAP)
        });
      });
      x += unit.members.length * (NODE_WIDTH + SPOUSE_GAP) + SUBTREE_GAP;
    });
  });
  
  return positions;
}

// ═══════════════════════════════════════════════════════════
// STEP 6: CREATE LAYOUT NODES
// ═══════════════════════════════════════════════════════════

function createLayoutNodes(
  nodes: FamilyNode[],
  positions: Map<string, { x: number; y: number }>,
  generations: Map<string, number>,
  personData: Map<string, PersonData>,
  rootId: string
): LayoutNode[] {
  return nodes.map(node => {
    const pos = positions.get(node.id) || { x: 0, y: 0 };
    const gen = generations.get(node.id) ?? 0;
    
    return {
      ...node,
      x: pos.x,
      y: pos.y,
      generation: gen,
      column: 0,
      person: personData.get(node.id),
      relationToRoot: getGenerationLabel(gen, node.id === rootId),
    };
  });
}

function getGenerationLabel(gen: number, isRoot: boolean): string {
  if (isRoot) return 'Self';
  if (gen === -1) return 'Parent';
  if (gen === -2) return 'Grandparent';
  if (gen === -3) return 'Great-Grandparent';
  if (gen === 1) return 'Child';
  if (gen === 2) return 'Grandchild';
  if (gen === 3) return 'Great-Grandchild';
  if (gen < -3) return `${Math.abs(gen) - 2}x Great-Grandparent`;
  if (gen > 3) return `${gen - 2}x Great-Grandchild`;
  if (gen === 0) return 'Same Gen';
  return '';
}

// ═══════════════════════════════════════════════════════════
// STEP 7: CREATE CONNECTORS (Orthogonal H-Layout)
// ═══════════════════════════════════════════════════════════

function createConnectors(
  layoutNodes: LayoutNode[],
  familyUnits: Map<string, FamilyUnit>,
  nodeToUnit: Map<string, string>,
  _nodeMap: Map<string, FamilyNode>
): Connector[] {
  const connectors: Connector[] = [];
  const nodePositions = new Map<string, LayoutNode>();
  layoutNodes.forEach(n => nodePositions.set(n.id, n));
  
  const processedSpouse = new Set<string>();
  const processedParentChild = new Set<string>();
  
  // ═══════════ SPOUSE CONNECTORS ═══════════
  familyUnits.forEach(unit => {
    if (unit.members.length === 2) {
      const [m1, m2] = unit.members;
      const n1 = nodePositions.get(m1.id);
      const n2 = nodePositions.get(m2.id);
      
      if (n1 && n2) {
        const pairKey = [m1.id, m2.id].sort().join('-');
        if (!processedSpouse.has(pairKey)) {
          processedSpouse.add(pairKey);
          
          // Horizontal line between spouses at their vertical center
          const y = n1.y + NODE_HEIGHT * 0.4;
          const leftNode = n1.x < n2.x ? n1 : n2;
          const rightNode = n1.x < n2.x ? n2 : n1;
          const fromX = leftNode.x + NODE_WIDTH;
          const toX = rightNode.x;
          
          connectors.push({
            type: 'spouse',
            from: { id: m1.id, x: fromX, y },
            to: { id: m2.id, x: toX, y },
            style: 'solid',
            color: '#E11D48', // Rose red
            label: '❤️',
          });
        }
      }
    }
  });
  
  // ═══════════ PARENT-CHILD CONNECTORS (Bracket Style) ═══════════
  familyUnits.forEach(unit => {
    if (unit.children.length === 0) return;
    
    // Calculate the DROP POINT: center of the parent unit (or spouse line midpoint)
    let dropX: number;
    let dropY: number;
    
    if (unit.members.length === 2) {
      // Spouses: drop from center of spouse line
      const n1 = nodePositions.get(unit.members[0].id);
      const n2 = nodePositions.get(unit.members[1].id);
      if (!n1 || !n2) return;
      
      dropX = (n1.x + n2.x + NODE_WIDTH) / 2;
      dropY = n1.y + NODE_HEIGHT * 0.4; // Same Y as spouse connector
    } else {
      // Single parent: drop from bottom center
      const n1 = nodePositions.get(unit.members[0].id);
      if (!n1) return;
      
      dropX = n1.x + NODE_WIDTH / 2;
      dropY = n1.y + NODE_HEIGHT;
    }
    
    // Collect child positions
    const childNodes: LayoutNode[] = [];
    unit.children.forEach(childId => {
      const childNode = nodePositions.get(childId);
      if (childNode) {
        childNodes.push(childNode);
      }
    });
    
    if (childNodes.length === 0) return;
    
    // Sort children by X position
    childNodes.sort((a, b) => a.x - b.x);
    
    // Create bracket connector for each child
    childNodes.forEach(child => {
      const pairKey = `parent-${unit.id}-child-${child.id}`;
      if (processedParentChild.has(pairKey)) return;
      processedParentChild.add(pairKey);
      
      const childCenterX = child.x + NODE_WIDTH / 2;
      
      // The connector stores the bracket waypoints for orthogonal drawing
      connectors.push({
        type: 'parent-child',
        from: { 
          id: unit.members[0].id, 
          x: dropX, 
          y: dropY
        },
        to: { 
          id: child.id, 
          x: childCenterX, 
          y: child.y 
        },
        style: 'solid',
        color: '#6366F1', // Indigo
      });
    });
  });
  
  return connectors;
}

// ═══════════════════════════════════════════════════════════
// STEP 8: CALCULATE BOUNDS
// ═══════════════════════════════════════════════════════════

function calculateBounds(nodes: LayoutNode[]) {
  if (nodes.length === 0) {
    return { width: 0, height: 0, minX: 0, minY: 0 };
  }
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + NODE_HEIGHT);
  });
  
  return {
    width: maxX - minX + 200,
    height: maxY - minY + 200,
    minX: minX - 100,
    minY: minY - 100,
  };
}

// ═══════════════════════════════════════════════════════════
// MEMBER TO NODE CONVERSION
// ═══════════════════════════════════════════════════════════

export function membersToFamilyNodes(
  members: any[],
  relationships: { fromId: string; toId: string; type: string }[]
): { nodes: FamilyNode[]; personData: Map<string, PersonData> } {
  const personData = new Map<string, PersonData>();
  
  // Build relationship lookup
  // IMPORTANT: The backend ALREADY provides bi-directional relationships.
  // Each relationship appears TWICE in the data:
  //   - From parent's perspective: {fromId: parent, toId: child, type: 'parent'}
  //   - From child's perspective: {fromId: child, toId: parent, type: 'child'} (auto-reversed by backend)
  // 
  // CORRECTED Relationship semantics from the backend:
  //   {fromId, toId, type='parent'} means: "toId is the parent of fromId"
  //   {fromId, toId, type='child'} means: "toId is the child of fromId"
  //
  // Example: Hruday's relationships include "parent→Vijaya" meaning Vijaya is Hruday's parent
  //
  // So we DON'T need to create reverse relationships - they already exist!
  console.log('🌳 [RelMap] Processing relationships (bi-directional data from backend)...');
  const relMap = new Map<string, { id: string; type: string; originalType: string }[]>();
  let parentRelCount = 0;
  let childRelCount = 0;
  let spouseRelCount = 0;
  let siblingRelCount = 0;
  let ignoredRelCount = 0;
  
  relationships.forEach(rel => {
    const relType = rel.type.toLowerCase();
    
    // Initialize the relationship list for this member if not exists
    if (!relMap.has(rel.fromId)) relMap.set(rel.fromId, []);
    
    if (relType === 'parent' || relType === 'father' || relType === 'mother' ||
        relType === 'step_father' || relType === 'step_mother') {
      // CORRECTED: type='parent' means "fromId IS the parent of toId"
      // Database stores: {from: grandpa, to: child, type: 'parent'} = grandpa is parent of child
      // So fromId should add toId to their CHILDREN list (fromId is the parent)
      relMap.get(rel.fromId)!.push({
        id: rel.toId,
        type: 'child',  // fromId sees toId as their CHILD (because fromId is the parent)
        originalType: relType
      });
      childRelCount++;
    } else if (relType === 'child' || relType === 'son' || relType === 'daughter' ||
               relType === 'step_son' || relType === 'step_daughter' ||
               relType === 'adopted_son' || relType === 'adopted_daughter') {
      // CORRECTED: type='child' means "fromId IS the child of toId"
      // So fromId should add toId to their PARENTS list (toId is the parent)
      relMap.get(rel.fromId)!.push({
        id: rel.toId,
        type: 'parent',  // fromId sees toId as their PARENT (because fromId is the child)
        originalType: relType
      });
      parentRelCount++;
    } else if (relType === 'spouse' || relType === 'husband' || relType === 'wife') {
      // fromId is married to toId
      relMap.get(rel.fromId)!.push({
        id: rel.toId,
        type: 'spouse',
        originalType: relType
      });
      spouseRelCount++;
    } else if (relType === 'sibling' || relType === 'brother' || relType === 'sister' ||
               relType === 'half_brother' || relType === 'half_sister') {
      // fromId is sibling of toId
      relMap.get(rel.fromId)!.push({
        id: rel.toId,
        type: 'sibling',
        originalType: relType
      });
      siblingRelCount++;
    } else {
      // NOTE: grandparent/grandchild/uncle/aunt/cousin etc. are IGNORED
      // They are derived relationships and shouldn't affect tree structure
      ignoredRelCount++;
    }
  });
  
  console.log(`🌳 [RelMap] Processed: parents=${parentRelCount}, children=${childRelCount}, spouses=${spouseRelCount}, siblings=${siblingRelCount}, ignored=${ignoredRelCount}`);
  
  // COMPREHENSIVE relationship type detection
  // IMPORTANT: Only DIRECT parent/child relationships build the tree structure
  // Grandparents, uncles, cousins etc. are DERIVED relationships computed from the tree
  
  // These are DIRECT parent types (one generation above)
  const isDirectParentType = (type: string): boolean => {
    const t = type.toLowerCase();
    return t === 'parent' || t === 'father' || t === 'mother' ||
           t === 'step_father' || t === 'step_mother';
    // NOTE: grandparent, great_grandparent are NOT direct parents
  };
  
  // These are DIRECT child types (one generation below)
  const isDirectChildType = (type: string): boolean => {
    const t = type.toLowerCase();
    return t === 'child' || t === 'son' || t === 'daughter' ||
           t === 'step_son' || t === 'step_daughter' ||
           t === 'adopted_son' || t === 'adopted_daughter';
    // NOTE: grandson, granddaughter are NOT direct children
  };
  
  // Spouse types
  const isSpouseType = (type: string): boolean => {
    const t = type.toLowerCase();
    return t === 'spouse' || t === 'husband' || t === 'wife';
  };
  
  // Sibling types
  const isSiblingType = (type: string): boolean => {
    const t = type.toLowerCase();
    return t === 'sibling' || t === 'brother' || t === 'sister' ||
           t === 'half_brother' || t === 'half_sister';
  };
  
  const nodes: FamilyNode[] = members.map(m => {
    personData.set(m.id, {
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      maidenName: m.maidenName,
      gender: m.gender || 'other',
      birthDate: m.birthDate,
      deathDate: m.deathDate,
      isAlive: m.isAlive ?? true,
      birthPlace: m.birthPlace,
      currentCity: m.currentCity,
      photoUri: m.avatarUri,
      occupation: m.occupation,
      bio: m.bio,
      memoryCount: m.memoryCount ?? 0,
      kathaCount: m.kathaCount ?? 0,
    });
    
    const rels = relMap.get(m.id) || [];
    
    const parents: { id: string; type: 'blood' | 'adopted' }[] = [];
    const children: { id: string; type: 'blood' | 'adopted' }[] = [];
    const spouses: { id: string; type: 'married' | 'divorced' }[] = [];
    const siblings: { id: string; type: 'blood' | 'half' | 'step' }[] = [];
    
    rels.forEach(r => {
      // Now r.type is already normalized to 'parent', 'child', 'spouse', or 'sibling'
      const relType = r.type;
      const origType = r.originalType.toLowerCase();
      
      if (relType === 'parent') {
        const type = origType.includes('step') ? 'adopted' : 'blood';
        if (!parents.find(p => p.id === r.id)) {
          parents.push({ id: r.id, type });
        }
      } else if (relType === 'child') {
        const type = origType.includes('adopted') || origType.includes('step') ? 'adopted' : 'blood';
        if (!children.find(c => c.id === r.id)) {
          children.push({ id: r.id, type });
        }
      } else if (relType === 'spouse') {
        if (!spouses.find(s => s.id === r.id)) {
          spouses.push({ id: r.id, type: 'married' });
        }
      } else if (relType === 'sibling') {
        const sibType = origType.includes('half') ? 'half' : 'blood';
        if (!siblings.find(s => s.id === r.id)) {
          siblings.push({ id: r.id, type: sibType });
        }
      }
    });
    
    return {
      id: m.id,
      gender: m.gender || 'other',
      parents,
      children,
      spouses,
      siblings,
    };
  });
  
  return { nodes, personData };
}

function categorizeRelationType(type: string): 'parent' | 'child' | 'spouse' | 'sibling' | 'other' {
  const PARENT_TYPES = ['parent', 'father', 'mother', 'step_father', 'step_mother'];
  const CHILD_TYPES = ['child', 'son', 'daughter', 'step_son', 'step_daughter', 'adopted_son', 'adopted_daughter'];
  const SPOUSE_TYPES = ['spouse', 'husband', 'wife'];
  const SIBLING_TYPES = ['sibling', 'brother', 'sister', 'half_brother', 'half_sister'];
  
  if (PARENT_TYPES.includes(type)) return 'parent';
  if (CHILD_TYPES.includes(type)) return 'child';
  if (SPOUSE_TYPES.includes(type)) return 'spouse';
  if (SIBLING_TYPES.includes(type)) return 'sibling';
  return 'other';
}

function getReverseRelationType(type: string): string {
  const t = type.toLowerCase();
  
  // Parent ↔ Child reversals
  if (t === 'father' || t === 'mother' || t === 'parent') return 'child';
  if (t === 'son' || t === 'daughter' || t === 'child') return 'parent';
  
  // Step-parent ↔ Step-child
  if (t === 'step_father' || t === 'step_mother') return 'step_child';
  if (t === 'step_son' || t === 'step_daughter') return 'step_parent';
  
  // Adopted
  if (t === 'adopted_son' || t === 'adopted_daughter') return 'parent';
  
  // Grandparent ↔ Grandchild
  if (t.includes('grandfather') || t.includes('grandmother')) return 'grandchild';
  if (t === 'grandson' || t === 'granddaughter') return 'grandparent';
  
  // Great-grandparent ↔ Great-grandchild
  if (t === 'great_grandfather' || t === 'great_grandmother') return 'great_grandchild';
  if (t === 'great_grandson' || t === 'great_granddaughter') return 'great_grandparent';
  
  // Spouse (symmetric)
  if (t === 'spouse') return 'spouse';
  if (t === 'husband') return 'wife';
  if (t === 'wife') return 'husband';
  
  // Siblings (symmetric)
  if (t === 'sibling' || t === 'brother' || t === 'sister') return 'sibling';
  if (t === 'half_brother' || t === 'half_sister') return t;
  
  // Uncle/Aunt ↔ Nephew/Niece
  if (t.includes('uncle') || t.includes('aunt')) return 'nephew_niece';
  if (t === 'nephew' || t === 'niece') return 'uncle_aunt';
  
  // Cousins (symmetric)
  if (t.includes('cousin')) return 'cousin';
  
  // In-laws (various)
  if (t === 'father_in_law' || t === 'mother_in_law') return 'child_in_law';
  if (t === 'son_in_law' || t === 'daughter_in_law') return 'parent_in_law';
  if (t === 'brother_in_law' || t === 'sister_in_law') return 'sibling_in_law';
  
  return type;
}
