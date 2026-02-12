
import { membersToFamilyNodes } from '../features/vriksha/tree-layout';
import type { MemberId, RelationType, VrikshaMember } from '../types';

// Mock data
// Scenario: "Son" has a "Parent" (Dead Dad).
// Expected: "Dead Dad" is the PARENT of "Son".
const mockMembers: Partial<VrikshaMember>[] = [
    {
        id: 'son' as MemberId,
        firstName: 'Son',
        lastName: 'Sharma',
        gender: 'male',
        isAlive: true,
        relationships: [
            { memberId: 'dead_dad' as MemberId, type: 'parent' as RelationType, prana: {} as any }
        ]
    },
    {
        id: 'dead_dad' as MemberId,
        firstName: 'Dead',
        lastName: 'Dad',
        gender: 'male',
        isAlive: false,
        relationships: [
            { memberId: 'son' as MemberId, type: 'child' as RelationType, prana: {} as any } // "Son" is my child
        ]
    }
];

// Run layout
console.log('--- Running Layout for Inversion Check ---');

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

// Check internal structure immediately
const sonNode = nodes.find(n => n.id === 'son')!;
const dadNode = nodes.find(n => n.id === 'dead_dad')!;

console.log('Son Parents:', sonNode.parents.map(p => p.id));
console.log('Son Children:', sonNode.children.map(c => c.id));
console.log('Dad Parents:', dadNode.parents.map(p => p.id));
console.log('Dad Children:', dadNode.children.map(c => c.id));

if (sonNode.children.some(c => c.id === 'dead_dad')) {
    console.log('FAIL: Son thinks Dead Dad is his CHILD (Inversion)');
} else if (sonNode.parents.some(p => p.id === 'dead_dad')) {
    console.log('PASS: Son thinks Dead Dad is his PARENT');
} else {
    console.log('FAIL: No connection found?');
}

