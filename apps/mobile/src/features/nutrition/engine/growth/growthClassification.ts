export type GrowthSeverity = 'adequate' | 'moderate' | 'severe';

/** WHO cutpoints: z < −2 moderate, z < −3 severe (undernutrition). */
export function classifyGrowthZScore(zScore: number): GrowthSeverity {
  if (!Number.isFinite(zScore)) {
    return 'adequate';
  }
  if (zScore < -3) {
    return 'severe';
  }
  if (zScore < -2) {
    return 'moderate';
  }
  return 'adequate';
}

export type GrowthIndicatorId = 'wfa' | 'lhfa' | 'wflh' | 'bmi';

const CODE_BY_INDICATOR: Record<
  GrowthIndicatorId,
  Record<GrowthSeverity, string | null>
> = {
  wfa: {
    adequate: null,
    moderate: 'developmentGrowthUnderweightModerate',
    severe: 'developmentGrowthUnderweightSevere',
  },
  lhfa: {
    adequate: null,
    moderate: 'developmentGrowthStuntedModerate',
    severe: 'developmentGrowthStuntedSevere',
  },
  wflh: {
    adequate: null,
    moderate: 'developmentGrowthWastingModerate',
    severe: 'developmentGrowthWastingSevere',
  },
  bmi: {
    adequate: null,
    moderate: 'developmentGrowthLowBmiModerate',
    severe: 'developmentGrowthLowBmiSevere',
  },
};

export function growthClassificationCode(
  indicatorId: GrowthIndicatorId,
  severity: GrowthSeverity,
): string | null {
  return CODE_BY_INDICATOR[indicatorId][severity];
}
