import Svg, { Circle, Path } from 'react-native-svg';

import { semanticColors } from '../../../theme';

export type WorkspaceRoleIconProps = {
  readonly size?: number;
  readonly testID?: string;
};

export function WorkerRoleIcon({ size = 44, testID }: WorkspaceRoleIconProps) {
  const stroke = semanticColors.action.primary;
  const fill = semanticColors.surface.muted;

  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessibilityLabel="Frontline health worker"
      accessible
    >
      <Circle cx="24" cy="24" r="22" fill={fill} stroke={stroke} strokeWidth={1.5} />
      <Circle cx="24" cy="17" r="5" fill="none" stroke={stroke} strokeWidth={1.8} />
      <Path
        d="M14 36 C14 29 18 26 24 26 C30 26 34 29 34 36"
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M30 20 C34 20 36 22 36 26"
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="36" cy="26" r="2.5" fill={stroke} />
    </Svg>
  );
}

export function AdminRoleIcon({ size = 44, testID }: WorkspaceRoleIconProps) {
  const stroke = semanticColors.action.primary;
  const fill = semanticColors.surface.muted;

  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessibilityLabel="Administrator"
      accessible
    >
      <Path
        d="M24 6 L38 11 V22 C38 32 31 37 24 40 C17 37 10 32 10 22 V11 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx="19" cy="22" r="3" fill={stroke} />
      <Circle cx="29" cy="22" r="3" fill={stroke} />
      <Path
        d="M17 30 C19 33 22 34 24 34 C26 34 29 33 31 30"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LockNoticeIcon({ size = 18 }: { readonly size?: number }) {
  const stroke = semanticColors.text.secondary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M7 10 V8 C7 5.2 9.2 3 12 3 C14.8 3 17 5.2 17 8 V10"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M6 10 H18 C19.1 10 20 10.9 20 12 V19 C20 20.1 19.1 21 18 21 H6 C4.9 21 4 20.1 4 19 V12 C4 10.9 4.9 10 6 10 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SwitchWorkspaceIcon({ size = 18 }: { readonly size?: number }) {
  const stroke = semanticColors.action.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M7 7 H17 M14 4 L17 7 L14 10"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 17 H7 M10 14 L7 17 L10 20"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
