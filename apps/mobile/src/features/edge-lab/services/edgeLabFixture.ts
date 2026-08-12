import { Directory, File, Paths } from 'expo-file-system';

/** Canonical synthetic fixture id for Edge Lab baseline runs. */
export const EDGE_LAB_FIXTURE_ID = 'edge-lab-fixture-v1';

/** Filename expected under app documents (see benchmarks/fixtures/README.md). */
export const EDGE_LAB_FIXTURE_FILENAME = 'edge-lab-fixture-v1.m4a';

export type EdgeLabFixtureResolution = {
  readonly fixtureId: string;
  readonly uri: string | null;
  readonly exists: boolean;
  readonly byteSize: number | null;
};

function fixtureCandidates(): File[] {
  const nestedDir = new Directory(Paths.document, 'edge-lab-fixtures');
  return [
    new File(nestedDir, EDGE_LAB_FIXTURE_FILENAME),
    new File(Paths.document, EDGE_LAB_FIXTURE_FILENAME),
  ];
}

/**
 * Resolve the synthetic Edge Lab audio fixture on device documents.
 * Never uses clinical voice-captures/.
 */
export async function resolveEdgeLabFixture(): Promise<EdgeLabFixtureResolution> {
  for (const file of fixtureCandidates()) {
    if (file.exists) {
      return {
        fixtureId: EDGE_LAB_FIXTURE_ID,
        uri: file.uri,
        exists: true,
        byteSize: typeof file.size === 'number' ? file.size : null,
      };
    }
  }
  return {
    fixtureId: EDGE_LAB_FIXTURE_ID,
    uri: null,
    exists: false,
    byteSize: null,
  };
}
