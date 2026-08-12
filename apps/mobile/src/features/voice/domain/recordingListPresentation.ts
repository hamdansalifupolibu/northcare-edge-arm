import type { VoiceRecordingListEntry } from './voiceRecordingSummary';
import type { voiceStrings } from '../i18n/voiceStrings';

type VoiceListStrings = typeof voiceStrings;

export function recordingListStatusLabel(
  entry: VoiceRecordingListEntry,
  strings: VoiceListStrings,
): string {
  if (entry.status === 'confirmed') {
    return strings.recordingsStatusSaved;
  }
  if (entry.status === 'failed') {
    return strings.recordingsStatus.failed;
  }
  if (entry.status === 'discarded') {
    return strings.recordingsStatus.discarded;
  }
  if (entry.status === 'reviewRequired') {
    if (entry.reviewableFieldCount > 0) {
      return entry.reviewableFieldCount === 1
        ? strings.recordingsStatusReadyToReviewOne
        : strings.recordingsStatusReadyToReviewMany(entry.reviewableFieldCount);
    }
    return strings.recordingsStatusTranscriptReady;
  }
  if (entry.status === 'transcriptReady' || entry.status === 'transcribing') {
    return strings.recordingsStatusTranscriptReady;
  }
  if (entry.status === 'recorded') {
    return strings.recordingsStatusAudioSaved;
  }
  if (entry.status === 'extracting') {
    return strings.recordingsStatusAnalyzing;
  }
  if (entry.status === 'consentPending' || entry.status === 'draft') {
    return strings.recordingsStatusNotStarted;
  }
  return strings.recordingsStatus[entry.status];
}
