import type { Measurement } from '../../../data/domain/entities/entities';
import { evaluateNutritionGrowthIndicators } from '../engine/growth/growthIndicatorEvaluator';

function weightKg(value: number): Measurement {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    clientId: '00000000-0000-4000-8000-000000000002',
    encounterId: null,
    measurementType: 'weight',
    numericValue: value,
    unit: 'kg',
    notes: null,
    accountId: '00000000-0000-4000-8000-000000000003',
    createdAt: '2026-08-02T12:00:00.000Z',
    updatedAt: '2026-08-02T12:00:00.000Z',
    syncStatus: 'synced',
    isDeleted: false,
  };
}

function heightCm(value: number): Measurement {
  return {
    id: '00000000-0000-4000-8000-000000000011',
    clientId: '00000000-0000-4000-8000-000000000002',
    encounterId: null,
    measurementType: 'height',
    numericValue: value,
    unit: 'cm',
    notes: null,
    accountId: '00000000-0000-4000-8000-000000000003',
    createdAt: '2026-08-02T12:00:00.000Z',
    updatedAt: '2026-08-02T12:00:00.000Z',
    syncStatus: 'synced',
    isDeleted: false,
  };
}

describe('nutrition growth indicators — WHO z-scores', () => {
  it('calculates WFA, L/HFA, WFL/H, and BMI when inputs are complete', () => {
    const result = evaluateNutritionGrowthIndicators({
      age: { ageDays: 365, precision: 'exact' },
      measurements: [weightKg(9.5), heightCm(75)],
      answers: [
        {
          questionId: 'child_sex',
          state: 'answered',
          value: { kind: 'option', value: 'male' },
        },
        {
          questionId: 'child_age_months',
          state: 'answered',
          value: { kind: 'number', value: 12 },
        },
      ],
    });

    expect(result.status).toBe('calculated');
    expect(result.indicators).toHaveLength(4);

    const wfa = result.indicators.find((i) => i.indicatorId === 'wfa');
    expect(wfa?.status).toBe('calculated');
    expect(wfa?.zScore).not.toBeNull();
    expect(Number.isFinite(wfa?.zScore)).toBe(true);

    const lhfa = result.indicators.find((i) => i.indicatorId === 'lhfa');
    expect(lhfa?.status).toBe('calculated');

    const wflh = result.indicators.find((i) => i.indicatorId === 'wflh');
    expect(wflh?.status).toBe('calculated');
    expect(wflh?.whoIndicator).toBe('weight-for-length');

    const bmi = result.indicators.find((i) => i.indicatorId === 'bmi');
    expect(bmi?.status).toBe('calculated');
  });

  it('flags stunting when L/HFA z-score is below −2', () => {
    const result = evaluateNutritionGrowthIndicators({
      age: { ageDays: 366, precision: 'exact' },
      measurements: [weightKg(7.0), heightCm(64)],
      answers: [
        {
          questionId: 'child_sex',
          state: 'answered',
          value: { kind: 'option', value: 'female' },
        },
        {
          questionId: 'child_age_months',
          state: 'answered',
          value: { kind: 'number', value: 12 },
        },
      ],
    });

    const lhfa = result.indicators.find((i) => i.indicatorId === 'lhfa');
    expect(lhfa?.status).toBe('calculated');
    expect(lhfa?.zScore).toBeLessThan(-2);
    expect(['moderate', 'severe']).toContain(lhfa?.severity);
    expect(lhfa?.classificationCode).toMatch(/^developmentGrowthStunted/);
  });

  it('uses weight-for-height for children 24 months and older', () => {
    const result = evaluateNutritionGrowthIndicators({
      age: { ageDays: 800, precision: 'exact' },
      measurements: [weightKg(11.5), heightCm(82)],
      answers: [
        {
          questionId: 'child_sex',
          state: 'answered',
          value: { kind: 'option', value: 'male' },
        },
        {
          questionId: 'child_age_months',
          state: 'answered',
          value: { kind: 'number', value: 26 },
        },
      ],
    });

    const wflh = result.indicators.find((i) => i.indicatorId === 'wflh');
    expect(wflh?.whoIndicator).toBe('weight-for-height');
  });

  it('returns insufficient information without sex or age', () => {
    const result = evaluateNutritionGrowthIndicators({
      age: { ageDays: null, precision: 'unknown' },
      measurements: [weightKg(8)],
      answers: [],
    });

    expect(result.status).toBe('insufficientInformation');
    expect(result.indicators).toHaveLength(0);
    expect(result.missingInformation).toEqual(
      expect.arrayContaining(['sex', 'age']),
    );
  });

  it('returns partial results when height is missing', () => {
    const result = evaluateNutritionGrowthIndicators({
      age: { ageDays: 365, precision: 'exact' },
      measurements: [weightKg(9.5)],
      answers: [
        {
          questionId: 'child_sex',
          state: 'answered',
          value: { kind: 'option', value: 'male' },
        },
      ],
    });

    expect(result.status).toBe('partial');
    const wfa = result.indicators.find((i) => i.indicatorId === 'wfa');
    expect(wfa?.status).toBe('calculated');
    const lhfa = result.indicators.find((i) => i.indicatorId === 'lhfa');
    expect(lhfa?.status).toBe('insufficientInformation');
  });
});
