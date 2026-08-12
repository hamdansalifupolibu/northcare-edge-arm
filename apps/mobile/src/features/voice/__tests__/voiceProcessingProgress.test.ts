import {
  analysisExtractionPercent,
  analysisStepFromPercent,
  estimateProcessingPercent,
  extractionStepFromPercent,
  processingStepFromPercent,
  saveRecordingPercent,
  speechTranscriptionPercent,
} from '../domain/voiceProcessingProgress';

describe('voiceProcessingProgress', () => {
  it('maps linear elapsed time to capped percent', () => {
    expect(estimateProcessingPercent(0, 10_000)).toBe(0);
    expect(estimateProcessingPercent(5_000, 10_000)).toBe(50);
    expect(estimateProcessingPercent(10_000, 10_000)).toBe(99);
  });

  it('easeOut curve rises quickly then slows before cap', () => {
    const early = speechTranscriptionPercent(2_000, 30_000);
    const late = speechTranscriptionPercent(30_000, 30_000);
    expect(early).toBeGreaterThan(15);
    expect(late).toBeGreaterThanOrEqual(88);
    expect(late).toBeGreaterThan(early);
  });

  it('analysis progress is phase-aware', () => {
    expect(analysisExtractionPercent('extracting', 0)).toBe(0);
    expect(analysisExtractionPercent('extracting', 18_000)).toBeGreaterThanOrEqual(70);
    expect(analysisExtractionPercent('applying', 0)).toBe(78);
    expect(analysisExtractionPercent('applying', 3500)).toBeGreaterThanOrEqual(98);
  });

  it('derives transcription steps from percent', () => {
    expect(processingStepFromPercent(0)).toBe('captured');
    expect(processingStepFromPercent(14)).toBe('transcribing');
    expect(processingStepFromPercent(40)).toBe('transcribing');
    expect(processingStepFromPercent(90)).toBe('preparing');
  });

  it('derives AI analysis steps from percent', () => {
    expect(analysisStepFromPercent(10)).toBe('loading');
    expect(analysisStepFromPercent(50)).toBe('extracting');
    expect(analysisStepFromPercent(90)).toBe('preparing');
  });

  it('keeps legacy extraction step mapping', () => {
    expect(extractionStepFromPercent(10)).toBe('captured');
    expect(extractionStepFromPercent(50)).toBe('transcribing');
  });

  it('save recording uses easeOut cap', () => {
    expect(saveRecordingPercent(2500, 2500)).toBeGreaterThanOrEqual(88);
  });
});
