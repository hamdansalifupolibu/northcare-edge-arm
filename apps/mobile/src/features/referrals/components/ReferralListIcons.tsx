import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function ReferralPrepareIcon({
  size = 22,
  color = colors.textInverse,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 12 L20 4 L14 20 L12 13 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReferralVerifyScanIcon({
  size = 22,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 8 V6 C4 4.9 4.9 4 6 4 H8 M16 4 H18 C19.1 4 20 4.9 20 6 V8 M20 16 V18 C20 19.1 19.1 20 18 20 H16 M8 20 H6 C4.9 20 4 19.1 4 18 V16"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Rect x={7} y={7} width={10} height={10} rx={1.5} fill="none" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function ReferralShieldCheckIcon({
  size = 22,
  color = colors.primary,
}: IconProps) {
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
        d="M8 12 L10.5 14.5 L16 9"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReferralPencilIcon({
  size = 20,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 20 H20 M14.5 5.5 L18.5 9.5 L8 20 H4 V16 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReferralChevronRightIcon({
  size = 18,
  color = colors.primary,
}: IconProps) {
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

export function ReferralOnDeviceIcon({
  size = 14,
  color = colors.primaryDark,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect
        x={7}
        y={3}
        width={10}
        height={18}
        rx={2}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
      />
      <Circle cx={12} cy={17.5} r={1} fill={color} />
    </Svg>
  );
}

export function ReferralEmptyIllustration() {
  return (
    <Svg width={120} height={96} viewBox="0 0 120 96" accessible={false}>
      <Circle cx={24} cy={18} r={8} fill="#D1FAE5" opacity={0.8} />
      <Circle cx={96} cy={22} r={10} fill="#E6F7F5" />
      <Path
        d="M28 58 C28 52 32 48 38 48 H72 C78 48 82 52 82 58 V68 C82 74 78 78 72 78 H38 C32 78 28 74 28 68 Z"
        fill="#B8EBE3"
      />
      <Path
        d="M38 48 V44 C38 40 42 36 48 36 H62 C68 36 72 40 72 44 V48"
        fill="none"
        stroke="#0F766E"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M58 62 C58 58 62 54 66 58 C70 62 66 70 58 74 C50 70 46 62 50 58 C54 54 58 58 58 62 Z"
        fill="#0F766E"
        opacity={0.35}
      />
      <Circle cx={88} cy={64} r={4} fill="#99F6E4" />
      <Circle cx={14} cy={72} r={5} fill="#CCFBF1" />
    </Svg>
  );
}

export function ReferralBackIcon({
  size = 22,
  color = colors.primaryDark,
}: IconProps) {
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

export function ReferralLinkIcon({
  size = 20,
  color = colors.textSecondary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M10 13 C10.5 13.5 11.2 14 12 14 C13.5 14 14.8 12.7 14.8 11.2 C14.8 9.7 13.5 8.4 12 8.4 C10.8 8.4 9.8 9.1 9.4 10.2 M13.6 13.8 L16.2 16.4 C17.4 17.6 19.3 17.6 20.5 16.4 C21.7 15.2 21.7 13.3 20.5 12.1 L17.9 9.5 M10.4 10.2 L7.8 7.6 C6.6 6.4 4.7 6.4 3.5 7.6 C2.3 8.8 2.3 10.7 3.5 11.9 L6.1 14.5"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ReferralClipboardIcon({
  size = 20,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x={8} y={4} width={10} height={14} rx={1.5} fill="none" stroke={color} strokeWidth={1.6} />
      <Path
        d="M6 8 H5 C3.9 8 3 8.9 3 10 V18 C3 19.1 3.9 20 5 20 H13 C14.1 20 15 19.1 15 18 V17"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ReferralInfoIcon({
  size = 16,
  color = colors.textSecondary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M12 10 V16 M12 7 V7.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ReferralLockIcon({
  size = 14,
  color = colors.textSecondary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8 10 V8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 V10"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Rect x={7} y={10} width={10} height={9} rx={1.5} fill="none" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function ReferralChevronDownIcon({
  size = 18,
  color = colors.primaryDark,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 9 L12 15 L18 9"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReferralDocumentSearchIcon({
  size = 22,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8 4 H14 L18 8 V18 C18 19.1 17.1 20 16 20 H8 C6.9 20 6 19.1 6 18 V6 C6 4.9 6.9 4 8 4 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={15.5} cy={15.5} r={2.5} fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M17.5 17.5 L19.5 19.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ReferralQrShieldIcon({
  size = 40,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Circle cx={24} cy={24} r={22} fill="#E6F7F5" />
      <Path
        d="M24 10 L34 14 V22 C34 28 30 32 24 36 C18 32 14 28 14 22 V14 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Rect x={20} y={19} width={8} height={8} rx={1} fill="none" stroke={color} strokeWidth={1.4} />
      <Path
        d="M16 16 H18 V18 H16 Z M30 16 H32 V18 H30 Z M16 28 H18 V30 H16 Z M30 28 H32 V30 H30 Z"
        fill={color}
      />
    </Svg>
  );
}

export function ReferralHospitalIcon({
  size = 22,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 20 V8 L12 4 L20 8 V20 H4 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M12 9 V15 M9 12 H15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ReferralChpsIcon({
  size = 22,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M3 12 L12 5 L21 12 V19 C21 19.6 20.6 20 20 20 H4 C3.4 20 3 19.6 3 19 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9 20 V14 H15 V20" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function ReferralCheckCircleIcon({
  size = 48,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Circle cx={24} cy={24} r={22} fill="#E6F7F5" />
      <Circle cx={24} cy={24} r={18} fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M15 24 L21 30 L33 18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
