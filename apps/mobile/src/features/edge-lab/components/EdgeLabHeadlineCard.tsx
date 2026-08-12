import { View } from 'react-native';

import { AppCard, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { EDGE_PUBLISHED_RESULTS } from '../domain/publishedResults';
import { EdgeLabMetricTile } from './EdgeLabMetricTile';
import { EdgeLabVerdictChip } from './EdgeLabVerdictChip';

function pctFaster(ratio: number): string {
  return `−${(ratio * 100).toFixed(1)}%`;
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Always-visible judge snapshot from published S20 Ultra evidence.
 */
export function EdgeLabHeadlineCard() {
  const pub = EDGE_PUBLISHED_RESULTS;

  return (
    <AppCard title="Published result" subtitle={pub.deviceLabel} elevated>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <AppText variant="label" style={{ flex: 1 }}>
          {pub.headline}
        </AppText>
        <EdgeLabVerdictChip verdict="promoted" />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <EdgeLabMetricTile
          label="Speech faster"
          value={pctFaster(pub.improvement.whisperInferenceRatio)}
          detail={`${seconds(pub.baseline.whisperInferenceMs)} → ${seconds(pub.optimized.whisperInferenceMs)}`}
          emphasize
        />
        <EdgeLabMetricTile
          label="Full pipeline"
          value={pctFaster(pub.improvement.totalRatio)}
          detail={`${seconds(pub.baseline.totalMs)} → ${seconds(pub.optimized.totalMs)}`}
          emphasize
        />
        <EdgeLabMetricTile
          label="Smaller model"
          value={pctFaster(pub.improvement.whisperStorageRatio)}
          detail="148 MB → 77 MB"
        />
      </View>

      <AppText variant="caption" color="secondary" style={{ marginTop: spacing.sm }}>
        Fixture accuracy {pub.fixtureQuality.optimized}/100 (phrases + extraction keys) · shipped in
        Voice-to-Care
      </AppText>
    </AppCard>
  );
}
