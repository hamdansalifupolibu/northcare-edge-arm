import type { MeasurementUnit } from '../../../data/domain/enums/domainEnums';
import type { RiskCondition } from '../domain/conditions';
import type { EngineAnswer, RiskEngineInput } from '../domain/input';
import { convertMeasurementUnit } from './unitConversion';

export type ConditionEvalStatus =
  | 'true'
  | 'false'
  | 'missingInput'
  | 'invalidInput'
  | 'notApplicable';

export type ConditionEvalResult = {
  readonly status: ConditionEvalStatus;
  readonly questionKey: string | null;
  readonly detail: string;
};

/**
 * Missing-input behaviour (documented per operator family):
 * - equals/notEquals/in/notIn/numeric: unanswered/unknown/notAssessed/declined → missingInput
 *   (never coerced to false/No)
 * - exists: true only for answered with a value; unanswered/unknown/etc → false (not missing)
 * - isMissing: true for unanswered/unknown/notAssessed/declined/notApplicable/skippedByCondition
 * - answerStateIs: compares recorded state including unanswered
 * - context ops: invalid context → invalidInput; age precision insufficient → missingInput
 */
export function evaluateCondition(
  condition: RiskCondition,
  input: RiskEngineInput,
): ConditionEvalResult {
  switch (condition.op) {
    case 'all': {
      let anyMissing = false;
      let anyInvalid = false;
      for (const child of condition.conditions) {
        const result = evaluateCondition(child, input);
        if (result.status === 'false') {
          return result;
        }
        if (result.status === 'missingInput') {
          anyMissing = true;
        }
        if (result.status === 'invalidInput') {
          anyInvalid = true;
        }
      }
      if (anyInvalid) {
        return { status: 'invalidInput', questionKey: null, detail: 'all:invalid' };
      }
      if (anyMissing) {
        return { status: 'missingInput', questionKey: null, detail: 'all:missing' };
      }
      return { status: 'true', questionKey: null, detail: 'all' };
    }
    case 'any': {
      let anyMissing = false;
      let anyInvalid = false;
      for (const child of condition.conditions) {
        const result = evaluateCondition(child, input);
        if (result.status === 'true') {
          return result;
        }
        if (result.status === 'missingInput') {
          anyMissing = true;
        }
        if (result.status === 'invalidInput') {
          anyInvalid = true;
        }
      }
      if (anyInvalid) {
        return { status: 'invalidInput', questionKey: null, detail: 'any:invalid' };
      }
      if (anyMissing) {
        return { status: 'missingInput', questionKey: null, detail: 'any:missing' };
      }
      return { status: 'false', questionKey: null, detail: 'any' };
    }
    case 'not': {
      const inner = evaluateCondition(condition.condition, input);
      if (inner.status === 'true') {
        return { status: 'false', questionKey: inner.questionKey, detail: 'not' };
      }
      if (inner.status === 'false') {
        return { status: 'true', questionKey: inner.questionKey, detail: 'not' };
      }
      return inner;
    }
    case 'equals':
      return compareEquality(condition.questionKey, condition.value, input, true);
    case 'notEquals':
      return compareEquality(condition.questionKey, condition.value, input, false);
    case 'in':
      return compareMembership(condition.questionKey, condition.values, input, true);
    case 'notIn':
      return compareMembership(condition.questionKey, condition.values, input, false);
    case 'exists': {
      const answer = findAnswer(input, condition.questionKey);
      const exists =
        answer != null && answer.state === 'answered' && answer.value != null;
      return {
        status: exists ? 'true' : 'false',
        questionKey: condition.questionKey,
        detail: 'exists',
      };
    }
    case 'isMissing': {
      const answer = findAnswer(input, condition.questionKey);
      const missing =
        answer == null ||
        answer.state === 'unanswered' ||
        answer.state === 'unknown' ||
        answer.state === 'notAssessed' ||
        answer.state === 'declined' ||
        answer.state === 'notApplicable' ||
        answer.state === 'skippedByCondition';
      return {
        status: missing ? 'true' : 'false',
        questionKey: condition.questionKey,
        detail: 'isMissing',
      };
    }
    case 'answerStateIs': {
      const answer = findAnswer(input, condition.questionKey);
      const state = answer?.state ?? 'unanswered';
      return {
        status: state === condition.state ? 'true' : 'false',
        questionKey: condition.questionKey,
        detail: 'answerStateIs',
      };
    }
    case 'greaterThan':
      return compareNumeric(condition.questionKey, input, condition.measurementUnit, (n) =>
        n > condition.value,
      );
    case 'greaterThanOrEqual':
      return compareNumeric(condition.questionKey, input, condition.measurementUnit, (n) =>
        n >= condition.value,
      );
    case 'lessThan':
      return compareNumeric(condition.questionKey, input, condition.measurementUnit, (n) =>
        n < condition.value,
      );
    case 'lessThanOrEqual':
      return compareNumeric(condition.questionKey, input, condition.measurementUnit, (n) =>
        n <= condition.value,
      );
    case 'between':
      return compareNumeric(condition.questionKey, input, condition.measurementUnit, (n) =>
        n >= condition.min && n <= condition.max,
      );
    case 'outsideRange':
      return compareNumeric(condition.questionKey, input, condition.measurementUnit, (n) =>
        n < condition.min || n > condition.max,
      );
    case 'clientCategoryIs':
      return {
        status: input.clientCategory === condition.category ? 'true' : 'false',
        questionKey: null,
        detail: 'clientCategoryIs',
      };
    case 'visitTypeIs':
      return {
        status: input.visitType === condition.visitType ? 'true' : 'false',
        questionKey: null,
        detail: 'visitTypeIs',
      };
    case 'screeningTemplateIs':
      return {
        status: input.screeningTemplateId === condition.templateId ? 'true' : 'false',
        questionKey: null,
        detail: 'screeningTemplateIs',
      };
    case 'templateVersionIs':
      return {
        status: input.screeningTemplateVersion === condition.version ? 'true' : 'false',
        questionKey: null,
        detail: 'templateVersionIs',
      };
    case 'ageInRange': {
      if (!input.derivedAge) {
        return {
          status: 'missingInput',
          questionKey: null,
          detail: 'ageInRange:missing',
        };
      }
      if (input.derivedAge.precision === 'approximate' && !condition.allowApproximate) {
        return {
          status: 'missingInput',
          questionKey: null,
          detail: 'ageInRange:approximateInsufficient',
        };
      }
      const inRange =
        input.derivedAge.years >= condition.minYearsInclusive &&
        input.derivedAge.years <= condition.maxYearsInclusive;
      return {
        status: inRange ? 'true' : 'false',
        questionKey: null,
        detail: 'ageInRange',
      };
    }
    default: {
      const _exhaustive: never = condition;
      return {
        status: 'invalidInput',
        questionKey: null,
        detail: `unsupported:${String((_exhaustive as { op: string }).op)}`,
      };
    }
  }
}

