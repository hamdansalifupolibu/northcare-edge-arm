import { View } from 'react-native';

import { AppCard, AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { EdgeLabChrome } from '../components/EdgeLabChrome';
import { EdgeLabKvRow } from '../components/EdgeLabKvRow';
import { EdgeLabStatusBanner } from '../components/EdgeLabStatusBanner';
import { EDGE_EXPERIMENT_CATALOG } from '../experiments/experimentCatalog';

const PHASE_ROWS: readonly {
  id: string;
  label: string;
  state: 'done' | 'later';
}[] = [
  { id: 'p1', label: 'Freeze baseline config', state: 'done' },
  { id: 'p2', label: 'Instrument EDGE_LAB_EVIDENCE', state: 'done' },
  { id: 'p3', label: 'S20 Ultra baseline (53.96 s)', state: 'done' },
  { id: 'p4', label: 'Bottleneck = Whisper (~83%)', state: 'done' },
  { id: 'p5', label: 'One-variable experiments', state: 'done' },
  { id: 'p6', label: 'Measure + quality gate', state: 'done' },
  { id: 'p7', label: 'Accept EXP-06 tiny.en', state: 'done' },
  { id: 'p8', label: 'Promote to production', state: 'done' },
  { id: 'p9', label: 'Edge Lab judge UI', state: 'done' },
  { id: 'p10', label: 'Docs + evidence trail', state: 'done' },
  { id: 'p11', label: 'Public Arm repository', state: 'later' },
  { id: 'p12', label: 'Video + submit', state: 'later' },
];

export function EdgeLabTimelineScreen() {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <EdgeLabChrome title="Story" active="timeline" testID="edge-lab-timeline-screen">
      <EdgeLabStatusBanner
        tone="ready"
        title="Freeze → measure → reject → accept → promote"
        detail="Honest Arm optimization path on a real healthcare offline pipeline."
      />

      <View style={{ marginTop: spacing.md }}>
        <AppCard title="Phases" elevated>
          {PHASE_ROWS.map((row) => (
            <View
              key={row.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.xs,
                borderBottomWidth: 1,
                borderBottomColor: semantic.border.default,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    row.state === 'done' ? themeColors.successBackground : semantic.surface.muted,
                }}
              >
                <AppText variant="caption" color="primary">
                  {row.state === 'done' ? '✓' : '·'}
                </AppText>
              </View>
              <AppText
                variant="caption"
                color={row.state === 'done' ? 'primary' : 'secondary'}
                style={{ flex: 1 }}
              >
                {row.label}
              </AppText>
            </View>
          ))}
        </AppCard>
      </View>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
        <AppCard title="Experiment scoreboard">
          {EDGE_EXPERIMENT_CATALOG.filter((e) => e.status === 'measured').map((exp) => (
            <EdgeLabKvRow
              key={exp.id}
              label={exp.title}
              value={`${exp.result.verdict}${
                exp.result.latencyImprovementRatio == null
                  ? ''
                  : ` · ${(exp.result.latencyImprovementRatio * 100).toFixed(0)}%`
              }`}
            />
          ))}
        </AppCard>
      </View>
    </EdgeLabChrome>
  );
}
