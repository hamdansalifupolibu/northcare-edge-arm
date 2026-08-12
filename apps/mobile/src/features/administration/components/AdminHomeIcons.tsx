import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, semanticColors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function AccountsIcon({ size = 24, color = semanticColors.action.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="9" cy="8" r="3" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M3 20 C3 16 5.5 14 9 14 C12.5 14 15 16 15 20"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M17 10 H21 M19 8 V12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SyncedRecordsIcon({ size = 24, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 7 H20 M4 12 H20 M4 17 H14"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 15 L18.5 17.5 L22 13"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ActivityIcon({ size = 24, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M3 12 H7 L9.5 6 L13.5 18 L16 12 H21"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SettingsGearIcon({ size = 24, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 3 V5.5 M12 18.5 V21 M3 12 H5.5 M18.5 12 H21 M5.6 5.6 L7.4 7.4 M16.6 16.6 L18.4 18.4 M5.6 18.4 L7.4 16.6 M16.6 7.4 L18.4 5.6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PendingIcon({ size = 20, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8.5" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M12 8 V12.5 L15 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function InactiveIcon({ size = 20, color = colors.danger }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8.5" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M9 9 L15 15 M15 9 L9 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function WorkersStatIcon({ size = 20, color = semanticColors.action.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="4" y="10" width="16" height="9" rx="2" fill="none" stroke={color} strokeWidth={1.7} />
      <Circle cx="12" cy="7" r="3" fill="none" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}
