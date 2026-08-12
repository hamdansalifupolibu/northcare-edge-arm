import { Platform } from 'react-native';

import { getOfflineAiModelManifest } from '../domain/manifest';
import { createOfflineAiLifecycle } from '../services/offlineAiLifecycle';
import {
  createMemoryOfflineAiFileStore,
  createMockDownloader,
  createMockRuntime,
} from './helpers';

describe('offline AI lifecycle', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  function createLifecycle(overrides?: {
    freeDiskBytes?: number | null;
    available?: boolean;
    completionText?: string;
    slowCompletionMs?: number;
  }) {
    const fileStore = createMemoryOfflineAiFileStore({
      freeDiskBytes: overrides?.freeDiskBytes,
    });
    const downloader = createMockDownloader(fileStore);
    const runtime = createMockRuntime({
      available: overrides?.available,
      completionText: overrides?.completionText,
      slowCompletionMs: overrides?.slowCompletionMs,
    });
    const lifecycle = createOfflineAiLifecycle({
      fileStore,
      downloader,
      runtime,
      appEnv: 'development',
      isNetworkOnline: async () => true,
      getDeviceInfo: async () => ({ model: 'test-device', androidVersion: '13' }),
    });
    return { lifecycle, fileStore, runtime };
  }

  it('reports missing model before provisioning', async () => {
    const { lifecycle } = createLifecycle();
    await lifecycle.refreshStateFromDisk();
    const model = await lifecycle.inspectModel();
    expect(model.stateHint).toBe('missing');
    expect(lifecycle.getSnapshot().state).toBe('missing');
  });

  it('prevents duplicate downloads', async () => {
    const fileStore = createMemoryOfflineAiFileStore();
    const manifest = getOfflineAiModelManifest();
    let releaseDownload: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseDownload = resolve;
    });
    const slow = createOfflineAiLifecycle({
      fileStore,
      downloader: {
        async download({ destinationUri }) {
          await gate;
          fileStore.files.set(destinationUri, {
            reportedSize: manifest.actualByteSize,
            validChecksum: true,
          });
        },
      },
      runtime: createMockRuntime(),
      appEnv: 'development',
      isNetworkOnline: async () => true,
    });
    const first = slow.provisionModel({ mode: 'download' });
    await expect(slow.provisionModel({ mode: 'download' })).rejects.toMatchObject({
      code: 'DUPLICATE_DOWNLOAD',
    });
    releaseDownload?.();
    await first;
  });

  it('verifies checksum and fails closed on mismatch', async () => {
    const { lifecycle, fileStore } = createLifecycle();
    fileStore.seedInvalidChecksumModel();
    await expect(lifecycle.verifyModel()).rejects.toMatchObject({
      code: 'CHECKSUM_MISMATCH',
    });
    const info = await fileStore.getInfo(fileStore.getModelUri());
    expect(info.exists).toBe(false);
  });

  it('handles partial files and rejects generation before load', async () => {
    const { lifecycle, fileStore } = createLifecycle();
    fileStore.seedPartialTemp();
    await lifecycle.refreshStateFromDisk();
    expect(lifecycle.getSnapshot().lastError?.code).toBe('PARTIAL_MODEL');
    await expect(lifecycle.generate()).rejects.toMatchObject({
      code: 'GENERATION_BEFORE_LOAD',
    });
  });

  it('loads from a size-matched file without requiring prior checksum', async () => {
    const { lifecycle, fileStore } = createLifecycle();
    fileStore.seedValidModel();
    await lifecycle.refreshStateFromDisk();
    expect(lifecycle.getSnapshot().model.sha256Verified).not.toBe(true);
    await lifecycle.loadModel();
    expect(lifecycle.getSnapshot().state).toBe('loaded');
  });

  it('loads, generates expected phrase, prevents duplicates, releases and reloads', async () => {
    const { lifecycle, runtime } = createLifecycle({ slowCompletionMs: 40 });
    await lifecycle.provisionModel({ mode: 'download' });
    expect(lifecycle.getSnapshot().state).toBe('ready');

    await lifecycle.loadModel();
    expect(lifecycle.getSnapshot().state).toBe('loaded');
    // Second load is idempotent — does not create another native context.
    await expect(lifecycle.loadModel()).resolves.toBeUndefined();
    expect(runtime.contextsCreated).toBe(1);
    const ensured = await lifecycle.ensureModelLoaded();
    expect(ensured.ok).toBe(true);
    expect(ensured.state).toBe('loaded');
    expect(runtime.contextsCreated).toBe(1);

    const result = await lifecycle.generate();
    expect(result.usedNativeRuntime).toBe(true);
    expect(result.networkInferenceUsed).toBe(false);
    expect(result.containsExpectedPhrase).toBe(true);
    expect(lifecycle.hasPersistedPromptHistory()).toBe(false);
    expect(lifecycle.usesNetworkInference()).toBe(false);

    const generating = lifecycle.generate();
    await expect(lifecycle.generate()).rejects.toMatchObject({ code: 'DUPLICATE_GENERATION' });
    await generating;

    await lifecycle.releaseModel();
    expect(lifecycle.getSnapshot().state).toBe('ready');
    await lifecycle.loadModel();
    const final = await lifecycle.generate();
    expect(final.containsExpectedPhrase).toBe(true);
    expect(runtime.contextsCreated).toBe(2);
  });

  it('blocks production provisioning and maps unsupported runtime', async () => {
    const fileStore = createMemoryOfflineAiFileStore();
    const lifecycle = createOfflineAiLifecycle({
      fileStore,
      downloader: createMockDownloader(fileStore),
      runtime: createMockRuntime({ available: false }),
      appEnv: 'production',
    });
    await expect(lifecycle.provisionModel()).rejects.toMatchObject({
      code: 'PROVISION_NOT_ALLOWED',
    });
    await lifecycle.refreshStateFromDisk();
    expect(lifecycle.getSnapshot().state).toBe('unsupported');
  });

  it('prevents delete while loaded', async () => {
    const { lifecycle } = createLifecycle();
    await lifecycle.provisionModel({ mode: 'download' });
    await lifecycle.loadModel();
    await expect(lifecycle.deleteInstalledModel()).rejects.toMatchObject({
      code: 'DELETE_WHILE_LOADED',
    });
  });

  it('verifies a pre-installed model without downloading', async () => {
    const { lifecycle, fileStore } = createLifecycle();
    fileStore.seedValidModel();
    const calls: string[] = [];
    const lifecycleWithSpy = createOfflineAiLifecycle({
      fileStore,
      downloader: {
        async download() {
          calls.push('download');
          throw new Error('download should not run');
        },
      },
      runtime: createMockRuntime(),
      appEnv: 'development',
      isNetworkOnline: async () => true,
    });
    await expect(lifecycleWithSpy.provisionModel({ mode: 'download' })).resolves.toMatchObject({
      stateHint: 'ready',
      exists: true,
    });
    expect(calls).toEqual([]);
    expect(lifecycleWithSpy.getSnapshot().state).toBe('ready');
    expect(lifecycleWithSpy.getSnapshot().model.sha256Verified).toBe(true);
  });

  it('surfaces a clear error when the temp download file disappears', async () => {
    const fileStore = createMemoryOfflineAiFileStore();
    const lifecycle = createOfflineAiLifecycle({
      fileStore,
      downloader: {
        async download() {
          // Pretend the download finished but left no temp file (cache eviction).
        },
      },
      runtime: createMockRuntime(),
      appEnv: 'development',
      isNetworkOnline: async () => true,
    });
    await expect(lifecycle.provisionModel({ mode: 'download' })).rejects.toMatchObject({
      code: 'DOWNLOAD_FAILED',
      message: expect.stringMatching(/Download interrupted/i),
    });
    expect(lifecycle.getSnapshot().state).toBe('error');
  });
});
