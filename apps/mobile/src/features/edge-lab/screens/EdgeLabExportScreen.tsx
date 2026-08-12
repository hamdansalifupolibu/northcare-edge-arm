import { useCallback, useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { AppButton, AppCard, AppText } from '../../../design-system';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { spacing } from '../../../theme';
import { EdgeLabChrome } from '../components/EdgeLabChrome';
import { EdgeLabKvRow } from '../components/EdgeLabKvRow';
import { EdgeLabStatusBanner } from '../components/EdgeLabStatusBanner';
import { EDGE_PUBLISHED_RESULTS } from '../domain/publishedResults';
import { shortRunId } from '../domain/formatters';
import type { EdgeBenchmarkRunSummary } from '../domain/types';
import { loadDesignatedBaseline } from '../services/edgeLabBaselineStore';
import {
  buildEdgeLabExportBundle,
  edgeLabExportToCsv,
  edgeLabExportToJson,
} from '../services/edgeLabExport';
import { loadEdgeLabLastRun } from '../services/edgeLabLastRunStore';

export function EdgeLabExportScreen() {
  const [lastRun, setLastRun] = useState<EdgeBenchmarkRunSummary | null>(null);
  const [baseline, setBaseline] = useState<EdgeBenchmarkRunSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLastRun(await loadEdgeLabLastRun());
    setBaseline(await loadDesignatedBaseline());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const bundle = buildEdgeLabExportBundle({
    lastRun,
    designatedBaseline: baseline,
  });

  async function share(kind: 'json' | 'csv') {
    setStatusMessage(null);
    try {
      const body = kind === 'json' ? edgeLabExportToJson(bundle) : edgeLabExportToCsv(bundle);
      await Share.share({
        title: `NorthCare Edge ${kind.toUpperCase()} export`,
        message: body,
      });
      setStatusMessage(`${kind.toUpperCase()} share opened.`);
    } catch (error) {
      setStatusMessage(mapUserFacingError(error, 'Export failed.'));
    }
  }

  return (
    <EdgeLabChrome title="Export" active="export" testID="edge-lab-export-screen">
      <AppCard title="Evidence pack" subtitle="Metric-only · no transcripts" elevated>
        <EdgeLabKvRow label="Freeze" value={bundle.freezeId} />
        <EdgeLabKvRow label="Published win" value={EDGE_PUBLISHED_RESULTS.optimizedRunId} />
        <EdgeLabKvRow label="Last run" value={shortRunId(bundle.lastRun?.runId)} />
        <EdgeLabKvRow label="Pinned baseline" value={shortRunId(bundle.designatedBaseline?.runId)} />
      </AppCard>

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <AppButton
          label="Share JSON"
          onPress={() => {
            void share('json');
          }}
        />
        <AppButton
          label="Share CSV"
          variant="secondary"
          onPress={() => {
            void share('csv');
          }}
        />
        {statusMessage ? <EdgeLabStatusBanner tone="info" title={statusMessage} /> : null}
      </View>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppText variant="caption" color="secondary">
          Also archive logcat `EDGE_LAB_EVIDENCE` into `benchmarks/raw/` on the host.
        </AppText>
      </View>
    </EdgeLabChrome>
  );
}
