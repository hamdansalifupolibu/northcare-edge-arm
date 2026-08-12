import type { EdgeFixturePhraseGolden } from '../domain/fixtureQuality';
import goldenJson from './edgeLabFixtureGolden.json';

export const EDGE_LAB_FIXTURE_GOLDEN: EdgeFixturePhraseGolden = {
  fixtureId: goldenJson.fixtureId,
  mustContainPhrases: goldenJson.mustContainPhrases,
  referenceTranscriptNormalized:
    goldenJson.referenceTranscriptNormalized.trim().length > 0
      ? goldenJson.referenceTranscriptNormalized
      : undefined,
  requiredExtractionKeys: goldenJson.requiredExtractionKeys,
};

export function isEdgeLabFixtureGoldenReady(): boolean {
  return EDGE_LAB_FIXTURE_GOLDEN.mustContainPhrases.length > 0;
}
