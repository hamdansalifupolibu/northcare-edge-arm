import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function ProfileBackIcon({ size = 22, color = colors.primaryDark }: IconProps) {
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

export function ProfileOfflineIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M2.5 8.5 C5.5 5.5 9.5 4 12 4 C14.5 4 18.5 5.5 21.5 8.5"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M3 3 L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileEditIcon({ size = 18, color = colors.primary }: IconProps) {
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

export function ProfileIdIcon({ size = 14, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke={color} strokeWidth={1.6} />
      <Circle cx="10" cy="11" r="2" fill="none" stroke={color} strokeWidth={1.4} />
      <Path d="M6 16 C7.5 14 12 14 14 16" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileAgeIcon({ size = 14, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M6 20 C6 16 8.5 14 12 14 C15.5 14 18 16 18 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileConsentIcon({ size = 14, color = colors.success }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19 12 22 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M8 11 L11 14 L16 9" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileLocationIcon({ size = 16, color = colors.textSecondary }: IconProps) {
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

export function ProfileFacilityIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 20 V8 L12 4 L20 8 V20 H4 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9 20 V13 H15 V20" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileStethoscopeIcon({ size = 20, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 4 C6 2.9 6.9 2 8 2 C9.1 2 10 2.9 10 4 V10 C10 12.2 8.2 14 6 14"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M14 4 C14 2.9 14.9 2 16 2 C17.1 2 18 2.9 18 4 V10 C18 13.3 15.3 16 12 16 C10.3 16 8.7 15.2 7.6 14"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="18" cy="18" r="3" fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function ProfileChevronIcon({ size = 18, color = colors.textInverse }: IconProps) {
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

export function ProfileClipboardIcon({ size = 22, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M9 4 H15 C16.1 4 17 4.9 17 6 V20 C17 21.1 16.1 22 15 22 H9 C7.9 22 7 21.1 7 20 V6 C7 4.9 7.9 4 9 4 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 2 H14 V5 H10 Z" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M10 11 H14 M10 15 H14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileMicIcon({ size = 22, color = '#7C3AED' }: IconProps) {
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

export function ProfileReferralIcon({ size = 22, color = '#7C3AED' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M10 8 L16 12 L10 16 Z" fill={color} />
    </Svg>
  );
}

export function ProfileReminderIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 8 V6 C6 3.8 7.8 2 10 2 H14 C16.2 2 18 3.8 18 6 V8"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M5 8 H19 V18 C19 19.1 18.1 20 17 20 H7 C5.9 20 5 19.1 5 18 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 20 V22 H14 V20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileClockIcon({ size = 14, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M12 8 V12 L15 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileEmptyCareIcon({ size = 40, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M7 4 H17 C18.1 4 19 4.9 19 6 V18 C19 19.1 18.1 20 17 20 H7 C5.9 20 5 19.1 5 18 V6 C5 4.9 5.9 4 7 4 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M12 10 C12 10 10.5 8.5 10.5 10.5 C10.5 12.5 12 14 12 14 C12 14 13.5 12.5 13.5 10.5 C13.5 8.5 12 10 12 10 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileShieldLockIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19 12 22 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 11 V9.5 C9 8.1 10.3 7 12 7 C13.7 7 15 8.1 15 9.5 V11"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Rect x="8.5" y="11" width="7" height="6" rx="1" fill="none" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function ProfileLockIcon({ size = 16, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M8 11 V8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 V11" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileDetailIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M12 10 V16 M12 8 V8.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfilePhoneIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8 3 H16 C17.1 3 18 3.9 18 5 V19 C18 20.1 17.1 21 16 21 H8 C6.9 21 6 20.1 6 19 V5 C6 3.9 6.9 3 8 3 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M11 18 H13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileRegionIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 6 H20 V18 H4 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M4 10 H20 M8 6 V18 M16 6 V18" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function ProfileCaregiverIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="9" cy="8" r="3" fill="none" stroke={color} strokeWidth={1.6} />
      <Path
        d="M3 20 C3 16.5 5.5 14.5 9 14.5 C12.5 14.5 15 16.5 15 20"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M17 10 V16 M14 13 H20" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
