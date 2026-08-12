/**
 * Fixture accuracy scoring for Edge Lab.
 * Compares transcripts/extractions to synthetic goldens — never logs full text.
 */

export type EdgeFixturePhraseGolden = {
  readonly fixtureId: string;
  readonly mustContainPhrases: readonly string[];
  /** Optional normalized reference transcript for token-overlap scoring. */
  readonly referenceTranscriptNormalized?: string;
  readonly requiredExtractionKeys: readonly string[];
};

export type EdgeTranscriptionQualityBreakdown = {
  readonly method: 'fixture_phrases_v1';
  readonly score: number;
  readonly phrasesMatched: number;
  readonly phrasesTotal: number;
  readonly phraseCoverage: number;
  readonly tokenOverlap: number | null;
};

export type EdgeExtractionQualityBreakdown = {
  readonly method: 'fixture_extraction_keys_v1';
  readonly score: number;
  readonly keysPresent: number;
  readonly keysTotal: number;
  readonly jsonParsed: boolean;
};

export type EdgeCombinedQualityBreakdown = {
  readonly method: 'fixture_combined_v1';
  readonly score: number;
  readonly transcription: EdgeTranscriptionQualityBreakdown;
  readonly extraction: EdgeExtractionQualityBreakdown | null;
};

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeTranscriptForQuality(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeForQuality(normalized: string): readonly string[] {
  if (!normalized) {
    return [];
  }
  return normalized.split(' ').filter((t) => t.length > 0);
}

/**
 * Phrase hit rate on 0–100, optionally blended with token overlap vs reference.
 * Phrase coverage is primary (70%); token overlap secondary (30%) when reference exists.
 */
export function scoreTranscriptionAgainstGolden(
  transcript: string | null | undefined,
  golden: EdgeFixturePhraseGolden,
): EdgeTranscriptionQualityBreakdown {
  const phrases = golden.mustContainPhrases;
  const phrasesTotal = phrases.length;
  if (!transcript || phrasesTotal === 0) {
    return {
      method: 'fixture_phrases_v1',
      score: 0,
      phrasesMatched: 0,
      phrasesTotal,
      phraseCoverage: 0,
      tokenOverlap: null,
    };
  }

  const normalized = normalizeTranscriptForQuality(transcript);
  let phrasesMatched = 0;
  for (const phrase of phrases) {
    const needle = normalizeTranscriptForQuality(phrase);
    if (needle.length > 0 && normalized.includes(needle)) {
      phrasesMatched += 1;
    }
  }
  const phraseCoverage = phrasesMatched / phrasesTotal;

  let tokenOverlap: number | null = null;
  let score = Math.round(phraseCoverage * 100);

  if (golden.referenceTranscriptNormalized) {
    const refTokens = new Set(tokenizeForQuality(golden.referenceTranscriptNormalized));
    const hypTokens = tokenizeForQuality(normalized);
    if (refTokens.size > 0 && hypTokens.length > 0) {
      let hit = 0;
      for (const token of hypTokens) {
        if (refTokens.has(token)) {
          hit += 1;
        }
      }
      // Precision-oriented overlap (how much of hypothesis is grounded in reference).
      tokenOverlap = hit / hypTokens.length;
      score = Math.round(phraseCoverage * 70 + tokenOverlap * 30);
    }
  }

  return {
    method: 'fixture_phrases_v1',
    score: Math.max(0, Math.min(100, score)),
    phrasesMatched,
    phrasesTotal,
    phraseCoverage,
    tokenOverlap,
  };
}

/**
 * Score Qwen lab JSON for required keys only (synthetic fixture).
 * Does not inspect clinical meaning of values.
 */
export function scoreExtractionAgainstGolden(
  rawModelText: string | null | undefined,
  golden: EdgeFixturePhraseGolden,
): EdgeExtractionQualityBreakdown {
  const keysTotal = golden.requiredExtractionKeys.length;
  if (!rawModelText || keysTotal === 0) {
    return {
      method: 'fixture_extraction_keys_v1',
      score: 0,
      keysPresent: 0,
      keysTotal,
      jsonParsed: false,
    };
  }

  const jsonSlice = extractJsonObject(rawModelText);
  if (!jsonSlice) {
    return {
      method: 'fixture_extraction_keys_v1',
      score: 0,
      keysPresent: 0,
      keysTotal,
      jsonParsed: false,
    };
  }

  try {
    const parsed = JSON.parse(jsonSlice) as Record<string, unknown>;
    let keysPresent = 0;
    for (const key of golden.requiredExtractionKeys) {
      const value = parsed[key];
      if (value != null && String(value).trim().length > 0) {
        keysPresent += 1;
      }
    }
    return {
      method: 'fixture_extraction_keys_v1',
      score: Math.round((keysPresent / keysTotal) * 100),
      keysPresent,
      keysTotal,
      jsonParsed: true,
    };
  } catch {
    return {
      method: 'fixture_extraction_keys_v1',
      score: 0,
      keysPresent: 0,
      keysTotal,
      jsonParsed: false,
    };
  }
}

export function combineFixtureQuality(
  transcription: EdgeTranscriptionQualityBreakdown,
  extraction: EdgeExtractionQualityBreakdown | null,
): EdgeCombinedQualityBreakdown {
  if (!extraction) {
    return {
      method: 'fixture_combined_v1',
      score: transcription.score,
      transcription,
      extraction: null,
    };
  }
  // Transcription dominates Voice-to-Care bottleneck story (70/30).
  const score = Math.round(transcription.score * 0.7 + extraction.score * 0.3);
  return {
    method: 'fixture_combined_v1',
    score,
    transcription,
    extraction,
  };
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}
