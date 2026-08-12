import { File, Paths } from 'expo-file-system';

import { EDGE_BASELINE_CONFIG } from '../baseline/baselineConfig';
import {
  combineFixtureQuality,
  scoreExtractionAgainstGolden,
  scoreTranscriptionAgainstGolden,
} from '../domain/fixtureQuality';
import type {
  EdgeBenchmarkRunSummary,
  EdgeLabHarnessMode,
  EdgeLabOverrides,
  EdgeStageTimingMs,
} from '../domain/types';
import {
  EDGE_LAB_FIXTURE_GOLDEN,
  isEdgeLabFixtureGoldenReady,
} from '../fixtures/edgeLabFixtureGolden';
import { captureArmDeviceEvidence } from './captureArmDeviceEvidence';
import { writeEdgeLabGoldenCapture } from './captureFixtureTranscript';
import { computeEdgeBaselineConfigHash } from './edgeLabConfigHash';
import { edgeLabEvidenceLog } from './edgeLabEvidenceLog';
import {
  clearEdgeLabAutoConfig,
  readEdgeLabAutoConfig,
} from './edgeLabExperimentConfig';
import { resolveEdgeLabFixture } from './edgeLabFixture';
import { saveEdgeLabLastRun } from './edgeLabLastRunStore';
import { appendEdgeLabRunHistory } from './edgeLabRunHistoryStore';
import { runEdgeLabQwenProbe } from './edgeLabQwenProbe';
import { runEdgeLabWhisperProbe } from './edgeLabWhisperProbe';

export const EDGE_LAB_AUTO_TRIGGER_FILENAME = 'edge-lab-auto-run.trigger';

export type EdgeLabProgressPhase =
  | 'start'
  | 'device'
  | 'fixture'
  | 'whisper_load'
  | 'whisper_inference'
  | 'qwen_load'
  | 'qwen_inference'
  | 'persist'
  | 'complete'
  | 'failed';

export type EdgeLabProgressEvent = {
  readonly phase: EdgeLabProgressPhase;
  readonly message: string;
};

export type RunEdgeLabHarnessOptions = {
  readonly onProgress?: (event: EdgeLabProgressEvent) => void;
  /** Lab-only overrides (also loaded from edge-lab-auto-run.config when mode=auto). */
  readonly labOverrides?: EdgeLabOverrides | null;
};

