import Svg, { Circle, G, Path } from 'react-native-svg';

import { colors, layout, semanticColors } from '../../theme';
import { RISK_COPY, type RiskLevel } from './riskLabels';

export type RiskIconProps = {
  readonly level: RiskLevel;
  readonly size?: number;
  readonly testID?: string;
};

/**
 * Typed SVG recreation of approved risk icons under assets/icons/risk/.
 * Undetermined uses a non-colour-only question mark treatment.
 */
export function RiskIcon({
  level,
  size = layout.iconSizeLg,
  testID,
}: RiskIconProps) {
  const label = RISK_COPY[level].accessibilityLabel;

  if (level === 'red') {
    return (
      <Svg
        testID={testID}
        width={size}
        height={size}
        viewBox="0 0 96 96"
        accessibilityLabel={label}
        accessible
      >
        <Circle cx="48" cy="48" r="44" fill={semanticColors.status.urgentBackground} />
        <G
          fill="none"
          stroke={semanticColors.status.urgent}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M48 20 L76 70 H20 Z" />
          <Path d="M48 38 V53" />
          <Path d="M48 64 H48.1" />
        </G>
      </Svg>
    );
  }

  if (level === 'amber') {
    return (
      <Svg
        testID={testID}
        width={size}
        height={size}
        viewBox="0 0 96 96"
        accessibilityLabel={label}
        accessible
      >
        <Circle cx="48" cy="48" r="44" fill={semanticColors.status.warningBackground} />
        <G
          fill="none"
          stroke={semanticColors.status.warning}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Circle cx="48" cy="48" r="27" />
          <Path d="M48 32 V49 L60 57" />
          <Path d="M48 16 V20" />
          <Path d="M48 76 V80" />
        </G>
      </Svg>
    );
  }

  if (level === 'undetermined') {
    return (
      <Svg
        testID={testID}
        width={size}
        height={size}
        viewBox="0 0 96 96"
        accessibilityLabel={label}
        accessible
      >
        <Circle cx="48" cy="48" r="44" fill={semanticColors.status.infoBackground} />
        <G
          fill="none"
          stroke={colors.info}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Circle cx="48" cy="48" r="28" />
          <Path d="M38 38 C38 30 58 30 58 40 C58 48 48 48 48 56" />
          <Path d="M48 68 H48.1" />
        </G>
      </Svg>
    );
  }

  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 96 96"
      accessibilityLabel={label}
      accessible
    >
      <Circle cx="48" cy="48" r="44" fill={semanticColors.status.stableBackground} />
      <G
        fill="none"
        stroke={semanticColors.status.stable}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Circle cx="48" cy="48" r="28" />
        <Path d="M33 49 L44 60 L65 36" />
      </G>
    </Svg>
  );
}
