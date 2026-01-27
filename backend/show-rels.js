const mysql = require('mysql2/promise');

async function showRelationships() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '1234',
    database: 'vansh_db'
  });
  
  // Get relationships for the Chettiyar family
  const [rows] = await conn.execute(`
    SELECT 
      m1.first_name as from_member, 
      r.relationship_type,
      r.relationship_subtype,
      m2.first_name as to_member
    FROM relationships r
    JOIN members m1 ON r.from_member_id = m1.id
    JOIN members m2 ON r.to_member_id = m2.id
    WHERE r.family_id = '8dce9be1-cdb2-4763-b84e-29631c750686'
    ORDER BY m1.first_name
  `);
  
  console.log('\\nALL RELATIONSHIPS (Chettiyar Family):');
  console.log('========================================');
  rows.forEach(r => {
    const subtype = r.relationship_subtype ? ` (${r.relationship_subtype})` : '';
    console.log(`${r.from_member} --[${r.relationship_type}${subtype}]--> ${r.to_member}`);
  });
  
  await conn.end();
}

showRelationships();
