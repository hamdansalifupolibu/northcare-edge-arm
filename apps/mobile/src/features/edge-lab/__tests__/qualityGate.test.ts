import { evaluateEdgeQualityGate } from '../domain/qualityGate';
import { rankEdgeBottlenecks } from '../domain/bottleneckAnalysis';
import type { EdgeBenchmarkRunSummary } from '../domain/types';

function summaryWithStages(
  stages: Array<{ stage: EdgeBenchmarkRunSummary['stages'][number]['stage']; durationMs: number | null }>,
): EdgeBenchmarkRunSummary {
  return {
    schemaVersion: 1,
    runId: 'test',
    capturedAtIso: null,
    configFreezeId: 'freeze',
    configHash: null,
    fixtureId: null,
    experimentId: null,
    labOverrides: null,
    device: {
      marketingName: null,
      model: null,
      androidVersion: null,
      abi: null,
      soc: null,
      cpuCoreCount: null,
      backend: 'cpu',
      nativeLibraryAbi: null,
      platformOs: 'android',
    },
    stages,
    whisperTranscribeBundlesDecode: true,
    whisperLoadWasCold: true,
    tokensPerSecond: null,
    generatedTokenCount: null,
    transcriptCharCount: null,
    peakMemoryBytes: null,
    batteryLevelChangePercent: null,
    startTemperatureC: null,
    endTemperatureC: null,
    success: true,
    qualityScore: null,
    qualityBreakdown: null,
    verdict: 'pending',
    error: null,
    notes: [],
  };
}

describe('evaluateEdgeQualityGate', () => {
  it('returns pending when quality is missing even if faster', () => {
    const result = evaluateEdgeQualityGate({
      baselineLatencyMs: 100,
      candidateLatencyMs: 50,
      baselineQuality: null,
      candidateQuality: null,
    });
    expect(result.verdict).toBe('pending');
    expect(result.latencyImprovementRatio).toBeCloseTo(0.5);
  });

  it('accepts faster run within quality threshold', () => {
    const result = evaluateEdgeQualityGate({
      baselineLatencyMs: 100,
      candidateLatencyMs: 70,
      baselineQuality: 90,
      candidateQuality: 88,
    });
    expect(result.verdict).toBe('accepted');
  });

  it('rejects faster run with large quality drop', () => {
    const result = evaluateEdgeQualityGate({
      baselineLatencyMs: 100,
      candidateLatencyMs: 40,
      baselineQuality: 94,
      candidateQuality: 77,
    });
    expect(result.verdict).toBe('rejected');
  });
});

describe('rankEdgeBottlenecks', () => {
  it('ranks the slowest measured stage first', () => {
    const ranks = rankEdgeBottlenecks(
      summaryWithStages([
        { stage: 'm4a_decode', durationMs: null },
        { stage: 'whisper_load', durationMs: 1000 },
        { stage: 'whisper_inference', durationMs: 8000 },
        { stage: 'qwen_load', durationMs: 2000 },
        { stage: 'qwen_inference', durationMs: 3000 },
        { stage: 'total', durationMs: 14000 },
      ]),
    );
    expect(ranks[0]?.stage).toBe('whisper_inference');
    expect(ranks[0]?.shareOfMeasured).toBeCloseTo(8 / 14);
  });
});
