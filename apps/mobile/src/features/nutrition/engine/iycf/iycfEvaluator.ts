import type { RecordedScreeningAnswer } from '../../../screening/content/types';
import type { NutritionAgeContext } from '../templateResolver';

export const IYCF_ENGINE_VERSION = 1 as const;

export const MDD_FOOD_GROUP_IDS = [
  'grains_roots_tubers',
  'legumes_nuts',
  'dairy',
  'flesh_foods',
  'eggs',
  'vitamin_a_fruits_vegetables',
  'other_fruits_vegetables',
  'breastmilk',
] as const;

export type MddFoodGroupId = (typeof MDD_FOOD_GROUP_IDS)[number];

export type NutritionIycfAgeBand = 'under6' | '6to23' | '24to59';

export type NutritionIycfEvaluationResult = {
  readonly status: 'calculated' | 'notApplicable' | 'insufficientInformation';
  readonly engineVersion: number;
  readonly ageMonths: number | null;
  readonly ageBand: NutritionIycfAgeBand | null;
  readonly mdd: {
    readonly score: number;
    readonly required: number;
    readonly met: boolean;
    readonly selectedGroups: readonly MddFoodGroupId[];
  } | null;
  readonly mmf: {
    readonly mealsPerDay: number | null;
    readonly requiredMeals: number;
    readonly met: boolean;
    readonly breastfed: boolean | null;
  } | null;
  readonly minimumAcceptableDiet: boolean | null;
  readonly ebf: {
    readonly exclusiveBreastfeeding: boolean | null;
  } | null;
  readonly feedingDifficultyFlags: readonly string[];
  readonly sameFoodCounselingFlag: boolean;
  readonly counselingNotes: readonly string[];
  readonly isDevelopment: true;
  readonly developmentBanner: string;
};

export type IycfEvaluationInput = {
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly age: NutritionAgeContext;
};

function answerMap(
  answers: readonly RecordedScreeningAnswer[],
): Map<string, RecordedScreeningAnswer> {
  return new Map(answers.map((a) => [a.questionId, a]));
}

function resolveAgeMonths(
  answers: Map<string, RecordedScreeningAnswer>,
  age: NutritionAgeContext,
): number | null {
  const monthsAnswer = answers.get('child_age_months');
  if (monthsAnswer?.state === 'answered' && monthsAnswer.value?.kind === 'number') {
    return monthsAnswer.value.value;
  }
  if (age.ageDays != null) {
    return Math.floor(age.ageDays / 30.4375);
  }
  return null;
}

function resolveAgeBand(ageMonths: number | null): NutritionIycfAgeBand | null {
  if (ageMonths == null) {
    return null;
  }
  if (ageMonths < 6) {
    return 'under6';
  }
  if (ageMonths < 24) {
    return '6to23';
  }
  if (ageMonths <= 59) {
    return '24to59';
  }
  return null;
}

function resolveBoolean(
  answers: Map<string, RecordedScreeningAnswer>,
  questionId: string,
): boolean | null {
  const answer = answers.get(questionId);
  if (!answer || answer.state !== 'answered' || !answer.value) {
    return null;
  }
  if (answer.value.kind === 'boolean') {
    return answer.value.value;
  }
  return null;
}

function resolveMealsPerDay(
  answers: Map<string, RecordedScreeningAnswer>,
): number | null {
  const answer = answers.get('meals_per_day');
  if (!answer || answer.state !== 'answered' || !answer.value) {
    return null;
  }
  if (answer.value.kind !== 'option') {
    return null;
  }
  switch (answer.value.value) {
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    case '4_plus':
      return 4;
    default:
      return null;
  }
}

function resolveMddGroups(
  answers: Map<string, RecordedScreeningAnswer>,
): readonly MddFoodGroupId[] {
  const answer = answers.get('mdd_food_groups_yesterday');
  if (!answer || answer.state !== 'answered' || !answer.value) {
    return [];
  }
  if (answer.value.kind !== 'multipleOptions') {
    return [];
  }
  return answer.value.values.filter((value): value is MddFoodGroupId =>
    (MDD_FOOD_GROUP_IDS as readonly string[]).includes(value),
  );
}

function resolveFeedingDifficultyFlags(
  answers: Map<string, RecordedScreeningAnswer>,
): readonly string[] {
  const answer = answers.get('feeding_difficulty_types');
  if (!answer || answer.state !== 'answered' || !answer.value) {
    return [];
  }
  if (answer.value.kind !== 'multipleOptions') {
    return [];
  }
  return answer.value.values;
}

function requiredMealsForMmf(ageMonths: number, breastfed: boolean): number {
  if (!breastfed) {
    return 4;
  }
  if (ageMonths <= 8) {
    return 2;
  }
  return 3;
}

