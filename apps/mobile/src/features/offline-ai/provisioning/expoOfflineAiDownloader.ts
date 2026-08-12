import { File } from 'expo-file-system';

import type { OfflineAiDownloader } from '../domain/types';

function ensureDestinationParent(destination: File): void {
  const parent = destination.parentDirectory;
  if (parent && !parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
}

function assertDownloadedFile(file: File | null, signal?: AbortSignal): asserts file is File {
  if (!file) {
    throw new Error(signal?.aborted ? 'Download cancelled' : 'Download failed');
  }
  if (!file.exists) {
    throw new Error(
      'Download interrupted: temporary model file is missing after download.',
    );
  }
}

export function createExpoOfflineAiDownloader(): OfflineAiDownloader {
  return {
    async download({ url, destinationUri, onProgress, signal }) {
      const destination = new File(destinationUri);
      ensureDestinationParent(destination);
      if (destination.exists) {
        destination.delete();
      }
      const task = File.createDownloadTask(url, destination, {
        onProgress: onProgress
          ? ({ bytesWritten, totalBytes }) => {
              if (totalBytes > 0) {
                onProgress(bytesWritten / totalBytes);
              }
            }
          : undefined,
      });

      if (signal) {
        const onAbort = () => {
          void task.cancel();
        };
        if (signal.aborted) {
          onAbort();
          throw new Error('Download cancelled');
        }
        signal.addEventListener('abort', onAbort, { once: true });
        try {
          const file = await task.downloadAsync();
          assertDownloadedFile(file, signal);
        } finally {
          signal.removeEventListener('abort', onAbort);
        }
        return;
      }

      const file = await task.downloadAsync();
      assertDownloadedFile(file);
    },
  };
}
