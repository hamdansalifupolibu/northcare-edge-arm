/**
 * Visual-only risk category labels.
 * Calculation belongs to the Stage 9 risk engine — not this module.
 */
export type RiskLevel = 'red' | 'amber' | 'green' | 'undetermined';

export const RISK_COPY = {
  red: {
    title: 'RED PRIORITY',
    subtitle: 'Urgent assessment required',
    accessibilityLabel: 'Red priority: urgent assessment required',
  },
  amber: {
    title: 'AMBER PRIORITY',
    subtitle: 'Close follow-up required',
    accessibilityLabel: 'Amber priority: close follow-up required',
  },
  green: {
    title: 'GREEN PRIORITY',
    subtitle: 'Routine monitoring',
    accessibilityLabel: 'Green priority: routine monitoring',
  },
  undetermined: {
    title: 'PRIORITY UNDETERMINED',
    subtitle: 'More information or review is required',
    accessibilityLabel: 'Priority undetermined: more information or review is required',
  },
} as const satisfies Record<
  RiskLevel,
  { readonly title: string; readonly subtitle: string; readonly accessibilityLabel: string }
>;
