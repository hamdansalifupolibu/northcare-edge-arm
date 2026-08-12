import type { Measurement } from '../../../data/domain/entities/entities';
import { getReferencePackById } from '../content/registry';
import { SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK } from '../content/references/syntheticDevNutritionReferencePack';
import { evaluateNutritionReference } from '../engine/referenceEvaluator';

const baseAge = { ageDays: 365, precision: 'exact' as const };

function muacMeasurement(value: number): Measurement {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    clientId: '00000000-0000-4000-8000-000000000002',
    encounterId: null,
    measurementType: 'muac',
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

describe('nutrition reference engine — WHO MUAC classification', () => {
  it('classifies SAM when bilateral oedema is present', () => {
    const pack = getReferencePackById(
      SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK.referencePackId,
      1,
      'development',
    )!;
    const result = evaluateNutritionReference({
      pack,
      packLoadable: true,
      age: baseAge,
      measurements: [muacMeasurement(13.0)],
      answers: [
        {
          questionId: 'bilateral_oedema',
          state: 'answered',
          value: { kind: 'boolean', value: true },
        },
      ],
    });
    expect(result.status).toBe('calculated');
    expect(result.interpretationCode).toBe('sam');
  });

  it('classifies SAM when MUAC < 11.5 cm', () => {
    const pack = getReferencePackById(
      SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK.referencePackId,
      1,
      'development',
    )!;
    const result = evaluateNutritionReference({
      pack,
      packLoadable: true,
      age: baseAge,
      measurements: [muacMeasurement(10.8)],
      answers: [],
    });
    expect(result.status).toBe('calculated');
    expect(result.interpretationCode).toBe('sam');
  });

  it('classifies MAM when MUAC is between 11.5 and 12.4 cm', () => {
    const pack = getReferencePackById(
      SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK.referencePackId,
      1,
      'development',
    )!;
    const result = evaluateNutritionReference({
      pack,
      packLoadable: true,
      age: baseAge,
      measurements: [muacMeasurement(12.0)],
      answers: [],
    });
    expect(result.status).toBe('calculated');
    expect(result.interpretationCode).toBe('mam');
  });

  it('classifies nutritionNormal when MUAC >= 12.5 cm', () => {
    const pack = getReferencePackById(
      SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK.referencePackId,
      1,
      'development',
    )!;
    const result = evaluateNutritionReference({
      pack,
      packLoadable: true,
      age: baseAge,
      measurements: [muacMeasurement(13.5)],
      answers: [],
    });
    expect(result.status).toBe('calculated');
    expect(result.interpretationCode).toBe('nutritionNormal');
  });

  it('fails closed when pack unavailable or unapproved in production', () => {
    const unavailable = evaluateNutritionReference({
      pack: null,
      packLoadable: false,
      age: baseAge,
      measurements: [],
      answers: [],
    });
    expect(unavailable.status).toBe('referencePackUnavailable');

    const unapproved = evaluateNutritionReference({
      pack: SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK,
      packLoadable: false,
      age: baseAge,
      measurements: [muacMeasurement(10)],
      answers: [],
    });
    expect(unapproved.status).toBe('referencePackUnapproved');
  });

  it('reports insufficient information without MUAC measurement', () => {
    const pack = getReferencePackById(
      SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK.referencePackId,
      1,
      'development',
    )!;
    const result = evaluateNutritionReference({
      pack,
      packLoadable: true,
      age: baseAge,
      measurements: [],
      answers: [],
    });
    expect(result.status).toBe('insufficientInformation');
    expect(result.interpretationCode).toBeNull();
  });
});
