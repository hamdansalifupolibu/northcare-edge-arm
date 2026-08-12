import rawManifest from '../content/offline-ai-model-manifest.json';
import type { OfflineAiModelManifest } from './types';

const MAXIMUM_SUPPORTED_MODEL_SIZE = 800 * 1024 * 1024;

export function getOfflineAiModelManifest(): OfflineAiModelManifest {
  return rawManifest as OfflineAiModelManifest;
}

export function validateOfflineAiModelManifest(
  manifest: OfflineAiModelManifest = getOfflineAiModelManifest(),
): readonly string[] {
  const errors: string[] = [];

  if (manifest.modelId !== 'qwen2.5-0.5b-instruct-q4_k_m') {
    errors.push('modelId must be qwen2.5-0.5b-instruct-q4_k_m');
  }
  if (manifest.filename !== 'qwen2.5-0.5b-instruct-q4_k_m.gguf') {
    errors.push('filename must be qwen2.5-0.5b-instruct-q4_k_m.gguf');
  }
  if (manifest.repository !== 'Qwen/Qwen2.5-0.5B-Instruct-GGUF') {
    errors.push('repository mismatch');
  }
  if (manifest.format !== 'GGUF') {
    errors.push('format must be GGUF');
  }
  if (manifest.quantisation !== 'Q4_K_M') {
    errors.push('quantisation must be Q4_K_M');
  }
  if (manifest.runtime !== 'llama.rn') {
    errors.push('runtime must be llama.rn');
  }
  if (!Number.isInteger(manifest.actualByteSize) || manifest.actualByteSize <= 0) {
    errors.push('actualByteSize must be a positive integer from real metadata');
  }
  if (manifest.actualByteSize >= MAXIMUM_SUPPORTED_MODEL_SIZE) {
    errors.push('actualByteSize must remain under 800 MB');
  }
  if (manifest.maximumSupportedModelSize !== MAXIMUM_SUPPORTED_MODEL_SIZE) {
    errors.push('maximumSupportedModelSize must equal 800 MiB in bytes');
  }
  if (!/^[a-f0-9]{64}$/i.test(manifest.sha256)) {
    errors.push('sha256 must be a 64-character hex digest');
  }
  if (!manifest.repositoryRevision.trim()) {
    errors.push('repositoryRevision is required');
  }
  if (manifest.configuredContextSize !== 2048) {
    errors.push('configuredContextSize must be 2048 for Stage 1');
  }
  if (manifest.configuredMaximumOutputTokens < 120 || manifest.configuredMaximumOutputTokens > 1024) {
    errors.push('configuredMaximumOutputTokens must be between 120 and 1024');
  }

  return errors;
}

export function assertValidOfflineAiModelManifest(
  manifest: OfflineAiModelManifest = getOfflineAiModelManifest(),
): OfflineAiModelManifest {
  const errors = validateOfflineAiModelManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid offline AI model manifest: ${errors.join('; ')}`);
  }
  return manifest;
}
