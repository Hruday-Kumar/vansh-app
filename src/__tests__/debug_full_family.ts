
import { membersToFamilyNodes } from '../features/vriksha/tree-layout';
import type { MemberId, RelationType, VrikshaMember } from '../types';

// Mock Data representing User's "Reality"
// Srinu (Alive)
// Parents: Amulu (Late Mother), Venkateswarlu (Late Father)
// Children: Dileep (Son), Satya (Daughter)

// Relationships defined using valid RelationType values:
// Srinu -> Amulu ("parent")     [Target=Parent]
// Srinu -> Venkateswarlu ("parent") [Target=Parent]
// Srinu -> Dileep ("child")         [Subject=Parent of Dileep]
// Srinu -> Satya ("child")          [Subject=Parent of Satya]

const mockMembers: Partial<VrikshaMember>[] = [
    {
        id: 'srinu' as MemberId,
        firstName: 'Srinu',
        lastName: 'P.',
        isAlive: true,
        relationships: [
            { memberId: 'amulu' as MemberId, type: 'parent' as RelationType, prana: {} as any },
            { memberId: 'venkateswarlu' as MemberId, type: 'parent' as RelationType, prana: {} as any },
            { memberId: 'dileep' as MemberId, type: 'child' as RelationType, prana: {} as any },
            { memberId: 'satya' as MemberId, type: 'child' as RelationType, prana: {} as any },
        ]
    },
    { id: 'amulu' as MemberId, firstName: 'Amulu', isAlive: false, relationships: [] },
    { id: 'venkateswarlu' as MemberId, firstName: 'Venkateswarlu', isAlive: false, relationships: [] },
    { id: 'dileep' as MemberId, firstName: 'Dileep', isAlive: true, relationships: [] },
    { id: 'satya' as MemberId, firstName: 'Satya', isAlive: true, relationships: [] }
];

console.log('--- Hybrid Logic Verification ---');

const relArray: { fromId: string; toId: string; type: string }[] = [];
mockMembers.forEach(m => {
    m.relationships?.forEach(rel => {
        relArray.push({ fromId: m.id!, toId: rel.memberId as string, type: rel.type });
    });
});

const { nodes } = membersToFamilyNodes(mockMembers as any[], relArray);
const srinu = nodes.find(n => n.id === 'srinu')!;
const amulu = nodes.find(n => n.id === 'amulu')!;
const dileep = nodes.find(n => n.id === 'dileep')!;

console.log('Srinu Parents (Expected: Amulu, Venkateswarlu):', srinu.parents.map(p => p.id));
console.log('Srinu Children (Expected: Dileep, Satya):', srinu.children.map(c => c.id));
console.log('Amulu Children (Expected: Srinu):', amulu.children.map(c => c.id));
console.log('Dileep Parents (Expected: Srinu):', dileep.parents.map(p => p.id));

const isParentsCorrect = srinu.parents.some(p => p.id === 'amulu') && srinu.parents.some(p => p.id === 'venkateswarlu');
const isChildrenCorrect = srinu.children.some(c => c.id === 'dileep') && srinu.children.some(c => c.id === 'satya');
const isAmuluChildrenCorrect = amulu.children.some(c => c.id === 'srinu');
const isDileepParentsCorrect = dileep.parents.some(p => p.id === 'srinu');

if (isParentsCorrect && isChildrenCorrect && isAmuluChildrenCorrect && isDileepParentsCorrect) {
    console.log('✅ VERDICT: SUCCESS. Hybrid logic works and links are bi-directional.');
} else {
    console.log('❌ VERDICT: FAILURE.');
    if (!isParentsCorrect) console.log('   - Srinu Parents missing/wrong.');
    if (!isChildrenCorrect) console.log('   - Srinu Children missing/wrong.');
    if (!isAmuluChildrenCorrect) console.log('   - Amulu Children missing (Reverse Link Broken).');
    if (!isDileepParentsCorrect) console.log('   - Dileep Parents missing (Reverse Link Broken).');
}

