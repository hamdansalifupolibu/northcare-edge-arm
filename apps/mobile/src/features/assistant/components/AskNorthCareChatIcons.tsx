import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function AskMenuIcon({ size = 22, color = colors.primaryDark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M4 7 H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 12 H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 17 H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function AskPlusIcon({ size = 18, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M12 5 V19 M5 12 H19" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function AskSendIcon({ size = 18, color = colors.textInverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 12 L20 4 L14 20 L11 13 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AskInfoIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M12 10 V16 M12 7 V8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AskBookIcon({ size = 14, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M5 4 C5 4 8 4 12 6 C16 4 19 4 19 4 V18 C19 18 16 18 12 20 C8 18 5 18 5 18 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AskChevronRightIcon({ size = 14, color = colors.primary }: IconProps) {
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

export function AskSettingsIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth={1.6} />
      <Path
        d="M12 2 V5 M12 19 V22 M4.2 4.2 L6.3 6.3 M17.7 17.7 L19.8 19.8 M2 12 H5 M19 12 H22 M4.2 19.8 L6.3 17.7 M17.7 6.3 L19.8 4.2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AskLockFooterIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M8 11 V8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 V11" fill="none" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function AskTopicPregnancyIcon({ size = 20, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="8" r="3" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M8 20 C8 15 10 13 12 13 C14 13 16 15 16 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="12" cy="11" r="2" fill={color} opacity={0.25} />
    </Svg>
  );
}

export function AskTopicChildIcon({ size = 20, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="10" r="4" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M7 20 C7 16 9.2 14 12 14 C14.8 14 17 16 17 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function AskTopicReferralIcon({ size = 20, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M8 9 H16 M8 13 H13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M15 15 L18 18 L15 21" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AskTopicNutritionIcon({ size = 20, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M12 3 C12 3 16 8 16 12 C16 15 14.2 17 12 17 C9.8 17 8 15 8 12 C8 8 12 3 12 3 Z" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12 17 V21" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function AskTopicGeneralIcon({ size = 20, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M12 8 V12 L15 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function AskMoreVerticalIcon({ size = 16, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="6" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

export function AskTrashIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 7 H18 M9 7 V5 C9 4.4 9.4 4 10 4 H14 C14.6 4 15 4.4 15 5 V7 M8 7 V19 C8 19.6 8.4 20 9 20 H15 C15.6 20 16 19.6 16 19 V7"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 10 V17 M14 10 V17" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