function findAnswer(input: RiskEngineInput, questionKey: string): EngineAnswer | undefined {
  return input.answers.find((answer) => answer.questionKey === questionKey);
}

function compareEquality(
  questionKey: string,
  expected: string | number | boolean,
  input: RiskEngineInput,
  wantEqual: boolean,
): ConditionEvalResult {
  const resolved = resolveComparable(questionKey, input);
  if (resolved.kind !== 'value') {
    return {
      status: resolved.kind,
      questionKey,
      detail: wantEqual ? 'equals' : 'notEquals',
    };
  }
  const equal = valuesEqual(resolved.value, expected);
  const matched = wantEqual ? equal : !equal;
  return {
    status: matched ? 'true' : 'false',
    questionKey,
    detail: wantEqual ? 'equals' : 'notEquals',
  };
}

function compareMembership(
  questionKey: string,
  values: readonly (string | number | boolean)[],
  input: RiskEngineInput,
  wantIn: boolean,
): ConditionEvalResult {
  const resolved = resolveComparable(questionKey, input);
  if (resolved.kind !== 'value') {
    return {
      status: resolved.kind,
      questionKey,
      detail: wantIn ? 'in' : 'notIn',
    };
  }
  if (Array.isArray(resolved.value)) {
    const any = resolved.value.some((item) => values.some((candidate) => valuesEqual(item, candidate)));
    const matched = wantIn ? any : !any;
    return {
      status: matched ? 'true' : 'false',
      questionKey,
      detail: wantIn ? 'in' : 'notIn',
    };
  }
  const included = values.some((candidate) => valuesEqual(resolved.value, candidate));
  const matched = wantIn ? included : !included;
  return {
    status: matched ? 'true' : 'false',
    questionKey,
    detail: wantIn ? 'in' : 'notIn',
  };
}

