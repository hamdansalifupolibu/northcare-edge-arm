import type { OpacityTokens } from './theme.types';

export const opacity = {
  disabled: 0.48,
  pressed: 0.88,
  overlay: 0.4,
  subtle: 0.64,
} as const satisfies OpacityTokens;
