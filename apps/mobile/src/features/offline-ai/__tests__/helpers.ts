import type {
  OfflineAiDownloader,
  OfflineAiFileStore,
  OfflineAiLlamaContext,
  OfflineAiLlamaRuntime,
} from '../domain/types';
import { getOfflineAiModelManifest } from '../domain/manifest';

type StoredFile = {
  readonly reportedSize: number;
  readonly validChecksum: boolean;
};

export function createMemoryOfflineAiFileStore(initial?: {
  freeDiskBytes?: number | null;
}): OfflineAiFileStore & {
  files: Map<string, StoredFile>;
  modelUri: string;
  tempUri: string;
  importUri: string | null;
  seedValidModel: () => void;
  seedInvalidChecksumModel: () => void;
  seedPartialTemp: (size?: number) => void;
} {
  const manifest = getOfflineAiModelManifest();
  const files = new Map<string, StoredFile>();
  const modelUri = `file:///mock/offline-ai/${manifest.filename}`;
  const tempUri = `file:///mock/offline-ai-temp/${manifest.filename}.partial`;
  let importUri: string | null = null;

  const api = {
    files,
    modelUri,
    tempUri,
    get importUri() {
      return importUri;
    },
    set importUri(value: string | null) {
      importUri = value;
    },
    seedValidModel() {
      files.set(modelUri, {
        reportedSize: manifest.actualByteSize,
        validChecksum: true,
      });
    },
    seedInvalidChecksumModel() {
      files.set(modelUri, {
        reportedSize: manifest.actualByteSize,
        validChecksum: false,
      });
    },
    seedPartialTemp(size = 128) {
      files.set(tempUri, {
        reportedSize: size,
        validChecksum: false,
      });
    },
    async ensureDirectories() {},
    async getInfo(uri: string) {
      const data = files.get(uri);
      if (!data) {
        return { exists: false, size: null, isDirectory: false };
      }
      return { exists: true, size: data.reportedSize, isDirectory: false };
    },
    async deleteIfExists(uri: string) {
      files.delete(uri);
    },
    async moveAsync(from: string, to: string) {
      const data = files.get(from);
      if (!data) {
        throw new Error('missing source');
      }
      files.set(to, data);
      files.delete(from);
    },
    async copyAsync(from: string, to: string) {
      const data = files.get(from);
      if (!data) {
        throw new Error('missing source');
      }
      files.set(to, { ...data });
    },
    async hashSha256(uri: string) {
      const data = files.get(uri);
      if (!data) {
        throw new Error('missing file');
      }
      return data.validChecksum ? manifest.sha256 : '0'.repeat(64);
    },
    async getFreeDiskBytes() {
      return initial?.freeDiskBytes ?? 2_000_000_000;
    },
    getModelUri() {
      return modelUri;
    },
    getTempDownloadUri() {
      return tempUri;
    },
    async pickImportUri() {
      return importUri;
    },
  };

  return api;
}

export function createMockDownloader(
  fileStore: ReturnType<typeof createMemoryOfflineAiFileStore>,
  options?: { fail?: boolean; validChecksum?: boolean; size?: number },
): OfflineAiDownloader {
  const manifest = getOfflineAiModelManifest();
  return {
    async download({ destinationUri, onProgress, signal }) {
      if (options?.fail) {
        throw new Error('network failed');
      }
      if (signal?.aborted) {
        throw new Error('Download cancelled');
      }
      onProgress?.(0.5);
      fileStore.files.set(destinationUri, {
        reportedSize: options?.size ?? manifest.actualByteSize,
        validChecksum: options?.validChecksum ?? true,
      });
      onProgress?.(1);
    },
  };
}

export function createMockRuntime(options?: {
  available?: boolean;
  completionText?: string;
  slowCompletionMs?: number;
}): OfflineAiLlamaRuntime & { contextsCreated: number } {
  let contextsCreated = 0;
  return {
    get contextsCreated() {
      return contextsCreated;
    },
    isNativeModuleAvailable() {
      return options?.available ?? true;
    },
    async init() {
      contextsCreated += 1;
      const context: OfflineAiLlamaContext = {
        async completion() {
          if (options?.slowCompletionMs) {
            await new Promise((resolve) => setTimeout(resolve, options.slowCompletionMs));
          }
          return {
            text: options?.completionText ?? 'OFFLINE_MODEL_READY',
            timings: {
              predicted_n: 3,
              predicted_per_second: 12,
              predicted_ms: 250,
            },
          };
        },
        async stopCompletion() {},
        async release() {},
      };
      return context;
    },
  };
}
