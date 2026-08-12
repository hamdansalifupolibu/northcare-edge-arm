import { selectExtractionProvider } from '../providers/extraction/selectExtractionProvider';
import { selectTranscriptionProvider } from '../providers/transcription/selectTranscriptionProvider';
import { listLoadableExtractionSchemas } from '../providers/extraction/schemas/registry';
import { DEV_EXTRACTION_PROVIDER_ID } from '../providers/extraction/DevelopmentSimulationExtractionProvider';
import { DEV_TRANSCRIPTION_PROVIDER_ID } from '../providers/transcription/DevelopmentSimulationTranscriptionProvider';

describe('voice provider gates', () => {
  it('allows development transcription and extraction only in development', () => {
    expect(selectTranscriptionProvider('development').id).toBe(DEV_TRANSCRIPTION_PROVIDER_ID);
    expect(selectExtractionProvider('development').id).toBe(DEV_EXTRACTION_PROVIDER_ID);
    expect(listLoadableExtractionSchemas('development').length).toBeGreaterThan(0);
  });

  it('fail-closed in production and staging', () => {
    expect(selectTranscriptionProvider('production').availability).toBe('failedClosed');
    expect(selectExtractionProvider('production').availability).toBe('failedClosed');
    expect(selectTranscriptionProvider('staging').availability).toBe('failedClosed');
    expect(selectExtractionProvider('staging').availability).toBe('failedClosed');
    expect(listLoadableExtractionSchemas('production')).toHaveLength(0);
  });
});
