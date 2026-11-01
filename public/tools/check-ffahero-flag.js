// Simple check to ensure every Entity subclass constructor explicitly sets `this.countsAsFFAHero`
// Exit code 1 when missing classes are found.
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
const src = fs.readFileSync(filePath, 'utf8');

const classRegex = /class\s+([A-Za-z0-9_]+)\s+extends\s+Entity/g;
let m;
const missing = [];

while ((m = classRegex.exec(src)) !== null) {
  const className = m[1];
  const classStart = m.index;
  // find the constructor after classStart
  const ctorIndex = src.indexOf('constructor', classStart);
  if (ctorIndex === -1) {
    // no constructor — skip (could be fine), but warn
    continue;
  }
  // ensure the constructor we found belongs to this class (i.e. appears before next 'class' declaration)
  const nextClassMatch = classRegex.exec(src);
  let nextClassIndex = nextClassMatch ? nextClassMatch.index : src.length;
  // reset lastIndex back so outer loop continues correctly
  classRegex.lastIndex = m.index + 1;

  if (ctorIndex > nextClassIndex) {
    // constructor belongs to a later class — skip
    continue;
  }

  // find the opening brace for the constructor
  const firstBrace = src.indexOf('{', ctorIndex);
  if (firstBrace === -1 || firstBrace > nextClassIndex) continue;

  // brace matching to find end of constructor
  let depth = 0;
  let i = firstBrace;
  let endIndex = -1;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { endIndex = i; break; }
    }
  }
  if (endIndex === -1) continue; // malformed

  const ctorText = src.substring(ctorIndex, endIndex + 1);
  if (!/countsAsFFAHero\s*=/.test(ctorText)) {
    missing.push(className);
  }
}

if (missing.length === 0) {
  console.log('✅ All Entity subclass constructors explicitly set countsAsFFAHero (or have no constructor).');
  process.exit(0);
} else {
  console.error('⚠️ Missing countsAsFFAHero in constructors for the following classes:');
  missing.forEach(c => console.error(' -', c));
  console.error('\nAdd `this.countsAsFFAHero = true|false;` to each constructor to make FFA counting future-proof.');
  process.exit(1);
}
