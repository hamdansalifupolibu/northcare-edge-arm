import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const APP = path.resolve('app');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      walk(full, out);
    } else if (/\.tsx$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

for (const file of [...walk(ROOT), ...walk(APP)]) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(
    /export function (\w+)\(\s*\n\s*const t = useTranslation\(\);\) \{/g,
    'export function $1() {\n  const t = useTranslation();',
  );
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('fixed', path.relative(process.cwd(), file));
  }
}
