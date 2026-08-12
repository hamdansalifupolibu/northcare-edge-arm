const fs = require('fs');
const path = require('path');

const source = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'database',
  'migrations',
  '001_initial_schema.ts',
);
const text = fs.readFileSync(source, 'utf8');
const start = text.indexOf('export const INITIAL_SCHEMA_SQL = `');
const end = text.indexOf('`;', start);
if (start < 0 || end < 0) {
  throw new Error('Could not locate INITIAL_SCHEMA_SQL');
}
const sql = text
  .slice(start + 'export const INITIAL_SCHEMA_SQL = `'.length, end)
  .trim();
const header = `-- NorthCare AI SQLite schema export
-- Authoritative runtime source: apps/mobile/src/data/database/migrations/001_initial_schema.ts
-- Migration version: 1
-- Generated for review only — do not treat as a second runtime schema source.

`;
const out = path.join(__dirname, '..', '..', '..', 'implementation', 'sqlite-schema.sql');
fs.writeFileSync(out, `${header}${sql}\n`, 'utf8');
console.log('Wrote', out);
