import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../../data/domain/value-objects/timestamps';
import type { VoiceCaptureSessionStatus } from './types';

export type VoiceRecordingListEntry = {
  readonly sessionId: EntityId;
  readonly clientId: EntityId;
  readonly clientName: string;
  readonly encounterId: EntityId | null;
  readonly status: VoiceCaptureSessionStatus;
  readonly durationMs: number | null;
  readonly languageHint: string | null;
  readonly transcriptSnippet: string | null;
  readonly hasAudio: boolean;
  readonly reviewableFieldCount: number;
  readonly updatedAt: IsoUtcTimestamp;
  readonly createdAt: IsoUtcTimestamp;
};
