import { Directory, File, Paths } from 'expo-file-system';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import manifest from '../../content/whisper-model-manifest.json';
import { createExpoOfflineAiDownloader } from '../../../offline-ai/provisioning/expoOfflineAiDownloader';

const WHISPER_DIR_NAME = 'whisper';

function whisperDirectory(): Directory {
  return new Directory(Paths.document, WHISPER_DIR_NAME);
}

function fileFromUri(uri: string): File {
  return new File(uri);
}

function ensureDirectory(directory: Directory): void {
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
}

async function yieldToUi(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function hashFileSha256(uri: string): Promise<string> {
  const file = fileFromUri(uri);
  const hasher = sha256.create();
  const stream = file.readableStream();
  const reader = stream.getReader();
  let processed = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        hasher.update(value);
        processed += value.byteLength;
        if (processed >= 4 * 1024 * 1024) {
          processed = 0;
          await yieldToUi();
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return bytesToHex(hasher.digest());
}

export type WhisperModelSnapshot = {
  readonly state: 'missing' | 'ready' | 'downloading' | 'verifying' | 'error';
  readonly filename: string;
  readonly exists: boolean;
  readonly byteSize: number | null;
  readonly expectedByteSize: number;
  readonly sha256Verified: boolean | null;
  readonly lastError: string | null;
  readonly downloadProgress: number | null;
};

export class WhisperModelManager {
  private static instance: WhisperModelManager | null = null;
  private state: WhisperModelSnapshot['state'] = 'missing';
  private downloadProgress: number | null = null;
  private lastError: string | null = null;
  private sha256Verified: boolean | null = null;
  private knownByteSize: number | null = null;
  private downloadController: AbortController | null = null;
  private listeners = new Set<() => void>();

  private constructor() {
    void this.refreshState();
  }

  public static getInstance(): WhisperModelManager {
    if (!this.instance) {
      this.instance = new WhisperModelManager();
    }
    return this.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getModelUri(): string {
    return new File(whisperDirectory(), manifest.filename).uri;
  }

  public getTempDownloadUri(): string {
    return new File(whisperDirectory(), `${manifest.filename}.partial`).uri;
  }

  public getSnapshot(): WhisperModelSnapshot {
    return {
      state: this.state,
      filename: manifest.filename,
      exists: this.state === 'ready',
      byteSize: this.knownByteSize,
      expectedByteSize: manifest.actualByteSize,
      sha256Verified: this.sha256Verified,
      lastError: this.lastError,
      downloadProgress: this.downloadProgress,
    };
  }

  public async refreshState(): Promise<void> {
    try {
      const finalUri = this.getModelUri();
      const file = fileFromUri(finalUri);
      if (!file.exists) {
        this.state = 'missing';
        this.knownByteSize = null;
        this.sha256Verified = null;
        this.notify();
        return;
      }

      this.knownByteSize = file.size;
      const sizeDiff = Math.abs((file.size ?? 0) - manifest.actualByteSize);
      if (sizeDiff > 1024 * 1024) { // Allow up to 1MB filesystem/transfer reporting difference
        this.state = 'error';
        this.lastError = 'Installed model size does not match verified manifest.';
        this.notify();
        return;
      }

      this.state = 'ready';
      this.notify();
    } catch (err) {
      this.state = 'error';
      this.lastError = err instanceof Error ? err.message : String(err);
      this.notify();
    }
  }

  public async verifyModelChecksum(): Promise<boolean> {
    this.state = 'verifying';
    this.notify();
    try {
      const finalUri = this.getModelUri();
      const file = fileFromUri(finalUri);
      if (!file.exists) {
        this.state = 'missing';
        this.notify();
        return false;
      }
      const digest = await hashFileSha256(finalUri);
      const isOk = digest.toLowerCase() === manifest.sha256.toLowerCase();
      this.sha256Verified = isOk;
      if (isOk) {
        this.state = 'ready';
        this.lastError = null;
      } else {
        this.state = 'error';
        this.lastError = 'Model SHA-256 verification failed.';
        file.delete();
      }
      this.notify();
      return isOk;
    } catch (err) {
      this.state = 'error';
      this.lastError = err instanceof Error ? err.message : String(err);
      this.notify();
      return false;
    }
  }

  public async provisionModel(mode: 'download' | 'import' = 'download'): Promise<boolean> {
    if (this.state === 'downloading' || this.state === 'verifying') {
      return false;
    }
    this.state = 'downloading';
    this.downloadProgress = 0;
    this.lastError = null;
    this.notify();

    try {
      ensureDirectory(whisperDirectory());
      const tempUri = this.getTempDownloadUri();
      const tempFile = fileFromUri(tempUri);
      if (tempFile.exists) {
        tempFile.delete();
      }

      if (mode === 'import') {
        const importResult = await File.pickFileAsync({
          mimeTypes: ['application/octet-stream', '*/*'],
        });
        if (importResult.canceled || !importResult.result) {
          this.state = 'missing';
          this.downloadProgress = null;
          this.notify();
          return false;
        }
        const sourceFile = fileFromUri(importResult.result.uri);
        sourceFile.copy(tempFile);
        this.downloadProgress = 1;
      } else {
        const downloader = createExpoOfflineAiDownloader();
        this.downloadController = new AbortController();
        await downloader.download({
          url: manifest.downloadUrl,
          destinationUri: tempUri,
          signal: this.downloadController.signal,
          onProgress: (ratio) => {
            this.downloadProgress = Math.max(0, Math.min(1, ratio));
            this.notify();
          },
        });
      }

      this.state = 'verifying';
      this.notify();

      const finalUri = this.getModelUri();
      const finalFile = fileFromUri(finalUri);
      if (finalFile.exists) {
        finalFile.delete();
      }

      tempFile.move(finalFile);
      this.knownByteSize = finalFile.size;

      const ok = await this.verifyModelChecksum();
      this.downloadProgress = null;
      this.downloadController = null;
      return ok;
    } catch (err) {
      this.state = 'error';
      this.lastError = err instanceof Error ? err.message : String(err);
      this.downloadProgress = null;
      this.downloadController = null;
      const tempFile = fileFromUri(this.getTempDownloadUri());
      if (tempFile.exists) {
        tempFile.delete();
      }
      this.notify();
      return false;
    }
  }

  public async deleteModel(): Promise<void> {
    try {
      const finalUri = this.getModelUri();
      const file = fileFromUri(finalUri);
      if (file.exists) {
        file.delete();
      }
      this.state = 'missing';
      this.knownByteSize = null;
      this.sha256Verified = null;
      this.notify();
    } catch (err) {
      this.state = 'error';
      this.lastError = err instanceof Error ? err.message : String(err);
      this.notify();
    }
  }

  public cancelProvision(): void {
    if (this.downloadController) {
      this.downloadController.abort();
      this.downloadController = null;
    }
  }
}
