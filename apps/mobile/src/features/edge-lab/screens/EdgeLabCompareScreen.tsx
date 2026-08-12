import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppCard, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { EdgeLabChrome } from '../components/EdgeLabChrome';
import { EdgeLabHeadlineCard } from '../components/EdgeLabHeadlineCard';
import { EdgeLabKvRow } from '../components/EdgeLabKvRow';
import { EdgeLabStatusBanner } from '../components/EdgeLabStatusBanner';
import { compareEdgeRuns } from '../domain/compareRuns';
import { EDGE_PUBLISHED_RESULTS } from '../domain/publishedResults';
import { edgeStageLabel, formatEdgeMs, shortRunId } from '../domain/formatters';
import { loadDesignatedBaseline } from '../services/edgeLabBaselineStore';
import { loadEdgeLabLastRun } from '../services/edgeLabLastRunStore';
import type { EdgeBenchmarkRunSummary } from '../domain/types';

function pct(ratio: number | null): string {
  if (ratio == null) {
    return '—';
  }
  if (ratio > 0) {
    return `↓ ${(ratio * 100).toFixed(1)}%`;
  }
  if (ratio < 0) {
    return `↑ ${(Math.abs(ratio) * 100).toFixed(1)}%`;
  }
  return '0%';
}

function gateTone(verdict: string): 'ready' | 'blocked' | 'warning' | 'info' {
  if (verdict === 'accepted') return 'ready';
  if (verdict === 'rejected') return 'blocked';
  if (verdict === 'pending') return 'warning';
  return 'info';
}

export function EdgeLabCompareScreen() {
  const [baseline, setBaseline] = useState<EdgeBenchmarkRunSummary | null>(null);
  const [lastRun, setLastRun] = useState<EdgeBenchmarkRunSummary | null>(null);

  const refresh = useCallback(async () => {
    setBaseline(await loadDesignatedBaseline());
    setLastRun(await loadEdgeLabLastRun());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const report = compareEdgeRuns(baseline, lastRun);
  const hasLivePair = Boolean(baseline && lastRun);
  const pub = EDGE_PUBLISHED_RESULTS;

  return (
    <EdgeLabChrome title="Compare" active="compare" testID="edge-lab-compare-screen">
      <EdgeLabHeadlineCard />

      <View style={{ marginTop: spacing.md }}>
        <AppCard title="Published Before → After" subtitle="S20 Ultra evidence pack" elevated>
          <EdgeLabKvRow
            label="Whisper"
            value={`${formatEdgeMs(pub.baseline.whisperInferenceMs)} → ${formatEdgeMs(pub.optimized.whisperInferenceMs)} (↓ 53.8%)`}
          />
          <EdgeLabKvRow
            label="End-to-end"
            value={`${formatEdgeMs(pub.baseline.totalMs)} → ${formatEdgeMs(pub.optimized.totalMs)} (↓ 50.9%)`}
          />
          <EdgeLabKvRow
            label="Fixture quality"
            value={
              pub.fixtureQuality
                ? `${pub.fixtureQuality.baseline}/100 → ${pub.fixtureQuality.optimized}/100`
                : 'phrase goldens (see Results after re-run)'
            }
          />
          <EdgeLabKvRow label="Model" value="base.en → tiny.en (shipped)" />
        </AppCard>
      </View>

      <View style={{ marginTop: spacing.md }}>
        <EdgeLabStatusBanner
          tone={hasLivePair ? gateTone(report.gate.verdict) : 'info'}
          title={
            hasLivePair
              ? `Live gate: ${report.gate.verdict}`
              : 'Live compare needs pinned baseline + last run'
          }
          detail={
            hasLivePair
              ? (report.gate.reasons[0] ?? 'Paired on-device measurements.')
              : 'Published numbers above are already judge-ready. Pin + re-run for live deltas.'
          }
        />
      </View>

      {hasLivePair ? (
        <>
          <View style={{ marginTop: spacing.md }}>
            <AppCard title="Live pair" subtitle={`${shortRunId(report.baselineRunId)} vs ${shortRunId(report.candidateRunId)}`}>
              {report.stages
                .filter((row) => row.stage !== 'm4a_decode')
                .map((row) => (
                  <EdgeLabKvRow
                    key={row.stage}
                    label={edgeStageLabel(row.stage)}
                    value={`${formatEdgeMs(row.baselineMs)} → ${formatEdgeMs(row.candidateMs)} (${pct(row.improvementRatio)})`}
                  />
                ))}
            </AppCard>
          </View>

          <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
            <AppCard title="Gate detail">
              <EdgeLabKvRow label="Latency" value={pct(report.gate.latencyImprovementRatio)} />
              <EdgeLabKvRow
                label="Quality Δ"
                value={
                  report.gate.qualityDeltaPoints == null
                    ? '—'
                    : `${report.gate.qualityDeltaPoints.toFixed(1)} pts`
                }
              />
              {report.gate.reasons.slice(0, 3).map((reason) => (
                <AppText key={reason} variant="caption" color="secondary">
                  · {reason}
                </AppText>
              ))}
            </AppCard>
          </View>
        </>
      ) : (
        <View style={{ marginBottom: spacing.lg }} />
      )}
    </EdgeLabChrome>
  );
}
