import * as Crypto from 'expo-crypto';

import {
  VOICE_AUDIO_EXTENSION,
  VOICE_AUDIO_FORMAT_VERSION,
  VOICE_AUDIO_MIME_TYPE,
  VOICE_MANAGED_DIRECTORY_NAME,
} from '../domain/constants';
import { VoiceError } from '../domain/errors';

export type ManagedVoiceFile = {
  readonly managedUri: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly fileSize: number;
  readonly checksum: string | null;
  readonly audioFormatVersion: number;
  readonly durationMs: number | null;
};

export type VoiceFileSystemGateway = {
  ensureManagedDirectory(): Promise<string>;
  getInfo(uri: string): Promise<{ exists: boolean; size: number | null; isDirectory: boolean }>;
  moveAsync(from: string, to: string): Promise<void>;
  copyAsync(from: string, to: string): Promise<void>;
  deleteAsync(uri: string): Promise<void>;
  readAsBase64?(uri: string): Promise<string>;
  listManagedFilenames(): Promise<string[]>;
};

function randomFilename(): string {
  const hex = Crypto.randomUUID().replace(/-/g, '');
  return `vc_${hex}.${VOICE_AUDIO_EXTENSION}`;
}

export function createVoiceFileManager(fs: VoiceFileSystemGateway) {
  return {
    async promoteTempRecording(input: {
      readonly tempUri: string;
      readonly durationMs: number | null;
    }): Promise<ManagedVoiceFile> {
      try {
        // Retry verification of temp file — native OS may not have flushed file handles yet.
        let info = { exists: false, size: null as number | null, isDirectory: false };
        for (let attempt = 0; attempt < 5; attempt++) {
          info = await fs.getInfo(input.tempUri);
          if (info.exists && !info.isDirectory && info.size !== null && info.size > 0) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if (!info.exists || info.isDirectory) {
          throw new VoiceError(
            'fileManagementFailed',
            'The temporary recording could not be validated.',
          );
        }
        if (info.size == null || info.size <= 0) {
          throw new VoiceError(
            'fileManagementFailed',
            'The temporary recording appears empty.',
          );
        }

        const directory = await fs.ensureManagedDirectory();
        const filename = randomFilename();
        // Normalize: ensure exactly one slash between directory and filename
        const normalizedDir = directory.endsWith('/') ? directory : `${directory}/`;
        const managedUri = `${normalizedDir}${filename}`;

        try {
          await fs.moveAsync(input.tempUri, managedUri);
        } catch {
          await fs.copyAsync(input.tempUri, managedUri);
          try {
            await fs.deleteAsync(input.tempUri);
          } catch {
            // Temp cleanup is best-effort after verified copy.
          }
        }

        // Retry verification — native OS may not have flushed file handles yet.
        let verified = { exists: false, size: null as number | null, isDirectory: false };
        for (let attempt = 0; attempt < 5; attempt++) {
          verified = await fs.getInfo(managedUri);
          if (verified.exists && !verified.isDirectory) {
            break;
          }
          // Wait 200ms between retries to allow OS file flush
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (!verified.exists || verified.isDirectory) {
          throw new VoiceError(
            'fileManagementFailed',
            'The managed recording could not be verified.',
          );
        }

        let checksum: string | null = null;
        if (fs.readAsBase64) {
          try {
            const base64 = await fs.readAsBase64(managedUri);
            checksum = await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              base64,
            );
          } catch {
            checksum = null;
          }
        }

        return {
          managedUri,
          filename,
          mimeType: VOICE_AUDIO_MIME_TYPE,
          fileSize: verified.size ?? info.size,
          checksum,
          audioFormatVersion: VOICE_AUDIO_FORMAT_VERSION,
          durationMs: input.durationMs,
        };
      } catch (error) {
        if (error instanceof VoiceError) {
          throw error;
        }
        throw new VoiceError(
          'fileManagementFailed',
          'The recording could not be stored privately.',
        );
      }
    },

    async deleteManagedFile(uri: string): Promise<void> {
      try {
        const info = await fs.getInfo(uri);
        if (!info.exists) {
          return;
        }
        await fs.deleteAsync(uri);
      } catch {
        throw new VoiceError(
          'fileManagementFailed',
          'The recording could not be deleted.',
        );
      }
    },

    async listOrphanCandidates(knownFilenames: ReadonlySet<string>): Promise<string[]> {
      const names = await fs.listManagedFilenames();
      return names.filter((name) => !knownFilenames.has(name));
    },

    managedDirectoryName: VOICE_MANAGED_DIRECTORY_NAME,
  };
}

export type VoiceFileManager = ReturnType<typeof createVoiceFileManager>;
