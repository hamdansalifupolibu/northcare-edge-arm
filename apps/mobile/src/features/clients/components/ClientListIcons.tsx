import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function ClientListBackIcon({ size = 22, color = colors.primaryDark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M15 6 L9 12 L15 18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClientListSearchIcon({ size = 20, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="11" cy="11" r="6.5" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M16 16 L20 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ClientListUserPlusIcon({ size = 20, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="9" cy="8" r="3.2" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M3.5 19 C3.5 15.5 5.8 13.5 9 13.5 C12.2 13.5 14.5 15.5 14.5 19"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M18 8 V14 M15 11 H21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ClientListCalendarIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 5 V7 M18 5 V7 M5 9 H19 M6 7 H18 C19.1 7 20 7.9 20 9 V18 C20 19.1 19.1 20 18 20 H6 C4.9 20 4 19.1 4 18 V9 C4 7.9 4.9 7 6 7 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClientListLocationIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 21 C12 21 19 14.5 19 10 C19 6.1 15.9 3 12 3 C8.1 3 5 6.1 5 10 C5 14.5 12 21 12 21 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="2.2" fill="none" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function ClientListChevronIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M9 6 L15 12 L9 18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClientListOfflineIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M2.5 8.5 C5.5 5.5 9.5 4 12 4 C14.5 4 18.5 5.5 21.5 8.5"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M5.5 12 C7.5 10 9.5 9 12 9 C14.5 9 16.5 10 18.5 12"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M8.5 15.5 C9.5 14.5 10.5 14 12 14 C13.5 14 14.5 14.5 15.5 15.5" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M12 18 V20" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M3 3 L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
