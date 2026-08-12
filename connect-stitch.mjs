/**
 * Verify Google Stitch connection for the NorthCare AI project.
 * Loads STITCH_API_KEY + STITCH_PROJECT_ID from .env
 */

import 'dotenv/config';
import { stitch, StitchError } from '@google/stitch-sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.STITCH_API_KEY;
const PROJECT_ID = process.env.STITCH_PROJECT_ID;
const EXPORT_DIR = join(process.cwd(), 'stitch-exports');

if (!API_KEY) {
  console.error('❌ Missing STITCH_API_KEY in .env');
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error('❌ Missing STITCH_PROJECT_ID in .env');
  process.exit(1);
}

// Ensure the SDK singleton picks up the key
process.env.STITCH_API_KEY = API_KEY;

if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

function screenLabel(screen, index) {
  return (
    screen?.title ||
    screen?.name ||
    screen?.data?.title ||
    screen?.data?.name ||
    screen?.id ||
    `screen-${index + 1}`
  );
}

async function main() {
  console.log('🔗 Connecting to Google Stitch...');
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log(`🔑 API key: ${API_KEY.slice(0, 8)}…${API_KEY.slice(-4)}`);
  console.log('');

  try {
    // 1) List tools (proves MCP/API handshake with the key)
    console.log('1. Listing Stitch tools…');
    const toolsResult = await stitch.listTools();
    const tools = toolsResult?.tools || toolsResult || [];
    const toolNames = Array.isArray(tools)
      ? tools.map((t) => t.name || t).filter(Boolean)
      : [];
    console.log(`   ✅ Connected — ${toolNames.length} tools available`);
    if (toolNames.length) {
      console.log(`   Tools: ${toolNames.slice(0, 12).join(', ')}${toolNames.length > 12 ? '…' : ''}`);
    }
    writeFileSync(
      join(EXPORT_DIR, 'available-tools.json'),
      JSON.stringify(toolsResult, null, 2)
    );

    // 2) List account projects (optional — may be empty depending on key scope)
    console.log('\n2. Listing accessible projects…');
    try {
      const projects = await stitch.projects();
      console.log(`   ✅ Found ${projects.length} project(s)`);
      for (const p of projects.slice(0, 10)) {
        const id = p.id || p.projectId || p.name;
        const title = p.title || p.name || p.displayName || id;
        console.log(`   - ${title} (${id})`);
      }
      const projectsSummary = projects.map((p) => ({
        id: p.id || p.projectId || null,
        title: p.title || p.name || p.displayName || null,
      }));
      writeFileSync(
        join(EXPORT_DIR, 'projects.json'),
        JSON.stringify(projectsSummary, null, 2)
      );
    } catch (err) {
      console.log(`   ⚠️  Could not list projects: ${err.message}`);
    }

    // 3) Open NorthCare project and list screens
    console.log('\n3. Opening NorthCare AI project…');
    const project = stitch.project(PROJECT_ID);
    const screens = await project.screens();
    console.log(`   ✅ Project reachable — ${screens.length} screen(s)`);

    const screenSummary = screens.map((screen, index) => ({
      index: index + 1,
      id: screen.id,
      title: screenLabel(screen, index),
    }));

    for (const item of screenSummary.slice(0, 20)) {
      console.log(`   ${item.index}. ${item.title} [${item.id}]`);
    }
    if (screenSummary.length > 20) {
      console.log(`   …and ${screenSummary.length - 20} more`);
    }

    writeFileSync(
      join(EXPORT_DIR, 'connection-status.json'),
      JSON.stringify(
        {
          connected: true,
          checkedAt: new Date().toISOString(),
          projectId: PROJECT_ID,
          screenCount: screens.length,
          toolCount: toolNames.length,
          tools: toolNames,
          screens: screenSummary,
        },
        null,
        2
      )
    );

    writeFileSync(
      join(EXPORT_DIR, 'screens-index.json'),
      JSON.stringify(screenSummary, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Stitch connection established');
    console.log(`📁 Status saved to stitch-exports/connection-status.json`);
    console.log('='.repeat(60));

    await stitch.close?.();
  } catch (error) {
    console.error('\n❌ Stitch connection failed');
    if (error instanceof StitchError) {
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Recoverable: ${error.recoverable}`);
    } else {
      console.error(`   ${error.message}`);
    }

    if (
      /401|403|auth|unauthorized|permission|api key/i.test(
        String(error.message || error.code || '')
      )
    ) {
      console.error('\n💡 Tip: Generate a fresh API key at https://stitch.withgoogle.com/');
      console.error('   Then update STITCH_API_KEY in .env');
    }

    writeFileSync(
      join(EXPORT_DIR, 'connection-status.json'),
      JSON.stringify(
        {
          connected: false,
          checkedAt: new Date().toISOString(),
          projectId: PROJECT_ID,
          error: {
            code: error.code || 'UNKNOWN',
            message: error.message,
          },
        },
        null,
        2
      )
    );

    process.exit(1);
  }
}

main();
