import type { RiskPriority } from '../../../data/domain/enums/domainEnums';

export type PriorityDisplay = {
  readonly label: string;
  readonly summary: string;
  readonly accessibilityLabel: string;
};

/**
 * Central mapping between internal priorities and worker-facing copy.
 * Clinical explanation fragments live in rule packs — not here.
 */
export const PRIORITY_DISPLAY: Record<RiskPriority, PriorityDisplay> = {
  red: {
    label: 'RED PRIORITY',
    summary: 'Urgent assessment required',
    accessibilityLabel: 'Red priority: urgent assessment required',
  },
  amber: {
    label: 'AMBER PRIORITY',
    summary: 'Close follow-up required',
    accessibilityLabel: 'Amber priority: close follow-up required',
  },
  green: {
    label: 'GREEN PRIORITY',
    summary: 'Routine monitoring',
    accessibilityLabel: 'Green priority: routine monitoring',
  },
  undetermined: {
    label: 'PRIORITY UNDETERMINED',
    summary: 'More information or review is required',
    accessibilityLabel: 'Priority undetermined: more information or review is required',
  },
};

/** Technical precedence used by highestApprovedPriorityWins (pack-declared). */
export const PRIORITY_RANK: Record<RiskPriority, number> = {
  red: 3,
  amber: 2,
  green: 1,
  undetermined: 0,
};

export function comparePriority(a: RiskPriority, b: RiskPriority): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b];
}
