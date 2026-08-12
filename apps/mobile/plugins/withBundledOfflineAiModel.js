const fs = require('fs');
const path = require('path');

const { withDangerousMod } = require('@expo/config-plugins');

const BUNDLE_DIR = '.offline-ai-bundle';
const ASSET_SUBDIR = 'offline-ai-models';
const MANIFEST_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';

/**
 * Copies a prepared GGUF from `.offline-ai-bundle/` into Android assets during prebuild.
 * Run `npm run prepare:offline-ai-model` before `expo prebuild` for hackathon APKs.
 * Weights are never committed to Git.
 */
function withBundledOfflineAiModel(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const source = path.join(projectRoot, BUNDLE_DIR, MANIFEST_FILENAME);
      const destDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets',
        ASSET_SUBDIR,
      );

      if (!fs.existsSync(source)) {
        console.warn(
          `[withBundledOfflineAiModel] Skipped — bundle not found at ${source}. ` +
            'Run npm run prepare:offline-ai-model before building a demo APK with bundled AI.',
        );
        return modConfig;
      }

      fs.mkdirSync(destDir, { recursive: true });
      const dest = path.join(destDir, MANIFEST_FILENAME);
      fs.copyFileSync(source, dest);
      const sizeMb = Math.round(fs.statSync(dest).size / (1024 * 1024));
      console.log(
        `[withBundledOfflineAiModel] Packaged ${MANIFEST_FILENAME} (${sizeMb} MB) into Android assets.`,
      );
      return modConfig;
    },
  ]);
}

module.exports = withBundledOfflineAiModel;
