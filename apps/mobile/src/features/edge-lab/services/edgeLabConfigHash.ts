import { EDGE_BASELINE_CONFIG } from '../baseline/baselineConfig';

/**
 * Stable short fingerprint of the frozen baseline knobs (not a cryptographic audit hash).
 */
export function computeEdgeBaselineConfigHash(): string {
  const speech = EDGE_BASELINE_CONFIG.speech;
  const lm = EDGE_BASELINE_CONFIG.languageModel;
  const material = [
    EDGE_BASELINE_CONFIG.freezeId,
    speech.modelId,
    String(speech.beamSize),
    String(speech.maxThreads),
    String(speech.temperature),
    String(speech.speedUp),
    lm.modelId,
    lm.quantisation,
    String(lm.nCtx),
    String(lm.nPredict),
    String(lm.nThreads),
    String(lm.nGpuLayers),
    String(lm.temperature),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < material.length; i += 1) {
    hash = (hash * 31 + material.charCodeAt(i)) >>> 0;
  }
  return `cfg_${hash.toString(16).padStart(8, '0')}`;
}
