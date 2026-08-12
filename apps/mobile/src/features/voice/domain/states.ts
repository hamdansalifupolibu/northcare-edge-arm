import { VoiceError } from './errors';

export const RECORDING_STATES = [
  'idle',
  'preparing',
  'ready',
  'recording',
  'paused',
  'stopping',
  'recorded',
  'playing',
  'transcriptionPending',
  'transcriptReady',
  'extractionPending',
  'extractionReady',
  'reviewRequired',
  'confirmed',
  'discarded',
  'failed',
] as const;

export type RecordingState = (typeof RECORDING_STATES)[number];

const ALLOWED_TRANSITIONS: Readonly<Record<RecordingState, readonly RecordingState[]>> = {
  idle: ['preparing', 'ready', 'failed', 'discarded'],
  preparing: ['ready', 'failed', 'idle'],
  ready: ['recording', 'idle', 'failed', 'discarded'],
  recording: ['paused', 'stopping', 'failed'],
  paused: ['recording', 'stopping', 'failed'],
  stopping: ['recorded', 'failed'],
  recorded: [
    'playing',
    'transcriptionPending',
    'transcriptReady',
    'discarded',
    'failed',
    'ready',
  ],
  playing: ['recorded', 'failed'],
  transcriptionPending: ['transcriptReady', 'failed', 'recorded'],
  transcriptReady: ['extractionPending', 'reviewRequired', 'discarded', 'failed'],
  extractionPending: ['extractionReady', 'failed', 'transcriptReady'],
  extractionReady: ['reviewRequired', 'failed'],
  reviewRequired: ['confirmed', 'discarded', 'failed', 'transcriptReady'],
  confirmed: ['discarded'],
  discarded: [],
  failed: ['idle', 'ready', 'discarded'],
};

export function assertRecordingTransition(from: RecordingState, to: RecordingState): void {
  if (from === to) {
    return;
  }
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new VoiceError(
      'invalidStateTransition',
      'That recording action is not available in the current state.',
    );
  }
}

export function canTransition(from: RecordingState, to: RecordingState): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}
