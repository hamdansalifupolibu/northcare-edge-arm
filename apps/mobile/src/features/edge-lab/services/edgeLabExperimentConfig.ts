import { File, Paths } from 'expo-file-system';

import type { EdgeLabOverrides } from '../domain/types';

export const EDGE_LAB_AUTO_CONFIG_FILENAME = 'edge-lab-auto-run.config';

/**
 * Optional JSON beside the auto trigger, e.g.:
 * {"experimentId":"exp-01-whisper-threads","whisperMaxThreads":6}
 */
export async function readEdgeLabAutoConfig(): Promise<EdgeLabOverrides | null> {
  const file = new File(Paths.document, EDGE_LAB_AUTO_CONFIG_FILENAME);
  if (!file.exists) {
    return null;
  }
  try {
    const raw = (await file.text()).trim();
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as EdgeLabOverrides;
    const overrides: EdgeLabOverrides = {};
    if (typeof parsed.experimentId === 'string' && parsed.experimentId.length > 0) {
      overrides.experimentId = parsed.experimentId;
    }
    if (
      typeof parsed.whisperMaxThreads === 'number' &&
      Number.isFinite(parsed.whisperMaxThreads) &&
      parsed.whisperMaxThreads >= 1 &&
      parsed.whisperMaxThreads <= 8
    ) {
      overrides.whisperMaxThreads = Math.round(parsed.whisperMaxThreads);
    }
    if (typeof parsed.whisperPrompt === 'string') {
      // Cap length; never log the prompt contents in evidence beyond length.
      overrides.whisperPrompt = parsed.whisperPrompt.slice(0, 240);
    }
    if (typeof parsed.whisperSpeedUp === 'boolean') {
      overrides.whisperSpeedUp = parsed.whisperSpeedUp;
    }
    if (
      typeof parsed.whisperModelFilename === 'string' &&
      /^[\w.\-]+$/.test(parsed.whisperModelFilename) &&
      parsed.whisperModelFilename.endsWith('.bin')
    ) {
      overrides.whisperModelFilename = parsed.whisperModelFilename;
    }
    if (parsed.captureFixtureTranscript === true) {
      overrides.captureFixtureTranscript = true;
    }
    return Object.keys(overrides).length > 0 ? overrides : null;
  } catch {
    return null;
  }
}

export function clearEdgeLabAutoConfig(): void {
  const file = new File(Paths.document, EDGE_LAB_AUTO_CONFIG_FILENAME);
  if (file.exists) {
    file.delete();
  }
}
