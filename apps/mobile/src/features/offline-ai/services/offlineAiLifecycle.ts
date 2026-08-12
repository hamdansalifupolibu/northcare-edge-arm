import { Platform } from 'react-native';

import { createOfflineAiError, mapNativeErrorToOfflineAiError } from '../domain/errors';
import {
  assertValidOfflineAiModelManifest,
  getOfflineAiModelManifest,
} from '../domain/manifest';
import {
  OFFLINE_AI_EXPECTED_PHRASE,
  OFFLINE_AI_SMOKE_SYSTEM_PROMPT,
  OFFLINE_AI_SMOKE_USER_PROMPT,
  type OfflineAiDownloader,
  type OfflineAiError,
  type OfflineAiFileStore,
  type OfflineAiGenerationResult,
  type OfflineAiLlamaContext,
  type OfflineAiLlamaRuntime,
  type OfflineAiLifecycleState,
  type OfflineAiModelInspection,
  type OfflineAiRuntimeInspection,
  type OfflineAiSnapshot,
  type OfflineAiTimingResult,
} from '../domain/types';
import { resolveBundledOfflineAiAssetUri } from '../provisioning/bundledOfflineAiAsset';
import { resolveOfflineAiThreadCount } from '../runtime/threadCount';

export type OfflineAiLifecycleDeps = {
  readonly fileStore: OfflineAiFileStore;
  readonly downloader: OfflineAiDownloader;
  readonly runtime: OfflineAiLlamaRuntime;
  readonly appEnv: 'development' | 'staging' | 'production';
  readonly now?: () => number;
  readonly isNetworkOnline?: () => Promise<boolean | null>;
  readonly getDeviceInfo?: () => Promise<{ model: string | null; androidVersion: string | null }>;
};

const TEMPERATURE = 0.1;

