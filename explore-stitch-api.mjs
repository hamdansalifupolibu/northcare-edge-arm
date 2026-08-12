/**
 * Stitch Connection & Exploration Script
 * Explores the SDK API to find the correct methods for fetching project data
 */

import 'dotenv/config';
import { stitch } from '@google/stitch-sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.STITCH_API_KEY;
const PROJECT_ID = process.env.STITCH_PROJECT_ID;

process.env.STITCH_API_KEY = API_KEY;

const EXPORT_DIR = join(process.cwd(), 'stitch-exports');

if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

async function exploreAndFetch() {
  console.log('🔗 Connecting to Google Stitch...');
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log('');

  try {
    // Inspect the stitch object
    console.log('=== Stitch SDK Top-Level ===');
    console.log('Type:', typeof stitch);
    console.log('Keys:', Object.keys(stitch));
    console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(stitch) || {}).filter(m => m !== 'constructor'));
    console.log('');

    // Access the project
    const project = stitch.project(PROJECT_ID);
    console.log('=== Project Object ===');
    console.log('Type:', typeof project);
    console.log('Keys:', Object.keys(project));
    const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(project) || {}).filter(m => m !== 'constructor');
    console.log('Prototype Methods:', protoMethods);
    console.log('');

    // Try every available method
    for (const method of protoMethods) {
      if (typeof project[method] === 'function') {
        console.log(`\n--- Trying project.${method}() ---`);
        try {
          const result = await project[method]();
          console.log(`  Result type: ${typeof result}`);
          if (result && typeof result === 'object') {
            console.log(`  Keys: ${Object.keys(result).slice(0, 20)}`);
            
            // Save result
            const resultStr = JSON.stringify(result, null, 2);
            writeFileSync(join(EXPORT_DIR, `${method}-result.json`), resultStr);
            console.log(`  💾 Saved to stitch-exports/${method}-result.json`);
            
            // If it looks like it has screens/pages/frames
            if (result.screens) console.log(`  Found ${result.screens.length} screens`);
            if (result.pages) console.log(`  Found ${result.pages.length} pages`);
            if (result.frames) console.log(`  Found ${result.frames.length} frames`);
            if (result.name) console.log(`  Name: ${result.name}`);
          } else if (typeof result === 'string') {
            writeFileSync(join(EXPORT_DIR, `${method}-result.txt`), result);
            console.log(`  💾 Saved to stitch-exports/${method}-result.txt`);
            console.log(`  Preview: ${result.substring(0, 200)}`);
          }
        } catch (err) {
          console.log(`  ❌ Error: ${err.message}`);
        }
      }
    }

    // Also check own keys that might be methods
    for (const key of Object.keys(project)) {
      if (typeof project[key] === 'function' && !protoMethods.includes(key)) {
        console.log(`\n--- Trying project.${key}() ---`);
        try {
          const result = await project[key]();
          console.log(`  Result type: ${typeof result}`);
          if (result && typeof result === 'object') {
            const resultStr = JSON.stringify(result, null, 2);
            writeFileSync(join(EXPORT_DIR, `${key}-result.json`), resultStr);
            console.log(`  💾 Saved to stitch-exports/${key}-result.json`);
          }
        } catch (err) {
          console.log(`  ❌ Error: ${err.message}`);
        }
      }
    }

    // Try common variations
    const commonMethods = [
      'info', 'get', 'fetch', 'list', 'listScreens', 'getScreens',
      'getPages', 'getData', 'toJSON', 'export', 'getExport',
      'getHtml', 'getCss', 'getImage', 'getScreenshot'
    ];

    console.log('\n=== Trying Common Method Names ===');
    for (const m of commonMethods) {
      if (typeof project[m] === 'function') {
        console.log(`\n--- project.${m}() ---`);
        try {
          const result = await project[m]();
          console.log(`  ✅ Result type: ${typeof result}`);
          if (result && typeof result === 'object') {
            const resultStr = JSON.stringify(result, null, 2);
            writeFileSync(join(EXPORT_DIR, `${m}-result.json`), resultStr);
            console.log(`  💾 Saved to stitch-exports/${m}-result.json`);
          }
        } catch (err) {
          console.log(`  Error: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Exploration complete! Check stitch-exports/ for results.');

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error(error.stack);
  }
}

exploreAndFetch();
