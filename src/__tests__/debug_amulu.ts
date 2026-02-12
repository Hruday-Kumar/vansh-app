
import { membersToFamilyNodes } from '../features/vriksha/tree-layout';
import type { MemberId, RelationType, VrikshaMember } from '../types';

// Mock Data based on User's Question
// "What does Amulu P. become to Srinu?"

// Assumption: 
// Srinu is the living user/member.
// Amulu is the deceased mother.
// Database probably has:
// Srinu -> { memberId: Amulu, type: 'parent' }  (Amulu is parent of Srinu)

const mockMembers: Partial<VrikshaMember>[] = [
    {
        id: 'srinu' as MemberId,
        firstName: 'Srinu',
        lastName: 'P.',
        gender: 'male',
        isAlive: true,
        relationships: [
            { memberId: 'amulu' as MemberId, type: 'parent' as RelationType, prana: {} as any }
        ]
    },
    {
        id: 'amulu' as MemberId,
        firstName: 'Amulu',
        lastName: 'P.',
        gender: 'female',
        isAlive: false,
        relationships: [] // Assuming implied by Srinu's link
    }
];

console.log('--- Experiment: Srinu -> Amulu ("parent") ---');

// 1. Convert
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

const { nodes } = membersToFamilyNodes(mockMembers as any[], relArray);

const srinu = nodes.find(n => n.id === 'srinu')!;
const amulu = nodes.find(n => n.id === 'amulu')!;

console.log('Srinu Children:', srinu.children.map(c => c.id));
console.log('Srinu Parents:', srinu.parents.map(p => p.id));
console.log('Amulu Children:', amulu.children.map(c => c.id));
console.log('Amulu Parents:', amulu.parents.map(p => p.id));

if (srinu.children.some(c => c.id === 'amulu')) {
    console.log('RESULT: Srinu is calculated as the PARENT of Amulu.');
    console.log('INTERPRETATION: "parent" was interpreted incorrectly.');
    console.log('VERDICT: INVERSION DETECTED.');
} else if (srinu.parents.some(p => p.id === 'amulu')) {
    console.log('RESULT: Srinu is calculated as the CHILD of Amulu.');
    console.log('VERDICT: CORRECT DIRECTION.');
} else {
    console.log('RESULT: No direct parent/child link found.');
}

