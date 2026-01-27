const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'vansh_db'
  });

  // Check relationships for family 8dce9be1-cdb2-4763-b84e-29631c750686
  const familyId = '8dce9be1-cdb2-4763-b84e-29631c750686';
  
  // Get all members in this family
  const [members] = await conn.query(`
    SELECT id, first_name FROM members WHERE family_id = ?
  `, [familyId]);
  
  console.log('Members in Ramakrishna family:');
  members.forEach(m => console.log(`  ${m.first_name}: ${m.id}`));
  
  const [rels] = await conn.query(`
    SELECT r.relationship_type, m1.first_name as from_name, m2.first_name as to_name 
    FROM relationships r 
    JOIN members m1 ON r.from_member_id=m1.id 
    JOIN members m2 ON r.to_member_id=m2.id 
    WHERE r.family_id=?
  `, [familyId]);
  
  console.log('\nRelationships:', rels.length);
  rels.forEach(r => console.log(`  ${r.from_name} -> ${r.to_name} (${r.relationship_type})`));
  
  await conn.end();
}

check();
