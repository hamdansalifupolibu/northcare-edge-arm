import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const schemaPath = path.join(root, 'implementation/sqlite-schema.sql');
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!schema.includes('approximate_age_unit')) {
  schema = schema.replace(
    'approximate_age INTEGER,',
    "approximate_age INTEGER,\n  approximate_age_unit TEXT CHECK (approximate_age_unit IS NULL OR approximate_age_unit IN ('days','weeks','months','years')),",
  );
}
schema = schema.replace(
  "consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'granted', 'declined', 'withdrawn')),",
  "consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'recorded', 'declined', 'deferred', 'notApplicable')),",
);
fs.writeFileSync(schemaPath, schema);

const rmPath = path.join(root, 'implementation/route-map.json');
const rm = JSON.parse(fs.readFileSync(rmPath, 'utf8'));
rm.version = 3;
rm.stage = 7;
rm.updated = '2026-08-02';
const clientRoutes = [
  {
    route_id: 'CLI-01',
    path: '/(worker)/clients',
    route_group: 'worker',
    access_level: 'protected-worker',
    required_auth_state: 'authenticated',
    required_role: 'worker',
    parameters: [],
    entry_points: ['/(worker)'],
    exit_points: ['/(worker)/clients/register', '/(worker)/clients/[clientId]'],
    back_destination: '/(worker)',
    deep_link: 'northcare://clients',
    deep_link_policy: 'authenticated-worker',
    offline_availability: 'full',
    production_status: 'production',
    implementation_status: 'IMPLEMENTED',
  },
  {
    route_id: 'CLI-02',
    path: '/(worker)/clients/register',
    route_group: 'worker',
    access_level: 'protected-worker',
    required_auth_state: 'authenticated',
    required_role: 'worker',
    parameters: [],
    entry_points: ['/(worker)/clients'],
    exit_points: ['/(worker)/clients', '/(worker)/clients/[clientId]'],
    back_destination: '/(worker)/clients',
    deep_link: 'northcare://clients/register',
    deep_link_policy: 'authenticated-worker',
    offline_availability: 'full',
    production_status: 'production',
    implementation_status: 'IMPLEMENTED',
  },
  {
    route_id: 'CLI-03',
    path: '/(worker)/clients/[clientId]',
    route_group: 'worker',
    access_level: 'protected-worker',
    required_auth_state: 'authenticated',
    required_role: 'worker',
    parameters: ['clientId'],
    entry_points: ['/(worker)/clients', '/(worker)/clients/register'],
    exit_points: [
      '/(worker)/clients/[clientId]/edit',
      '/(worker)/clients/[clientId]/history',
      '/(worker)/clients/[clientId]/archive',
    ],
    back_destination: '/(worker)/clients',
    deep_link: 'northcare://clients/{clientId}',
    deep_link_policy: 'authenticated-worker',
    offline_availability: 'full',
    production_status: 'production',
    implementation_status: 'IMPLEMENTED',
  },
  {
    route_id: 'CLI-04',
    path: '/(worker)/clients/[clientId]/edit',
    route_group: 'worker',
    access_level: 'protected-worker',
    required_auth_state: 'authenticated',
    required_role: 'worker',
    parameters: ['clientId'],
    entry_points: ['/(worker)/clients/[clientId]'],
    exit_points: ['/(worker)/clients/[clientId]'],
    back_destination: '/(worker)/clients/[clientId]',
    deep_link: 'northcare://clients/{clientId}/edit',
    deep_link_policy: 'authenticated-worker',
    offline_availability: 'full',
    production_status: 'production',
    implementation_status: 'IMPLEMENTED',
  },
  {
    route_id: 'CLI-05',
    path: '/(worker)/clients/[clientId]/history',
    route_group: 'worker',
    access_level: 'protected-worker',
    required_auth_state: 'authenticated',
    required_role: 'worker',
    parameters: ['clientId'],
    entry_points: ['/(worker)/clients/[clientId]'],
    exit_points: ['/(worker)/clients/[clientId]'],
    back_destination: '/(worker)/clients/[clientId]',
    deep_link: 'northcare://clients/{clientId}/history',
    deep_link_policy: 'authenticated-worker',
    offline_availability: 'full',
    production_status: 'production',
    implementation_status: 'IMPLEMENTED',
  },
  {
    route_id: 'CLI-06',
    path: '/(worker)/clients/[clientId]/archive',
    route_group: 'worker',
    access_level: 'protected-worker',
    required_auth_state: 'authenticated',
    required_role: 'worker',
    parameters: ['clientId'],
    entry_points: ['/(worker)/clients/[clientId]'],
    exit_points: ['/(worker)/clients'],
    back_destination: '/(worker)/clients/[clientId]',
    deep_link: 'northcare://clients/{clientId}/archive',
    deep_link_policy: 'authenticated-worker',
    offline_availability: 'full',
    production_status: 'production',
    implementation_status: 'IMPLEMENTED',
  },
];
rm.routes = rm.routes.filter((r) => !String(r.route_id).startsWith('CLI-'));
rm.routes.push(...clientRoutes);
fs.writeFileSync(rmPath, `${JSON.stringify(rm, null, 2)}\n`);

