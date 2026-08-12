import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { VoiceCaptureSessionStatus } from './types';

export function voiceSessionBasePath(input: {
  readonly clientId: EntityId;
  readonly encounterId?: EntityId | null;
}): string {
  if (input.encounterId) {
    return `/(worker)/clients/${input.clientId}/visits/${input.encounterId}/voice`;
  }
  return `/(worker)/clients/${input.clientId}/voice`;
}

export function resolveVoiceSessionRoute(input: {
  readonly clientId: EntityId;
  readonly sessionId: EntityId;
  readonly status: VoiceCaptureSessionStatus;
  readonly encounterId?: EntityId | null;
  readonly reviewableFieldCount?: number;
}): string {
  const base = voiceSessionBasePath({
    clientId: input.clientId,
    encounterId: input.encounterId,
  });
  const query = `sessionId=${input.sessionId}`;

  switch (input.status) {
    case 'consentPending':
    case 'draft':
      return `${base}/consent?${query}`;
    case 'readyToRecord':
    case 'recording':
      return `${base}/record?${query}`;
    case 'recorded':
      // Always resume at transcript so workers can hear audio and re-transcribe.
      return `${base}/transcript?${query}`;
    case 'transcribing':
    case 'transcriptReady':
    case 'failed':
    case 'extracting':
      return `${base}/transcript?${query}`;
    case 'reviewRequired':
      // Empty/failed extractions must not open a blank Results screen.
      if ((input.reviewableFieldCount ?? 0) <= 0) {
        return `${base}/transcript?${query}`;
      }
      if (input.encounterId) {
        return `${base}/review?${query}`;
      }
      return `${base}/results?${query}`;
    case 'confirmed':
      if (input.encounterId) {
        return `${base}/transcript?${query}`;
      }
      return `${base}/success?${query}`;
    case 'discarded':
      return `${base}?${query}`;
    default:
      return `${base}?${query}`;
  }
}

export function formatRecordingDuration(durationMs: number | null): string {
  if (durationMs == null || durationMs <= 0) {
    return '—';
  }
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatRecordingTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const day = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

const TRANSCRIPT_SNIPPET_MAX = 80;

export function buildTranscriptSnippet(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length <= TRANSCRIPT_SNIPPET_MAX) {
    return normalized;
  }
  return `${normalized.slice(0, TRANSCRIPT_SNIPPET_MAX - 1).trim()}…`;
}
