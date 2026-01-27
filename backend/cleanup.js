const mysql = require('mysql2/promise');

async function cleanup() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '1234',
    database: 'vansh_db'
  });
  
  // Delete orphaned Wife and Son members
  await conn.execute("DELETE FROM members WHERE first_name IN ('Wife', 'Son')");
  console.log('Deleted orphaned Wife and Son members');
  
  // Show remaining members
  const [rows] = await conn.execute('SELECT first_name, last_name FROM members');
  console.log('Remaining members:');
  rows.forEach(m => console.log('  ' + m.first_name + ' ' + m.last_name));
  
  await conn.end();
}

cleanup();
