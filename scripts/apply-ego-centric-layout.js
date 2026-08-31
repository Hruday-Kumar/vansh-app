const fs = require('fs');
const filepath = 'c:\\dev\\vansh-app-1\\src\\features\\vriksha\\tree-layout.ts';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(
  `interface FamilyUnit {
  id: string;
  members: FamilyNode[];
  children: string[];
  subtreeWidth: number;
  x: number;
  y: number;
}`,
`interface FamilyUnit {
  id: string;
  members: FamilyNode[];
  children: string[];
  subtreeWidth: number;
  leftBound: number;
  rightBound: number;
  childOffsets: Map<string, number>;
  x: number;
  y: number;
}`
);

content = content.replace(
`    const unit: FamilyUnit = {
      id: unitId,
      members,
      children: Array.from(childrenSet),
      subtreeWidth: 0,
      x: 0,
      y: (generations.get(node.id) ?? 0) * (NODE_HEIGHT + GENERATION_GAP),
    };`,
`    const unit: FamilyUnit = {
      id: unitId,
      members,
      children: Array.from(childrenSet),
      subtreeWidth: 0,
      leftBound: 0,
      rightBound: 0,
      childOffsets: new Map<string, number>(),
      x: 0,
      y: (generations.get(node.id) ?? 0) * (NODE_HEIGHT + GENERATION_GAP),
    };`
);

content = content.replace(
`  const childrenByUnit = buildUnitGraph(familyUnits, nodeToUnit, generations);
  calculateSubtreeWidths(familyUnits, childrenByUnit);
  const positions = assignPositions(familyUnits, childrenByUnit, generations, rootId, nodeToUnit);`,
`  const childrenByUnit = buildUnitGraph(familyUnits, nodeToUnit, generations);
  
  const rootUnitId = nodeToUnit.get(rootId);
  const spine = getSpinePath(rootUnitId, childrenByUnit);

  calculateSubtreeBounds(familyUnits, childrenByUnit, spine);
  const positions = assignPositionsEgoCentric(familyUnits, childrenByUnit, generations, rootId, nodeToUnit);`
);

const calculateStart = content.indexOf('function calculateSubtreeWidths(');
const fallbackStart = content.indexOf('function fallbackPositioning(');

if (calculateStart === -1) {
    if (content.indexOf('function calculateSubtreeBounds(') !== -1) {
        console.log('Layout logic already updated. Skipping.');
        process.exit(0);
    } else {
        console.error('Could not find boundaries');
        process.exit(1);
    }
}

if (fallbackStart === -1) {
    console.error('Could not find fallbackPositioning boundary');
    process.exit(1);
}

const beforeBlock = content.substring(0, calculateStart);
const afterBlock = content.substring(fallbackStart);

