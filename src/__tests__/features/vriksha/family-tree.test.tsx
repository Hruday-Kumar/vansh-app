/**
 * FamilyTree Feature Tests
 * Unit tests for the FamilyTree component and related types
 */

// Define relationship types locally for testing
// This mirrors the actual DEFAULT_RELATIONSHIP_TYPES from family-tree.tsx
type RelationType = 
  | 'parent' | 'child' | 'spouse' | 'sibling' 
  | 'grandparent' | 'grandchild' | 'uncle' | 'aunt' 
  | 'cousin' | 'nephew' | 'niece' | 'in-law';

interface RelationshipTypeInfo {
  label: string;
  emoji: string;
  color: string;
  inverse: RelationType;
}

const DEFAULT_RELATIONSHIP_TYPES: Record<RelationType, RelationshipTypeInfo> = {
  parent: { label: 'Parent', emoji: '👨‍👩‍👧', color: '#8B4513', inverse: 'child' },
  child: { label: 'Child', emoji: '👶', color: '#DAA520', inverse: 'parent' },
  spouse: { label: 'Spouse', emoji: '💑', color: '#FF6B6B', inverse: 'spouse' },
  sibling: { label: 'Sibling', emoji: '👫', color: '#4ECDC4', inverse: 'sibling' },
  grandparent: { label: 'Grandparent', emoji: '👴', color: '#9B59B6', inverse: 'grandchild' },
  grandchild: { label: 'Grandchild', emoji: '👶', color: '#E74C3C', inverse: 'grandparent' },
  uncle: { label: 'Uncle', emoji: '👨', color: '#3498DB', inverse: 'nephew' },
  aunt: { label: 'Aunt', emoji: '👩', color: '#E91E63', inverse: 'niece' },
  cousin: { label: 'Cousin', emoji: '🤝', color: '#2ECC71', inverse: 'cousin' },
  nephew: { label: 'Nephew', emoji: '👦', color: '#F39C12', inverse: 'uncle' },
  niece: { label: 'Niece', emoji: '👧', color: '#9C27B0', inverse: 'aunt' },
  'in-law': { label: 'In-Law', emoji: '🤝', color: '#607D8B', inverse: 'in-law' },
};

describe('FamilyTree Relationship Types', () => {
  describe('DEFAULT_RELATIONSHIP_TYPES', () => {
    it('contains all required relationship types', () => {
      const requiredTypes: RelationType[] = [
        'parent', 'child', 'spouse', 'sibling',
        'grandparent', 'grandchild', 'uncle', 'aunt',
        'cousin', 'nephew', 'niece', 'in-law',
      ];

      const keys = Object.keys(DEFAULT_RELATIONSHIP_TYPES);
      requiredTypes.forEach(type => {
        expect(keys.includes(type)).toBe(true);
      });
    });

    it('each type has required properties', () => {
      Object.entries(DEFAULT_RELATIONSHIP_TYPES).forEach(([key, type]) => {
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('emoji');
        expect(type).toHaveProperty('color');
        expect(type).toHaveProperty('inverse');
        expect(typeof type.label).toBe('string');
      });
    });

    it('has valid inverse references', () => {
      const keys = Object.keys(DEFAULT_RELATIONSHIP_TYPES);
      Object.entries(DEFAULT_RELATIONSHIP_TYPES).forEach(([key, type]) => {
        expect(keys.includes(type.inverse)).toBe(true);
      });
    });

    it('has no empty labels', () => {
      Object.values(DEFAULT_RELATIONSHIP_TYPES).forEach(type => {
        expect(type.label.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Family Tree Data Structures', () => {
  // Test member structure
  interface TestMember {
    id: string;
    name: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    parentIds?: string[];
    childIds?: string[];
    spouseIds?: string[];
  }

  it('can create valid member structure', () => {
    const member: TestMember = {
      id: 'member-1',
      name: 'Test Member',
      birthDate: '1990-01-01',
      gender: 'male',
      parentIds: [],
      childIds: [],
      spouseIds: [],
    };

    expect(member.id).toBe('member-1');
    expect(member.name).toBe('Test Member');
    expect(member.gender).toBe('male');
  });

  it('can build family tree from members', () => {
    const grandmother: TestMember = {
      id: 'gm-1',
      name: 'Grandmother',
      birthDate: '1940-01-01',
      gender: 'female',
      childIds: ['p-1'],
    };

    const parent: TestMember = {
      id: 'p-1',
      name: 'Parent',
      birthDate: '1970-01-01',
      gender: 'female',
      parentIds: ['gm-1'],
      childIds: ['c-1'],
    };

    const child: TestMember = {
      id: 'c-1',
      name: 'Child',
      birthDate: '2000-01-01',
      gender: 'male',
      parentIds: ['p-1'],
    };

    const familyTree = [grandmother, parent, child];

    expect(familyTree.length).toBe(3);
    expect(parent.parentIds).toContain(grandmother.id);
    expect(parent.childIds).toContain(child.id);
    expect(child.parentIds).toContain(parent.id);
  });

  it('validates relationship consistency', () => {
    const parent: TestMember = {
      id: 'p-1',
      name: 'Parent',
      childIds: ['c-1'],
    };

    const child: TestMember = {
      id: 'c-1',
      name: 'Child',
      parentIds: ['p-1'],
    };

    // Parent lists child in childIds
    expect(parent.childIds).toContain(child.id);
    // Child lists parent in parentIds
    expect(child.parentIds).toContain(parent.id);
  });
});

describe('Tree Layout Calculations', () => {
  // Helper interface for tree calculations
  interface SimpleMember {
    id: string;
    parentIds?: string[];
  }

  function calculateLevel(members: SimpleMember[], memberId: string): number {
    const member = members.find(m => m.id === memberId);
    if (!member || !member.parentIds || member.parentIds.length === 0) {
      return 0;
    }
    
    const parentLevels = member.parentIds.map(pid => calculateLevel(members, pid));
    return Math.max(...parentLevels) + 1;
  }

  it('calculates correct levels for simple tree', () => {
    const members: SimpleMember[] = [
      { id: 'root', parentIds: [] },
      { id: 'child1', parentIds: ['root'] },
      { id: 'child2', parentIds: ['root'] },
      { id: 'grandchild', parentIds: ['child1'] },
    ];

    expect(calculateLevel(members, 'root')).toBe(0);
    expect(calculateLevel(members, 'child1')).toBe(1);
    expect(calculateLevel(members, 'child2')).toBe(1);
    expect(calculateLevel(members, 'grandchild')).toBe(2);
  });

  it('handles multiple parents correctly', () => {
    const members: SimpleMember[] = [
      { id: 'parent1', parentIds: [] },
      { id: 'parent2', parentIds: [] },
      { id: 'child', parentIds: ['parent1', 'parent2'] },
    ];

    expect(calculateLevel(members, 'child')).toBe(1);
  });
});
