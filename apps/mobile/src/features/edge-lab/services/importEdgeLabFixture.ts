import { Directory, File, Paths } from 'expo-file-system';

import { EDGE_LAB_FIXTURE_FILENAME, EDGE_LAB_FIXTURE_ID } from './edgeLabFixture';

export type ImportEdgeLabFixtureResult =
  | { readonly ok: true; readonly fixtureId: string; readonly byteSize: number | null }
  | { readonly ok: false; readonly error: 'cancelled' | 'copy_failed' };

/**
 * Lets a judge/dev import a synthetic M4A on-device without adb.
 * Overwrites the canonical Edge Lab fixture path only.
 */
export async function importEdgeLabFixtureFromPicker(): Promise<ImportEdgeLabFixtureResult> {
  try {
    const importResult = await File.pickFileAsync({
      mimeTypes: ['audio/*', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', '*/*'],
    });
    if (importResult.canceled || !importResult.result) {
      return { ok: false, error: 'cancelled' };
    }

    const dir = new Directory(Paths.document, 'edge-lab-fixtures');
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }

    const destination = new File(dir, EDGE_LAB_FIXTURE_FILENAME);
    if (destination.exists) {
      destination.delete();
    }

    const source = new File(importResult.result.uri);
    source.copy(destination);

    return {
      ok: true,
      fixtureId: EDGE_LAB_FIXTURE_ID,
      byteSize: typeof destination.size === 'number' ? destination.size : null,
    };
  } catch {
    return { ok: false, error: 'copy_failed' };
  }
}
