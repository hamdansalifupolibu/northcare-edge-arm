/**
 * Local Stitch MCP proxy for Cursor.
 * Loads STITCH_API_KEY from .env and exposes Google Stitch tools over stdio.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { StitchProxy } from '@google/stitch-sdk';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

config({ path: resolve(rootDir, '.env'), quiet: true });

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error('Missing STITCH_API_KEY in .env');
  process.exit(1);
}

const proxy = new StitchProxy({
  apiKey,
  name: 'northcare-stitch',
  version: '1.0.0',
});

const transport = new StdioServerTransport();
await proxy.start(transport);
