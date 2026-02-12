/**
 * 🌳 TREE LAYOUT ALGORITHM
 * ═══════════════════════════════════════════════════════════
 * 
 * A proper hierarchical tree layout using SUBTREE WIDTH calculation.
 * 
 * ALGORITHM:
 * 1. BFS from root to assign generations
 * 2. Pair spouses into family units
 * 3. Build parent→child unit graph
 * 4. Bottom-up subtree width calculation
 * 5. Top-down position assignment (centers children under parents)
 * 6. Create orthogonal bracket connectors
 * 
 * FIXED:
 * ✓ Single-child properly centered under parents
 * ✓ NODE_HEIGHT/WIDTH consistent with animated-member-node
 * ✓ No excessive console.log
 * ✓ No duplicate code or dead functions
 * ✓ Clean relationship mapping (no legacy inversion)
 */

import type { Connector, FamilyNode, LayoutNode, PersonData, TreeLayout } from './types';

// ═══════════════════════════════════════════════════════════
// CONSTANTS — must match animated-member-node.tsx!
// ═══════════════════════════════════════════════════════════

export const NODE_WIDTH = 120;
export const NODE_HEIGHT = 150;
export const SPOUSE_GAP = 40;
export const SIBLING_GAP = 50;
export const GENERATION_GAP = 120;
export const SUBTREE_GAP = 40;

// ═══════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════

interface FamilyUnit {
  id: string;
  members: FamilyNode[];
  children: string[];
  subtreeWidth: number;
  x: number;
  y: number;
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
    return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
  }

  const nodeMap = new Map<string, FamilyNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  if (!nodeMap.has(rootId)) rootId = nodes[0].id;

  const generations = calculateGenerations(nodes, nodeMap, rootId);
  const { familyUnits, nodeToUnit } = createFamilyUnits(nodes, nodeMap, generations);
  const childrenByUnit = buildUnitGraph(familyUnits, nodeToUnit, generations);
  calculateSubtreeWidths(familyUnits, childrenByUnit);
  const positions = assignPositions(familyUnits, childrenByUnit, generations, rootId, nodeToUnit);
  const layoutNodes = createLayoutNodes(nodes, positions, generations, personData, rootId);
  const connectors = createConnectors(layoutNodes, familyUnits, nodeToUnit);
  const bounds = calculateBounds(layoutNodes);

  return { nodes: layoutNodes, connectors, bounds };
}

// ═══════════════════════════════════════════════════════════
// STEP 1: GENERATION CALCULATION (BFS from root)
// ═══════════════════════════════════════════════════════════

