import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppCard, AppText, SectionHeader } from '../../../design-system';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { spacing } from '../../../theme';
import { EDGE_BASELINE_CONFIG, formatBaselineBytes } from '../baseline/baselineConfig';
import { EdgeLabChrome } from '../components/EdgeLabChrome';
import { EdgeLabHeadlineCard } from '../components/EdgeLabHeadlineCard';
import { EdgeLabKvRow } from '../components/EdgeLabKvRow';
import { EdgeLabPreflightCard } from '../components/EdgeLabPreflightCard';
import { EdgeLabStageBars } from '../components/EdgeLabStageBars';
import { EdgeLabStatusBanner } from '../components/EdgeLabStatusBanner';
import { primaryBottleneck } from '../domain/bottleneckAnalysis';
import { formatEdgeMs, shortRunId } from '../domain/formatters';
import type { EdgeBenchmarkRunSummary, EdgePipelineStageId } from '../domain/types';
import { EDGE_LAB_FIXTURE_ID } from '../services/edgeLabFixture';
import {
  loadDesignatedBaseline,
  saveDesignatedBaseline,
} from '../services/edgeLabBaselineStore';
import { loadEdgeLabLastRun } from '../services/edgeLabLastRunStore';
import {
  runEdgeLabPreflight,
  type EdgeLabPreflightReport,
} from '../services/edgeLabPreflight';
import { importEdgeLabFixtureFromPicker } from '../services/importEdgeLabFixture';
import { loadEdgeLabRunHistory } from '../services/edgeLabRunHistoryStore';
import { runEdgeLabHarness } from '../services/runEdgeLabHarness';

function stageMs(summary: EdgeBenchmarkRunSummary, stage: EdgePipelineStageId): string {
  return formatEdgeMs(summary.stages.find((s) => s.stage === stage)?.durationMs);
}

