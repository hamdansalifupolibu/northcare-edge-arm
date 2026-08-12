import type { RadiusTokens } from './theme.types';

/**
 * Border radii from Stitch (sm 8 / md 12 / lg 16 / pill 999)
 * plus semantic aliases for cards, inputs, buttons, and modals.
 */
export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
  card: 16,
  input: 12,
  button: 12,
  modal: 20,
  image: 16,
} as const satisfies RadiusTokens;
