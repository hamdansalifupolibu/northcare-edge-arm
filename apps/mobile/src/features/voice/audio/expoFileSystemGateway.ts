import { Directory, File, Paths } from 'expo-file-system';

import { VOICE_MANAGED_DIRECTORY_NAME } from '../domain/constants';
import type { VoiceFileSystemGateway } from './fileManager';

function managedDirectory(): Directory {
  return new Directory(Paths.document, VOICE_MANAGED_DIRECTORY_NAME);
}

function fileFromUri(uri: string): File {
  return new File(uri);
}

export function createExpoVoiceFileSystemGateway(): VoiceFileSystemGateway {
  return {
    async ensureManagedDirectory() {
      const dir = managedDirectory();
      if (!dir.exists) {
        dir.create({ intermediates: true, idempotent: true });
      }
      const uri = dir.uri.endsWith('/') ? dir.uri : `${dir.uri}/`;
      return uri;
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
    async moveAsync(from, to) {
      const source = fileFromUri(from);
      source.move(fileFromUri(to));
    },
    async copyAsync(from, to) {
      const source = fileFromUri(from);
      source.copy(fileFromUri(to));
    },
    async deleteAsync(uri) {
      const file = fileFromUri(uri);
      if (file.exists) {
        file.delete();
      }
    },
    async readAsBase64(uri) {
      const file = fileFromUri(uri);
      return file.base64();
    },
    async listManagedFilenames() {
      const dir = managedDirectory();
      if (!dir.exists) {
        return [];
      }
      return dir.list().map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        // File | Directory
        const name = 'name' in entry ? String(entry.name) : String(entry);
        return name;
      });
    },
  };
}