function calculateGenerations(
  nodes: FamilyNode[],
  nodeMap: Map<string, FamilyNode>,
  rootId: string
): Map<string, number> {
  const generations = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; gen: number }[] = [{ id: rootId, gen: 0 }];
  generations.set(rootId, 0);
  visited.add(rootId);

  while (queue.length > 0) {
    const { id: currentId, gen: currentGen } = queue.shift()!;
    const node = nodeMap.get(currentId);
    if (!node) continue;

    // Parents → gen - 1
    for (const parentRel of node.parents) {
      if (!nodeMap.has(parentRel.id) || visited.has(parentRel.id)) continue;
      visited.add(parentRel.id);
      generations.set(parentRel.id, currentGen - 1);
      queue.push({ id: parentRel.id, gen: currentGen - 1 });
    }

    // Children → gen + 1
    for (const childRel of node.children) {
      if (!nodeMap.has(childRel.id) || visited.has(childRel.id)) continue;
      visited.add(childRel.id);
      generations.set(childRel.id, currentGen + 1);
      queue.push({ id: childRel.id, gen: currentGen + 1 });
    }

    // Spouses → same gen
    for (const spouseRel of node.spouses) {
      if (!nodeMap.has(spouseRel.id) || visited.has(spouseRel.id)) continue;
      visited.add(spouseRel.id);
      generations.set(spouseRel.id, currentGen);
      queue.push({ id: spouseRel.id, gen: currentGen });
    }

    // Siblings → same gen
    for (const siblingRel of node.siblings) {
      if (!nodeMap.has(siblingRel.id) || visited.has(siblingRel.id)) continue;
      visited.add(siblingRel.id);
      generations.set(siblingRel.id, currentGen);
      queue.push({ id: siblingRel.id, gen: currentGen });
    }

    // Cousins → same gen
    if (node.cousins) {
      for (const cousinRel of node.cousins) {
        if (!nodeMap.has(cousinRel.id) || visited.has(cousinRel.id)) continue;
        visited.add(cousinRel.id);
        generations.set(cousinRel.id, currentGen);
        queue.push({ id: cousinRel.id, gen: currentGen });
      }
    }
  }

  // Disconnected nodes → gen 0
  nodes.forEach(node => {
    if (!generations.has(node.id)) generations.set(node.id, 0);
  });

  // Normalize minimum gen to 0
  const minGen = Math.min(...Array.from(generations.values()));
  if (minGen !== 0) {
    generations.forEach((gen, id) => generations.set(id, gen - minGen));
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
    for (const spouseRel of node.spouses) {
      const spouse = nodeMap.get(spouseRel.id);
      if (!spouse || processed.has(spouse.id)) continue;
      const nodeGen = generations.get(node.id) ?? 0;
      const spouseGen = generations.get(spouse.id) ?? 0;
      if (nodeGen === spouseGen) {
        members.push(spouse);
        processed.add(spouse.id);
      }
    }

    // Sort: male first
    members.sort((a, b) => {
      if (a.gender === 'male' && b.gender !== 'male') return -1;
      if (a.gender !== 'male' && b.gender === 'male') return 1;
      return 0;
    });

    // Collect all children
    const childrenSet = new Set<string>();
    members.forEach(m => {
      m.children.forEach(c => {
        if (nodeMap.has(c.id)) childrenSet.add(c.id);
      });
    });

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
// STEP 3: BUILD UNIT GRAPH
// ═══════════════════════════════════════════════════════════

function buildUnitGraph(
  familyUnits: Map<string, FamilyUnit>,
  nodeToUnit: Map<string, string>,
  generations: Map<string, number>
): Map<string, string[]> {
  const childrenByUnit = new Map<string, string[]>();

  familyUnits.forEach((unit, unitId) => {
    const childUnitIds = new Set<string>();
    const parentGen = unit.members[0] ? (generations.get(unit.members[0].id) ?? 0) : 0;

    unit.children.forEach(childId => {
      const childUnitId = nodeToUnit.get(childId);
      if (!childUnitId || childUnitId === unitId) return;
      const childGen = generations.get(childId) ?? 0;
      if (childGen > parentGen) childUnitIds.add(childUnitId);
    });

    childrenByUnit.set(unitId, Array.from(childUnitIds));
  });

  return childrenByUnit;
}

// ═══════════════════════════════════════════════════════════
// STEP 4: CALCULATE SUBTREE WIDTHS (Bottom-Up)
// ═══════════════════════════════════════════════════════════

function calculateSubtreeWidths(
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>
): void {
  const calculated = new Set<string>();
  const visiting = new Set<string>();

  function calcWidth(unitId: string): number {
    if (calculated.has(unitId)) return familyUnits.get(unitId)?.subtreeWidth || 0;
    if (visiting.has(unitId)) {
      const unit = familyUnits.get(unitId);
      return unit ? unit.members.length * NODE_WIDTH + (unit.members.length - 1) * SPOUSE_GAP : NODE_WIDTH;
    }

    const unit = familyUnits.get(unitId);
    if (!unit) return 0;

    visiting.add(unitId);

    const ownWidth = unit.members.length * NODE_WIDTH + (unit.members.length - 1) * SPOUSE_GAP;
    const childUnitIds = childrenByUnit.get(unitId) || [];

    if (childUnitIds.length === 0) {
      unit.subtreeWidth = ownWidth;
    } else {
      let childrenTotalWidth = 0;
      childUnitIds.forEach((childUnitId, index) => {
        childrenTotalWidth += calcWidth(childUnitId);
        if (index < childUnitIds.length - 1) childrenTotalWidth += SIBLING_GAP;
      });
      unit.subtreeWidth = Math.max(ownWidth, childrenTotalWidth);
    }

    visiting.delete(unitId);
    calculated.add(unitId);
    return unit.subtreeWidth;
  }

  familyUnits.forEach((_, unitId) => calcWidth(unitId));
}

// ═══════════════════════════════════════════════════════════
// STEP 5: ASSIGN POSITIONS (Top-Down)
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

  const rootUnitId = nodeToUnit.get(rootId);
  if (!rootUnitId) return fallbackPositioning(familyUnits, generations);

  const allRootUnits = findRootUnits(familyUnits, childrenByUnit);

  // Separate primary roots (ancestor lineage of the root member) from secondary
  // roots (in-law lineages). Primary roots are positioned first; secondary roots
  // are placed near their already-positioned children rather than far away.
  const primaryRoots: string[] = [];
  const secondaryRoots: string[] = [];

  for (const unitId of allRootUnits) {
    if (canReachUnit(unitId, rootUnitId, childrenByUnit)) {
      primaryRoots.push(unitId);
    } else {
      secondaryRoots.push(unitId);
    }
  }

  // If no primary root found (root member itself is in a root unit), use it
  if (primaryRoots.length === 0) {
    const idx = allRootUnits.indexOf(rootUnitId);
    if (idx >= 0) {
      primaryRoots.push(rootUnitId);
      secondaryRoots.splice(secondaryRoots.indexOf(rootUnitId), 1);
    } else {
      // Fallback: just use all roots as primary
      primaryRoots.push(...allRootUnits);
      secondaryRoots.length = 0;
    }
  }

  // Position primary lineage roots
  let currentX = 0;
  primaryRoots.forEach(unitId => {
    const unit = familyUnits.get(unitId);
    if (!unit) return;
    unit.x = currentX + unit.subtreeWidth / 2;
    unitPositioned.add(unitId);
    positionChildren(unitId, unit.x, familyUnits, childrenByUnit, unitPositioned);
    currentX += unit.subtreeWidth + SUBTREE_GAP;
  });

  // Position secondary roots (in-law parents) near their positioned children
  secondaryRoots.forEach(unitId => {
    const unit = familyUnits.get(unitId);
    if (!unit) return;

    const childUnitIds = childrenByUnit.get(unitId) || [];
    const positionedChildId = childUnitIds.find(cid => unitPositioned.has(cid));

    if (positionedChildId) {
      const childUnit = familyUnits.get(positionedChildId);
      if (childUnit) {
        // Position this unit directly above and to the side of its child
        // Find the rightmost x of already-positioned units at the same generation
        const unitGen = unit.members[0] ? (generations.get(unit.members[0].id) ?? 0) : 0;
        let maxXAtGen = -Infinity;
        familyUnits.forEach(u => {
          if (!unitPositioned.has(u.id)) return;
          const uGen = u.members[0] ? (generations.get(u.members[0].id) ?? 0) : 0;
          if (uGen === unitGen) {
            const uRight = u.x + (u.members.length * NODE_WIDTH + (u.members.length - 1) * SPOUSE_GAP) / 2;
            maxXAtGen = Math.max(maxXAtGen, uRight);
          }
        });

        // Place to the right of existing units at same generation, or near child
        const ownWidth = unit.members.length * NODE_WIDTH + (unit.members.length - 1) * SPOUSE_GAP;
        if (maxXAtGen > -Infinity) {
          unit.x = maxXAtGen + SUBTREE_GAP + ownWidth / 2;
        } else {
          unit.x = childUnit.x + SUBTREE_GAP + ownWidth / 2;
        }

        unitPositioned.add(unitId);
        // Position any un-positioned children of this secondary root
        positionChildren(unitId, unit.x, familyUnits, childrenByUnit, unitPositioned);
      }
    } else {
      // Truly disconnected unit — position after everything else
      unit.x = currentX + unit.subtreeWidth / 2;
      unitPositioned.add(unitId);
      positionChildren(unitId, unit.x, familyUnits, childrenByUnit, unitPositioned);
      currentX += unit.subtreeWidth + SUBTREE_GAP;
    }
  });

  // Convert unit center X to individual node positions
  familyUnits.forEach(unit => {
    const totalMemberWidth = unit.members.length * NODE_WIDTH + (unit.members.length - 1) * SPOUSE_GAP;
    const startX = unit.x - totalMemberWidth / 2;
    unit.members.forEach((member, index) => {
      positions.set(member.id, {
        x: startX + index * (NODE_WIDTH + SPOUSE_GAP),
        y: unit.y,
      });
    });
  });

  return positions;
}

