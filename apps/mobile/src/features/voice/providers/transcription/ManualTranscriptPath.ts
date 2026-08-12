export const MANUAL_TRANSCRIPT_PROVIDER_ID = 'manual.worker.transcript.v1';
export const MANUAL_TRANSCRIPT_PROVIDER_VERSION = '1';

export type ManualTranscriptMarker = {
  readonly providerId: typeof MANUAL_TRANSCRIPT_PROVIDER_ID;
  readonly providerVersion: typeof MANUAL_TRANSCRIPT_PROVIDER_VERSION;
  readonly source: 'manual';
  readonly isSynthetic: false;
  readonly label: 'Manual transcript entered by worker';
};

export function createManualTranscriptMarker(): ManualTranscriptMarker {
  return {
    providerId: MANUAL_TRANSCRIPT_PROVIDER_ID,
    providerVersion: MANUAL_TRANSCRIPT_PROVIDER_VERSION,
    source: 'manual',
    isSynthetic: false,
    label: 'Manual transcript entered by worker',
  };
}
