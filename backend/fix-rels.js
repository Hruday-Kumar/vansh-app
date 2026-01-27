const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function addRelationships() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'vansh_db'
  });

  const familyId = '8dce9be1-cdb2-4763-b84e-29631c750686';
  
  // Member IDs
  const members = {
    grandfather: 'e8d7d856-d26d-4d20-9ae9-a8d75c41bb3a',
    father: '8c0a2b69-66f8-4bbd-b2ac-699895a8f35d',
    mother: '26575e82-a872-4acf-8af1-77702854356d',
    ramakrishna: 'a1e52fb8-f498-4b67-a369-347008ff008a', // ME
    sai: 'e7709125-65aa-4a47-a250-2ada383374df',
  };
  
  // Family structure (based on the names):
  // Grandfather (b.1940) is parent of Father (b.1975)
  // Father + Mother (b.1985) are parents of Ramakrishna (ME) and Sai (b.2001)
  
  const relationships = [
    // Grandfather is PARENT of Father
    { from: members.grandfather, to: members.father, type: 'parent' },
    
    // Father + Mother are spouses
    { from: members.father, to: members.mother, type: 'spouse' },
    
    // Father is PARENT of Ramakrishna
    { from: members.father, to: members.ramakrishna, type: 'parent' },
    
    // Mother is PARENT of Ramakrishna
    { from: members.mother, to: members.ramakrishna, type: 'parent' },
    
    // Father is PARENT of Sai
    { from: members.father, to: members.sai, type: 'parent' },
    
    // Mother is PARENT of Sai
    { from: members.mother, to: members.sai, type: 'parent' },
    
    // Ramakrishna and Sai are siblings
    { from: members.ramakrishna, to: members.sai, type: 'sibling' },
  ];
  
  console.log('Adding relationships...');
  
  for (const rel of relationships) {
    const id = uuidv4();
    await conn.query(`
      INSERT INTO relationships (id, family_id, from_member_id, to_member_id, relationship_type, prana_strength)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [id, familyId, rel.from, rel.to, rel.type]);
    
    console.log(`  Added: ${rel.type} relationship`);
  }
  
  console.log('\nDone! Added', relationships.length, 'relationships.');
  
  // Verify
  const [rels] = await conn.query(`
    SELECT r.relationship_type, m1.first_name as from_name, m2.first_name as to_name 
    FROM relationships r 
    JOIN members m1 ON r.from_member_id=m1.id 
    JOIN members m2 ON r.to_member_id=m2.id 
    WHERE r.family_id=?
  `, [familyId]);
  
  console.log('\nVerification - Relationships now:');
  rels.forEach(r => console.log(`  ${r.from_name} -> ${r.to_name} (${r.relationship_type})`));
  
  await conn.end();
}

addRelationships();
