#!/usr/bin/env node
/**
 * Pushes a verified GGUF to an emulator/device for development iteration.
 * Requires adb and a prepared `.offline-ai-bundle/` file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(mobileRoot, 'src/features/offline-ai/content/offline-ai-model-manifest.json'),
    'utf8',
  ),
);
const source = path.join(mobileRoot, '.offline-ai-bundle', manifest.filename);
const remoteDir = `/sdcard/Android/data/com.northcareai.app/files/offline-ai-models`;
const remotePath = `${remoteDir}/${manifest.filename}`;

if (!fs.existsSync(source)) {
  console.error('Run npm run prepare:offline-ai-model first.');
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('adb', ['shell', 'mkdir', '-p', remoteDir]);
run('adb', ['push', source, remotePath]);
console.log(`Model pushed to ${remotePath}`);
