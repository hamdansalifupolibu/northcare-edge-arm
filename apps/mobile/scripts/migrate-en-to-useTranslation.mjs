/**
 * One-off migration helper: replace static `en` imports with `useTranslation()` in React components.
 * Skips test files and known non-component modules.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const APP = path.resolve('app');

const SKIP = new Set([
  'errorMapper.ts',
  'labels.ts',
  'PasswordField.tsx',
  'stateAccuracyCopy.test.ts',
  'passwordField.test.tsx',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.tsx$/.test(entry.name) && !SKIP.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes("import { en } from")) return false;

  const importMatch = content.match(/import \{ en \} from ['"]([^'"]+)['"];/);
  if (!importMatch) return false;

  const enImportPath = importMatch[1];
  const providerPath = enImportPath.replace(/\/en$/, '/LanguageProvider');

  content = content.replace(
    /import \{ en \} from ['"][^'"]+['"];\n/,
    `import { useTranslation } from '${providerPath}';\n`,
  );

  if (!content.includes('useTranslation()')) {
    content = content.replace(
      /export default function (\w+)\(/,
      'export default function $1(',
    );
    content = content.replace(
      /export function (\w+)\(/,
      (match) => `${match}\n  const t = useTranslation();`,
    );
    content = content.replace(
      /export default function (\w+)\([^)]*\) \{/,
      (match) => `${match}\n  const t = useTranslation();`,
    );
  }

  content = content.replace(/\ben\./g, 't.');

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

const files = [...walk(ROOT), ...walk(APP)];
let count = 0;
for (const file of files) {
  if (migrateFile(file)) {
    count += 1;
    console.log('migrated', path.relative(process.cwd(), file));
  }
}
console.log(`Done. Migrated ${count} files.`);
