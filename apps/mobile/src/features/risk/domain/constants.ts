/** Persisted with every assessment. Bump when evaluation semantics change. */
export const RISK_ENGINE_VERSION = 1 as const;

export const RISK_AGGREGATION_STRATEGIES = ['highestApprovedPriorityWins'] as const;
export type RiskAggregationStrategyId = (typeof RISK_AGGREGATION_STRATEGIES)[number];

export const RISK_AGGREGATION_STRATEGY_VERSION = 1 as const;
