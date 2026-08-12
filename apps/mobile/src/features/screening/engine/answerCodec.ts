import type { AnswerValueType } from '../../../data/domain/enums/domainEnums';
import type { SaveAnswerInput } from '../../../data/repositories/contracts/types';
import type { ScreeningAnswer } from '../../../data/domain/entities/entities';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type {
  RecordedAnswerValue,
  RecordedScreeningAnswer,
  ScreeningAnswerState,
} from '../content/types';

const STATE_PREFIX = 'nc_state:';

export function encodeAnswerForPersistence(input: {
  readonly screeningId: EntityId;
  readonly answer: RecordedScreeningAnswer;
  readonly accountId?: EntityId | null;
}): SaveAnswerInput {
  const { screeningId, answer, accountId = null } = input;

  if (answer.state === 'skippedByCondition') {
    return {
      screeningId,
      questionKey: answer.questionId,
      valueType: 'option',
      optionValue: `${STATE_PREFIX}skippedByCondition`,
      accountId,
    };
  }

  if (answer.state === 'unknown') {
    return {
      screeningId,
      questionKey: answer.questionId,
      valueType: 'unknown',
      accountId,
    };
  }

  if (
    answer.state === 'notAssessed' ||
    answer.state === 'declined' ||
    answer.state === 'notApplicable'
  ) {
    return {
      screeningId,
      questionKey: answer.questionId,
      valueType: 'option',
      optionValue: `${STATE_PREFIX}${answer.state}`,
      accountId,
    };
  }

  if (!answer.value) {
    throw new Error('Answered state requires a value');
  }

  return {
    screeningId,
    questionKey: answer.questionId,
    accountId,
    ...valueToColumns(answer.value),
  };
}

function valueToColumns(value: RecordedAnswerValue): {
  readonly valueType: AnswerValueType;
  readonly booleanValue?: boolean | null;
  readonly numberValue?: number | null;
  readonly textValue?: string | null;
  readonly dateValue?: string | null;
  readonly optionValue?: string | null;
  readonly multipleOptionsJson?: string | null;
} {
  switch (value.kind) {
    case 'boolean':
      return { valueType: 'boolean', booleanValue: value.value };
    case 'number':
    case 'measurement':
      return { valueType: 'number', numberValue: value.value };
    case 'text':
      return { valueType: 'text', textValue: value.value };
    case 'date':
      return { valueType: 'date', dateValue: value.value };
    case 'time':
      return { valueType: 'text', textValue: `time:${value.value}` };
    case 'option':
      return { valueType: 'option', optionValue: value.value };
    case 'multipleOptions':
      return {
        valueType: 'multipleOptions',
        multipleOptionsJson: JSON.stringify(value.values),
      };
    case 'acknowledgement':
      return { valueType: 'boolean', booleanValue: true };
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
}

export function decodePersistedAnswer(row: ScreeningAnswer): RecordedScreeningAnswer {
  if (row.valueType === 'unknown') {
    return { questionId: row.questionKey, state: 'unknown' };
  }

  if (row.valueType === 'option' && row.optionValue?.startsWith(STATE_PREFIX)) {
    const state = row.optionValue.slice(STATE_PREFIX.length) as ScreeningAnswerState;
    if (
      state === 'notAssessed' ||
      state === 'declined' ||
      state === 'notApplicable' ||
      state === 'skippedByCondition'
    ) {
      return { questionId: row.questionKey, state };
    }
  }

  const value = columnsToValue(row);
  return {
    questionId: row.questionKey,
    state: 'answered',
    value,
  };
}

function columnsToValue(row: ScreeningAnswer): RecordedAnswerValue {
  switch (row.valueType) {
    case 'boolean':
      return { kind: 'boolean', value: row.booleanValue === true };
    case 'number':
      return { kind: 'number', value: row.numberValue ?? 0 };
    case 'text':
      if (row.textValue?.startsWith('time:')) {
        return { kind: 'time', value: row.textValue.slice('time:'.length) };
      }
      return { kind: 'text', value: row.textValue ?? '' };
    case 'date':
      return { kind: 'date', value: row.dateValue ?? '' };
    case 'option':
      return { kind: 'option', value: row.optionValue ?? '' };
    case 'multipleOptions': {
      let values: string[] = [];
      if (row.multipleOptionsJson) {
        try {
          const parsed: unknown = JSON.parse(row.multipleOptionsJson);
          if (Array.isArray(parsed)) {
            values = parsed.filter((item): item is string => typeof item === 'string');
          }
        } catch {
          values = [];
        }
      }
      return { kind: 'multipleOptions', values };
    }
    case 'unknown':
      return { kind: 'text', value: '' };
    default: {
      const _exhaustive: never = row.valueType;
      return _exhaustive;
    }
  }
}
