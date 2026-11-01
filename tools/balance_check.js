const fs = require('fs');
const s = fs.readFileSync('server.js', 'utf8');
let stack = [];
const pairs = { '(': ')', '{': '}', '[': ']' };
let i = 0;
function isEscaped(str, idx) {
  let backslashes = 0;
  for (let j = idx - 1; j >= 0; j--) {
    if (str[j] === '\\') backslashes++; else break;
  }
  return backslashes % 2 === 1;
}
while (i < s.length) {
  const c = s[i];
  // skip single-line comments
  if (c === '/' && s[i + 1] === '/') {
    i += 2;
    while (i < s.length && s[i] !== '\n') i++;
    continue;
  }
  // skip block comments
  if (c === '/' && s[i + 1] === '*') {
    i += 2;
    while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++;
    i += 2;
    continue;
  }
  // skip strings (single, double, template)
  if (c === '"' || c === "'" || c === '`') {
    const q = c;
    i++;
    while (i < s.length) {
      if (s[i] === q && !isEscaped(s, i)) { i++; break; }
      i++;
    }
    continue;
  }
  if ('({['.includes(c)) {
    stack.push({ c, i });
  } else if (')}]'.includes(c)) {
    if (stack.length === 0) {
      console.log('Unexpected closing', c, 'at', i);
      process.exit(1);
    }
    const top = stack.pop();
    if (pairs[top.c] !== c) {
      console.log('Mismatched', top.c, 'at', top.i, 'with', c, 'at', i);
      process.exit(1);
    }
  }
  i++;
}
if (stack.length) {
  const top = stack[stack.length - 1];
  console.log('Unclosed', top.c, 'at', top.i);
  process.exit(1);
}
console.log('All brackets/braces/parentheses are balanced');
