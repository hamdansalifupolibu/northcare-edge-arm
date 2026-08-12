/**
 * Stitch Connection Script
 * Connects to Google Stitch and fetches project designs for NorthCare AI Project
 */

import 'dotenv/config';
import { stitch } from '@google/stitch-sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.STITCH_API_KEY;
const PROJECT_ID = process.env.STITCH_PROJECT_ID;

if (!API_KEY || !PROJECT_ID) {
  console.error('❌ Missing STITCH_API_KEY or STITCH_PROJECT_ID in .env file');
  process.exit(1);
}

// Set the API key for the SDK
process.env.STITCH_API_KEY = API_KEY;

const EXPORT_DIR = join(process.cwd(), 'stitch-exports');

async function connectAndFetchProject() {
  console.log('🔗 Connecting to Google Stitch...');
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log('');

  try {
    // Access the project
    const project = stitch.project(PROJECT_ID);
    console.log('✅ Connected to Stitch project successfully!');

    // Create export directory
    if (!existsSync(EXPORT_DIR)) {
      mkdirSync(EXPORT_DIR, { recursive: true });
    }

    // Get project details
    console.log('\n📐 Fetching project details...');
    const details = await project.getDetails();
    console.log(`   Project Name: ${details.name || 'Untitled'}`);
    console.log(`   Created: ${details.createdAt || 'Unknown'}`);
    console.log(`   Screens: ${details.screens?.length || 0}`);

    // Save project metadata
    writeFileSync(
      join(EXPORT_DIR, 'project-details.json'),
      JSON.stringify(details, null, 2)
    );
    console.log('   💾 Saved project details to stitch-exports/project-details.json');

    // Fetch all screens
    if (details.screens && details.screens.length > 0) {
      console.log(`\n🖥️  Fetching ${details.screens.length} screen(s)...`);

      const screensDir = join(EXPORT_DIR, 'screens');
      if (!existsSync(screensDir)) {
        mkdirSync(screensDir, { recursive: true });
      }

      for (let i = 0; i < details.screens.length; i++) {
        const screen = details.screens[i];
        const screenName = screen.name || `screen-${i + 1}`;
        console.log(`\n   Screen ${i + 1}: ${screenName}`);

        try {
          // Get HTML export
          const html = await screen.getHtml();
          if (html) {
            const htmlPath = join(screensDir, `${screenName}.html`);
            writeFileSync(htmlPath, html);
            console.log(`   ✅ HTML saved: stitch-exports/screens/${screenName}.html`);
          }

          // Get screenshot/image
          try {
            const imageUrl = await screen.getImage();
            if (imageUrl) {
              const imagePath = join(screensDir, `${screenName}.png`);
              // Fetch and save the image
              const response = await fetch(imageUrl);
              const buffer = await response.arrayBuffer();
              writeFileSync(imagePath, Buffer.from(buffer));
              console.log(`   ✅ Image saved: stitch-exports/screens/${screenName}.png`);
            }
          } catch (imgErr) {
            console.log(`   ⚠️  Could not export image for ${screenName}`);
          }

          // Get CSS if available
          try {
            const css = await screen.getCss();
            if (css) {
              const cssPath = join(screensDir, `${screenName}.css`);
              writeFileSync(cssPath, css);
              console.log(`   ✅ CSS saved: stitch-exports/screens/${screenName}.css`);
            }
          } catch (cssErr) {
            // CSS export may not be available for all screens
          }

        } catch (screenErr) {
          console.log(`   ⚠️  Error fetching screen ${screenName}: ${screenErr.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Stitch project data exported successfully!');
    console.log(`📁 All exports saved to: stitch-exports/`);
    console.log('='.repeat(60));

    return details;

  } catch (error) {
    console.error('\n❌ Error connecting to Stitch:');
    console.error(`   ${error.message}`);

    if (error.message?.includes('401') || error.message?.includes('auth') || error.message?.includes('Unauthorized')) {
      console.error('\n💡 Tip: Your API key may be expired or invalid.');
      console.error('   Generate a new one at https://stitch.withgoogle.com/');
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      console.error('\n💡 Tip: You may not have access to this project.');
      console.error('   Make sure the project is shared or you are the owner.');
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.error('\n💡 Tip: Project not found. Double-check the project ID.');
    }

    // Try alternative: direct API fetch
    console.log('\n🔄 Attempting alternative API connection...');
    try {
      const response = await fetch(
        `https://stitch.withgoogle.com/api/v1/projects/${PROJECT_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        writeFileSync(
          join(EXPORT_DIR, 'project-details.json'),
          JSON.stringify(data, null, 2)
        );
        console.log('✅ Alternative API connection successful!');
        console.log('💾 Saved to stitch-exports/project-details.json');
        return data;
      } else {
        console.error(`   Alternative API returned: ${response.status} ${response.statusText}`);
      }
    } catch (altError) {
      console.error(`   Alternative API also failed: ${altError.message}`);
    }

    throw error;
  }
}

// Run the connection
connectAndFetchProject()
  .then((details) => {
    console.log('\n✅ Ready to start building the NorthCare AI Project!');
  })
  .catch((err) => {
    console.error('\n⚠️  Connection completed with errors. Check the output above.');
    process.exit(1);
  });
