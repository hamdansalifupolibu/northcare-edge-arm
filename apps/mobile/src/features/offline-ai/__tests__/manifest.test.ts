import fs from 'node:fs';
import path from 'node:path';

import {
  getOfflineAiModelManifest,
  validateOfflineAiModelManifest,
} from '../domain/manifest';

describe('offline AI model manifest', () => {
  it('validates locked model identity and under-800MB rule', () => {
    const manifest = getOfflineAiModelManifest();
    expect(validateOfflineAiModelManifest(manifest)).toEqual([]);
    expect(manifest.modelId).toBe('qwen2.5-0.5b-instruct-q4_k_m');
    expect(manifest.quantisation).toBe('Q4_K_M');
    expect(manifest.actualByteSize).toBeLessThan(800 * 1024 * 1024);
    expect(manifest.sha256).toHaveLength(64);
    expect(manifest.repositoryRevision.length).toBeGreaterThan(0);
  });

  it('matches implementation manifest bytes and checksum', () => {
    const mobile = getOfflineAiModelManifest();
    const implementationPath = path.resolve(
      __dirname,
      '../../../../../../implementation/offline-ai-model-manifest.json',
    );
    const implementation = JSON.parse(fs.readFileSync(implementationPath, 'utf8')) as {
      actualByteSize: number;
      sha256: string;
      modelId: string;
      quantisation: string;
    };
    expect(implementation.modelId).toBe(mobile.modelId);
    expect(implementation.quantisation).toBe(mobile.quantisation);
    expect(implementation.actualByteSize).toBe(mobile.actualByteSize);
    expect(implementation.sha256).toBe(mobile.sha256);
  });

  it('rejects oversized manifests', () => {
    const bad = {
      ...getOfflineAiModelManifest(),
      actualByteSize: 900 * 1024 * 1024,
    };
    expect(validateOfflineAiModelManifest(bad)).toContain(
      'actualByteSize must remain under 800 MB',
    );
  });
});
