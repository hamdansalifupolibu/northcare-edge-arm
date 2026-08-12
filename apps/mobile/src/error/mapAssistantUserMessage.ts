import { mapUserFacingError } from './mapUserFacingError';

/** Worker-safe copy when the on-device Ask NorthCare model cannot be used. */
export const ASSISTANT_MODEL_UNAVAILABLE_FALLBACK =
  'Ask NorthCare is unavailable right now. Try again later.';

export function mapAssistantUserMessage(
  error: unknown,
  fallback: string = ASSISTANT_MODEL_UNAVAILABLE_FALLBACK,
): string {
  return mapUserFacingError(error, fallback);
}

export function sanitizeAssistantErrorMessage(
  message: string | undefined | null,
  fallback: string = ASSISTANT_MODEL_UNAVAILABLE_FALLBACK,
): string {
  if (message == null || message.trim() === '') {
    return fallback;
  }
  return mapUserFacingError(message, fallback);
}
