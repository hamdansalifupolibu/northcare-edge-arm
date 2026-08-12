import type { SpacingScale } from './theme.types';

/**
 * Spacing scale derived from Stitch tokens (xs/sm/md/base/lg/xl)
 * and extended for practical Android layout gaps (0, 2, 20, 40, 48, 64).
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
} as const satisfies SpacingScale;
