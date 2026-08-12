import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/features');

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

function migrateFeature(filePath, feature, hookName, stringsName) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(`${stringsName}`)) return false;

  const depth = path.relative(path.join(ROOT, feature), path.dirname(filePath)).split(path.sep).length;
  const hookPath = `${'../'.repeat(depth)}hooks/${hookName}`;

  content = content.replace(
    new RegExp(`import \\{ ${stringsName} \\} from '[^']+';\\n`),
    `import { ${hookName} } from '${hookPath}';\n`,
  );

  if (!content.includes(`${hookName}()`)) {
    content = content.replace(
      /export function (\w+)\(\) \{/,
      `export function $1() {\n  const ${stringsName} = ${hookName}();`,
    );
  }

  content = content.replace(
    new RegExp(`(const ${stringsName} = ${hookName}\\(\\);\\s*)+`, 'g'),
    `const ${stringsName} = ${hookName}();\n`,
  );

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

for (const feature of ['assistant', 'referrals']) {
  const hookName = feature === 'assistant' ? 'useAssistantStrings' : 'useReferralStrings';
  const stringsName = feature === 'assistant' ? 'assistantStrings' : 'referralStrings';
  for (const file of walk(path.join(ROOT, feature))) {
    if (migrateFeature(file, feature, hookName, stringsName)) {
      console.log('migrated', file);
    }
  }
}
