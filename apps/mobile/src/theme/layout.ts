import { spacing } from './spacing';
import type { LayoutTokens } from './theme.types';

/**
 * Semantic layout values verified against Stitch patterns
 * (16px gutters, ~20px card padding, 48dp touch targets).
 */
export const layout = {
  screenHorizontalPadding: spacing.base,
  screenTopSpacing: spacing.base,
  screenBottomSpacing: spacing.lg,
  sectionSpacing: spacing.lg,
  cardPadding: 20,
  formFieldSpacing: spacing.md,
  compactRowGap: spacing.sm,
  bottomNavigationClearance: 72,
  minTouchTarget: spacing['3xl'],
  contentMaxWidth: 480,
  headerHeight: 56,
  iconSizeSm: 16,
  iconSizeMd: 24,
  iconSizeLg: 32,
} as const satisfies LayoutTokens;
