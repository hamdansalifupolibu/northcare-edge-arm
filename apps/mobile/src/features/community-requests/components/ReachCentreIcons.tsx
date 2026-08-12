import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function ReachSignalIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 20 C12 20 6 14 6 9 C6 6.2 8.2 4 11 4 C13.8 4 16 6.2 16 9 C16 14 12 20 12 20 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={9} r={2.2} fill={color} />
    </Svg>
  );
}

export function ReachUssdIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x={7} y={3} width={10} height={18} rx={2} fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M10 18 H14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path
        d="M9 7 H15 M9 10 H15 M9 13 H13"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ReachChevronRightIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M9 6 L15 12 L9 18"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReachRefreshIcon({ size = 20, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M20 12 C20 16.4 16.4 20 12 20 C8.2 20 5 17.2 4.2 13.6 M4 12 C4 7.6 7.6 4 12 4 C15.8 4 19 6.8 19.8 10.4"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M4 8 V4 H8 M20 16 V20 H16"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReachBackIcon({ size = 22, color = colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M15 6 L9 12 L15 18"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReachEmptyIllustration({ width = 160, height = 120 }: { readonly width?: number; readonly height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 120" accessible={false}>
      <Path
        d="M0 92 H160"
        stroke={colors.primaryDark}
        strokeWidth={1.2}
        strokeOpacity={0.35}
      />
      <Path
        d="M20 92 L35 72 L52 82 L78 58 L98 68 L118 48 L140 92 Z"
        fill={colors.mutedSurface}
        stroke={colors.primary}
        strokeWidth={1.2}
        strokeOpacity={0.5}
      />
      <Circle cx={80} cy={36} r={18} fill="none" stroke={colors.primary} strokeWidth={1.2} strokeOpacity={0.25} />
      <Circle cx={80} cy={36} r={28} fill="none" stroke={colors.primary} strokeWidth={1} strokeOpacity={0.15} />
      <Circle cx={80} cy={36} r={38} fill="none" stroke={colors.primary} strokeWidth={0.8} strokeOpacity={0.1} />
      <Circle cx={80} cy={36} r={4} fill={colors.primary} fillOpacity={0.6} />
    </Svg>
  );
}
