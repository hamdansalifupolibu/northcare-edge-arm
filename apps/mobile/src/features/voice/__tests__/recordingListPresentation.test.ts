import { voiceStrings } from '../i18n/voiceStrings';
import { recordingListStatusLabel } from '../domain/recordingListPresentation';
import type { VoiceRecordingListEntry } from '../domain/voiceRecordingSummary';

function entry(
  overrides: Partial<VoiceRecordingListEntry> = {},
): VoiceRecordingListEntry {
  return {
    sessionId: '00000000-0000-4000-8000-000000000001',
    clientId: '00000000-0000-4000-8000-000000000002',
    clientName: 'SYNTHETIC Client',
    encounterId: null,
    status: 'recorded',
    durationMs: 1200,
    languageHint: 'en',
    transcriptSnippet: 'SYNTHETIC snippet',
    hasAudio: true,
    reviewableFieldCount: 0,
    updatedAt: '2026-08-09T00:00:00.000Z',
    createdAt: '2026-08-09T00:00:00.000Z',
    ...overrides,
  };
}

describe('recordingListStatusLabel', () => {
  it('shows saved label for confirmed sessions', () => {
    expect(
      recordingListStatusLabel(entry({ status: 'confirmed' }), voiceStrings),
    ).toBe(voiceStrings.recordingsStatusSaved);
  });

  it('shows field count when review is ready', () => {
    expect(
      recordingListStatusLabel(
        entry({ status: 'reviewRequired', reviewableFieldCount: 3 }),
        voiceStrings,
      ),
    ).toBe(voiceStrings.recordingsStatusReadyToReviewMany(3));
  });

  it('falls back to transcript ready when review has no fields', () => {
    expect(
      recordingListStatusLabel(
        entry({ status: 'reviewRequired', reviewableFieldCount: 0 }),
        voiceStrings,
      ),
    ).toBe(voiceStrings.recordingsStatusTranscriptReady);
  });
});
