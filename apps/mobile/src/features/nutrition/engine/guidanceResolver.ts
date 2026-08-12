import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import type {
  NutritionGuidanceCard,
  NutritionGuidanceCondition,
  NutritionGuidancePackDefinition,
  NutritionGuidanceResolutionResult,
  NutritionReferenceEvaluationResult,
} from '../domain/types';

export type GuidanceResolutionInput = {
  readonly pack: NutritionGuidancePackDefinition | null;
  readonly packLoadable: boolean;
  readonly templateId: string;
  readonly clientCategory: ClientCategory;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly referenceResult: NutritionReferenceEvaluationResult | null;
};

function evaluateGuidanceCondition(
  condition: NutritionGuidanceCondition,
  answers: readonly RecordedScreeningAnswer[],
  interpretationCode: string | null,
): boolean {
  switch (condition.op) {
    case 'interpretationCode':
      return interpretationCode === condition.code;
    case 'answerEquals': {
      const answer = answers.find((a) => a.questionId === condition.questionId);
      if (!answer || answer.state !== 'answered' || !answer.value) {
        return false;
      }
      const value = answer.value;
      if (value.kind === 'boolean' || value.kind === 'number' || value.kind === 'option') {
        return value.value === condition.value;
      }
      if (value.kind === 'text') {
        return value.value === condition.value;
      }
      return false;
    }
    case 'answerState': {
      const answer = answers.find((a) => a.questionId === condition.questionId);
      return answer?.state === condition.state;
    }
    case 'all':
      return condition.conditions.every((c) =>
        evaluateGuidanceCondition(c, answers, interpretationCode),
      );
    case 'any':
      return condition.conditions.some((c) =>
        evaluateGuidanceCondition(c, answers, interpretationCode),
      );
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

/**
 * Deterministic guidance resolver. Never invents generic advice when packs unavailable.
 * Does not call LLM / AI.
 */
export function resolveNutritionGuidance(
  input: GuidanceResolutionInput,
): NutritionGuidanceResolutionResult {
  const empty: NutritionGuidanceResolutionResult = {
    outcome: 'guidancePackUnavailable',
    guidancePackId: null,
    guidancePackVersion: null,
    guidanceIds: [],
    cards: [],
    isDevelopment: false,
    developmentBanner: null,
    missingInformation: [],
  };

  if (!input.packLoadable || !input.pack) {
    return empty;
  }

  if (input.pack.status === 'RETIRED') {
    return { ...empty, outcome: 'contentRetired', guidancePackId: input.pack.guidancePackId };
  }

  if (input.pack.status === 'DRAFT' || input.pack.status === 'REVIEW_REQUIRED') {
    return { ...empty, outcome: 'guidancePackUnavailable' };
  }

  if (!input.pack.applicableAssessmentTemplateIds.includes(input.templateId)) {
    return {
      ...empty,
      outcome: 'incompatibleContent',
      guidancePackId: input.pack.guidancePackId,
      guidancePackVersion: input.pack.version,
    };
  }

  if (!input.pack.applicableClientCategories.includes(input.clientCategory)) {
    return {
      ...empty,
      outcome: 'incompatibleContent',
      guidancePackId: input.pack.guidancePackId,
      guidancePackVersion: input.pack.version,
    };
  }

  if (
    input.referenceResult == null ||
    (input.referenceResult.status !== 'calculated' &&
      input.referenceResult.status !== 'available')
  ) {
    if (
      input.referenceResult?.status === 'insufficientInformation' ||
      input.referenceResult?.status === 'incompatibleAge'
    ) {
      return {
        outcome: 'moreInformationRequired',
        guidancePackId: input.pack.guidancePackId,
        guidancePackVersion: input.pack.version,
        guidanceIds: [],
        cards: [],
        isDevelopment: input.pack.status === 'APPROVED_FOR_DEVELOPMENT',
        developmentBanner: input.pack.developmentBanner,
        missingInformation: input.referenceResult.missingInformation,
      };
    }
    return {
      outcome: 'guidanceUnavailable',
      guidancePackId: input.pack.guidancePackId,
      guidancePackVersion: input.pack.version,
      guidanceIds: [],
      cards: [],
      isDevelopment: input.pack.status === 'APPROVED_FOR_DEVELOPMENT',
      developmentBanner: input.pack.developmentBanner,
      missingInformation: [],
    };
  }

  const interpretationCode = input.referenceResult.interpretationCode;
  if (
    interpretationCode &&
    input.pack.applicableInterpretationCodes.length > 0 &&
    !input.pack.applicableInterpretationCodes.includes(interpretationCode)
  ) {
    return {
      outcome: 'incompatibleContent',
      guidancePackId: input.pack.guidancePackId,
      guidancePackVersion: input.pack.version,
      guidanceIds: [],
      cards: [],
      isDevelopment: input.pack.status === 'APPROVED_FOR_DEVELOPMENT',
      developmentBanner: input.pack.developmentBanner,
      missingInformation: [],
    };
  }

  const matched: NutritionGuidanceCard[] = input.pack.cards
    .filter((card) =>
      evaluateGuidanceCondition(card.applicableConditions, input.answers, interpretationCode),
    )
    .sort((a, b) => a.priorityOrder - b.priorityOrder || a.guidanceId.localeCompare(b.guidanceId));

  if (matched.length === 0) {
    return {
      outcome: 'guidanceUnavailable',
      guidancePackId: input.pack.guidancePackId,
      guidancePackVersion: input.pack.version,
      guidanceIds: [],
      cards: [],
      isDevelopment: input.pack.status === 'APPROVED_FOR_DEVELOPMENT',
      developmentBanner: input.pack.developmentBanner,
      missingInformation: [],
    };
  }

  return {
    outcome: 'guidanceAvailable',
    guidancePackId: input.pack.guidancePackId,
    guidancePackVersion: input.pack.version,
    guidanceIds: matched.map((c) => c.guidanceId),
    cards: matched,
    isDevelopment: input.pack.status === 'APPROVED_FOR_DEVELOPMENT',
    developmentBanner: input.pack.developmentBanner,
    missingInformation: [],
  };
}
