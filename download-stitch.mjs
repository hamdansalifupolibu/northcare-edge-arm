/**
 * Stitch Download Script - Fixed
 * Downloads all project assets from Google Stitch
 */

import 'dotenv/config';
import { stitch } from '@google/stitch-sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.STITCH_API_KEY;
const PROJECT_ID = process.env.STITCH_PROJECT_ID;

process.env.STITCH_API_KEY = API_KEY;

const EXPORT_DIR = join(process.cwd(), 'stitch-exports');
const ASSETS_DIR = join(EXPORT_DIR, 'assets');

[EXPORT_DIR, ASSETS_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

async function downloadProject() {
  console.log('🔗 Connecting to Google Stitch...');
  console.log(`📋 Project ID: ${PROJECT_ID}\n`);

  try {
    const project = stitch.project(PROJECT_ID);
    
    // List available tools from the MCP client
    console.log('=== Listing Available Tools ===');
    try {
      const tools = await project.client.listTools();
      console.log('Tools:');
      if (tools && Array.isArray(tools)) {
        for (const tool of tools) {
          console.log(`  - ${tool.name}: ${tool.description || ''}`);
          if (tool.inputSchema) {
            console.log(`    Schema: ${JSON.stringify(tool.inputSchema, null, 4)}`);
          }
        }
        writeFileSync(
          join(EXPORT_DIR, 'available-tools.json'),
          JSON.stringify(tools, null, 2)
        );
        console.log('💾 Saved tools list to stitch-exports/available-tools.json');
      } else if (tools && typeof tools === 'object') {
        console.log(JSON.stringify(tools, null, 2));
        writeFileSync(
          join(EXPORT_DIR, 'available-tools.json'),
          JSON.stringify(tools, null, 2)
        );
      }
    } catch (err) {
      console.error('Error listing tools:', err.message);
    }
    console.log('');

    // Download assets - passing string directly
    console.log('📥 Downloading project assets...');
    try {
      const result = await project.downloadAssets(ASSETS_DIR);
      console.log('✅ Assets downloaded!');
      console.log('Result:', JSON.stringify(result, null, 2));
      writeFileSync(
        join(EXPORT_DIR, 'download-result.json'),
        JSON.stringify(result, null, 2)
      );
    } catch (err) {
      console.error('Download error:', err.message);
      
      // Inspect the project-ext.js source to understand the API
      console.log('\n📖 Checking SDK source...');
      try {
        const { readFileSync } = await import('fs');
        const sdkPath = 'file:///C:/Users/Gebruiker/OneDrive/Desktop/Hon.%20Salifu%20Dandaawa/node_modules/@google/stitch-sdk/dist/src/project-ext.js';
        const sdkSource = readFileSync(new URL(sdkPath), 'utf-8');
        console.log('\n--- project-ext.js source ---');
        console.log(sdkSource);
      } catch (readErr) {
        console.log('Could not read SDK source:', readErr.message);
      }
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

downloadProject();
