import { View } from 'react-native';

import {
  borders,
  layout,
  radii,
  spacing,
  type SemanticColors,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';
import { RiskIcon } from './RiskIcon';
import { RISK_COPY, type RiskLevel } from './riskLabels';

export type RiskSummaryCardProps = {
  readonly level: RiskLevel;
  /** Optional synthetic helper line — never clinical advice */
  readonly detail?: string;
  readonly testID?: string;
};

function barColor(level: RiskLevel, semantic: SemanticColors): string {
  switch (level) {
    case 'red':
      return semantic.status.urgent;
    case 'amber':
      return semantic.status.warning;
    case 'green':
      return semantic.status.stable;
    default:
      return semantic.status.info;
  }
}

const TEXT: Record<RiskLevel, 'urgent' | 'warning' | 'stable' | 'info'> = {
  red: 'urgent',
  amber: 'warning',
  green: 'stable',
  undetermined: 'info',
};

/**
 * Visual risk summary card (Stitch risk-result pattern).
 * Presentation only — no medical rules or danger-sign data.
 */
export function RiskSummaryCard({
  level,
  detail,
  testID,
}: RiskSummaryCardProps) {
  const { semantic } = useThemeMode();
  const copy = RISK_COPY[level];
  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      accessibilityLabel={copy.accessibilityLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: semantic.surface.primary,
        borderRadius: radii.card,
        borderWidth: borders.widthThin,
        borderColor: semantic.border.default,
        overflow: 'hidden',
        minHeight: layout.minTouchTarget,
      }}
    >
      <View style={{ width: 6, backgroundColor: barColor(level, semantic) }} />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.base,
          padding: layout.cardPadding,
        }}
      >
        <RiskIcon level={level} />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText variant="riskLabel" color={TEXT[level]}>
            {copy.title}
          </AppText>
          <AppText variant="body" color="secondary">
            {copy.subtitle}
          </AppText>
          {detail ? (
            <AppText variant="caption" color="secondary">
              {detail}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}
