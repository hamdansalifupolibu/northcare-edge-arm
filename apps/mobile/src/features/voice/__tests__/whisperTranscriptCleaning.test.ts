import { cleanWhisperTranscript } from '../providers/transcription/WhisperTranscriptionProvider';

describe('cleanWhisperTranscript', () => {
  it('passes through clean text unchanged', () => {
    const input = 'The patient has a fever and cough.';
    expect(cleanWhisperTranscript(input)).toBe('The patient has a fever and cough.');
  });

  it('returns empty string for null/undefined/empty input', () => {
    expect(cleanWhisperTranscript('')).toBe('');
  });

  it('removes bracketed hallucinations like [Intense Music]', () => {
    const input = 'Patient is febrile. [Intense Music] Temperature is 39 degrees.';
    expect(cleanWhisperTranscript(input)).toBe('Patient is febrile. Temperature is 39 degrees.');
  });

  it('removes bracketed hallucinations like [Music]', () => {
    const input = 'Baby crying. [Music] Mother concerned.';
    expect(cleanWhisperTranscript(input)).toBe('Baby crying. Mother concerned.');
  });

  it('removes parenthesized hallucinations like (Music)', () => {
    const input = 'Cough noted. (Music) No chest pain.';
    expect(cleanWhisperTranscript(input)).toBe('Cough noted. No chest pain.');
  });

   it('removes unbracketed "intense music" hallucination', () => {
    const input = 'The child is afebrile. intense music Continue with treatment.';
    expect(cleanWhisperTranscript(input)).toBe('The child is afebrile. Continue with treatment.');
  });

  it('removes unbracketed "Suspense music" hallucination', () => {
    const input = 'Patient appears stable. Suspense music Vital signs normal.';
    expect(cleanWhisperTranscript(input)).toBe('Patient appears stable. Vital signs normal.');
  });

  it('removes unbracketed "dramatic music" hallucination', () => {
    const input = 'dramatic music The child is crying.';
    expect(cleanWhisperTranscript(input)).toBe('The child is crying.');
  });

  it('removes unbracketed "background music" hallucination', () => {
    const input = 'background music Patient has fever. background music Temperature elevated.';
    expect(cleanWhisperTranscript(input)).toBe('Patient has fever. Temperature elevated.');
  });

  it('removes unbracketed "music playing" hallucination', () => {
    const input = 'Vital signs normal. music playing Everything looks good.';
    expect(cleanWhisperTranscript(input)).toBe('Vital signs normal. Everything looks good.');
  });

  it('removes music note characters', () => {
    const input = '♪♫ baby feeding well ♪♫ mother healthy';
    expect(cleanWhisperTranscript(input)).toBe('baby feeding well mother healthy');
  });

  it('removes YouTube-style hallucinations', () => {
    const input = 'Thank you for watching. Patient discharged. Subscribe to for follow-up.';
    expect(cleanWhisperTranscript(input)).toBe('. Patient discharged. for follow-up.');
  });

  it('collapses multiple spaces left by replacements', () => {
    const input = '[Music]  [Laughter]  baby is crying';
    expect(cleanWhisperTranscript(input)).toBe('baby is crying');
  });

  it('handles mixed bracketed and unbracketed hallucinations', () => {
    const input = '[Intense Music] intense music Patient stable. (applause)';
    expect(cleanWhisperTranscript(input)).toBe('Patient stable.');
  });

  it('handles case-insensitive unbracketed hallucinations', () => {
    const input = 'INTENSE MUSIC baby sleeping well';
    expect(cleanWhisperTranscript(input)).toBe('baby sleeping well');
  });

  it('preserves legitimate clinical text containing the word music', () => {
    const input = 'Patient mentioned music therapy in history. No concerns.';
    expect(cleanWhisperTranscript(input)).toBe('Patient mentioned music therapy in history. No concerns.');
  });
});
