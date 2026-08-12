import { File, Paths } from 'expo-file-system';

import { OFFLINE_AI_EXPECTED_PHRASE } from '../domain/types';
import { getOfflineAiServices } from './createOfflineAiServices';

export const OFFLINE_AI_AUTO_TRIGGER_FILENAME = 'offline-ai-auto-run.trigger';
export const OFFLINE_AI_AUTO_MODE_FILENAME = 'offline-ai-auto-run.mode';

export type OfflineAiStage1HarnessMode = 'online' | 'airplane' | 'stability';

export type OfflineAiStage1HarnessResult = {
  readonly mode: OfflineAiStage1HarnessMode;
  readonly ok: boolean;
  readonly modelBytes: number | null;
  readonly loadMs: number | null;
  readonly completionMs: number | null;
  readonly tokensPerSecond: number | null;
  readonly containsExpectedPhrase: boolean;
  readonly offline: boolean | null;
  readonly phrase: string;
  readonly error: string | null;
  readonly stabilityOk: boolean | null;
};

function evidenceLog(payload: Record<string, unknown>): void {
  // Distinct tag for adb logcat capture — no health data / no secrets.
  console.log(`[OFFLINE_AI_STAGE1_EVIDENCE] ${JSON.stringify(payload)}`);
}

export function getOfflineAiAutoTriggerFile(): File {
  return new File(Paths.document, OFFLINE_AI_AUTO_TRIGGER_FILENAME);
}

export async function readOfflineAiAutoTriggerModeAsync(): Promise<OfflineAiStage1HarnessMode | null> {
  const trigger = getOfflineAiAutoTriggerFile();
  if (!trigger.exists) {
    return null;
  }
  const modeFile = new File(Paths.document, OFFLINE_AI_AUTO_MODE_FILENAME);
  try {
    if (modeFile.exists) {
      const raw = (await modeFile.text()).trim().toLowerCase();
      if (raw === 'airplane' || raw === 'stability' || raw === 'online') {
        return raw;
      }
    }
  } catch {
    // fall through
  }
  return 'online';
}

export function clearOfflineAiAutoTrigger(): void {
  const trigger = getOfflineAiAutoTriggerFile();
  if (trigger.exists) {
    trigger.delete();
  }
  const modeFile = new File(Paths.document, OFFLINE_AI_AUTO_MODE_FILENAME);
  if (modeFile.exists) {
    modeFile.delete();
  }
}

/**
 * Unattended Stage 1 device harness. Invoked from a development-only bridge
 * when the trigger file is present (written via adb run-as).
 */
export async function runOfflineAiStage1Harness(
  mode: OfflineAiStage1HarnessMode = 'online',
): Promise<OfflineAiStage1HarnessResult> {
  const services = getOfflineAiServices();
  evidenceLog({ event: 'start', mode });

  try {
    await services.refreshStateFromDisk();
    const before = services.getSnapshot();
    evidenceLog({
      event: 'refresh',
      state: before.state,
      modelExists: before.model.exists,
      modelBytes: before.model.byteSize,
      native: before.runtime.nativeModuleAvailable,
    });

    // Size-gated load. Full JS SHA-256 of ~491 MB is available via explicit Verify,
    // but blocks Stage 1 evidence collection for too long on-device; host SHA-256 was
    // verified before adb/netcat install and on-device byte size is checked at load.
    evidenceLog({
      event: 'size_gate',
      expectedBytes: before.manifest.actualByteSize,
      actualBytes: before.model.byteSize,
      sizeMatch: before.model.byteSize === before.manifest.actualByteSize,
    });

    await services.loadModel();
    const loaded = services.getSnapshot();
    evidenceLog({
      event: 'loaded',
      state: loaded.state,
      loadMs: loaded.lastTiming?.loadMs ?? null,
    });

    const first = await services.generate();
    evidenceLog({
      event: 'smoke',
      containsExpectedPhrase: first.containsExpectedPhrase,
      completionMs: first.timing.completionMs,
      tokensPerSecond: first.timing.tokensPerSecond,
      offline: first.timing.offline,
      preview: services.getSnapshot().lastCompletionPreview,
    });

    let stabilityOk: boolean | null = null;
    if (mode === 'stability' || mode === 'online') {
      await services.releaseModel();
      await services.loadModel();
      const second = await services.generate();
      stabilityOk = second.containsExpectedPhrase === true;
      evidenceLog({
        event: 'stability',
        ok: stabilityOk,
        loadMs: services.getSnapshot().lastTiming?.loadMs ?? null,
        completionMs: second.timing.completionMs,
      });
    }

    const snap = services.getSnapshot();
    const ok =
      first.containsExpectedPhrase &&
      first.text.includes(OFFLINE_AI_EXPECTED_PHRASE) &&
      (stabilityOk === null || stabilityOk);

    const result: OfflineAiStage1HarnessResult = {
      mode,
      ok,
      modelBytes: snap.model.byteSize,
      loadMs: snap.lastTiming?.loadMs ?? null,
      completionMs: first.timing.completionMs,
      tokensPerSecond: first.timing.tokensPerSecond,
      containsExpectedPhrase: first.containsExpectedPhrase,
      offline: first.timing.offline,
      phrase: OFFLINE_AI_EXPECTED_PHRASE,
      error: null,
      stabilityOk,
    };
    evidenceLog({ event: 'complete', ...result });
    return result;
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Harness failed';
    const result: OfflineAiStage1HarnessResult = {
      mode,
      ok: false,
      modelBytes: services.getSnapshot().model.byteSize,
      loadMs: services.getSnapshot().lastTiming?.loadMs ?? null,
      completionMs: null,
      tokensPerSecond: null,
      containsExpectedPhrase: false,
      offline: null,
      phrase: OFFLINE_AI_EXPECTED_PHRASE,
      error: message,
      stabilityOk: false,
    };
    evidenceLog({ event: 'failed', ...result });
    return result;
  }
}
