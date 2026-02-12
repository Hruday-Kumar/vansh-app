
import { calculateTreeLayout, membersToFamilyNodes } from '../features/vriksha/tree-layout';
import type { MemberId, RelationType, VrikshaMember } from '../types';

// Mock data
// SYSTEM ASSUMPTION: "My Role" semantics.
// (A, B, 'spouse') -> A is spouse of B.
// (A, B, 'parent') -> B is A's parent.
// (A, B, 'child')  -> B is A's child.

const mockMembers: Partial<VrikshaMember>[] = [
    {
        id: 'grandpa' as MemberId,
        firstName: 'Grandpa',
        lastName: 'Sharma',
        gender: 'male',
        isAlive: true,
        relationships: [
            { memberId: 'grandma' as MemberId, type: 'spouse' as RelationType, prana: {} as any },
            { memberId: 'father' as MemberId, type: 'child' as RelationType, prana: {} as any } // Father is my child
        ]
    },
    {
        id: 'grandma' as MemberId,
        firstName: 'Grandma',
        lastName: 'Sharma',
        gender: 'female',
        isAlive: false, // DECEASED SPOUSE
        relationships: [
            { memberId: 'grandpa' as MemberId, type: 'spouse' as RelationType, prana: {} as any },
            { memberId: 'father' as MemberId, type: 'child' as RelationType, prana: {} as any } // Father is my child
        ]
    },
    {
        id: 'father' as MemberId,
        firstName: 'Father',
        lastName: 'Sharma',
        gender: 'male',
        isAlive: true,
        relationships: [
            { memberId: 'grandpa' as MemberId, type: 'parent' as RelationType, prana: {} as any }, // Grandpa is my parent
            { memberId: 'grandma' as MemberId, type: 'parent' as RelationType, prana: {} as any } // Grandma is my parent
        ]
    }
];

// Run layout
console.log('--- Running Layout with Correct Semantics ---');

// 1. Convert to FamilyNodes
const relArray: { fromId: string; toId: string; type: string }[] = [];
mockMembers.forEach(m => {
    m.relationships?.forEach(rel => {
        relArray.push({
            fromId: m.id!,
            toId: rel.memberId as string,
            type: rel.type
        });
    });
});

const { nodes, personData } = membersToFamilyNodes(mockMembers as any[], relArray);

// Check Parents/Children
const father = nodes.find(n => n.id === 'father');
console.log('Father Parents:', father?.parents.map(p => p.id)); // Should contain grandpa, grandma

// 2. Calculate Layout
const rootId = 'grandpa';
const layout = calculateTreeLayout(nodes, personData, rootId);

// 4. Check Connectors
console.log('Connectors:', layout.connectors.length);
layout.connectors.forEach(c => {
    console.log(`${c.type}: ${c.from.id} -> ${c.to.id}`);
});

