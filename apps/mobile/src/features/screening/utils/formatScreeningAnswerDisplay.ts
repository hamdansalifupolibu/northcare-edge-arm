import type {
  RecordedAnswerValue,
  ScreeningAnswerState,
  ScreeningQuestionDefinition,
} from '../content/types';

export type ScreeningAnswerDisplayStrings = {
  readonly yesLabel: string;
  readonly noLabel: string;
  readonly unknownLabel: string;
  readonly notAssessedLabel: string;
  readonly notApplicableLabel: string;
  readonly confirmedLabel: string;
  readonly reviewSectionSkipped: string;
  readonly measurementMuac: string;
  readonly measurementWeight: string;
  readonly measurementHeight: string;
};

const REVIEW_SHORT_LABELS: Readonly<Record<string, string>> = {
  child_age_months: 'Age',
  child_sex: 'Sex',
  weight_kg: 'Weight',
  muac_cm: 'MUAC',
  height_cm: 'Height',
  bilateral_oedema: 'Bilateral oedema',
  visible_wasting: 'Visible wasting',
  exclusive_breastfeeding: 'Exclusive breastfeeding',
  currently_breastfeeding: 'Currently breastfeeding',
  complementary_feeding: 'Complementary feeding',
  meals_per_day: 'Meals per day',
  mdd_food_groups_yesterday: 'Food groups (yesterday)',
  same_food_all_meals_yesterday: 'Same food at every meal',
  feeding_difficulties: 'Feeding difficulties',
  feeding_difficulty_types: 'Feeding concerns',
  feeding_difficulties_detail: 'Details',
  caregiver_counselled: 'Caregiver discussion',
};

/** Converts snake_case option ids to readable text when no template label exists. */
export function humanizeOptionId(optionId: string): string {
  const words = optionId.split('_').filter(Boolean).join(' ');
  if (!words) {
    return optionId;
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function resolveOptionLabel(
  question: ScreeningQuestionDefinition,
  optionId: string,
): string {
  const match = question.options?.find((option) => option.id === optionId);
  return match?.label ?? humanizeOptionId(optionId);
}

function measurementLabel(
  question: ScreeningQuestionDefinition,
  strings: ScreeningAnswerDisplayStrings,
): string {
  switch (question.measurementType) {
    case 'muac':
      return strings.measurementMuac;
    case 'weight':
      return strings.measurementWeight;
    case 'height':
      return strings.measurementHeight;
    default:
      return REVIEW_SHORT_LABELS[question.id] ?? question.label;
  }
}

/**
 * Compact label for review / summary rows (e.g. "Height", "Sex").
 */
export function reviewQuestionLabel(
  question: ScreeningQuestionDefinition,
  strings: ScreeningAnswerDisplayStrings,
): string {
  if (question.answerType === 'measurement') {
    return measurementLabel(question, strings);
  }
  return REVIEW_SHORT_LABELS[question.id] ?? question.label;
}

/**
 * Formats a recorded screening answer value for display, resolving choice labels
 * and humanizing raw option ids (e.g. vomiting_feeds → Vomiting feeds).
 */
export function formatScreeningAnswerValue(
  question: ScreeningQuestionDefinition,
  state: ScreeningAnswerState | string,
  value: RecordedAnswerValue | undefined,
  strings: ScreeningAnswerDisplayStrings,
): string {
  if (state === 'skippedByCondition') {
    return strings.reviewSectionSkipped;
  }
  if (state === 'unknown') {
    return strings.unknownLabel;
  }
  if (state === 'notAssessed') {
    return strings.notAssessedLabel;
  }
  if (state === 'notApplicable') {
    return strings.notApplicableLabel;
  }
  if (state !== 'answered') {
    return String(state);
  }
  if (!value) {
    return '—';
  }

  switch (value.kind) {
    case 'boolean':
      return value.value ? strings.yesLabel : strings.noLabel;
    case 'number':
      if (question.id === 'child_age_months') {
        return `${value.value} months`;
      }
      return String(value.value);
    case 'text':
      return value.value.trim() || '—';
    case 'date':
    case 'time':
      return value.value;
    case 'option':
      return resolveOptionLabel(question, value.value);
    case 'multipleOptions':
      return value.values
        .map((optionId) => resolveOptionLabel(question, optionId))
        .join(', ');
    case 'measurement':
      return `${value.value} ${value.unit}`;
    case 'acknowledgement':
      return strings.confirmedLabel;
    default:
      return '—';
  }
}

export function formatScreeningAnswerLine(
  question: ScreeningQuestionDefinition,
  state: ScreeningAnswerState | string,
  value: RecordedAnswerValue | undefined,
  strings: ScreeningAnswerDisplayStrings,
): { readonly label: string; readonly value: string } {
  return {
    label: reviewQuestionLabel(question, strings),
    value: formatScreeningAnswerValue(question, state, value, strings),
  };
}
