import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { Directory, File, Paths } from 'expo-file-system';

import {
  OFFLINE_AI_MANAGED_DIRECTORY,
  OFFLINE_AI_TEMP_DIRECTORY,
  type OfflineAiFileStore,
} from '../domain/types';
import { getOfflineAiModelManifest } from '../domain/manifest';

function managedDirectory(): Directory {
  return new Directory(Paths.document, OFFLINE_AI_MANAGED_DIRECTORY);
}

/** Temp downloads live under documents — Android may purge Paths.cache mid-download. */
function tempDirectory(): Directory {
  return new Directory(Paths.document, OFFLINE_AI_TEMP_DIRECTORY);
}

function fileFromUri(uri: string): File {
  return new File(uri);
}

function ensureDirectory(directory: Directory): void {
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
}

function ensureParentDirectoryForFile(file: File): void {
  const parent = file.parentDirectory;
  if (parent) {
    ensureDirectory(parent);
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
        // Yield so a ~491 MB hash does not ANR / freeze the JS thread.
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

export function createExpoOfflineAiFileStore(): OfflineAiFileStore {
  const manifest = getOfflineAiModelManifest();

  return {
    async ensureDirectories() {
      ensureDirectory(managedDirectory());
      ensureDirectory(tempDirectory());
    },

    async getInfo(uri) {
      const file = fileFromUri(uri);
      if (!file.exists) {
        return { exists: false, size: null, isDirectory: false };
      }
      return {
        exists: true,
        size: typeof file.size === 'number' ? file.size : null,
        isDirectory: false,
      };
    },

    async deleteIfExists(uri) {
      const file = fileFromUri(uri);
      if (file.exists) {
        file.delete();
      }
    },

    async moveAsync(from, to) {
      await this.ensureDirectories();
      const source = fileFromUri(from);
      if (!source.exists) {
        throw new Error(
          'Download interrupted: temporary model file is missing before move.',
        );
      }
      const destination = fileFromUri(to);
      ensureParentDirectoryForFile(destination);
      if (destination.exists) {
        destination.delete();
      }
      source.move(destination);
    },

    async copyAsync(from, to) {
      await this.ensureDirectories();
      const source = fileFromUri(from);
      if (!source.exists) {
        throw new Error('Source file is missing before copy.');
      }
      const destination = fileFromUri(to);
      ensureParentDirectoryForFile(destination);
      if (destination.exists) {
        destination.delete();
      }
      source.copy(destination);
    },

    async hashSha256(uri) {
      return hashFileSha256(uri);
    },

    async getFreeDiskBytes() {
      try {
        const free = Paths.availableDiskSpace;
        return typeof free === 'number' ? free : null;
      } catch {
        return null;
      }
    },

    getModelUri() {
      return new File(managedDirectory(), manifest.filename).uri;
    },

    getTempDownloadUri() {
      return new File(tempDirectory(), `${manifest.filename}.partial`).uri;
    },

    async pickImportUri() {
      const result = await File.pickFileAsync({
        mimeTypes: ['application/octet-stream', '*/*'],
      });
      if (result.canceled || !result.result) {
        return null;
      }
      return result.result.uri;
    },
  };
}