/** BFS check: can we reach targetUnitId from startUnitId via childrenByUnit? */
function canReachUnit(
  startUnitId: string,
  targetUnitId: string,
  childrenByUnit: Map<string, string[]>
): boolean {
  const visited = new Set<string>();
  const queue = [startUnitId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetUnitId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const children = childrenByUnit.get(current) || [];
    queue.push(...children);
  }
  return false;
}

function findRootUnits(
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>
): string[] {
  const allChildren = new Set<string>();
  childrenByUnit.forEach(children => children.forEach(c => allChildren.add(c)));

  const rootUnits: string[] = [];
  familyUnits.forEach((_, unitId) => {
    if (!allChildren.has(unitId)) rootUnits.push(unitId);
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

  // Calculate total width of all children subtrees
  let totalChildWidth = 0;
  childUnitIds.forEach((childUnitId, index) => {
    const childUnit = familyUnits.get(childUnitId);
    if (childUnit) {
      totalChildWidth += childUnit.subtreeWidth;
      if (index < childUnitIds.length - 1) totalChildWidth += SIBLING_GAP;
    }
  });

  // Center children under parent — this works correctly for 1 or N children
  let currentX = parentCenterX - totalChildWidth / 2;

  childUnitIds.forEach(childUnitId => {
    if (unitPositioned.has(childUnitId)) return;
    const childUnit = familyUnits.get(childUnitId);
    if (!childUnit) return;

    childUnit.x = currentX + childUnit.subtreeWidth / 2;
    unitPositioned.add(childUnitId);
    positionChildren(childUnitId, childUnit.x, familyUnits, childrenByUnit, unitPositioned);
    currentX += childUnit.subtreeWidth + SIBLING_GAP;
  });
}

function fallbackPositioning(
  familyUnits: Map<string, FamilyUnit>,
  generations: Map<string, number>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const genGroups = new Map<number, FamilyUnit[]>();
  familyUnits.forEach(unit => {
    const gen = unit.members[0] ? (generations.get(unit.members[0].id) ?? 0) : 0;
    if (!genGroups.has(gen)) genGroups.set(gen, []);
    genGroups.get(gen)!.push(unit);
  });

  genGroups.forEach((units, gen) => {
    let x = 0;
    units.forEach(unit => {
      unit.members.forEach((member, idx) => {
        positions.set(member.id, {
          x: x + idx * (NODE_WIDTH + SPOUSE_GAP),
          y: gen * (NODE_HEIGHT + GENERATION_GAP),
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
  const labels: Record<number, string> = {
    [-1]: 'Parent', [-2]: 'Grandparent', [-3]: 'Great-Grandparent',
    [1]: 'Child', [2]: 'Grandchild', [3]: 'Great-Grandchild',
    [0]: 'Same Gen',
  };
  if (labels[gen]) return labels[gen];
  if (gen < -3) return `${Math.abs(gen) - 2}x Great-Grandparent`;
  if (gen > 3) return `${gen - 2}x Great-Grandchild`;
  return '';
}

// ═══════════════════════════════════════════════════════════
// STEP 7: CREATE CONNECTORS
// ═══════════════════════════════════════════════════════════

function createConnectors(
  layoutNodes: LayoutNode[],
  familyUnits: Map<string, FamilyUnit>,
  _nodeToUnit: Map<string, string>,
): Connector[] {
  const connectors: Connector[] = [];
  const nodePositions = new Map<string, LayoutNode>();
  layoutNodes.forEach(n => nodePositions.set(n.id, n));

  const processedSpouse = new Set<string>();
  const processedParentChild = new Set<string>();

  // ── SPOUSE CONNECTORS ──
  familyUnits.forEach(unit => {
    if (unit.members.length < 2) return;
    const [m1, m2] = unit.members;
    const n1 = nodePositions.get(m1.id);
    const n2 = nodePositions.get(m2.id);
    if (!n1 || !n2) return;

    const pairKey = [m1.id, m2.id].sort().join('-');
    if (processedSpouse.has(pairKey)) return;
    processedSpouse.add(pairKey);

    const y = Math.min(n1.y, n2.y) + NODE_HEIGHT * 0.35;
    const leftNode = n1.x < n2.x ? n1 : n2;
    const rightNode = n1.x < n2.x ? n2 : n1;

    connectors.push({
      type: 'spouse',
      from: { id: m1.id, x: leftNode.x + NODE_WIDTH, y },
      to: { id: m2.id, x: rightNode.x, y },
      style: 'solid',
      color: '#E11D48',
      label: '❤️',
    });
  });

  // ── PARENT-CHILD CONNECTORS ──
  familyUnits.forEach(unit => {
    if (unit.children.length === 0) return;

    let dropX: number;
    let dropY: number;

    if (unit.members.length >= 2) {
      // Couple: drop from center between spouses
      const n1 = nodePositions.get(unit.members[0].id);
      const n2 = nodePositions.get(unit.members[1].id);
      if (!n1 || !n2) return;
      dropX = (n1.x + n2.x + NODE_WIDTH) / 2;
      dropY = n1.y + NODE_HEIGHT;
    } else {
      // Single parent: drop from bottom center
      const n1 = nodePositions.get(unit.members[0].id);
      if (!n1) return;
      dropX = n1.x + NODE_WIDTH / 2;
      dropY = n1.y + NODE_HEIGHT;
    }

    // Get child nodes that exist
    const childNodes: LayoutNode[] = [];
    unit.children.forEach(childId => {
      const cn = nodePositions.get(childId);
      if (cn) childNodes.push(cn);
    });
    if (childNodes.length === 0) return;

    childNodes.sort((a, b) => a.x - b.x);

    // One connector per child
    childNodes.forEach(child => {
      const pairKey = `pc-${unit.id}-${child.id}`;
      if (processedParentChild.has(pairKey)) return;
      processedParentChild.add(pairKey);

      connectors.push({
        type: 'parent-child',
        from: { id: unit.members[0].id, x: dropX, y: dropY },
        to: { id: child.id, x: child.x + NODE_WIDTH / 2, y: child.y },
        style: 'solid',
        color: '#6366F1',
      });
    });
  });

  return connectors;
}

// ═══════════════════════════════════════════════════════════
// STEP 8: CALCULATE BOUNDS
// ═══════════════════════════════════════════════════════════

function calculateBounds(nodes: LayoutNode[]) {
  if (nodes.length === 0) return { width: 0, height: 0, minX: 0, minY: 0 };

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
  // The store provides bi-directional relationships:
  //   {fromId: me, toId: dad, type: 'parent'} → dad is my parent
  //   {fromId: dad, toId: me, type: 'child'} → me is dad's child
  const relMap = new Map<string, { id: string; type: string }[]>();

  relationships.forEach(rel => {
    const normalizedType = normalizeRelType(rel.type);
    if (!relMap.has(rel.fromId)) relMap.set(rel.fromId, []);
    relMap.get(rel.fromId)!.push({ id: rel.toId, type: normalizedType });
  });

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
    const cousins: { id: string; type: 'blood' }[] = [];

    rels.forEach(r => {
      if (r.type === 'parent' && !parents.find(p => p.id === r.id)) {
        parents.push({ id: r.id, type: 'blood' });
      } else if (r.type === 'child' && !children.find(c => c.id === r.id)) {
        children.push({ id: r.id, type: 'blood' });
      } else if (r.type === 'spouse' && !spouses.find(s => s.id === r.id)) {
        spouses.push({ id: r.id, type: 'married' });
      } else if (r.type === 'sibling' && !siblings.find(s => s.id === r.id)) {
        siblings.push({ id: r.id, type: 'blood' });
      } else if (r.type === 'cousin' && !cousins.find(c => c.id === r.id)) {
        cousins.push({ id: r.id, type: 'blood' });
      }
    });

    return { id: m.id, gender: m.gender || 'other', parents, children, spouses, siblings, cousins };
  });

  return { nodes, personData };
}

function normalizeRelType(type: string): string {
  let t = type.toLowerCase().trim();
  const prefixes = ['late ', 'deceased ', 'widowed ', 'ex ', 'late_', 'deceased_'];
  for (const prefix of prefixes) {
    if (t.startsWith(prefix)) t = t.substring(prefix.length).trim();
  }

  if (['father', 'mother', 'step_father', 'step_mother'].includes(t)) return 'parent';
  if (['son', 'daughter', 'step_son', 'step_daughter', 'adopted_son', 'adopted_daughter'].includes(t)) return 'child';
  if (['husband', 'wife'].includes(t)) return 'spouse';
  if (['brother', 'sister', 'half_brother', 'half_sister'].includes(t)) return 'sibling';
  if (t.includes('cousin')) return 'cousin';
  return t;
}
