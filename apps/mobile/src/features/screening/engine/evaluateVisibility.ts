import type {
  RecordedScreeningAnswer,
  VisibilityCondition,
} from '../content/types';

function answerLookup(
  answers: readonly RecordedScreeningAnswer[],
): Map<string, RecordedScreeningAnswer> {
  return new Map(answers.map((answer) => [answer.questionId, answer]));
}

function comparableValue(answer: RecordedScreeningAnswer | undefined): unknown {
  if (!answer || answer.state !== 'answered' || !answer.value) {
    return undefined;
  }
  switch (answer.value.kind) {
    case 'boolean':
      return answer.value.value;
    case 'number':
    case 'measurement':
      return answer.value.value;
    case 'text':
    case 'date':
    case 'time':
    case 'option':
      return answer.value.value;
    case 'multipleOptions':
      return answer.value.values;
    case 'acknowledgement':
      return true;
    default: {
      const _exhaustive: never = answer.value;
      return _exhaustive;
    }
  }
}

/**
 * Typed visibility evaluator — no eval, no JSON-rules engine.
 * Unknown / notAssessed / declined / unanswered do not equal "No".
 */
export function evaluateVisibility(
  condition: VisibilityCondition | undefined,
  answers: readonly RecordedScreeningAnswer[],
): boolean {
  if (!condition) {
    return true;
  }
  const byId = answerLookup(answers);
  return evaluate(condition, byId);
}

function evaluate(
  condition: VisibilityCondition,
  byId: Map<string, RecordedScreeningAnswer>,
): boolean {
  switch (condition.op) {
    case 'equals': {
      const current = comparableValue(byId.get(condition.questionId));
      return current === condition.value;
    }
    case 'notEquals': {
      const current = comparableValue(byId.get(condition.questionId));
      if (current === undefined) {
        return false;
      }
      return current !== condition.value;
    }
    case 'includes': {
      const answer = byId.get(condition.questionId);
      if (!answer || answer.state !== 'answered' || !answer.value) {
        return false;
      }
      if (answer.value.kind === 'multipleOptions') {
        return answer.value.values.includes(condition.value);
      }
      if (answer.value.kind === 'option' || answer.value.kind === 'text') {
        return answer.value.value === condition.value;
      }
      return false;
    }
    case 'exists': {
      const answer = byId.get(condition.questionId);
      return answer != null && answer.state === 'answered';
    }
    case 'numberGreaterThanOrEqual': {
      const current = comparableValue(byId.get(condition.questionId));
      return typeof current === 'number' && current >= condition.value;
    }
    case 'numberLessThan': {
      const current = comparableValue(byId.get(condition.questionId));
      return typeof current === 'number' && current < condition.value;
    }
    case 'all':
      return condition.conditions.every((child) => evaluate(child, byId));
    case 'any':
      return condition.conditions.some((child) => evaluate(child, byId));
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}
