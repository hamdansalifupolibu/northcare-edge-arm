const EDGE_LAB_EVIDENCE_TAG = '[EDGE_LAB_EVIDENCE]';

const FORBIDDEN_META_KEYS = new Set([
  'transcript',
  'transcriptText',
  'rawPreview',
  'preview',
  'text',
  'audio',
  'audioUri',
  'audioPath',
  'prompt',
  'systemPrompt',
  'userPrompt',
  'pin',
  'token',
  'password',
  'qr',
]);

/**
 * Privacy-safe Stage-1-style evidence log for adb logcat capture.
 * Strips known sensitive keys; never log transcripts or audio paths.
 */
export function sanitizeEdgeLabEvidencePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_META_KEYS.has(key)) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeEdgeLabEvidencePayload(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function edgeLabEvidenceLog(payload: Record<string, unknown>): void {
  console.log(`${EDGE_LAB_EVIDENCE_TAG} ${JSON.stringify(sanitizeEdgeLabEvidencePayload(payload))}`);
}

export const EDGE_LAB_EVIDENCE_LOG_TAG = EDGE_LAB_EVIDENCE_TAG;
