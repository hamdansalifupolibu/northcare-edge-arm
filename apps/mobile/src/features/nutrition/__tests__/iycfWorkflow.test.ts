import { evaluateNutritionCompleteness } from '../engine/completenessEvaluator';
import { SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE } from '../content/assessments/syntheticDevChildNutritionTemplate';
import {
  parseStoredNutritionIndicators,
  serializeStoredNutritionIndicators,
  STORED_NUTRITION_INDICATORS_VERSION,
} from '../engine/storedNutritionIndicators';
import type { NutritionGrowthEvaluationResult } from '../engine/growth/growthIndicatorEvaluator';
import { setupNutritionTest, completeSyntheticChildAssessment } from './helpers';

describe('stored nutrition indicators JSON', () => {
  const growthStub: NutritionGrowthEvaluationResult = {
    status: 'insufficientInformation',
    engineVersion: 1,
    dataSource: 'test',
    isDevelopment: true,
    developmentBanner: 'test',
    indicators: [],
    missingInformation: [],
  };

  it('round-trips v2 payload with growth and iycf', () => {
    const iycfStub = {
      status: 'calculated' as const,
      engineVersion: 1,
      ageMonths: 14,
      ageBand: '6to23' as const,
      mdd: { score: 6, required: 5, met: true, selectedGroups: [] as const },
      mmf: { mealsPerDay: 3, requiredMeals: 3, met: true, breastfed: true },
      minimumAcceptableDiet: true,
      ebf: null,
      feedingDifficultyFlags: [],
      sameFoodCounselingFlag: false,
      counselingNotes: [],
      isDevelopment: true as const,
      developmentBanner: 'test',
    };

    const json = serializeStoredNutritionIndicators({ growth: growthStub, iycf: iycfStub });
    const parsed = JSON.parse(json) as { version: number };
    expect(parsed.version).toBe(STORED_NUTRITION_INDICATORS_VERSION);

    const restored = parseStoredNutritionIndicators(json);
    expect(restored.growth?.status).toBe('insufficientInformation');
    expect(restored.iycf?.minimumAcceptableDiet).toBe(true);
    expect(restored.iycf?.mdd?.score).toBe(6);
  });

  it('parses legacy v1 growth-only JSON without breaking', () => {
    const legacy = JSON.stringify(growthStub);
    const restored = parseStoredNutritionIndicators(legacy);
    expect(restored.growth?.engineVersion).toBe(1);
    expect(restored.iycf).toBeNull();
  });

  it('returns nulls for corrupt JSON', () => {
    expect(parseStoredNutritionIndicators('not-json')).toEqual({ growth: null, iycf: null });
    expect(parseStoredNutritionIndicators('{}')).toEqual({ growth: null, iycf: null });
  });
});

describe('IYCF age-gated completeness', () => {
  it('does not require MDD or meals for infants under 6 months', () => {
    const result = evaluateNutritionCompleteness(SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE, [
      { questionId: 'child_age_months', state: 'answered', value: { kind: 'number', value: 4 } },
      { questionId: 'child_sex', state: 'answered', value: { kind: 'option', value: 'female' } },
      { questionId: 'weight_kg', state: 'answered', value: { kind: 'measurement', value: 6.5 } },
      { questionId: 'muac_cm', state: 'answered', value: { kind: 'measurement', value: 13 } },
      { questionId: 'bilateral_oedema', state: 'answered', value: { kind: 'boolean', value: false } },
      { questionId: 'exclusive_breastfeeding', state: 'answered', value: { kind: 'boolean', value: true } },
      {
        questionId: 'caregiver_counselled',
        state: 'answered',
        value: { kind: 'acknowledgement', value: true },
      },
    ]);

    expect(result.incompleteRequired).not.toContain('mdd_food_groups_yesterday');
    expect(result.incompleteRequired).not.toContain('meals_per_day');
    expect(result.resolvedAnswers.find((a) => a.questionId === 'mdd_food_groups_yesterday')?.state).toBe(
      'skippedByCondition',
    );
  });

  it('requires MDD and meals for children 6–23 months', () => {
    const result = evaluateNutritionCompleteness(SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE, [
      { questionId: 'child_age_months', state: 'answered', value: { kind: 'number', value: 14 } },
      { questionId: 'child_sex', state: 'answered', value: { kind: 'option', value: 'male' } },
      { questionId: 'weight_kg', state: 'answered', value: { kind: 'measurement', value: 10 } },
      { questionId: 'muac_cm', state: 'answered', value: { kind: 'measurement', value: 13 } },
      { questionId: 'bilateral_oedema', state: 'answered', value: { kind: 'boolean', value: false } },
      {
        questionId: 'caregiver_counselled',
        state: 'answered',
        value: { kind: 'acknowledgement', value: true },
      },
    ]);

    expect(result.incompleteRequired).toContain('meals_per_day');
    expect(result.incompleteRequired).toContain('mdd_food_groups_yesterday');
  });
});

