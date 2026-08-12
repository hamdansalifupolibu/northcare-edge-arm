import type { OfflineAiError, OfflineAiErrorCode } from './types';

export function createOfflineAiError(
  code: OfflineAiErrorCode,
  message: string,
): OfflineAiError {
  return { code, message };
}

export function mapNativeErrorToOfflineAiError(error: unknown): OfflineAiError {
  const raw = error instanceof Error ? error.message : String(error);
  const lowered = raw.toLowerCase();

  if (lowered.includes('abort') || lowered.includes('cancel')) {
    return createOfflineAiError('GENERATION_CANCELLED', 'Generation was cancelled.');
  }
  if (lowered.includes('memory') || lowered.includes('oom') || lowered.includes('alloc')) {
    return createOfflineAiError(
      'MEMORY_ALLOCATION_FAILED',
      'The device could not allocate memory for the model.',
    );
  }
  if (lowered.includes('gguf') || lowered.includes('unsupported')) {
    return createOfflineAiError('UNSUPPORTED_GGUF', 'The model file is unsupported.');
  }
  if (lowered.includes('load')) {
    return createOfflineAiError('LOAD_FAILED', 'The model failed to load.');
  }
  return createOfflineAiError(
    'GENERATION_FAILED',
    'Offline model operation failed. No patient or prompt details are shown.',
  );
}

export function toSafeUiErrorMessage(error: OfflineAiError | null): string {
  if (!error) {
    return 'No error.';
  }
  return error.message;
}
