import { SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE } from '../../../nutrition/content/assessments/syntheticDevChildNutritionTemplate';
import {
  formatScreeningAnswerLine,
  formatScreeningAnswerValue,
  humanizeOptionId,
} from '../formatScreeningAnswerDisplay';

const strings = {
  yesLabel: 'Yes',
  noLabel: 'No',
  unknownLabel: 'Unknown',
  notAssessedLabel: 'Not assessed',
  notApplicableLabel: 'N/A',
  confirmedLabel: 'Confirmed',
  reviewSectionSkipped: 'Skipped',
  measurementMuac: 'MUAC',
  measurementWeight: 'Weight',
  measurementHeight: 'Height/Length',
};

describe('formatScreeningAnswerDisplay', () => {
  const sexQuestion = SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE.sections[0]!.questions[1]!;
  const mddQuestion = SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE.sections[4]!.questions[0]!;
  const feedingTypesQuestion =
    SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE.sections[6]!.questions[1]!;
  const heightQuestion = SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE.sections[1]!.questions[2]!;

  it('humanizes snake_case option ids', () => {
    expect(humanizeOptionId('vomiting_feeds')).toBe('Vomiting feeds');
    expect(humanizeOptionId('flesh_foods')).toBe('Flesh foods');
  });

  it('resolves single-choice labels', () => {
    expect(
      formatScreeningAnswerValue(sexQuestion, 'answered', { kind: 'option', value: 'male' }, strings),
    ).toBe('Male');
  });

  it('resolves multiple-choice labels from template options', () => {
    expect(
      formatScreeningAnswerValue(
        mddQuestion,
        'answered',
        { kind: 'multipleOptions', values: ['flesh_foods', 'eggs'] },
        strings,
      ),
    ).toContain('Flesh foods');
    expect(
      formatScreeningAnswerValue(
        mddQuestion,
        'answered',
        { kind: 'multipleOptions', values: ['flesh_foods', 'eggs'] },
        strings,
      ),
    ).toContain('Eggs');
  });

  it('formats feeding concern options readably', () => {
    expect(
      formatScreeningAnswerValue(
        feedingTypesQuestion,
        'answered',
        { kind: 'multipleOptions', values: ['vomiting_feeds'] },
        strings,
      ),
    ).toBe('Vomiting after feeds');
  });

  it('builds label/value pairs for review rows', () => {
    expect(
      formatScreeningAnswerLine(
        heightQuestion,
        'answered',
        { kind: 'measurement', value: 20, unit: 'cm' },
        strings,
      ),
    ).toEqual({ label: 'Height/Length', value: '20 cm' });
  });
});
