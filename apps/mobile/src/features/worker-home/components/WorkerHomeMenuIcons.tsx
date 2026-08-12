import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function MenuWorkerAvatarIcon({ size = 28, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="8" r="3.5" fill={color} />
      <Path
        d="M6 20 C6 16 8.5 14 12 14 C15.5 14 18 16 18 20"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MenuWorkspaceIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="4" y="8" width="16" height="12" rx="1.5" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M8 8 V6 C8 4.3 9.3 3 11 3 H13 C14.7 3 16 4.3 16 6 V8" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M4 12 H20" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function MenuSyncIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M20 12 C20 16.4 16.4 20 12 20 C8.5 20 5.6 17.8 4.5 14.5"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M4 12 L4.5 10 M4.5 14.5 L4 12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path
        d="M4 12 C4 7.6 7.6 4 12 4 C15.5 4 18.4 6.2 19.5 9.5"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M20 12 L19.5 10 M19.5 14.5 L20 12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function MenuBellIcon({ size = 22, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 21 C13.1 21 14 20.2 14 19 H10 C10 20.2 10.9 21 12 21 Z"
        fill={color}
      />
      <Path
        d="M18 16 V10 C18 7.2 15.9 5 13 5 C10.1 5 8 7.2 8 10 V16 L6 18 H18 L16 16 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MenuSettingsIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth={1.6} />
      <Path
        d="M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.6 5.6 L7 7 M17 17 L18.4 18.4 M5.6 18.4 L7 17 M17 7 L18.4 5.6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MenuLockIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8 10 V8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 V10"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Rect x="7" y="10" width="10" height="10" rx="1.5" fill="none" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function MenuSignOutIcon({ size = 22, color = colors.danger }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M10 4 H6 C4.9 4 4 4.9 4 6 V18 C4 19.1 4.9 20 6 20 H10" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M14 12 H8 M18 8 L21 12 L18 16" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
