
import { calculateTreeLayout, membersToFamilyNodes } from './src/features/vriksha/tree-layout';

// Mock data based on screenshot
// Generation 1: Ramalah P (Male)
// Generation 2: Venkateswarlu P (Male) -> Son of Ramalah. Amulu P (Female) -> Wife of Venkateswarlu.
// Generation 3: Srinu P (Male), Rama P (Female). Srinu is son of Venkat & Amulu. Rama is Srinu's wife. 
// Generation 4: Hruday P (Male), Dileep P (Male), Satya P (Female).
// Hruday -> Son of Srinu & Rama
// Dileep -> Son of Srinu & Rama
// Satya -> Daughter of Srinu & Rama

const members = [
    { id: '1', firstName: 'Ramalah', lastName: 'P.', gender: 'male' },
    { id: '2', firstName: 'Venkateswarlu', lastName: 'P.', gender: 'male' },
    { id: '3', firstName: 'Amulu', lastName: 'P.', gender: 'female' },
    { id: '4', firstName: 'Srinu', lastName: 'P.', gender: 'male' },
    { id: '5', firstName: 'Rama', lastName: 'P.', gender: 'female' },
    { id: '6', firstName: 'Hruday', lastName: 'P.', gender: 'male' },
    { id: '7', firstName: 'Dileep', lastName: 'P.', gender: 'male' },
    { id: '8', firstName: 'Satya', lastName: 'P.', gender: 'female' },
];

// Relationships (Backend format: fromId, toId, type)
// NOTE: "type" is from the perspective of "toId is [type] of fromId" ??
// The code says:
// if type == 'parent': relMap.get(fromId).push({id: toId, type: 'child'}) -> "fromId sees toId as child" ??
// Wait, the code comments say:
// if relType === 'parent': // REVERTED LOGIC: Treating 'parent' type as "fromId is Parent of toId"
// relMap.get(rel.fromId)!.push({ id: rel.toId, type: 'child' }); // fromId sees toId as CHILD

// Let's assume the backend sends: { fromId: 'Son', toId: 'Father', type: 'father' }
// The current code:
// type='father' -> matches 'parent' block.
// formId='Son' gets pushed { id: 'Father', type: 'child' } -> Son has Child 'Father' ??? THIS IS WRONG.

// Let's test this hypothesis.

const relationships = [
    // Venkat is son of Ramalah
    { fromId: '2', toId: '1', type: 'father' },

    // Srinu is son of Venkat
    { fromId: '4', toId: '2', type: 'father' },
    // Srinu is son of Amulu
    { fromId: '4', toId: '3', type: 'mother' },

    // Venkat and Amulu are married
    { fromId: '2', toId: '3', type: 'wife' },
    { fromId: '3', toId: '2', type: 'husband' },

    // Srinu and Rama are married
    { fromId: '4', toId: '5', type: 'wife' },
    { fromId: '5', toId: '4', type: 'husband' },

    // Hruday is son of Srinu
    { fromId: '6', toId: '4', type: 'father' },
    // Hruday is son of Rama
    { fromId: '6', toId: '5', type: 'mother' },

    // Dileep is son of Srinu
    { fromId: '7', toId: '4', type: 'father' },

    // Satya is daughter of Srinu
    { fromId: '8', toId: '4', type: 'father' },
];

console.log("--- MOCK DATA SIMULATION ---");

const { nodes, personData } = membersToFamilyNodes(members, relationships);

console.log("\n--- NODES STRUCTURE ---");
nodes.forEach(n => {
    console.log(`Node ${n.id} (${personData.get(n.id)?.firstName}):`);
    console.log(`  Parents: ${n.parents.map(p => p.id).join(', ')}`);
    console.log(`  Children: ${n.children.map(c => c.id).join(', ')}`);
});

const layout = calculateTreeLayout(nodes, personData, '1'); // Root is Ramalah

console.log("\n--- LAYOUT POSITIONS ---");
layout.nodes.forEach(n => {
    console.log(`Node ${n.id}: Gen ${n.generation}, X=${n.x}, Y=${n.y}`);
});

