import {
  FORBIDDEN_EXTRACTION_TARGETS,
  VOICE_MAX_RECORDING_DURATION_MS,
  VOICE_RECORDING_WARNING_DURATION_MS,
} from './constants';
import { VoiceError } from './errors';
import type { VoiceAllowedTargetType } from './types';
import { VOICE_ALLOWED_TARGET_TYPES } from './types';

export function isPastRecordingWarning(durationMs: number): boolean {
  return durationMs >= VOICE_RECORDING_WARNING_DURATION_MS;
}

export function isAtOrOverMaxRecordingDuration(durationMs: number): boolean {
  return durationMs >= VOICE_MAX_RECORDING_DURATION_MS;
}

export function assertAllowedExtractionTarget(
  targetType: string,
  targetKey: string,
): asserts targetType is VoiceAllowedTargetType {
  if (!(VOICE_ALLOWED_TARGET_TYPES as readonly string[]).includes(targetType)) {
    throw new VoiceError(
      'forbiddenTarget',
      'That extraction target is not allowed.',
    );
  }
  const lowered = `${targetType}.${targetKey}`.toLowerCase();
  for (const forbidden of FORBIDDEN_EXTRACTION_TARGETS) {
    if (lowered.includes(forbidden.toLowerCase())) {
      throw new VoiceError(
        'forbiddenTarget',
        'That extraction target is not allowed.',
      );
    }
  }
}

/** Missing speech must never become an affirmative clinical answer. */
export function missingSpeechMeansNo(): false {
  return false;
}

/** Confidence never bypasses worker review. */
export function confidenceBypassesReview(): false {
  return false;
}
