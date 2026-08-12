import type { EdgeExperimentVerdict, EdgePipelineStageId } from '../domain/types';

/**
 * Experiment definitions + measured S20 Ultra results.
 * Never silently promote these into production Voice-to-Care config.
 */
export type EdgeExperimentDefinition = {
  readonly id: string;
  readonly title: string;
  readonly hypothesis: string;
  readonly armRationale: string;
  readonly primaryVariable: string;
  readonly targetsBottleneck: EdgePipelineStageId | 'unknown_until_baseline';
  readonly status: 'planned' | 'ready_to_run' | 'measured' | 'archived';
  readonly productionWritable: false;
  readonly result: {
    readonly verdict: EdgeExperimentVerdict;
    readonly latencyImprovementRatio: number | null;
    readonly qualityDeltaPoints: number | null;
    readonly notes: string | null;
  };
};

export const EDGE_EXPERIMENT_CATALOG: readonly EdgeExperimentDefinition[] = [
  {
    id: 'exp-01-whisper-threads',
    title: 'Whisper thread sweep',
    hypothesis:
      'Adjusting Whisper maxThreads around the Arm64 big.LITTLE layout can reduce transcription latency without harming accuracy.',
    armRationale:
      'S20 Ultra class Arm CPUs expose heterogeneous cores; thread count must be measured, not assumed.',
    primaryVariable: 'WHISPER_TRANSCRIPTION_OPTIONS.maxThreads (lab override only)',
    targetsBottleneck: 'whisper_inference',
    status: 'measured',
    productionWritable: false,
    result: {
      verdict: 'rejected',
      latencyImprovementRatio: -0.719,
      qualityDeltaPoints: -4,
      notes:
        'Run edge_msp5wxf5_ehhj: threads 4→6 made whisper_inference ~72% slower. Keep production maxThreads=4.',
    },
  },
  {
    id: 'exp-02-whisper-prompt-length',
    title: 'Whisper prompt length',
    hypothesis:
      'A shorter initial prompt can reduce decode overhead in Whisper without meaningful WER regression on fixture notes.',
    armRationale:
      'Prompt tokens add work on-device; Arm CPU budget is limited during long community visits.',
    primaryVariable: 'WHISPER_TRANSCRIPTION_OPTIONS.prompt (lab override only)',
    targetsBottleneck: 'whisper_inference',
    status: 'measured',
    productionWritable: false,
    result: {
      verdict: 'rejected',
      latencyImprovementRatio: -0.0072,
      qualityDeltaPoints: -4,
      notes:
        'Run edge_msp61xyw_bzmw: empty prompt −0.72% on whisper_inference (<5% gate).',
    },
  },
  {
    id: 'exp-03-whisper-speedup',
    title: 'Whisper speedUp flag',
    hypothesis:
      'Enabling whisper.rn speedUp reduces transcription latency on Arm without large provisional quality loss.',
    armRationale:
      'Vendor speed paths must be measured on Arm64; assumed wins often fail under real decode+infer load.',
    primaryVariable: 'WHISPER_TRANSCRIPTION_OPTIONS.speedUp (lab override only)',
    targetsBottleneck: 'whisper_inference',
    status: 'measured',
    productionWritable: false,
    result: {
      verdict: 'rejected',
      latencyImprovementRatio: -0.0081,
      qualityDeltaPoints: -4,
      notes:
        'Run edge_msp670iy_7lfm: speedUp=true −0.81% on whisper_inference (<5% gate).',
    },
  },
  {
    id: 'exp-04-qwen-prompt-compaction',
    title: 'Qwen extraction prompt compaction',
    hypothesis:
      'A compacted extraction system prompt reduces Qwen completion time while preserving JSON field coverage on the synthetic fixture.',
    armRationale:
      'LLM prefill/decode on Arm CPU is prompt-sensitive; smaller prompts often mean lower latency and thermals.',
    primaryVariable: 'Edge Lab extraction system/user prompt size',
    targetsBottleneck: 'qwen_inference',
    status: 'planned',
    productionWritable: false,
    result: {
      verdict: 'pending',
      latencyImprovementRatio: null,
      qualityDeltaPoints: null,
      notes: 'Deprioritized: Phase 4 bottleneck was Whisper, not Qwen.',
    },
  },
  {
    id: 'exp-05-qwen-threads',
    title: 'Qwen thread sweep',
    hypothesis:
      'Changing llama.rn n_threads can improve tokens/sec on Arm64 without quality loss on structured extraction.',
    armRationale:
      'llama.cpp thread mapping on Arm benefits from empirical sweeps; oversubscription can hurt.',
    primaryVariable: 'resolveOfflineAiThreadCount lab override',
    targetsBottleneck: 'qwen_inference',
    status: 'planned',
    productionWritable: false,
    result: {
      verdict: 'pending',
      latencyImprovementRatio: null,
      qualityDeltaPoints: null,
      notes: 'Deprioritized: Phase 4 bottleneck was Whisper, not Qwen.',
    },
  },
  {
    id: 'exp-06-smaller-whisper-conditional',
    title: 'Smaller Whisper model (conditional)',
    hypothesis:
      'A smaller Whisper English model can cut latency and storage if quality stays within the gate.',
    armRationale:
      'Model size directly affects Arm memory pressure and disk footprint on mid-range phones.',
    primaryVariable: 'Whisper model artifact (lab override only)',
    targetsBottleneck: 'whisper_inference',
    status: 'measured',
    productionWritable: false,
    result: {
      verdict: 'accepted',
      latencyImprovementRatio: 0.538,
      qualityDeltaPoints: -4,
      notes:
        'Run edge_msp6cf7n_d5qs: tiny.en −53.8% whisper_inference. ACCEPTED and PROMOTED into whisper-model-manifest.json (2026-08-11).',
    },
  },
  {
    id: 'exp-07-model-lifecycle',
    title: 'Model lifecycle / preload strategy',
    hypothesis:
      'Keeping a warm model context across lab iterations reduces load latency more than changing model weights.',
    armRationale:
      'If baseline shows load dominates, Arm memory bandwidth and init cost matter more than greedy decode tweaks.',
    primaryVariable: 'load/release/preload strategy (lab harness only)',
    targetsBottleneck: 'whisper_load',
    status: 'planned',
    productionWritable: false,
    result: {
      verdict: 'pending',
      latencyImprovementRatio: null,
      qualityDeltaPoints: null,
      notes: 'Not required after EXP-06; inference dominated and model size already accepted in lab.',
    },
  },
];

export function getEdgeExperimentById(id: string): EdgeExperimentDefinition | undefined {
  return EDGE_EXPERIMENT_CATALOG.find((item) => item.id === id);
}
