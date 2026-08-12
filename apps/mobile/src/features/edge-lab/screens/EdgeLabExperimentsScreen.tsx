import { View } from 'react-native';

import { AppCard, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { EdgeLabChrome } from '../components/EdgeLabChrome';
import { EdgeLabKvRow } from '../components/EdgeLabKvRow';
import { EdgeLabStatusBanner } from '../components/EdgeLabStatusBanner';
import { EdgeLabVerdictChip } from '../components/EdgeLabVerdictChip';
import {
  EDGE_EXPERIMENT_CATALOG,
  type EdgeExperimentDefinition,
} from '../experiments/experimentCatalog';

function latencyLabel(exp: EdgeExperimentDefinition): string {
  if (exp.result.latencyImprovementRatio == null) {
    return '—';
  }
  const pct = exp.result.latencyImprovementRatio * 100;
  if (pct > 0) {
    return `↓ ${pct.toFixed(1)}%`;
  }
  if (pct < 0) {
    return `↑ ${Math.abs(pct).toFixed(1)}% slower`;
  }
  return '0%';
}

function ExperimentCard({ exp }: { readonly exp: EdgeExperimentDefinition }) {
  const chipVerdict =
    exp.id === 'exp-06-smaller-whisper-conditional' && exp.result.verdict === 'accepted'
      ? 'promoted'
      : exp.result.verdict;

  return (
    <AppCard title={exp.title} subtitle={exp.id} elevated>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        }}
      >
        <EdgeLabVerdictChip verdict={chipVerdict} />
        <AppText variant="label">{latencyLabel(exp)}</AppText>
      </View>
      <EdgeLabKvRow label="Variable" value={exp.primaryVariable.split('(')[0].trim()} />
      {exp.result.notes ? (
        <AppText variant="caption" color="secondary" numberOfLines={3}>
          {exp.result.notes}
        </AppText>
      ) : (
        <AppText variant="caption" color="secondary" numberOfLines={2}>
          {exp.hypothesis}
        </AppText>
      )}
    </AppCard>
  );
}

export function EdgeLabExperimentsScreen() {
  const measured = EDGE_EXPERIMENT_CATALOG.filter((e) => e.status === 'measured');
  const planned = EDGE_EXPERIMENT_CATALOG.filter((e) => e.status !== 'measured');

  return (
    <EdgeLabChrome
      title="Experiments"
      active="experiments"
      testID="edge-lab-experiments-screen"
    >
      <EdgeLabStatusBanner
        tone="ready"
        title="3 rejected · 1 promoted"
        detail="Config knobs failed the 5% gate. Smaller Whisper passed and shipped."
      />

      <AppText variant="label" style={{ marginTop: spacing.md }}>
        Measured on S20 Ultra
      </AppText>
      {measured.map((exp) => (
        <View key={exp.id} style={{ marginTop: spacing.sm }}>
          <ExperimentCard exp={exp} />
        </View>
      ))}

      {planned.length > 0 ? (
        <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
          <AppCard title="Queued (not needed)" subtitle="Whisper was the bottleneck">
            {planned.map((exp) => (
              <EdgeLabKvRow key={exp.id} label={exp.title} value={exp.result.verdict} />
            ))}
          </AppCard>
        </View>
      ) : (
        <View style={{ marginBottom: spacing.lg }} />
      )}
    </EdgeLabChrome>
  );
}
