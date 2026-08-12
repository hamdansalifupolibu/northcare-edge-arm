import { getGuidancePackById, getReferencePackById } from '../content/registry';
import { evaluateNutritionReference } from '../engine/referenceEvaluator';
import { resolveNutritionGuidance } from '../engine/guidanceResolver';

describe('nutrition guidance resolution', () => {
  it('resolves SAM guidance when MUAC < 11.5 in development', () => {
    const referencePack = getReferencePackById('synthetic-dev-nutrition-reference-v1', 1, 'development')!;
    const guidancePack = getGuidancePackById('synthetic-dev-nutrition-guidance-v1', 1, 'development')!;
    const reference = evaluateNutritionReference({
      pack: referencePack,
      packLoadable: true,
      age: { ageDays: 400, precision: 'exact' },
      measurements: [
        {
          id: '00000000-0000-4000-8000-000000000010',
          clientId: '00000000-0000-4000-8000-000000000011',
          encounterId: null,
          measurementType: 'muac',
          numericValue: 10.5,
          unit: 'cm',
          notes: null,
          accountId: '00000000-0000-4000-8000-000000000012',
          createdAt: '2026-08-02T12:00:00.000Z',
          updatedAt: '2026-08-02T12:00:00.000Z',
          syncStatus: 'synced',
          isDeleted: false,
        },
      ],
      answers: [],
    });
    expect(reference.interpretationCode).toBe('sam');

    const resolved = resolveNutritionGuidance({
      pack: guidancePack,
      packLoadable: true,
      templateId: 'synthetic-dev-child-nutrition-v1',
      clientCategory: 'childUnderFive',
      answers: [],
      referenceResult: reference,
    });
    expect(resolved.outcome).toBe('guidanceAvailable');
    expect(resolved.cards.map((c) => c.guidanceId)).toContain('sam-urgent-referral');
  });

  it('resolves Normal guidance when MUAC >= 12.5', () => {
    const referencePack = getReferencePackById('synthetic-dev-nutrition-reference-v1', 1, 'development')!;
    const guidancePack = getGuidancePackById('synthetic-dev-nutrition-guidance-v1', 1, 'development')!;
    const reference = evaluateNutritionReference({
      pack: referencePack,
      packLoadable: true,
      age: { ageDays: 400, precision: 'exact' },
      measurements: [
        {
          id: '00000000-0000-4000-8000-000000000010',
          clientId: '00000000-0000-4000-8000-000000000011',
          encounterId: null,
          measurementType: 'muac',
          numericValue: 14.0,
          unit: 'cm',
          notes: null,
          accountId: '00000000-0000-4000-8000-000000000012',
          createdAt: '2026-08-02T12:00:00.000Z',
          updatedAt: '2026-08-02T12:00:00.000Z',
          syncStatus: 'synced',
          isDeleted: false,
        },
      ],
      answers: [],
    });
    expect(reference.interpretationCode).toBe('nutritionNormal');

    const resolved = resolveNutritionGuidance({
      pack: guidancePack,
      packLoadable: true,
      templateId: 'synthetic-dev-child-nutrition-v1',
      clientCategory: 'childUnderFive',
      answers: [],
      referenceResult: reference,
    });
    expect(resolved.outcome).toBe('guidanceAvailable');
    expect(resolved.cards.map((c) => c.guidanceId)).toContain('normal-growth-monitoring');
  });

  it('returns unavailable when reference is not calculated', () => {
    const guidancePack = getGuidancePackById('synthetic-dev-nutrition-guidance-v1', 1, 'development')!;
    const resolved = resolveNutritionGuidance({
      pack: guidancePack,
      packLoadable: true,
      templateId: 'synthetic-dev-child-nutrition-v1',
      clientCategory: 'childUnderFive',
      answers: [],
      referenceResult: {
        status: 'insufficientInformation',
        referencePackId: 'synthetic-dev-nutrition-reference-v1',
        referencePackVersion: 1,
        engineVersion: 1,
        interpretationCode: null,
        derivedValue: null,
        derivedUnit: null,
        explanationId: null,
        missingInformation: ['measurement:muac'],
        inputMeasurementIds: [],
        isDevelopment: true,
        developmentBanner: guidancePack.developmentBanner,
      },
    });
    expect(resolved.outcome).toBe('moreInformationRequired');
    expect(resolved.cards).toHaveLength(0);
  });

  it('blocks guidance packs in production', () => {
    const resolved = resolveNutritionGuidance({
      pack: null,
      packLoadable: false,
      templateId: 'synthetic-dev-child-nutrition-v1',
      clientCategory: 'childUnderFive',
      answers: [],
      referenceResult: null,
    });
    expect(resolved.outcome).toBe('guidancePackUnavailable');
    expect(resolved.cards).toHaveLength(0);
  });
});
