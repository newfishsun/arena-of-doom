const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, 'public', 'index.html'),
  path.join(__dirname, 'index.html'),
  path.join(__dirname, '..', 'index.html'),
  path.join(__dirname, '..', 'public', 'index.html')
];

const indexPath = candidates.find(p => fs.existsSync(p));
if (!indexPath) {
  console.error('❌ Could not find index.html');
  process.exit(1);
}

const text = fs.readFileSync(indexPath, 'utf8');
const classRegex = /class\s+(\w+)\s+extends\s+Entity\s*\{([\s\S]*?)(?=\n\s*class\s+\w+|\n\s*function\s+\w+|\n\s*<\/script>)/g;

let match;
let missing = [];
let total = 0;

while ((match = classRegex.exec(text)) !== null) {
  const className = match[1];
  const body = match[2];
  total++;
  if (!/this\.countsAsFFAHero\s*=\s*(true|false)/.test(body)) {
    missing.push(className);
  }
}

console.log(`Checked ${total} Entity subclasses in ${indexPath}`);
if (missing.length > 0) {
  console.warn(`⚠️ Missing countsAsFFAHero in: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('✅ All Entity subclasses explicitly set countsAsFFAHero!');
}