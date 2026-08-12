import type { EdgeBenchmarkRunSummary } from '../domain/types';
import { EDGE_EXPERIMENT_CATALOG } from '../experiments/experimentCatalog';
import { EDGE_BASELINE_CONFIG } from '../baseline/baselineConfig';
import { rankEdgeBottlenecks } from '../domain/bottleneckAnalysis';
import { compareEdgeRuns } from '../domain/compareRuns';

export type EdgeLabExportBundle = {
  readonly schemaVersion: 1;
  readonly exportedAtIso: string;
  readonly freezeId: string;
  readonly lastRun: EdgeBenchmarkRunSummary | null;
  readonly designatedBaseline: EdgeBenchmarkRunSummary | null;
  readonly bottlenecks: ReturnType<typeof rankEdgeBottlenecks>;
  readonly compare: ReturnType<typeof compareEdgeRuns>;
  readonly experiments: typeof EDGE_EXPERIMENT_CATALOG;
  readonly disclaimer: string;
};

export function buildEdgeLabExportBundle(options: {
  readonly lastRun: EdgeBenchmarkRunSummary | null;
  readonly designatedBaseline: EdgeBenchmarkRunSummary | null;
}): EdgeLabExportBundle {
  return {
    schemaVersion: 1,
    exportedAtIso: new Date().toISOString(),
    freezeId: EDGE_BASELINE_CONFIG.freezeId,
    lastRun: options.lastRun,
    designatedBaseline: options.designatedBaseline,
    bottlenecks: rankEdgeBottlenecks(options.designatedBaseline ?? options.lastRun),
    compare: compareEdgeRuns(options.designatedBaseline, options.lastRun),
    experiments: EDGE_EXPERIMENT_CATALOG,
    disclaimer:
      'Privacy-safe metrics only. No transcripts/audio. Empty numeric fields mean not measured yet — do not invent values.',
  };
}

export function edgeLabExportToJson(bundle: EdgeLabExportBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function edgeLabExportToCsv(bundle: EdgeLabExportBundle): string {
  const rows: string[] = ['section,key,value'];
  rows.push(`meta,freezeId,${bundle.freezeId}`);
  rows.push(`meta,exportedAtIso,${bundle.exportedAtIso}`);
  rows.push(`meta,lastRunId,${bundle.lastRun?.runId ?? ''}`);
  rows.push(`meta,baselineRunId,${bundle.designatedBaseline?.runId ?? ''}`);

  const run = bundle.designatedBaseline ?? bundle.lastRun;
  if (run) {
    for (const stage of run.stages) {
      rows.push(`stages,${stage.stage},${stage.durationMs ?? ''}`);
    }
  }

  for (const exp of bundle.experiments) {
    rows.push(
      `experiments,${exp.id},${exp.status}|${exp.result.verdict}|${exp.result.latencyImprovementRatio ?? ''}`,
    );
  }

  return `${rows.join('\n')}\n`;
}
