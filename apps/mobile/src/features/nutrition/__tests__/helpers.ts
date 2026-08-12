import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { createNutritionServices } from '../application/createNutritionServices';

export function createSequentialIds(): IdGenerator {
  let n = 0;
  return {
    nextId: () => {
      n += 1;
      const hex = n.toString(16).padStart(12, '0');
      return `00000000-0000-4000-8000-${hex}`;
    },
  };
}

export async function setupNutritionTest(options?: {
  readonly category?: ClientCategory;
  readonly dateOfBirth?: string;
  readonly withEncounter?: boolean;
}) {
  const { manager, repos } = await createTestDatabase();
  const facility = await repos.facilities.create({
    name: 'SYNTHETIC Nutrition Clinic',
    region: 'Northern',
  });
  const accountId = '55555555-5555-4555-8555-555555555555';
  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'SYNTHETIC Nutrition Worker',
  });
  const category = options?.category ?? 'childUnderFive';
  const client = await repos.clients.create({
    clientCode: 'SYN-NUT-001',
    category,
    givenName: 'Kofi',
    familyName: 'NutritionSynthetic',
    primaryFacilityId: facility.id,
    accountId,
    dateOfBirth: options?.dateOfBirth ?? '2023-01-15',
  });

  let encounterId: string | null = null;
  if (options?.withEncounter) {
    const encounter = await repos.encounters.createDraft({
      clientId: client.id,
      encounterType: 'childWellness',
      facilityId: facility.id,
      accountId,
    });
    encounterId = encounter.id;
  }

  const services = createNutritionServices(repos, {
    withTransaction: (task) => manager.withTransaction(task),
  });

  return {
    manager,
    repos,
    services,
    facility,
    accountId,
    client,
    encounterId,
  };
}

export async function completeSyntheticChildAssessment(input: {
  readonly services: ReturnType<typeof createNutritionServices>;
  readonly repos: Awaited<ReturnType<typeof setupNutritionTest>>['repos'];
  readonly accountId: string;
  readonly clientId: string;
  readonly encounterId?: string | null;
}) {
  const started = await input.services.startAssessment({
    clientId: input.clientId,
    accountId: input.accountId,
    assessmentType: 'childNutrition',
    encounterId: input.encounterId ?? null,
    environment: 'development',
  });
  if (started.kind !== 'started' && started.kind !== 'existingDraft') {
    throw new Error(`Expected started draft, got ${started.kind}`);
  }
  const assessmentId = started.draft.assessment.id;
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'child_age_months',
      state: 'answered',
      value: { kind: 'number', value: 12 },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'child_sex',
      state: 'answered',
      value: { kind: 'option', value: 'male' },
    },
  });
  await input.services.recordMeasurement({
    assessmentId,
    accountId: input.accountId,
    questionId: 'weight_kg',
    numericValue: 10.5,
    unit: 'kg',
    measurementType: 'weight',
  });
  await input.services.recordMeasurement({
    assessmentId,
    accountId: input.accountId,
    questionId: 'muac_cm',
    numericValue: 13.0,
    unit: 'cm',
    measurementType: 'muac',
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'bilateral_oedema',
      state: 'answered',
      value: { kind: 'boolean', value: false },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'currently_breastfeeding',
      state: 'answered',
      value: { kind: 'boolean', value: true },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'complementary_feeding',
      state: 'answered',
      value: { kind: 'option', value: 'yes' },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'meals_per_day',
      state: 'answered',
      value: { kind: 'option', value: '3' },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'mdd_food_groups_yesterday',
      state: 'answered',
      value: {
        kind: 'multipleOptions',
        values: [
          'grains_roots_tubers',
          'legumes_nuts',
          'flesh_foods',
          'eggs',
          'vitamin_a_fruits_vegetables',
          'breastmilk',
        ],
      },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'feeding_difficulties',
      state: 'answered',
      value: { kind: 'boolean', value: false },
    },
  });
  await input.services.recordAnswer({
    assessmentId,
    accountId: input.accountId,
    answer: {
      questionId: 'caregiver_counselled',
      state: 'answered',
      value: { kind: 'acknowledgement', value: true },
    },
  });
  return { assessmentId, started };
}
