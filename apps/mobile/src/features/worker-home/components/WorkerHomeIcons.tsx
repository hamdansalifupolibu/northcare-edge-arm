import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, semanticColors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function MenuIcon({ size = 22, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M4 7 H20 M4 12 H20 M4 17 H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SunIcon({ size = 18, color = colors.accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="4" fill={color} />
      <Path
        d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.2 4.2 L6.3 6.3 M17.7 17.7 L19.8 19.8 M4.2 19.8 L6.3 17.7 M17.7 6.3 L19.8 4.2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoonIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M20 14.5 C18.8 15.8 16.9 16.5 15 16.5 C11.4 16.5 8.5 13.6 8.5 10 C8.5 8.1 9.2 6.2 10.5 5 C7.5 5.8 5.5 8.6 5.5 12 C5.5 16.1 8.9 19.5 13 19.5 C16.4 19.5 19.2 17.5 20 14.5 Z"
        fill={color}
      />
    </Svg>
  );
}

export function ClientsIcon({ size = 24, color = semanticColors.action.primary }: IconProps) {
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
        d="M16 8 C18 8 19.5 9.5 19.5 11.5 C19.5 13.5 18 15 16 15"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M14 20 C14.5 17 16 15.5 19 15.5"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function NutritionIcon({ size = 24, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 14 C6 10 8 7 12 6 C16 7 18 10 18 14 C18 18 15 20 12 20 C9 20 6 18 6 14 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path d="M12 6 V20" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function VoiceIcon({ size = 24, color = '#7C3AED' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="9" y="4" width="6" height="11" rx="3" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M6 11 C6 15 8.5 18 12 18 C15.5 18 18 15 18 11"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M12 18 V21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AssistantIcon({ size = 24, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 8 C6 5 8 3 12 3 C16 3 18 5 18 8 V14 C18 17 16 19 12 19 H8 L5 21 V19 C5 17 6 16 6 14 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 9 H15 M9 13 H13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ReferralIcon({ size = 24, color = '#7C3AED' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 12 L20 4 L16 20 L12 13 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CommunityIcon({ size = 24, color = semanticColors.action.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 8 C6 5.8 7.8 4 10 4 H14 C16.2 4 18 5.8 18 8 V18 H6 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 18 V20 H14 V18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AssessmentIcon({ size = 22, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M8 8 H16 M8 12 H16 M8 16 H13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function HomeIcon({ size = 22, color = semanticColors.action.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 11 L12 4 L20 11 V19 C20 20 19 21 18 21 H6 C5 21 4 20 4 19 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 21 V13 H15 V21" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function MoreIcon({ size = 22, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="6" cy="12" r="1.6" fill={color} />
      <Circle cx="12" cy="12" r="1.6" fill={color} />
      <Circle cx="18" cy="12" r="1.6" fill={color} />
    </Svg>
  );
}

export function HeartPulseIcon({ size = 28, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 20 C8 16 4 13 4 9 C4 6 6 4 9 4 C10.5 4 12 5 12 6.5 C12 5 13.5 4 15 4 C18 4 20 6 20 9 C20 13 16 16 12 20 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path d="M8 11 H10 L11 9 L13 14 L14 11 H16" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M9 6 L15 12 L9 18" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Wi‑Fi signal — shown when the device has network connectivity. */
export function WifiOnlineIcon({ size = 16, color = colors.success }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 20 L12 20.01 M8.5 16.5 C10.2 14.8 13.8 14.8 15.5 16.5 M5.5 13.5 C8.5 10.5 15.5 10.5 18.5 13.5 M2.5 10.5 C6.8 6.2 17.2 6.2 21.5 10.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="20" r="1.5" fill={color} />
    </Svg>
  );
}

/** Wi‑Fi off — shown when offline or no usable connection. */
export function WifiOfflineIcon({ size = 16, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8.5 16.5 C10.2 14.8 13.8 14.8 15.5 16.5 M5.5 13.5 C8.5 10.5 15.5 10.5 18.5 13.5 M2.5 10.5 C6.8 6.2 17.2 6.2 21.5 10.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      />
      <Path
        d="M4 4 L20 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** @deprecated Use WifiOnlineIcon */
export const OnlineSignalIcon = WifiOnlineIcon;

/** @deprecated Use WifiOfflineIcon */
export const AirplaneIcon = WifiOfflineIcon;