function previewCompletion(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 77)}...`;
}

export function createOfflineAiLifecycle(deps: OfflineAiLifecycleDeps) {
  const manifest = assertValidOfflineAiModelManifest(getOfflineAiModelManifest());
  const threadCount = resolveOfflineAiThreadCount();
  const now = deps.now ?? (() => Date.now());

  let state: OfflineAiLifecycleState = 'missing';
  let lastError: OfflineAiError | null = null;
  let lastTiming: OfflineAiTimingResult | null = null;
  let lastCompletionPreview: string | null = null;
  let downloadProgress: number | null = null;
  let context: OfflineAiLlamaContext | null = null;
  let downloadController: AbortController | null = null;
  let provisionInFlight = false;
  let loadInFlight = false;
  let loadPromise: Promise<void> | null = null;
  let generateInFlight = false;
  let sha256Verified: boolean | null = null;
  let knownByteSize: number | null = null;

  function assertDevelopmentProvisioningAllowed(mode?: 'download' | 'import' | 'bundle'): void {
    if (mode === 'bundle') {
      return;
    }
    if (deps.appEnv === 'production') {
      throw createOfflineAiError(
        'PROVISION_NOT_ALLOWED',
        'Model provisioning is unavailable in production builds.',
      );
    }
  }

  function inspectRuntime(): OfflineAiRuntimeInspection {
    const nativeModuleAvailable = deps.runtime.isNativeModuleAvailable();
    const supported = Platform.OS === 'android' && nativeModuleAvailable;
    return {
      supported,
      nativeModuleAvailable,
      platform: Platform.OS,
      accelerationMode: 'cpu',
      reason: supported
        ? undefined
        : !nativeModuleAvailable
          ? 'llama.rn native module unavailable (development build required)'
          : `Platform ${Platform.OS} is not the Stage 1 Android target`,
    };
  }

  async function inspectModel(): Promise<OfflineAiModelInspection> {
    await deps.fileStore.ensureDirectories();
    const uri = deps.fileStore.getModelUri();
    const info = await deps.fileStore.getInfo(uri);
    const tempInfo = await deps.fileStore.getInfo(deps.fileStore.getTempDownloadUri());

    if (!info.exists) {
      knownByteSize = null;
      sha256Verified = null;
      if (tempInfo.exists) {
        return {
          stateHint: 'partial',
          filename: manifest.filename,
          exists: false,
          byteSize: tempInfo.size,
          expectedByteSize: manifest.actualByteSize,
          sha256Verified: null,
          storageCategory: 'app-private',
        };
      }
      return {
        stateHint: 'missing',
        filename: manifest.filename,
        exists: false,
        byteSize: null,
        expectedByteSize: manifest.actualByteSize,
        sha256Verified: null,
        storageCategory: 'app-private',
      };
    }

    knownByteSize = info.size;
    const sizeMatches = info.size === manifest.actualByteSize;
    return {
      stateHint: sizeMatches && sha256Verified === true ? 'ready' : sizeMatches ? 'ready' : 'partial',
      filename: manifest.filename,
      exists: true,
      byteSize: info.size,
      expectedByteSize: manifest.actualByteSize,
      sha256Verified,
      storageCategory: 'app-private',
    };
  }

  async function refreshStateFromDisk(): Promise<void> {
    const runtime = inspectRuntime();
    if (!runtime.supported) {
      state = 'unsupported';
      return;
    }
    if (context) {
      state = generateInFlight ? 'generating' : 'loaded';
      return;
    }
    const model = await inspectModel();
    if (model.stateHint === 'missing') {
      state = 'missing';
      return;
    }
    if (model.stateHint === 'partial' && !model.exists) {
      state = 'error';
      lastError = createOfflineAiError(
        'PARTIAL_MODEL',
        'A partial model download was detected. Re-provision the model.',
      );
      return;
    }
    if (model.exists && model.byteSize !== manifest.actualByteSize) {
      state = 'error';
      lastError = createOfflineAiError(
        'SIZE_MISMATCH',
        'Installed model size does not match the verified manifest.',
      );
      return;
    }
    if (model.exists && sha256Verified === false) {
      state = 'error';
      lastError = createOfflineAiError(
        'CHECKSUM_MISMATCH',
        'Installed model checksum does not match the verified manifest.',
      );
      return;
    }
    state = 'ready';
  }

  function getSnapshot(): OfflineAiSnapshot {
    const runtime = inspectRuntime();
    return {
      state,
      manifest,
      runtime,
      model: {
        stateHint:
          state === 'missing'
            ? 'missing'
            : state === 'ready' ||
                state === 'loading' ||
                state === 'loaded' ||
                state === 'generating' ||
                state === 'releasing'
              ? 'ready'
              : state === 'downloading' || state === 'verifying'
                ? 'partial'
                : knownByteSize != null
                  ? 'partial'
                  : 'missing',
        filename: manifest.filename,
        exists: knownByteSize != null || state === 'ready' || state === 'loaded' || state === 'generating',
        byteSize: knownByteSize,
        expectedByteSize: manifest.actualByteSize,
        sha256Verified,
        storageCategory: 'app-private',
      },
      lastError,
      lastTiming,
      lastCompletionPreview,
      downloadProgress,
      threadCount,
      contextSize: manifest.configuredContextSize,
      maxOutputTokens: manifest.configuredMaximumOutputTokens,
      temperature: TEMPERATURE,
      accelerationMode: 'cpu',
    };
  }

  async function verifyModel(uri?: string): Promise<OfflineAiModelInspection> {
    state = 'verifying';
    lastError = null;
    const targetUri = uri ?? deps.fileStore.getModelUri();
    const info = await deps.fileStore.getInfo(targetUri);
    if (!info.exists) {
      sha256Verified = null;
      knownByteSize = null;
      state = 'missing';
      lastError = createOfflineAiError('MODEL_MISSING', 'Model file is missing.');
      throw lastError;
    }
    if (info.size !== manifest.actualByteSize) {
      await deps.fileStore.deleteIfExists(targetUri);
      sha256Verified = false;
      knownByteSize = info.size;
      state = 'error';
      lastError = createOfflineAiError(
        'SIZE_MISMATCH',
        'Model file size does not match the verified manifest.',
      );
      throw lastError;
    }
    if (info.size > manifest.maximumSupportedModelSize) {
      await deps.fileStore.deleteIfExists(targetUri);
      state = 'error';
      lastError = createOfflineAiError(
        'MODEL_TOO_LARGE',
        'Model exceeds the Stage 1 maximum supported size.',
      );
      throw lastError;
    }

    const digest = await deps.fileStore.hashSha256(targetUri);
    if (digest.toLowerCase() !== manifest.sha256.toLowerCase()) {
      await deps.fileStore.deleteIfExists(targetUri);
      sha256Verified = false;
      knownByteSize = null;
      state = 'error';
      lastError = createOfflineAiError(
        'CHECKSUM_MISMATCH',
        'Model checksum verification failed. Corrupt file was deleted.',
      );
      throw lastError;
    }

    sha256Verified = true;
    knownByteSize = info.size;
    state = 'ready';
    return inspectModel();
  }

  async function provisionModel(options?: {
    readonly mode?: 'download' | 'import' | 'bundle';
  }): Promise<OfflineAiModelInspection> {
    const mode = options?.mode ?? 'download';
    assertDevelopmentProvisioningAllowed(mode);
    if (provisionInFlight || state === 'downloading' || downloadController) {
      throw createOfflineAiError(
        'DUPLICATE_DOWNLOAD',
        'A model download is already in progress.',
      );
    }
    if (context) {
      throw createOfflineAiError(
        'DELETE_WHILE_LOADED',
        'Release the model before replacing model files.',
      );
    }

    provisionInFlight = true;
    lastError = null;
    state = 'downloading';
    downloadProgress = 0;
    try {
      await deps.fileStore.ensureDirectories();
      const finalUri = deps.fileStore.getModelUri();
      const existing = await deps.fileStore.getInfo(finalUri);
      // Pre-installed via adb push / import — verify in place and skip network download.
      if (
        mode === 'download' &&
        existing.exists &&
        existing.size === manifest.actualByteSize
      ) {
        downloadProgress = 1;
        const verified = await verifyModel(finalUri);
        downloadProgress = null;
        return verified;
      }

      const free = await deps.fileStore.getFreeDiskBytes();
      if (free != null && free < manifest.actualByteSize + 64 * 1024 * 1024) {
        lastError = createOfflineAiError(
          'INSUFFICIENT_STORAGE',
          'Not enough free storage to provision the model.',
        );
        state = 'error';
        throw lastError;
      }

      const tempUri = deps.fileStore.getTempDownloadUri();
      await deps.fileStore.deleteIfExists(tempUri);

      if (mode === 'import') {
        const importUri = await deps.fileStore.pickImportUri();
        if (!importUri) {
          state = 'missing';
          downloadProgress = null;
          lastError = createOfflineAiError('DOWNLOAD_CANCELLED', 'Model import was cancelled.');
          throw lastError;
        }
        await deps.fileStore.copyAsync(importUri, tempUri);
        downloadProgress = 1;
      } else if (mode === 'bundle') {
        const bundledUri = resolveBundledOfflineAiAssetUri(manifest.filename);
        if (!bundledUri) {
          lastError = createOfflineAiError(
            'MODEL_MISSING',
            'Bundled model is only available on Android demo builds.',
          );
          state = 'missing';
          throw lastError;
        }
        const bundledInfo = await deps.fileStore.getInfo(bundledUri);
        if (!bundledInfo.exists) {
          lastError = createOfflineAiError(
            'MODEL_MISSING',
            'Bundled model was not packaged in this build. Run prepare:offline-ai-model before prebuild.',
          );
          state = 'missing';
          throw lastError;
        }
        await deps.fileStore.copyAsync(bundledUri, tempUri);
        downloadProgress = 1;
      } else {
        const online = deps.isNetworkOnline ? await deps.isNetworkOnline() : true;
        if (online === false) {
          lastError = createOfflineAiError(
            'NETWORK_UNAVAILABLE',
            'Internet is required only for model download, not for inference.',
          );
          state = 'error';
          throw lastError;
        }
        downloadController = new AbortController();
        await deps.downloader.download({
          url: manifest.downloadUrl,
          destinationUri: tempUri,
          signal: downloadController.signal,
          onProgress: (ratio) => {
            downloadProgress = Math.max(0, Math.min(1, ratio));
          },
        });
        downloadProgress = 1;
      }

      await deps.fileStore.ensureDirectories();
      const tempInfo = await deps.fileStore.getInfo(tempUri);
      if (!tempInfo.exists) {
        lastError = createOfflineAiError(
          'DOWNLOAD_FAILED',
          'Download interrupted. The temporary model file is missing — retry the download.',
        );
        state = 'error';
        throw lastError;
      }

      await verifyModel(tempUri);
      await deps.fileStore.deleteIfExists(finalUri);
      await deps.fileStore.moveAsync(tempUri, finalUri);
      await verifyModel(finalUri);
      downloadProgress = null;
      return inspectModel();
    } catch (error) {
      downloadController = null;
      downloadProgress = null;
      await deps.fileStore.deleteIfExists(deps.fileStore.getTempDownloadUri());
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('cancel') || message.includes('abort')) {
        lastError = createOfflineAiError('DOWNLOAD_CANCELLED', 'Model download was cancelled.');
        state = 'missing';
        throw lastError;
      }
      if (
        message.includes('download interrupted') ||
        message.includes('nosuchfile') ||
        message.includes('no such file') ||
        message.includes('missing before move') ||
        message.includes('missing after download')
      ) {
        lastError = createOfflineAiError(
          'DOWNLOAD_FAILED',
          'Download interrupted. The temporary model file is missing — retry the download.',
        );
        state = 'error';
        throw lastError;
      }
      lastError = createOfflineAiError('DOWNLOAD_FAILED', 'Model provisioning failed.');
      state = 'error';
      throw lastError;
    } finally {
      downloadController = null;
      provisionInFlight = false;
    }
  }

  async function cancelProvision(): Promise<void> {
    if (downloadController) {
      downloadController.abort();
    }
  }

  async function loadModel(): Promise<void> {
    // Idempotent when already loaded; join an in-flight load instead of throwing.
    if (context || state === 'loaded' || state === 'generating') {
      return;
    }
    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async () => {
      const runtime = inspectRuntime();
      if (!runtime.supported) {
        state = 'unsupported';
        lastError = createOfflineAiError(
          'RUNTIME_UNSUPPORTED',
          runtime.reason ?? 'Offline AI runtime is unsupported on this device.',
        );
        throw lastError;
      }

      await refreshStateFromDisk();
      if (context || state === 'loaded' || state === 'generating') {
        return;
      }
      const model = await inspectModel();
      if (!model.exists) {
        lastError = createOfflineAiError('MODEL_MISSING', 'Install the model before loading.');
        state = 'missing';
        throw lastError;
      }
      if (model.byteSize !== manifest.actualByteSize) {
        lastError = createOfflineAiError(
          'SIZE_MISMATCH',
          'Installed model size does not match the verified manifest.',
        );
        state = 'error';
        throw lastError;
      }

      // Do not SHA-256 the full ~491 MB file on the JS thread before load — that freezes the UI.
      // Size gate is enough to start native init; explicit verify/provision still checksums.

      loadInFlight = true;
      state = 'loading';
      lastError = null;
      // Let React paint the loading state before native work begins.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      const started = now();
      try {
        context = await deps.runtime.init({
          modelPath: deps.fileStore.getModelUri(),
          n_ctx: manifest.configuredContextSize,
          n_threads: threadCount,
          n_gpu_layers: 0,
        });
        const loadMs = now() - started;
        lastTiming = {
          loadMs,
          completionMs: lastTiming?.completionMs ?? null,
          generatedTokenCount: null,
          tokensPerSecond: null,
          offline: null,
          deviceModel: null,
          androidVersion: null,
        };
        state = 'loaded';
      } catch (error) {
        context = null;
        lastError = mapNativeErrorToOfflineAiError(error);
        if (lastError.code === 'GENERATION_FAILED') {
          lastError = createOfflineAiError('LOAD_FAILED', 'The model failed to load.');
        }
        state = 'error';
        throw lastError;
      } finally {
        loadInFlight = false;
      }
    })();

    try {
      await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  /**
   * Load the installed model if needed. Safe to call from chat UI on open.
   * Does not throw for missing/unsupported — returns a result for the caller.
   */
  async function ensureModelLoaded(): Promise<{
    readonly ok: boolean;
    readonly state: OfflineAiLifecycleState;
    readonly error: OfflineAiError | null;
  }> {
    try {
      await refreshStateFromDisk();
      if (state === 'loaded' || state === 'generating') {
        return { ok: true, state, error: null };
      }
      if (state === 'missing' || state === 'unsupported') {
        return { ok: false, state, error: lastError };
      }
      if (state === 'ready' || state === 'loading' || loadInFlight || loadPromise) {
        await loadModel();
        if (state === 'loaded' || state === 'generating') {
          return { ok: true, state, error: null };
        }
        return { ok: false, state, error: lastError };
      }
      return { ok: false, state, error: lastError };
    } catch (error) {
      const mapped =
        error && typeof error === 'object' && 'code' in error
          ? (error as OfflineAiError)
          : lastError;
      return { ok: false, state, error: mapped };
    }
  }

  async function generate(options?: {
    readonly systemPrompt?: string;
    readonly userPrompt?: string;
    readonly expectPhrase?: string;
  }): Promise<OfflineAiGenerationResult> {
    if (!context || (state !== 'loaded' && state !== 'generating')) {
      lastError = createOfflineAiError(
        'GENERATION_BEFORE_LOAD',
        'Load the model before generating.',
      );
      throw lastError;
    }
    if (generateInFlight || state === 'generating') {
      throw createOfflineAiError(
        'DUPLICATE_GENERATION',
        'Only one generation may run at a time.',
      );
    }

    generateInFlight = true;
    state = 'generating';
    lastError = null;
    const started = now();
    const systemPrompt = options?.systemPrompt ?? OFFLINE_AI_SMOKE_SYSTEM_PROMPT;
    const userPrompt = options?.userPrompt ?? OFFLINE_AI_SMOKE_USER_PROMPT;
    const expectPhrase = options?.expectPhrase ?? OFFLINE_AI_EXPECTED_PHRASE;

    try {
      const result = await context.completion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        n_predict: manifest.configuredMaximumOutputTokens,
        temperature: TEMPERATURE,
      });

      const completionMs = now() - started;
      const text = result.text ?? '';
      const device = deps.getDeviceInfo ? await deps.getDeviceInfo() : { model: null, androidVersion: null };
      const offline = deps.isNetworkOnline ? !(await deps.isNetworkOnline()) : null;
      const timing: OfflineAiTimingResult = {
        loadMs: lastTiming?.loadMs ?? null,
        completionMs,
        generatedTokenCount: result.timings?.predicted_n ?? null,
        tokensPerSecond: result.timings?.predicted_per_second ?? null,
        offline,
        deviceModel: device.model,
        androidVersion: device.androidVersion,
      };
      lastTiming = timing;
      lastCompletionPreview = previewCompletion(text);
      state = 'loaded';

      return {
        text,
        containsExpectedPhrase: text.includes(expectPhrase),
        timing,
        usedNativeRuntime: true,
        networkInferenceUsed: false,
      };
    } catch (error) {
      lastError = mapNativeErrorToOfflineAiError(error);
      state = context ? 'loaded' : 'error';
      throw lastError;
    } finally {
      generateInFlight = false;
    }
  }

  async function cancelGeneration(): Promise<void> {
    if (!context || !generateInFlight) {
      return;
    }
    await context.stopCompletion();
  }

  async function releaseModel(): Promise<void> {
    if (generateInFlight && context) {
      await context.stopCompletion();
      generateInFlight = false;
    }
    if (!context) {
      await refreshStateFromDisk();
      return;
    }
    state = 'releasing';
    try {
      await context.release();
      context = null;
      await refreshStateFromDisk();
    } catch {
      lastError = createOfflineAiError('RELEASE_FAILED', 'Model release failed.');
      state = 'error';
      throw lastError;
    }
  }

  async function deleteInstalledModel(): Promise<void> {
    if (context) {
      throw createOfflineAiError(
        'DELETE_WHILE_LOADED',
        'Release the model before deleting model files.',
      );
    }
    await deps.fileStore.deleteIfExists(deps.fileStore.getModelUri());
    await deps.fileStore.deleteIfExists(deps.fileStore.getTempDownloadUri());
    sha256Verified = null;
    knownByteSize = null;
    lastCompletionPreview = null;
    state = 'missing';
  }

  return {
    inspectRuntime,
    inspectModel,
    provisionModel,
    cancelProvision,
    verifyModel,
    loadModel,
    ensureModelLoaded,
    generate,
    cancelGeneration,
    releaseModel,
    deleteInstalledModel,
    refreshStateFromDisk,
    getSnapshot,
    /** Stage 1 privacy: completion history is never persisted. */
    hasPersistedPromptHistory: () => false,
    usesNetworkInference: () => false,
  };
}

export type OfflineAiLifecycle = ReturnType<typeof createOfflineAiLifecycle>;
