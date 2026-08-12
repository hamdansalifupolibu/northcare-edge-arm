import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { edgeStageLabel, formatEdgeMs } from '../domain/formatters';
import type { EdgeBenchmarkRunSummary, EdgePipelineStageId } from '../domain/types';

const DISPLAY_STAGES: readonly EdgePipelineStageId[] = [
  'whisper_load',
  'whisper_inference',
  'qwen_load',
  'qwen_inference',
];

type EdgeLabStageBarsProps = {
  readonly summary: EdgeBenchmarkRunSummary | null;
};

export function EdgeLabStageBars({ summary }: EdgeLabStageBarsProps) {
  const { semantic, colors: themeColors } = useThemeMode();

  if (!summary) {
    return (
      <AppText variant="caption" color="secondary">
        Stage bars appear after the first measured run.
      </AppText>
    );
  }

  const rows = DISPLAY_STAGES.map((stage) => {
    const durationMs = summary.stages.find((s) => s.stage === stage)?.durationMs ?? null;
    return { stage, durationMs };
  });
  const max = Math.max(...rows.map((row) => row.durationMs ?? 0), 1);

  return (
    <View style={{ gap: spacing.sm }}>
      {rows.map((row) => {
        const ratio = row.durationMs != null ? Math.max(row.durationMs / max, 0.04) : 0;
        return (
          <View key={row.stage} style={{ gap: spacing.xxs }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: spacing.sm,
              }}
            >
              <AppText variant="caption" color="secondary">
                {edgeStageLabel(row.stage)}
              </AppText>
              <AppText variant="caption" color="secondary">
                {formatEdgeMs(row.durationMs)}
              </AppText>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: radii.pill,
                backgroundColor: semantic.surface.muted,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  height: '100%',
                  borderRadius: radii.pill,
                  backgroundColor:
                    row.durationMs == null ? semantic.border.default : themeColors.primary,
                }}
              />
            </View>
          </View>
        );
      })}
      <AppText variant="caption" color="secondary">
        Total {formatEdgeMs(summary.stages.find((s) => s.stage === 'total')?.durationMs)}
        {summary.whisperTranscribeBundlesDecode
          ? ' · decode bundled into transcribe'
          : ''}
      </AppText>
    </View>
  );
}
