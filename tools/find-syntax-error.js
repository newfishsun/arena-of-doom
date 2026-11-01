const fs = require('fs');
const vm = require('vm');
const path = 'c:/Users/User/Downloads/hero/server.js';
const src = fs.readFileSync(path, 'utf8');
const lines = src.split(/\r?\n/);
for (let i = 1; i <= lines.length; i++) {
  const chunk = lines.slice(0, i).join('\n');
  try {
    new vm.Script(chunk, {filename: path});
  } catch (err) {
    if (err && err.loc) {
      console.error('Parse error at line', err.loc.line, 'col', err.loc.column, err.message);
    } else {
      console.error('Parse error while compiling up to line', i, err.message);
    }
    process.exit(0);
  }
}
console.log('No syntax errors detected by vm.Script');
