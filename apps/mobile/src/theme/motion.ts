import type { MotionTokens } from './theme.types';

/**
 * Motion constants — React Native Animated only (no Lottie / new packages).
 *
 * Principles:
 * - Prefer reduced motion when the OS requests it
 * - No unnecessary delays or fake loading animations
 * - Motion must communicate state, not decorate
 * - Critical information must never depend only on animation
 * - See docs/design/STAGE_17_MOTION_POLICY.md
 */
export const motion = {
  duration: {
    instant: 0,
    fast: 120,
    standard: 200,
    emphasised: 280,
    slow: 400,
  },
  easing: {
    standard: 'ease-in-out',
    emphasised: 'ease-out',
    decelerate: 'ease-out',
  },
  distance: {
    entrance: 8,
  },
  scale: {
    press: 0.98,
    entrance: 0.98,
  },
} as const satisfies MotionTokens;