function createRunId(): string {
  return `edge_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function stagesFromMs(parts: {
  whisperLoadMs: number | null;
  whisperTranscribeTotalMs: number | null;
  qwenLoadMs: number | null;
  qwenInferenceMs: number | null;
  totalMs: number | null;
}): EdgeStageTimingMs[] {
  return [
    { stage: 'm4a_decode', durationMs: null },
    { stage: 'whisper_load', durationMs: parts.whisperLoadMs },
    {
      stage: 'whisper_inference',
      durationMs: parts.whisperTranscribeTotalMs,
    },
    { stage: 'qwen_load', durationMs: parts.qwenLoadMs },
    { stage: 'qwen_inference', durationMs: parts.qwenInferenceMs },
    { stage: 'total', durationMs: parts.totalMs },
  ];
}

export function getEdgeLabAutoTriggerFile(): File {
  return new File(Paths.document, EDGE_LAB_AUTO_TRIGGER_FILENAME);
}

export async function isEdgeLabAutoTriggerPresent(): Promise<boolean> {
  return getEdgeLabAutoTriggerFile().exists;
}

export function clearEdgeLabAutoTrigger(): void {
  const trigger = getEdgeLabAutoTriggerFile();
  if (trigger.exists) {
    trigger.delete();
  }
}

async function persistSummary(summary: EdgeBenchmarkRunSummary): Promise<void> {
  await saveEdgeLabLastRun(summary);
  await appendEdgeLabRunHistory(summary);
}

/**
 * Lab harness: times Voice-to-Care AI stages without clinical SQLite apply.
 */
export async function runEdgeLabHarness(
  mode: EdgeLabHarnessMode = 'ui',
  options: RunEdgeLabHarnessOptions = {},
): Promise<EdgeBenchmarkRunSummary> {
  const report = (phase: EdgeLabProgressPhase, message: string) => {
    options.onProgress?.({ phase, message });
  };

  const autoConfig = mode === 'auto' ? await readEdgeLabAutoConfig() : null;
  if (mode === 'auto') {
    clearEdgeLabAutoConfig();
  }
  const labOverrides: EdgeLabOverrides | null =
    options.labOverrides ?? autoConfig ?? null;
  const experimentId = labOverrides?.experimentId ?? null;

  const runId = createRunId();
  const totalStarted = Date.now();
  const configHash = computeEdgeBaselineConfigHash();
  const notes: string[] = [
    'm4a_decode not separable in JS; included inside whisper_inference (whisper.rn patch).',
    'Lab path does not write Voice-to-Care SQLite confirm/apply.',
    'Battery/thermal/peak memory not instrumented yet (null).',
  ];
  if (labOverrides?.whisperMaxThreads != null) {
    notes.push(
      `Lab override whisperMaxThreads=${labOverrides.whisperMaxThreads} (production remains unchanged).`,
    );
  }
  if (typeof labOverrides?.whisperPrompt === 'string') {
    notes.push(
      `Lab override whisperPromptLength=${labOverrides.whisperPrompt.length} (production remains unchanged).`,
    );
  }
  if (typeof labOverrides?.whisperSpeedUp === 'boolean') {
    notes.push(
      `Lab override whisperSpeedUp=${String(labOverrides.whisperSpeedUp)} (production remains unchanged).`,
    );
  }
  if (labOverrides?.whisperModelFilename) {
    notes.push(
      `Lab override whisperModelFilename=${labOverrides.whisperModelFilename} (production remains unchanged).`,
    );
  }
  if (experimentId) {
    notes.push(`Experiment id: ${experimentId}`);
  }

  report('start', 'Starting Edge Lab harness…');
  edgeLabEvidenceLog({
    event: 'start',
    runId,
    mode,
    freezeId: EDGE_BASELINE_CONFIG.freezeId,
    configHash,
    experimentId,
    whisperMaxThreads: labOverrides?.whisperMaxThreads ?? null,
    whisperPromptLength:
      typeof labOverrides?.whisperPrompt === 'string' ? labOverrides.whisperPrompt.length : null,
    whisperSpeedUp: labOverrides?.whisperSpeedUp ?? null,
    whisperModelFilename: labOverrides?.whisperModelFilename ?? null,
  });

  report('device', 'Capturing device evidence…');
  const device = await captureArmDeviceEvidence();
  edgeLabEvidenceLog({
    event: 'device',
    runId,
    model: device.model,
    androidVersion: device.androidVersion,
    platformOs: device.platformOs,
    backend: device.backend,
    abi: device.abi,
    soc: device.soc,
  });

  report('fixture', 'Resolving synthetic fixture…');
  const fixture = await resolveEdgeLabFixture();
  edgeLabEvidenceLog({
    event: 'fixture',
    runId,
    fixtureId: fixture.fixtureId,
    exists: fixture.exists,
    byteSize: fixture.byteSize,
  });

  const baseMeta = {
    schemaVersion: 1 as const,
    runId,
    configFreezeId: EDGE_BASELINE_CONFIG.freezeId,
    configHash,
    fixtureId: fixture.fixtureId,
    experimentId,
    labOverrides,
    device,
    whisperTranscribeBundlesDecode: true as const,
    peakMemoryBytes: null,
    batteryLevelChangePercent: null,
    startTemperatureC: null,
    endTemperatureC: null,
  };

  if (!fixture.exists || !fixture.uri) {
    const summary: EdgeBenchmarkRunSummary = {
      ...baseMeta,
      capturedAtIso: new Date().toISOString(),
      stages: stagesFromMs({
        whisperLoadMs: null,
        whisperTranscribeTotalMs: null,
        qwenLoadMs: null,
        qwenInferenceMs: null,
        totalMs: Date.now() - totalStarted,
      }),
      whisperLoadWasCold: true,
      tokensPerSecond: null,
      generatedTokenCount: null,
      transcriptCharCount: null,
      success: false,
      qualityScore: null,
      qualityBreakdown: null,
      verdict: 'inconclusive',
      error: 'fixture_missing',
      notes: [
        ...notes,
        'Place edge-lab-fixture-v1.m4a under app documents (see benchmarks/fixtures/README.md).',
      ],
    };
    report('failed', 'Fixture missing');
    edgeLabEvidenceLog({
      event: 'failed',
      runId,
      error: summary.error,
      totalMs: Date.now() - totalStarted,
    });
    report('persist', 'Saving run summary…');
    await persistSummary(summary);
    return summary;
  }

  const whisper = await runEdgeLabWhisperProbe(fixture.uri, {
    maxThreads: labOverrides?.whisperMaxThreads,
    prompt: labOverrides?.whisperPrompt,
    speedUp: labOverrides?.whisperSpeedUp,
    modelFilename: labOverrides?.whisperModelFilename,
    onLoadStart: () => report('whisper_load', 'Loading Whisper (cold lab context)…'),
    onTranscribeStart: () =>
      report(
        'whisper_inference',
        labOverrides?.whisperModelFilename
          ? `Transcribing with lab model ${labOverrides.whisperModelFilename}…`
          : labOverrides?.whisperSpeedUp === true
            ? 'Transcribing with lab speedUp=true…'
            : labOverrides?.whisperMaxThreads != null
              ? `Transcribing with lab threads=${labOverrides.whisperMaxThreads}…`
              : typeof labOverrides?.whisperPrompt === 'string'
                ? `Transcribing with lab prompt length=${labOverrides.whisperPrompt.length}…`
                : 'Transcribing fixture (includes M4A decode)…',
      ),
  });
  if (
    labOverrides?.captureFixtureTranscript === true &&
    whisper.ok &&
    whisper.transcriptTextForLabOnly
  ) {
    await writeEdgeLabGoldenCapture(whisper.transcriptTextForLabOnly);
    notes.push('Wrote synthetic transcript capture file for golden authoring.');
    edgeLabEvidenceLog({
      event: 'golden_capture',
      runId,
      written: true,
      transcriptCharCount: whisper.transcriptCharCount,
    });
  }

  edgeLabEvidenceLog({
    event: 'whisper',
    runId,
    ok: whisper.ok,
    whisperLoadMs: whisper.whisperLoadMs,
    whisperTranscribeTotalMs: whisper.whisperTranscribeTotalMs,
    transcriptCharCount: whisper.transcriptCharCount,
    whisperMaxThreads: labOverrides?.whisperMaxThreads ?? EDGE_BASELINE_CONFIG.speech.maxThreads,
    whisperPromptLength:
      typeof labOverrides?.whisperPrompt === 'string'
        ? labOverrides.whisperPrompt.length
        : EDGE_BASELINE_CONFIG.speech.prompt.length,
    whisperSpeedUp: labOverrides?.whisperSpeedUp ?? EDGE_BASELINE_CONFIG.speech.speedUp,
    whisperModelFilename: whisper.modelFilenameUsed,
    error: whisper.error,
  });

  if (!whisper.ok) {
    const summary: EdgeBenchmarkRunSummary = {
      ...baseMeta,
      capturedAtIso: new Date().toISOString(),
      stages: stagesFromMs({
        whisperLoadMs: whisper.whisperLoadMs,
        whisperTranscribeTotalMs: whisper.whisperTranscribeTotalMs,
        qwenLoadMs: null,
        qwenInferenceMs: null,
        totalMs: Date.now() - totalStarted,
      }),
      whisperLoadWasCold: whisper.whisperLoadWasCold,
      tokensPerSecond: null,
      generatedTokenCount: null,
      transcriptCharCount: whisper.transcriptCharCount,
      success: false,
      qualityScore: 0,
      qualityBreakdown: null,
      verdict: 'inconclusive',
      error: whisper.error,
      notes,
    };
    report('failed', whisper.error ?? 'Whisper probe failed');
    edgeLabEvidenceLog({ event: 'failed', runId, error: summary.error });
    report('persist', 'Saving run summary…');
    await persistSummary(summary);
    return summary;
  }

  const qwen = await runEdgeLabQwenProbe({
    labTranscript: whisper.transcriptTextForLabOnly,
    onLoadStart: () => report('qwen_load', 'Loading Qwen…'),
    onInferStart: () => report('qwen_inference', 'Running Qwen extraction probe…'),
  });
  edgeLabEvidenceLog({
    event: 'qwen',
    runId,
    ok: qwen.ok,
    qwenLoadMs: qwen.qwenLoadMs,
    qwenInferenceMs: qwen.qwenInferenceMs,
    tokensPerSecond: qwen.tokensPerSecond,
    generatedTokenCount: qwen.generatedTokenCount,
    error: qwen.error,
  });

  const totalMs = Date.now() - totalStarted;
  const success = whisper.ok && qwen.ok;

  let qualityScore: number | null = null;
  let qualityBreakdown: EdgeBenchmarkRunSummary['qualityBreakdown'] = null;
  if (success && isEdgeLabFixtureGoldenReady()) {
    const transcription = scoreTranscriptionAgainstGolden(
      whisper.transcriptTextForLabOnly,
      EDGE_LAB_FIXTURE_GOLDEN,
    );
    const extraction = scoreExtractionAgainstGolden(
      qwen.rawTextForLabOnly,
      EDGE_LAB_FIXTURE_GOLDEN,
    );
    const combined = combineFixtureQuality(transcription, extraction);
    qualityScore = combined.score;
    qualityBreakdown = {
      method: combined.method,
      phrasesMatched: transcription.phrasesMatched,
      phrasesTotal: transcription.phrasesTotal,
      extractionKeysPresent: extraction.keysPresent,
      extractionKeysTotal: extraction.keysTotal,
      extractionJsonParsed: extraction.jsonParsed,
    };
    notes.push(
      `Fixture quality ${qualityScore}/100 · phrases ${transcription.phrasesMatched}/${transcription.phrasesTotal} · extraction keys ${extraction.keysPresent}/${extraction.keysTotal}`,
    );
  } else if (success) {
    notes.push('Fixture golden phrases not ready — qualityScore left null.');
  }

  const summary: EdgeBenchmarkRunSummary = {
    ...baseMeta,
    capturedAtIso: new Date().toISOString(),
    stages: stagesFromMs({
      whisperLoadMs: whisper.whisperLoadMs,
      whisperTranscribeTotalMs: whisper.whisperTranscribeTotalMs,
      qwenLoadMs: qwen.qwenLoadMs,
      qwenInferenceMs: qwen.qwenInferenceMs,
      totalMs,
    }),
    whisperLoadWasCold: whisper.whisperLoadWasCold,
    tokensPerSecond: qwen.tokensPerSecond,
    generatedTokenCount: qwen.generatedTokenCount,
    transcriptCharCount: whisper.transcriptCharCount,
    success,
    qualityScore,
    qualityBreakdown,
    verdict: success ? 'pending' : 'inconclusive',
    error: qwen.ok ? null : qwen.error,
    notes,
  };

  if (success) {
    report(
      'complete',
      qualityScore != null
        ? `Complete · ${totalMs} ms · quality ${qualityScore}/100`
        : `Complete · total ${totalMs} ms`,
    );
  } else {
    report('failed', qwen.error ?? 'Qwen probe failed');
  }

  edgeLabEvidenceLog({
    event: 'complete',
    runId,
    success: summary.success,
    totalMs,
    stages: summary.stages,
    tokensPerSecond: summary.tokensPerSecond,
    transcriptCharCount: summary.transcriptCharCount,
    qualityScore: summary.qualityScore,
    qualityBreakdown: summary.qualityBreakdown,
    experimentId,
    whisperMaxThreads: labOverrides?.whisperMaxThreads ?? null,
    verdict: summary.verdict,
  });

  report('persist', 'Saving run summary…');
  await persistSummary(summary);
  return summary;
}
