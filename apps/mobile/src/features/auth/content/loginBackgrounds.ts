import type { ImageSourcePropType, ImageStyle } from 'react-native';

import type { AuthRole } from '../domain/types';

export type LoginBackgroundLayout = {
  readonly source: ImageSourcePropType;
  /** Slightly taller than the screen; image is anchored to the top edge. */
  readonly imageHeightPercent: number;
  /** Upward nudge (≤ 0) to bring faces into the hero without a top gap. */
  readonly focalOffsetY: number;
};

export const loginBackgroundLayout: Record<AuthRole, LoginBackgroundLayout> = {
  worker: {
    source: require('../../../../assets/images/auth/worker-login-background.webp'),
    imageHeightPercent: 122,
    focalOffsetY: -28,
  },
  administrator: {
    source: require('../../../../assets/images/auth/admin-login-background.webp'),
    imageHeightPercent: 120,
    focalOffsetY: -20,
  },
};

export function resolveLoginBackgroundImageStyle(
  role: AuthRole,
  windowHeight: number,
  windowWidth: number,
): ImageStyle {
  const config = loginBackgroundLayout[role];
  return {
    top: 0,
    left: 0,
    width: windowWidth,
    height: windowHeight * (config.imageHeightPercent / 100),
    transform: [{ translateY: config.focalOffsetY }],
  };
}

/** @deprecated Use loginBackgroundLayout[role].source */
export const loginBackgrounds: Record<AuthRole, ImageSourcePropType> = {
  worker: loginBackgroundLayout.worker.source,
  administrator: loginBackgroundLayout.administrator.source,
};