const newBlock = `
function getSpinePath(rootUnitId: string | undefined, childrenByUnit: Map<string, string[]>): Set<string> {
  const spine = new Set<string>();
  if (!rootUnitId) return spine;
  
  const parentsByUnit = new Map<string, string[]>();
  childrenByUnit.forEach((children, parentId) => {
    children.forEach(childId => {
      if (!parentsByUnit.has(childId)) parentsByUnit.set(childId, []);
      parentsByUnit.get(childId)!.push(parentId);
    });
  });

  let current: string | undefined = rootUnitId;
  while (current) {
    spine.add(current);
    const parents = parentsByUnit.get(current);
    if (parents && parents.length > 0) {
      current = parents[0];
    } else {
      break;
    }
  }
  return spine;
}

function calculateSubtreeBounds(
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>,
  spine: Set<string>
): void {
  const calculated = new Set<string>();

  function calcBounds(unitId: string): void {
    if (calculated.has(unitId)) return;
    const unit = familyUnits.get(unitId);
    if (!unit) return;

    const childUnitIds = childrenByUnit.get(unitId) || [];
    childUnitIds.forEach(id => calcBounds(id));

    const ownWidth = unit.members.length * NODE_WIDTH + (unit.members.length - 1) * SPOUSE_GAP;
    const ownLeft = ownWidth / 2;
    const ownRight = ownWidth / 2;

    if (childUnitIds.length === 0) {
      unit.leftBound = ownLeft;
      unit.rightBound = ownRight;
      unit.subtreeWidth = ownLeft + ownRight;
      calculated.add(unitId);
      return;
    }

    const spineChildIdx = childUnitIds.findIndex(cid => spine.has(cid));

    if (spineChildIdx >= 0) {
      unit.childOffsets.set(childUnitIds[spineChildIdx], 0);

      let currentOffsetX = -familyUnits.get(childUnitIds[spineChildIdx])!.leftBound - SIBLING_GAP;
      for (let i = spineChildIdx - 1; i >= 0; i--) {
        const cUnit = familyUnits.get(childUnitIds[i])!;
        const offset = currentOffsetX - cUnit.rightBound;
        unit.childOffsets.set(cUnit.id, offset);
        currentOffsetX = offset - cUnit.leftBound - SIBLING_GAP;
      }
      const maxLeftChild = currentOffsetX > 0 ? 0 : -currentOffsetX - SIBLING_GAP;

      currentOffsetX = familyUnits.get(childUnitIds[spineChildIdx])!.rightBound + SIBLING_GAP;
      for (let i = spineChildIdx + 1; i < childUnitIds.length; i++) {
        const cUnit = familyUnits.get(childUnitIds[i])!;
        const offset = currentOffsetX + cUnit.leftBound;
        unit.childOffsets.set(cUnit.id, offset);
        currentOffsetX = offset + cUnit.rightBound + SIBLING_GAP;
      }
      const maxRightChild = currentOffsetX - SIBLING_GAP;

      unit.leftBound = Math.max(ownLeft, maxLeftChild);
      unit.rightBound = Math.max(ownRight, maxRightChild);

    } else {
      let totalChildrenWidth = 0;
      childUnitIds.forEach((cid, index) => {
        const cUnit = familyUnits.get(cid)!;
        totalChildrenWidth += cUnit.leftBound + cUnit.rightBound;
        if (index < childUnitIds.length - 1) totalChildrenWidth += SIBLING_GAP;
      });

      let currentOffsetX = -totalChildrenWidth / 2;
      childUnitIds.forEach(cid => {
        const cUnit = familyUnits.get(cid)!;
        const offset = currentOffsetX + cUnit.leftBound;
        unit.childOffsets.set(cid, offset);
        currentOffsetX = offset + cUnit.rightBound + SIBLING_GAP;
      });

      unit.leftBound = Math.max(ownLeft, totalChildrenWidth / 2);
      unit.rightBound = Math.max(ownRight, totalChildrenWidth / 2);
    }

    unit.subtreeWidth = unit.leftBound + unit.rightBound;
    calculated.add(unitId);
  }

  familyUnits.forEach((_, unitId) => calcBounds(unitId));
}

function assignPositionsEgoCentric(
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
  const primaryRoots = allRootUnits.filter(r => canReachUnit(r, rootUnitId, childrenByUnit));
  const secondaryRoots = allRootUnits.filter(r => !primaryRoots.includes(r));

  if (primaryRoots.length === 0) {
    if (allRootUnits.includes(rootUnitId)) {
      primaryRoots.push(rootUnitId);
      const idx = secondaryRoots.indexOf(rootUnitId);
      if (idx > -1) secondaryRoots.splice(idx, 1);
    } else {
      primaryRoots.push(...allRootUnits);
      secondaryRoots.length = 0;
    }
  }

  let currentX = 0;
  primaryRoots.forEach(unitId => {
    const unit = familyUnits.get(unitId)!;
    unit.x = currentX + unit.leftBound;
    unitPositioned.add(unitId);
    positionChildrenUsingOffsets(unitId, familyUnits, childrenByUnit, unitPositioned);
    currentX += unit.leftBound + unit.rightBound + SUBTREE_GAP;
  });

  secondaryRoots.forEach(unitId => {
    const unit = familyUnits.get(unitId)!;
    const childUnitIds = childrenByUnit.get(unitId) || [];
    const positionedChildId = childUnitIds.find(cid => unitPositioned.has(cid));

    if (positionedChildId) {
      const childUnit = familyUnits.get(positionedChildId)!;
      const unitGen = unit.members[0] ? (generations.get(unit.members[0].id) ?? 0) : 0;
      let maxXAtGen = -Infinity;
      familyUnits.forEach(u => {
        if (!unitPositioned.has(u.id)) return;
        const uGen = u.members[0] ? (generations.get(u.members[0].id) ?? 0) : 0;
        if (uGen === unitGen) {
          maxXAtGen = Math.max(maxXAtGen, u.x + u.rightBound);
        }
      });

      if (maxXAtGen > -Infinity) {
        unit.x = maxXAtGen + SUBTREE_GAP + unit.leftBound;
      } else {
        unit.x = childUnit.x + SUBTREE_GAP + unit.leftBound;
      }
    } else {
      unit.x = currentX + unit.leftBound;
      currentX += unit.leftBound + unit.rightBound + SUBTREE_GAP;
    }
    unitPositioned.add(unitId);
    positionChildrenUsingOffsets(unitId, familyUnits, childrenByUnit, unitPositioned);
  });

  const targetRootUnit = familyUnits.get(rootUnitId);
  const shiftX = targetRootUnit ? targetRootUnit.x : 0;

  familyUnits.forEach(unit => {
    unit.x -= shiftX;
    
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

function positionChildrenUsingOffsets(
  parentUnitId: string,
  familyUnits: Map<string, FamilyUnit>,
  childrenByUnit: Map<string, string[]>,
  unitPositioned: Set<string>
): void {
  const parentUnit = familyUnits.get(parentUnitId);
  if (!parentUnit) return;
  const childUnitIds = childrenByUnit.get(parentUnitId) || [];

  childUnitIds.forEach(childUnitId => {
    if (unitPositioned.has(childUnitId)) return;
    const childUnit = familyUnits.get(childUnitId);
    if (!childUnit) return;

    const offset = parentUnit.childOffsets.get(childUnitId) ?? 0;
    childUnit.x = parentUnit.x + offset;
    unitPositioned.add(childUnitId);
    positionChildrenUsingOffsets(childUnitId, familyUnits, childrenByUnit, unitPositioned);
  });
}

`;

const newContent = beforeBlock + newBlock + afterBlock;
fs.writeFileSync(filepath, newContent);
console.log('Successfully updated layout logic');
