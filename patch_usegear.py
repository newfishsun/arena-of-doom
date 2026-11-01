from pathlib import Path
import re

candidates = [
    Path(__file__).parent / 'public' / 'index.html',
    Path(__file__).parent / 'index.html',
]

path = next((p for p in candidates if p.exists()), None)
if path is None:
    raise FileNotFoundError('Could not find index.html in current directory or public/index.html')

text = path.read_text(encoding='utf-8')
pattern = re.compile(r'(?P<indent>\s*)useGear\s*\(\s*\)\s*\{\s*')

def replacement(m):
    body_after = text[m.end():m.end() + 220]
    if 'Entity.prototype.useGear' in body_after:
        return m.group(0)
    return (
        f"{m.group(0)}\n"
        f"{m.group('indent')}    if (['visiongoggles','electrico','invincible','soundblast','execution','teleportation'].includes(this.gear)) {{ return Entity.prototype.useGear.call(this); }}\n"
        f"{m.group('indent')}"
    )

new_text, count = pattern.subn(replacement, text)
new_text = new_text.replace('let knockback = 1100;', 'let knockback = 2000;')
new_text = new_text.replace('let knockback = 1200;', 'let knockback = 2000;')
new_text = new_text.replace('let knockback = 1500;', 'let knockback = 2000;')

if new_text != text:
    path.write_text(new_text, encoding='utf-8')
    print(f'Patched useGear methods in {path}')
else:
    print(f'All {count} useGear methods in {path} are already patched and up to date.')