export function EdgeLabOverviewScreen() {
  const [busy, setBusy] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<EdgeBenchmarkRunSummary | null>(null);
  const [baseline, setBaseline] = useState<EdgeBenchmarkRunSummary | null>(null);
  const [history, setHistory] = useState<readonly EdgeBenchmarkRunSummary[]>([]);
  const [preflight, setPreflight] = useState<EdgeLabPreflightReport | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const refresh = useCallback(async () => {
    setLastRun(await loadEdgeLabLastRun());
    setBaseline(await loadDesignatedBaseline());
    setHistory(await loadEdgeLabRunHistory());
  }, []);

  const refreshPreflight = useCallback(async () => {
    setPreflight(await runEdgeLabPreflight());
  }, []);

  useEffect(() => {
    void refresh();
    void refreshPreflight();
  }, [refresh, refreshPreflight]);

  const { speech, languageModel, targetDevice } = EDGE_BASELINE_CONFIG;
  const bottleneck = primaryBottleneck(baseline ?? lastRun);

  async function onRunBenchmark() {
    setBusy(true);
    setStatusMessage(null);
    setProgressMessage('Starting…');
    try {
      const latestPreflight = await runEdgeLabPreflight();
      setPreflight(latestPreflight);
      if (!latestPreflight.readyToRun) {
        setStatusMessage('Preflight blocked — fix checklist first.');
        setProgressMessage(null);
        return;
      }

      const summary = await runEdgeLabHarness('ui', {
        onProgress: (event) => setProgressMessage(event.message),
      });
      setLastRun(summary);
      setHistory(await loadEdgeLabRunHistory());
      if (summary.success) {
        setStatusMessage(`Complete · ${stageMs(summary, 'total')}`);
      } else if (summary.error === 'fixture_missing') {
        setStatusMessage(`Fixture missing (${EDGE_LAB_FIXTURE_ID}.m4a).`);
      } else {
        setStatusMessage(`Incomplete: ${summary.error ?? 'unknown'}`);
      }
    } catch (error) {
      setStatusMessage(mapUserFacingError(error, 'Benchmark failed.'));
    } finally {
      setBusy(false);
      setProgressMessage(null);
      void refreshPreflight();
    }
  }

  async function onPinBaseline() {
    if (!lastRun || !lastRun.success) {
      setStatusMessage('Need a successful run to pin.');
      return;
    }
    await saveDesignatedBaseline(lastRun);
    setBaseline(lastRun);
    setStatusMessage(`Pinned ${shortRunId(lastRun.runId)}`);
  }

  async function onImportFixture() {
    setBusy(true);
    setStatusMessage(null);
    try {
      const result = await importEdgeLabFixtureFromPicker();
      if (result.ok) {
        setStatusMessage('Fixture imported.');
        await refreshPreflight();
      } else if (result.error === 'cancelled') {
        setStatusMessage('Import cancelled.');
      } else {
        setStatusMessage('Import failed — synthetic M4A only.');
      }
    } catch (error) {
      setStatusMessage(mapUserFacingError(error, 'Fixture import failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <EdgeLabChrome title="Results" active="overview" testID="edge-lab-overview-screen">
      <EdgeLabHeadlineCard />

      {busy ? (
        <View style={{ marginTop: spacing.md }}>
          <EdgeLabStatusBanner
            tone="running"
            title="Running"
            detail={progressMessage ?? 'Working…'}
          />
        </View>
      ) : null}

      <View style={{ marginTop: spacing.md }}>
        <AppCard
          title="This device"
          subtitle={
            lastRun
              ? `${lastRun.success ? 'Last run OK' : 'Last run incomplete'} · ${shortRunId(lastRun.runId)}`
              : 'No live run yet'
          }
          elevated
        >
          {lastRun ? (
            <>
              <EdgeLabStageBars summary={lastRun} />
              <View style={{ marginTop: spacing.sm }}>
                <EdgeLabKvRow
                  label="Bottleneck"
                  value={
                    bottleneck
                      ? `${bottleneck.stage.replace(/_/g, ' ')} · ${Math.round(bottleneck.shareOfMeasured * 100)}%`
                      : '—'
                  }
                />
                <EdgeLabKvRow
                  label="Pinned baseline"
                  value={baseline ? shortRunId(baseline.runId) : 'Not pinned'}
                />
                <EdgeLabKvRow
                  label="Fixture quality"
                  value={
                    lastRun.qualityScore != null
                      ? `${lastRun.qualityScore}/100${
                          lastRun.qualityBreakdown?.phrasesMatched != null
                            ? ` · phrases ${lastRun.qualityBreakdown.phrasesMatched}/${lastRun.qualityBreakdown.phrasesTotal}`
                            : ''
                        }`
                      : '—'
                  }
                />
                <EdgeLabKvRow
                  label="tok/s · chars"
                  value={`${lastRun.tokensPerSecond?.toFixed(1) ?? '—'} · ${lastRun.transcriptCharCount ?? '—'}`}
                />
              </View>
            </>
          ) : (
            <AppText variant="caption" color="secondary">
              Published evidence is above. Run below to refresh live stage bars on this phone.
            </AppText>
          )}
        </AppCard>
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <SectionHeader title="Actions" />
        <AppButton
          label={busy ? 'Running…' : 'Run benchmark'}
          onPress={() => {
            void onRunBenchmark();
          }}
          disabled={busy || (preflight != null && !preflight.readyToRun)}
          loading={busy}
          accessibilityHint="Runs the Edge Lab AI pipeline benchmark"
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppButton
              label="Import fixture"
              variant="secondary"
              disabled={busy}
              onPress={() => {
                void onImportFixture();
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              label="Pin baseline"
              variant="tertiary"
              disabled={busy || !lastRun?.success}
              onPress={() => {
                void onPinBaseline();
              }}
            />
          </View>
        </View>
        {statusMessage ? (
          <EdgeLabStatusBanner
            tone={lastRun?.success ? 'success' : 'warning'}
            title={statusMessage}
          />
        ) : null}
      </View>

      <View style={{ marginTop: spacing.md }}>
        <EdgeLabPreflightCard
          report={preflight}
          busy={busy}
          onRefresh={() => {
            void refreshPreflight();
          }}
        />
      </View>

      <View style={{ marginTop: spacing.md }}>
        <AppCard
          title="Frozen baseline config"
          subtitle={`${targetDevice.marketingName} · historical start line`}
        >
          <AppButton
            label={showConfig ? 'Hide details' : 'Show details'}
            variant="tertiary"
            size="compact"
            onPress={() => setShowConfig((v) => !v)}
          />
          {showConfig ? (
            <View style={{ marginTop: spacing.xs }}>
              <EdgeLabKvRow
                label="Whisper (freeze)"
                value={`${speech.filename} · ${formatBaselineBytes(speech.actualByteSize)}`}
              />
              <EdgeLabKvRow
                label="Threads / beam"
                value={`${speech.maxThreads} / ${speech.beamSize}`}
              />
              <EdgeLabKvRow
                label="Qwen"
                value={`${languageModel.quantisation} · ${formatBaselineBytes(languageModel.actualByteSize)}`}
              />
              <AppText variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
                Production now uses promoted tiny.en — freeze stays base.en for Before→After.
              </AppText>
            </View>
          ) : (
            <AppText variant="caption" color="secondary">
              Whisper base.en + Qwen 0.5B Q4 — details collapsed
            </AppText>
          )}
        </AppCard>
      </View>

      {history.length > 0 ? (
        <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
          <AppCard title="Recent" subtitle="Last 4 on device">
            {history.slice(0, 4).map((run) => (
              <EdgeLabKvRow
                key={run.runId}
                label={`${run.success ? '✓' : '✕'} ${shortRunId(run.runId)}`}
                value={`${stageMs(run, 'total')} · ${run.verdict}`}
              />
            ))}
          </AppCard>
        </View>
      ) : (
        <View style={{ marginBottom: spacing.lg }} />
      )}
    </EdgeLabChrome>
  );
}
