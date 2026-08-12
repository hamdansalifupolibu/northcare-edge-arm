import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function HistoryHeaderClockIcon({ size = 28, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M12 8 V12 L15 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M18 6 C19.5 7.5 20.5 9.5 20.5 12"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HistoryShieldCheckIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19 12 22 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M8 11.5 L11 14.5 L16 9"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HistoryDocumentLockIcon({ size = 56, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" accessible={false}>
      <Rect x="10" y="8" width="28" height="36" rx="4" fill="#FFFFFF" stroke={color} strokeWidth={1.6} />
      <Path d="M16 16 H32 M16 22 H28 M16 28 H24" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Rect x="30" y="30" width="16" height="14" rx="3" fill={color} />
      <Path
        d="M34 30 V27 C34 24.8 35.8 23 38 23 C40.2 23 42 24.8 42 27 V30"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HistoryCalendarIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M4 10 H20" stroke={color} strokeWidth={1.6} />
      <Path d="M8 4 V8 M16 4 V8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function HistoryTimeIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M12 8 V12 L15 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function HistorySuccessCheckIcon({ size = 12, color = colors.success }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 12 L10 16 L18 8"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HistoryRegisterIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="10" cy="9" r="3.5" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M5 19 C5 15.5 7.5 13 10 13 C12.5 13 15 15.5 15 19" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M17 8 H21 M19 6 V10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function HistoryUpdateIcon({ size = 18, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 20 H8 L19.5 8.5 C20.3 7.7 20.3 6.3 19.5 5.5 L18.5 4.5 C17.7 3.7 16.3 3.7 15.5 4.5 L4 16 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M14 6 L18 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function HistoryArchiveIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="4" y="5" width="16" height="4" rx="1" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M6 9 V18 C6 19 7 20 8 20 H16 C17 20 18 19 18 18 V9" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M10 13 H14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
