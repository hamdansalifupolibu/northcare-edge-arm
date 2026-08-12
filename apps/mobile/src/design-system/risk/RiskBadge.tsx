import { View } from 'react-native';

import { radii, semanticColors, spacing } from '../../theme';
import { AppText } from '../text/AppText';
import { RiskIcon } from './RiskIcon';
import { RISK_COPY, type RiskLevel } from './riskLabels';

export type RiskBadgeProps = {
  readonly level: RiskLevel;
  readonly testID?: string;
};

const BG: Record<RiskLevel, string> = {
  red: semanticColors.status.urgentBackground,
  amber: semanticColors.status.warningBackground,
  green: semanticColors.status.stableBackground,
  undetermined: semanticColors.status.infoBackground,
};

const TEXT: Record<RiskLevel, 'urgent' | 'warning' | 'stable' | 'info'> = {
  red: 'urgent',
  amber: 'warning',
  green: 'stable',
  undetermined: 'info',
};

/** Visual-only risk badge. Does not calculate risk. */
export function RiskBadge({ level, testID }: RiskBadgeProps) {
  const copy = RISK_COPY[level];
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={copy.accessibilityLabel}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        backgroundColor: BG[level],
      }}
    >
      <RiskIcon level={level} size={20} />
      <AppText variant="riskLabel" color={TEXT[level]}>
        {copy.title}
      </AppText>
    </View>
  );
}