/**
 * Deterministic IYCF indicators for community frontline use (development slice).
 * MDD/MMF thresholds follow WHO 6–23 month IYCF indicators — GHS review required.
 */
export function evaluateNutritionIycfIndicators(
  input: IycfEvaluationInput,
): NutritionIycfEvaluationResult {
  const answers = answerMap(input.answers);
  const ageMonths = resolveAgeMonths(answers, input.age);
  const ageBand = resolveAgeBand(ageMonths);
  const developmentBanner =
    'IYCF indicators (MDD/MMF) — development slice based on WHO 6–23 month guidance. GHS review required before pilot.';

  if (ageBand == null) {
    return {
      status: 'insufficientInformation',
      engineVersion: IYCF_ENGINE_VERSION,
      ageMonths,
      ageBand: null,
      mdd: null,
      mmf: null,
      minimumAcceptableDiet: null,
      ebf: null,
      feedingDifficultyFlags: resolveFeedingDifficultyFlags(answers),
      sameFoodCounselingFlag: resolveBoolean(answers, 'same_food_all_meals_yesterday') === true,
      counselingNotes: [],
      isDevelopment: true,
      developmentBanner,
    };
  }

  const counselingNotes: string[] = [];
  const breastfed = resolveBoolean(answers, 'currently_breastfeeding');
  const sameFoodCounselingFlag =
    resolveBoolean(answers, 'same_food_all_meals_yesterday') === true;
  const feedingDifficultyFlags = resolveFeedingDifficultyFlags(answers);

  if (sameFoodCounselingFlag) {
    counselingNotes.push(
      'Caregiver reported mostly the same food at all meals yesterday — discuss meal variety.',
    );
  }
  if (feedingDifficultyFlags.length > 0) {
    counselingNotes.push(
      'Feeding difficulty signs reported — review selected concerns with the caregiver.',
    );
  }

  if (ageBand === 'under6') {
    return {
      status: 'calculated',
      engineVersion: IYCF_ENGINE_VERSION,
      ageMonths,
      ageBand,
      mdd: null,
      mmf: null,
      minimumAcceptableDiet: null,
      ebf: {
        exclusiveBreastfeeding: resolveBoolean(answers, 'exclusive_breastfeeding'),
      },
      feedingDifficultyFlags,
      sameFoodCounselingFlag,
      counselingNotes,
      isDevelopment: true,
      developmentBanner,
    };
  }

  const mddGroups = resolveMddGroups(answers);
  const mddScore = mddGroups.length;
  const mddRequired = 5;
  const mddMet = mddScore >= mddRequired;

  let mmf: NutritionIycfEvaluationResult['mmf'] = null;
  let minimumAcceptableDiet: boolean | null = null;

  if (ageBand === '6to23') {
    const mealsPerDay = resolveMealsPerDay(answers);
    const requiredMeals =
      ageMonths != null && breastfed != null
        ? requiredMealsForMmf(ageMonths, breastfed)
        : breastfed === false
          ? 4
          : 3;
    const mmfMet = mealsPerDay != null ? mealsPerDay >= requiredMeals : false;

    mmf = {
      mealsPerDay,
      requiredMeals,
      met: mealsPerDay != null ? mmfMet : false,
      breastfed,
    };

    if (mealsPerDay != null) {
      minimumAcceptableDiet = mddMet && mmfMet;
      if (!mmfMet) {
        counselingNotes.push(
          `Meals per day (${mealsPerDay}) below WHO minimum (${requiredMeals}) for this age and breastfeeding status.`,
        );
      }
    }
    if (!mddMet && mddGroups.length > 0) {
      counselingNotes.push(
        `Minimum dietary diversity not met (${mddScore}/8 food groups yesterday; need ≥${mddRequired}).`,
      );
    }
    if (minimumAcceptableDiet === false) {
      counselingNotes.push(
        'Minimum acceptable diet not met — acute MUAC status and feeding practices both matter for counseling.',
      );
    }
  }

  if (ageBand === '24to59' && !mddMet && mddGroups.length > 0) {
    counselingNotes.push(
      `Dietary diversity below recommended (${mddScore}/8 groups yesterday) — reinforce varied family foods.`,
    );
  }

  return {
    status: 'calculated',
    engineVersion: IYCF_ENGINE_VERSION,
    ageMonths,
    ageBand,
    mdd: {
      score: mddScore,
      required: mddRequired,
      met: mddMet,
      selectedGroups: mddGroups,
    },
    mmf,
    minimumAcceptableDiet,
    ebf: null,
    feedingDifficultyFlags,
    sameFoodCounselingFlag,
    counselingNotes,
    isDevelopment: true,
    developmentBanner,
  };
}
