const fs = require('fs');
const s = fs.readFileSync('c:/Users/User/Downloads/hero/server.js', 'utf8');
const lines = s.split(/\r?\n/);
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("socket.on('playerDamaged'") || lines[i].includes('socket.on(\'playerDamaged\'')) { start = i; break; }
}
for (let i = start; i < lines.length; i++) {
  if (lines[i].trim() === '});') { end = i; break; }
}
console.log('startLine', start+1, 'endLine', end+1);
const chunk = lines.slice(start, end+1).join('\n');
let par = 0, br = 0, brac = 0, backs = 0, sq = 0, dq = 0;
let inSingle=false, inDouble=false, inBack=false, esc=false;
for (let i = 0; i < chunk.length; i++) {
  const ch = chunk[i];
  if (esc) { esc = false; continue; }
  if (ch === '\\') { esc = true; continue; }
  if (inSingle) { if (ch === "'") inSingle = false; continue; }
  if (inDouble) { if (ch === '"') inDouble = false; continue; }
  if (inBack) { if (ch === '`') inBack = false; continue; }
  if (ch === "'") { inSingle = true; sq++; continue; }
  if (ch === '"') { inDouble = true; dq++; continue; }
  if (ch === '`') { inBack = true; backs++; continue; }
  if (ch === '(') par++;
  if (ch === ')') par--;
  if (ch === '[') br++;
  if (ch === ']') br--;
  if (ch === '{') brac++;
  if (ch === '}') brac--;
}
console.log({par, br, brac, backs, sq, dq});

// Print lines around the first occurrence of a backtick inside the chunk
for (let i = start; i <= end; i++) {
  if (lines[i].includes('`')) {
    console.log('\nLines around backtick at', i+1);
    for (let j = Math.max(start, i-3); j <= Math.min(end, i+3); j++) {
      console.log((j+1).toString().padStart(4, ' '), lines[j]);
    }
    break;
  }
}
