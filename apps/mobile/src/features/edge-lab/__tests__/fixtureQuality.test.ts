import {
  combineFixtureQuality,
  normalizeTranscriptForQuality,
  scoreExtractionAgainstGolden,
  scoreTranscriptionAgainstGolden,
} from '../domain/fixtureQuality';

const golden = {
  fixtureId: 'edge-lab-fixture-v1',
  mustContainPhrases: ['fever', 'cough', 'two years'],
  referenceTranscriptNormalized: 'child aged two years has fever and mild cough',
  requiredExtractionKeys: ['symptomSummary', 'urgencyLevel'],
};

describe('fixtureQuality', () => {
  it('normalizes punctuation and case', () => {
    expect(normalizeTranscriptForQuality('Fever, Cough!')).toBe('fever cough');
  });

  it('scores full phrase coverage highly', () => {
    const result = scoreTranscriptionAgainstGolden(
      'Child aged two years has fever and mild cough today.',
      golden,
    );
    expect(result.phrasesMatched).toBe(3);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('penalizes missing phrases', () => {
    const result = scoreTranscriptionAgainstGolden('hello world', golden);
    expect(result.phrasesMatched).toBe(0);
    expect(result.score).toBeLessThan(40);
  });

  it('scores extraction keys from JSON', () => {
    const result = scoreExtractionAgainstGolden(
      'Here you go: {"symptomSummary":"cough","urgencyLevel":"low"}',
      golden,
    );
    expect(result.jsonParsed).toBe(true);
    expect(result.keysPresent).toBe(2);
    expect(result.score).toBe(100);
  });

  it('combines transcription and extraction 70/30', () => {
    const transcription = scoreTranscriptionAgainstGolden(
      'Child aged two years has fever and mild cough today.',
      golden,
    );
    const extraction = scoreExtractionAgainstGolden(
      '{"symptomSummary":"x","urgencyLevel":"y"}',
      golden,
    );
    const combined = combineFixtureQuality(transcription, extraction);
    expect(combined.score).toBe(Math.round(transcription.score * 0.7 + 100 * 0.3));
  });
});
