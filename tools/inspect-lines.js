const fs = require('fs');
const path = 'c:/Users/User/Downloads/hero/server.js';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
for (let i = 418; i <= 426; i++) {
  const ln = lines[i-1] || '';
  const codes = [];
  for (let j = 0; j < ln.length; j++) codes.push(ln.charCodeAt(j));
  console.log(i + ':', ln);
  console.log(' codes:', codes.join(' '));
}
