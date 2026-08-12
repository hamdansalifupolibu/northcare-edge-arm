import { describe, expect, it } from '@jest/globals';

import type { RecordedScreeningAnswer } from '../../../../screening/content/types';
import { evaluateNutritionIycfIndicators } from '../iycfEvaluator';

function answer(
  questionId: string,
  value: RecordedScreeningAnswer['value'],
): RecordedScreeningAnswer {
  return { questionId, state: 'answered', value };
}

const baseAgeContext = {
  ageDays: 420,
  ageMonthsApprox: 14,
  dateOfBirthKnown: true,
  approximateAgeOnly: false,
};

describe('evaluateNutritionIycfIndicators', () => {
  it('scores MDD and MMF for a 14-month breastfed child with adequate feeding', () => {
    const result = evaluateNutritionIycfIndicators({
      age: baseAgeContext,
      answers: [
        answer('child_age_months', { kind: 'number', value: 14 }),
        answer('currently_breastfeeding', { kind: 'boolean', value: true }),
        answer('meals_per_day', { kind: 'option', value: '3' }),
        answer('mdd_food_groups_yesterday', {
          kind: 'multipleOptions',
          values: [
            'grains_roots_tubers',
            'legumes_nuts',
            'flesh_foods',
            'eggs',
            'vitamin_a_fruits_vegetables',
            'breastmilk',
          ],
        }),
      ],
    });

    expect(result.status).toBe('calculated');
    expect(result.ageBand).toBe('6to23');
    expect(result.mdd?.score).toBe(6);
    expect(result.mdd?.met).toBe(true);
    expect(result.mmf?.requiredMeals).toBe(3);
    expect(result.mmf?.met).toBe(true);
    expect(result.minimumAcceptableDiet).toBe(true);
  });

  it('flags inadequate feeding when MDD passes but MMF fails', () => {
    const result = evaluateNutritionIycfIndicators({
      age: baseAgeContext,
      answers: [
        answer('child_age_months', { kind: 'number', value: 14 }),
        answer('currently_breastfeeding', { kind: 'boolean', value: true }),
        answer('meals_per_day', { kind: 'option', value: '1' }),
        answer('mdd_food_groups_yesterday', {
          kind: 'multipleOptions',
          values: [
            'grains_roots_tubers',
            'legumes_nuts',
            'flesh_foods',
            'eggs',
            'vitamin_a_fruits_vegetables',
            'breastmilk',
          ],
        }),
      ],
    });

    expect(result.mdd?.met).toBe(true);
    expect(result.mmf?.met).toBe(false);
    expect(result.minimumAcceptableDiet).toBe(false);
    expect(result.counselingNotes.some((note) => note.includes('Meals per day'))).toBe(true);
  });

  it('uses EBF path for infants under 6 months', () => {
    const result = evaluateNutritionIycfIndicators({
      age: { ...baseAgeContext, ageDays: 120 },
      answers: [
        answer('child_age_months', { kind: 'number', value: 4 }),
        answer('exclusive_breastfeeding', { kind: 'boolean', value: true }),
      ],
    });

    expect(result.ageBand).toBe('under6');
    expect(result.ebf?.exclusiveBreastfeeding).toBe(true);
    expect(result.mdd).toBeNull();
    expect(result.mmf).toBeNull();
  });

  it('requires 4 meals for non-breastfed children 6–23 months', () => {
    const result = evaluateNutritionIycfIndicators({
      age: baseAgeContext,
      answers: [
        answer('child_age_months', { kind: 'number', value: 18 }),
        answer('currently_breastfeeding', { kind: 'boolean', value: false }),
        answer('meals_per_day', { kind: 'option', value: '3' }),
        answer('mdd_food_groups_yesterday', {
          kind: 'multipleOptions',
          values: [
            'grains_roots_tubers',
            'legumes_nuts',
            'dairy',
            'flesh_foods',
            'eggs',
          ],
        }),
      ],
    });

    expect(result.mmf?.requiredMeals).toBe(4);
    expect(result.mmf?.met).toBe(false);
  });
});
