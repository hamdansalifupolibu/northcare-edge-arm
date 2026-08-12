import { Platform } from 'react-native';

import { getOfflineAiServices } from '../../offline-ai/services/createOfflineAiServices';
import { WhisperModelManager } from '../../voice/providers/transcription/whisperModelManager';
import { EDGE_LAB_FIXTURE_ID, resolveEdgeLabFixture } from './edgeLabFixture';

export type EdgeLabPreflightItemId =
  | 'platform'
  | 'whisper_model'
  | 'qwen_model'
  | 'fixture'
  | 'llama_native'
  | 'whisper_runtime';

export type EdgeLabPreflightItem = {
  readonly id: EdgeLabPreflightItemId;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
  readonly blocking: boolean;
};

export type EdgeLabPreflightReport = {
  readonly checkedAtIso: string;
  readonly readyToRun: boolean;
  readonly blockingCount: number;
  readonly items: readonly EdgeLabPreflightItem[];
};

/**
 * Phone-session readiness checklist. Safe to run offline; no clinical writes.
 */
export async function runEdgeLabPreflight(): Promise<EdgeLabPreflightReport> {
  const items: EdgeLabPreflightItem[] = [];

  items.push({
    id: 'platform',
    label: 'Android runtime',
    ok: Platform.OS === 'android',
    detail:
      Platform.OS === 'android'
        ? `Android API ${String(Platform.Version)}`
        : `Current platform: ${Platform.OS} (Arm demo targets Android)`,
    blocking: Platform.OS !== 'android',
  });

  const whisperManager = WhisperModelManager.getInstance();
  await whisperManager.refreshState();
  const whisper = whisperManager.getSnapshot();
  const whisperOk = whisper.state === 'ready';
  items.push({
    id: 'whisper_model',
    label: 'Whisper model',
    ok: whisperOk,
    detail: whisperOk
      ? `${whisper.filename} · ${whisper.byteSize ?? 'size unknown'} bytes`
      : `State: ${whisper.state}${whisper.lastError ? ` · ${whisper.lastError}` : ''}`,
    blocking: true,
  });

  items.push({
    id: 'whisper_runtime',
    label: 'Whisper runtime',
    ok: true,
    detail: 'whisper.rn + M4A patch expected at native build time',
    blocking: false,
  });

  const offline = getOfflineAiServices();
  await offline.refreshStateFromDisk();
  const snap = offline.getSnapshot();
  const qwenOk =
    snap.model.exists &&
    snap.model.byteSize === snap.manifest.actualByteSize &&
    (snap.state === 'ready' || snap.state === 'loaded' || snap.state === 'generating');
  items.push({
    id: 'qwen_model',
    label: 'Qwen model',
    ok: qwenOk,
    detail: qwenOk
      ? `${snap.manifest.filename} · state ${snap.state}`
      : `State: ${snap.state} · exists=${String(snap.model.exists)}`,
    blocking: true,
  });

  items.push({
    id: 'llama_native',
    label: 'llama.rn native module',
    ok: snap.runtime.nativeModuleAvailable,
    detail: snap.runtime.nativeModuleAvailable
      ? `Acceleration: ${snap.accelerationMode}`
      : 'Native module unavailable — rebuild development client',
    blocking: true,
  });

  const fixture = await resolveEdgeLabFixture();
  items.push({
    id: 'fixture',
    label: `Fixture ${EDGE_LAB_FIXTURE_ID}`,
    ok: fixture.exists,
    detail: fixture.exists
      ? `${fixture.byteSize ?? '?'} bytes on device`
      : 'Missing — push edge-lab-fixture-v1.m4a (see benchmarks/fixtures/README.md)',
    blocking: true,
  });

  const blockingCount = items.filter((item) => item.blocking && !item.ok).length;
  return {
    checkedAtIso: new Date().toISOString(),
    readyToRun: blockingCount === 0,
    blockingCount,
    items,
  };
}
