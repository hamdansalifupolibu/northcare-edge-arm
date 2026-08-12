#!/usr/bin/env node
/**
 * Downloads the verified Stage 1 GGUF into `.offline-ai-bundle/` for Android asset packaging.
 * The file is gitignored — never commit model weights.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(
  mobileRoot,
  'src/features/offline-ai/content/offline-ai-model-manifest.json',
);
const bundleDir = path.join(mobileRoot, '.offline-ai-bundle');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const dest = path.join(bundleDir, manifest.filename);

async function download(url, destination) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temp = `${destination}.partial`;
  const file = fs.createWriteStream(temp);
  const reader = response.body.getReader();
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    file.write(Buffer.from(value));
    received += value.byteLength;
    if (received % (32 * 1024 * 1024) < value.byteLength) {
      const pct = Math.round((received / manifest.actualByteSize) * 100);
      process.stdout.write(`\rDownloading… ${pct}%`);
    }
  }
  file.end();
  await new Promise((resolve, reject) => {
    file.on('finish', resolve);
    file.on('error', reject);
  });
  fs.renameSync(temp, destination);
  process.stdout.write('\n');
}

function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

async function main() {
  if (fs.existsSync(dest)) {
    const size = fs.statSync(dest).size;
    if (size === manifest.actualByteSize) {
      const digest = sha256File(dest);
      if (digest.toLowerCase() === manifest.sha256.toLowerCase()) {
        console.log(`Model already present and verified: ${dest}`);
        return;
      }
      console.warn('Existing file checksum mismatch — re-downloading.');
      fs.unlinkSync(dest);
    } else {
      fs.unlinkSync(dest);
    }
  }

  console.log(`Fetching ${manifest.displayName} (~${Math.round(manifest.actualByteSize / (1024 * 1024))} MB)…`);
  await download(manifest.downloadUrl, dest);

  const size = fs.statSync(dest).size;
  if (size !== manifest.actualByteSize) {
    throw new Error(`Size mismatch: expected ${manifest.actualByteSize}, got ${size}`);
  }
  const digest = sha256File(dest);
  if (digest.toLowerCase() !== manifest.sha256.toLowerCase()) {
    fs.unlinkSync(dest);
    throw new Error('SHA-256 verification failed after download.');
  }
  console.log(`Verified model saved to ${dest}`);
  console.log('Next: npx expo prebuild --platform android --clean && npm run build:demo-apk');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