function compareNumeric(
  questionKey: string,
  input: RiskEngineInput,
  requiredUnit: MeasurementUnit | undefined,
  predicate: (value: number) => boolean,
): ConditionEvalResult {
  const answer = findAnswer(input, questionKey);
  if (!answer || answer.state === 'unanswered') {
    return { status: 'missingInput', questionKey, detail: 'numeric:unanswered' };
  }
  if (
    answer.state === 'unknown' ||
    answer.state === 'notAssessed' ||
    answer.state === 'declined' ||
    answer.state === 'notApplicable' ||
    answer.state === 'skippedByCondition'
  ) {
    return { status: 'missingInput', questionKey, detail: `numeric:${answer.state}` };
  }
  if (!answer.value) {
    return { status: 'missingInput', questionKey, detail: 'numeric:noValue' };
  }
  if (answer.value.kind === 'number') {
    if (requiredUnit) {
      return { status: 'invalidInput', questionKey, detail: 'numeric:unitRequired' };
    }
    return {
      status: predicate(answer.value.value) ? 'true' : 'false',
      questionKey,
      detail: 'numeric',
    };
  }
  if (answer.value.kind === 'measurement') {
    if (!requiredUnit) {
      return {
        status: predicate(answer.value.value) ? 'true' : 'false',
        questionKey,
        detail: 'numeric:measurement',
      };
    }
    const converted = convertMeasurementUnit(
      answer.value.originalValue,
      answer.value.originalUnit,
      requiredUnit,
    );
    if (!converted) {
      return { status: 'invalidInput', questionKey, detail: 'numeric:unsupportedUnit' };
    }
    return {
      status: predicate(converted.convertedValue) ? 'true' : 'false',
      questionKey,
      detail: 'numeric:converted',
    };
  }
  return { status: 'invalidInput', questionKey, detail: 'numeric:wrongKind' };
}

type ResolvedComparable =
  | { readonly kind: 'value'; readonly value: string | number | boolean | readonly string[] }
  | { readonly kind: 'missingInput' }
  | { readonly kind: 'invalidInput' };

function resolveComparable(questionKey: string, input: RiskEngineInput): ResolvedComparable {
  const answer = findAnswer(input, questionKey);
  if (!answer || answer.state === 'unanswered') {
    return { kind: 'missingInput' };
  }
  if (
    answer.state === 'unknown' ||
    answer.state === 'notAssessed' ||
    answer.state === 'declined' ||
    answer.state === 'notApplicable' ||
    answer.state === 'skippedByCondition'
  ) {
    return { kind: 'missingInput' };
  }
  if (!answer.value) {
    return { kind: 'missingInput' };
  }
  switch (answer.value.kind) {
    case 'boolean':
      return { kind: 'value', value: answer.value.value };
    case 'number':
      return { kind: 'value', value: answer.value.value };
    case 'text':
    case 'date':
    case 'option':
      return { kind: 'value', value: answer.value.value };
    case 'multipleOptions':
      return { kind: 'value', value: answer.value.values };
    case 'measurement':
      return { kind: 'value', value: answer.value.value };
    case 'acknowledgement':
      return { kind: 'value', value: true };
    default:
      return { kind: 'invalidInput' };
  }
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return left === right;
}
