import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../../theme';

type IconProps = {
  readonly size?: number;
  readonly color?: string;
};

export function PregnantCategoryIcon({ size = 32, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="7" r="2.5" fill={color} />
      <Path
        d="M8 12 C8 10 9.5 9 12 9 C14.5 9 16 10 16 12 C16 14 15 15 12 16 C9 15 8 14 8 12 Z"
        fill={color}
        opacity={0.85}
      />
      <Circle cx="12" cy="14" r="3.5" fill="none" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function PostnatalCategoryIcon({ size = 32, color = colors.warning }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="9" cy="8" r="2" fill={color} />
      <Path d="M6 14 C6 12 7 11 9 11 C11 11 12 12 12 14" fill={color} opacity={0.8} />
      <Circle cx="15" cy="11" r="1.8" fill={color} />
      <Path d="M13.5 15 C13.5 14 14.2 13.5 15 13.5 C15.8 13.5 16.5 14 16.5 15" fill={color} />
    </Svg>
  );
}

export function NewbornCategoryIcon({ size = 32, color = '#7C3AED' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="10" r="4" fill="none" stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 16 C8 14 10 13 12 13 C14 13 16 14 16 16"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M10 9 H14 M12 7 V11" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

export function ChildUnderFiveCategoryIcon({ size = 32, color = '#1570EF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="7.5" r="2.8" fill={color} />
      <Path
        d="M7 18 C7 14.5 9 13 12 13 C15 13 17 14.5 17 18"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
