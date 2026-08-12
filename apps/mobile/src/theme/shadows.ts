import { colors } from './colors';
import type { ShadowTokens } from './theme.types';

/**
 * Android-appropriate elevation. Prefer tonal surfaces over heavy drop shadows
 * (Stitch elevation strategy). Values kept intentionally light.
 */
export const shadows = {
  none: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
} as const satisfies ShadowTokens;