const siPath = path.join(root, 'implementation/screen-inventory.json');
const si = JSON.parse(fs.readFileSync(siPath, 'utf8'));
si.version = (si.version || 1) + 1;
si.stage = 7;
si.updated = '2026-08-02';
if (!si.screens) si.screens = [];
const screenIds = new Set(si.screens.map((s) => s.screen_id || s.id));
for (const s of [
  { screen_id: 'CLI-LIST', route: '/(worker)/clients', title: 'Clients', status: 'IMPLEMENTED', stage: 7 },
  { screen_id: 'CLI-REGISTER', route: '/(worker)/clients/register', title: 'Register client', status: 'IMPLEMENTED', stage: 7 },
  { screen_id: 'CLI-PROFILE', route: '/(worker)/clients/[clientId]', title: 'Client profile', status: 'IMPLEMENTED', stage: 7 },
  { screen_id: 'CLI-EDIT', route: '/(worker)/clients/[clientId]/edit', title: 'Edit client', status: 'IMPLEMENTED', stage: 7 },
  { screen_id: 'CLI-HISTORY', route: '/(worker)/clients/[clientId]/history', title: 'Client history', status: 'IMPLEMENTED', stage: 7 },
  { screen_id: 'CLI-ARCHIVE', route: '/(worker)/clients/[clientId]/archive', title: 'Archive client', status: 'IMPLEMENTED', stage: 7 },
]) {
  if (!screenIds.has(s.screen_id)) si.screens.push(s);
}
fs.writeFileSync(siPath, `${JSON.stringify(si, null, 2)}\n`);

const ciPath = path.join(root, 'implementation/component-inventory.json');
const ci = JSON.parse(fs.readFileSync(ciPath, 'utf8'));
ci.version = (ci.version || 1) + 1;
ci.stage = 7;
ci.updated = '2026-08-02';
if (!ci.components) ci.components = [];
const existing = new Set(ci.components.map((c) => c.component_id || c.id));
for (const c of [
  { component_id: 'ClientListItem', path: 'apps/mobile/src/features/clients/components/ClientListItem.tsx', status: 'IMPLEMENTED', stage: 7 },
  { component_id: 'PrivacyAvatar', path: 'apps/mobile/src/features/clients/components/PrivacyAvatar.tsx', status: 'IMPLEMENTED', stage: 7 },
  { component_id: 'StepProgress', path: 'apps/mobile/src/features/clients/components/StepProgress.tsx', status: 'IMPLEMENTED', stage: 7 },
]) {
  if (!existing.has(c.component_id)) ci.components.push(c);
}
fs.writeFileSync(ciPath, `${JSON.stringify(ci, null, 2)}\n`);

const dmPath = path.join(root, 'implementation/data-model.json');
const dm = JSON.parse(fs.readFileSync(dmPath, 'utf8'));
dm.version = (dm.version || 1) + 1;
dm.stage = 7;
dm.updated = '2026-08-02';
dm.schema_version = 2;
dm.notes = `${dm.notes || ''} Stage 7: consent statuses recorded/declined/deferred/notApplicable/unknown; approximate_age_unit.`.trim();
fs.writeFileSync(dmPath, `${JSON.stringify(dm, null, 2)}\n`);

const irPath = path.join(root, 'implementation/implementation-roadmap.json');
if (fs.existsSync(irPath)) {
  const ir = JSON.parse(fs.readFileSync(irPath, 'utf8'));
  ir.current_stage = 7;
  ir.next_stage = 8;
  ir.updated = '2026-08-02';
  fs.writeFileSync(irPath, `${JSON.stringify(ir, null, 2)}\n`);
}

console.log('Stage 7 inventories updated');
