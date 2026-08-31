const fs = require('fs');
const path = 'c:/dev/vansh-app-1/scripts/apply-ego-centric-layout.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\\`/g, '`');
fs.writeFileSync(path, content);
console.log('Fixed backticks.');
