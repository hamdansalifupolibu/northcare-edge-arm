import {
  ASSISTANT_MODEL_UNAVAILABLE_FALLBACK,
  mapAssistantUserMessage,
  sanitizeAssistantErrorMessage,
} from '../mapAssistantUserMessage';

describe('mapAssistantUserMessage', () => {
  it('returns fallback for system errors', () => {
    expect(
      mapAssistantUserMessage(new Error('ReferenceError: foo is not defined')),
    ).toBe(ASSISTANT_MODEL_UNAVAILABLE_FALLBACK);
  });

  it('passes through short worker-safe messages', () => {
    expect(mapAssistantUserMessage('The offline AI model is not installed.')).toBe(
      'The offline AI model is not installed.',
    );
  });

  it('sanitizes nullable messages', () => {
    expect(sanitizeAssistantErrorMessage(null)).toBe(ASSISTANT_MODEL_UNAVAILABLE_FALLBACK);
    expect(sanitizeAssistantErrorMessage('facility.listActive failed')).toBe(
      ASSISTANT_MODEL_UNAVAILABLE_FALLBACK,
    );
  });
});