describe('IYCF end-to-end workflow and database persistence', () => {
  it('persists MDD answers and IYCF evaluation through complete → getDetails', async () => {
    const { manager, repos, services, accountId, client } = await setupNutritionTest();
    const { assessmentId } = await completeSyntheticChildAssessment({
      services,
      repos,
      accountId,
      clientId: client.id,
    });

    const completed = await services.completeAssessment({
      assessmentId,
      accountId,
      confirmed: true,
      environment: 'development',
    });

    expect(completed.details.iycfEvaluation?.status).toBe('calculated');
    expect(completed.details.iycfEvaluation?.mdd?.met).toBe(true);
    expect(completed.details.iycfEvaluation?.mmf?.met).toBe(true);
    expect(completed.details.iycfEvaluation?.minimumAcceptableDiet).toBe(true);

    const refResults = await repos.nutritionAssessments.listReferenceResults(assessmentId);
    expect(refResults).toHaveLength(1);
    expect(refResults[0]?.growthIndicatorsJson).toBeTruthy();

    const stored = parseStoredNutritionIndicators(refResults[0]!.growthIndicatorsJson!);
    expect(stored.iycf?.mdd?.score).toBe(6);
    expect(stored.growth).not.toBeNull();

    const reloaded = await services.getDetails(assessmentId);
    expect(reloaded?.iycfEvaluation?.minimumAcceptableDiet).toBe(true);
    expect(reloaded?.iycfEvaluation?.mdd?.selectedGroups).toContain('breastmilk');

    const persistedAnswers = await repos.nutritionAssessments.listAnswers(assessmentId);
    const mddRow = persistedAnswers.find((a) => a.questionKey === 'mdd_food_groups_yesterday');
    expect(mddRow?.valueType).toBe('multipleOptions');
    expect(mddRow?.multipleOptionsJson).toBeTruthy();
    const groups = JSON.parse(mddRow!.multipleOptionsJson!) as string[];
    expect(groups.length).toBe(6);

    await manager.close();
  });

  it('flags inadequate feeding when MDD passes but MMF fails — persisted in DB', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    expect(started.kind).toBe('started');
    const assessmentId = started.draft.assessment.id;

    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_age_months', state: 'answered', value: { kind: 'number', value: 14 } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_sex', state: 'answered', value: { kind: 'option', value: 'male' } },
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'weight_kg',
      numericValue: 10,
      unit: 'kg',
      measurementType: 'weight',
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'muac_cm',
      numericValue: 13,
      unit: 'cm',
      measurementType: 'muac',
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'bilateral_oedema', state: 'answered', value: { kind: 'boolean', value: false } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'currently_breastfeeding', state: 'answered', value: { kind: 'boolean', value: true } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'meals_per_day', state: 'answered', value: { kind: 'option', value: '1' } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'mdd_food_groups_yesterday',
        state: 'answered',
        value: {
          kind: 'multipleOptions',
          values: ['grains_roots_tubers', 'legumes_nuts', 'flesh_foods', 'eggs', 'vitamin_a_fruits_vegetables', 'breastmilk'],
        },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'feeding_difficulties', state: 'answered', value: { kind: 'boolean', value: false } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'caregiver_counselled', state: 'answered', value: { kind: 'acknowledgement', value: true } },
    });

    const completed = await services.completeAssessment({
      assessmentId,
      accountId,
      confirmed: true,
      environment: 'development',
    });

    expect(completed.details.iycfEvaluation?.mdd?.met).toBe(true);
    expect(completed.details.iycfEvaluation?.mmf?.met).toBe(false);
    expect(completed.details.iycfEvaluation?.minimumAcceptableDiet).toBe(false);
    expect(completed.details.referenceEvaluation?.interpretationCode).toBe('nutritionNormal');

    const details = await services.getDetails(assessmentId);
    expect(details?.iycfEvaluation?.counselingNotes.some((n) => n.includes('Meals per day'))).toBe(true);

    await manager.close();
  });

  it('blocks completion when required IYCF fields missing for age 14 months', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    const assessmentId = started.draft!.assessment.id;

    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_age_months', state: 'answered', value: { kind: 'number', value: 14 } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_sex', state: 'answered', value: { kind: 'option', value: 'male' } },
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'muac_cm',
      numericValue: 13,
      unit: 'cm',
      measurementType: 'muac',
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'weight_kg',
      numericValue: 10,
      unit: 'kg',
      measurementType: 'weight',
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'bilateral_oedema', state: 'answered', value: { kind: 'boolean', value: false } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'caregiver_counselled', state: 'answered', value: { kind: 'acknowledgement', value: true } },
    });

    const review = await services.reviewAssessment(assessmentId);
    expect(review?.incompleteRequired).toContain('meals_per_day');
    expect(review?.incompleteRequired).toContain('mdd_food_groups_yesterday');

    await expect(
      services.completeAssessment({ assessmentId, accountId, confirmed: true, environment: 'development' }),
    ).rejects.toThrow(/incomplete/i);

    await manager.close();
  });

  it('completes infant under 6 months on EBF path without MDD', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    const assessmentId = started.draft!.assessment.id;

    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_age_months', state: 'answered', value: { kind: 'number', value: 4 } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_sex', state: 'answered', value: { kind: 'option', value: 'female' } },
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'weight_kg',
      numericValue: 6,
      unit: 'kg',
      measurementType: 'weight',
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'muac_cm',
      numericValue: 13.5,
      unit: 'cm',
      measurementType: 'muac',
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'bilateral_oedema', state: 'answered', value: { kind: 'boolean', value: false } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'exclusive_breastfeeding', state: 'answered', value: { kind: 'boolean', value: true } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'caregiver_counselled', state: 'answered', value: { kind: 'acknowledgement', value: true } },
    });

    const completed = await services.completeAssessment({
      assessmentId,
      accountId,
      confirmed: true,
      environment: 'development',
    });

    expect(completed.details.iycfEvaluation?.ageBand).toBe('under6');
    expect(completed.details.iycfEvaluation?.ebf?.exclusiveBreastfeeding).toBe(true);
    expect(completed.details.iycfEvaluation?.mdd).toBeNull();

    const mddAnswer = completed.details.answers.find((a) => a.questionId === 'mdd_food_groups_yesterday');
    expect(mddAnswer?.state).toBe('skippedByCondition');

    await manager.close();
  });

  it('blocks completion when child age is missing — feeding sections stay hidden', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    const assessmentId = started.draft!.assessment.id;

    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'child_sex', state: 'answered', value: { kind: 'option', value: 'male' } },
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'muac_cm',
      numericValue: 13,
      unit: 'cm',
      measurementType: 'muac',
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'weight_kg',
      numericValue: 10,
      unit: 'kg',
      measurementType: 'weight',
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'bilateral_oedema', state: 'answered', value: { kind: 'boolean', value: false } },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'caregiver_counselled', state: 'answered', value: { kind: 'acknowledgement', value: true } },
    });

    const review = await services.reviewAssessment(assessmentId);
    expect(review?.incompleteRequired).toContain('child_age_months');

    await expect(
      services.completeAssessment({ assessmentId, accountId, confirmed: true, environment: 'development' }),
    ).rejects.toThrow(/incomplete/i);

    await manager.close();
  });

  it('does not expose IYCF evaluation on draft assessments via getDetails', async () => {
    const { manager, repos, services, accountId, client } = await setupNutritionTest();
    const { assessmentId } = await completeSyntheticChildAssessment({
      services,
      repos,
      accountId,
      clientId: client.id,
    });

    const draftDetails = await services.getDetails(assessmentId);
    expect(draftDetails?.assessment.status).toBe('draft');
    expect(draftDetails?.iycfEvaluation).toBeNull();

    await manager.close();
  });
});
