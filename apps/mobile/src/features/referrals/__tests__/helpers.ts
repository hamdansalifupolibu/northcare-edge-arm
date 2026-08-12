import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { createReferralServices } from '../application/createReferralServices';

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

export async function setupReferralTest() {
  const { manager, repos } = await createTestDatabase();
  const source = await repos.facilities.create({
    name: 'SYNTHETIC Source Clinic',
    region: 'Northern',
  });
  const destination = await repos.facilities.create({
    name: 'Tamale Teaching Hospital',
    externalCode: 'GH-TTH',
    facilityType: 'TeachingHospital',
    district: 'Tamale Metro',
    region: 'Northern',
  });
  const accountId = '33333333-3333-4333-8333-333333333333';
  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: source.id,
    displayName: 'SYNTHETIC Referral Worker',
  });
  const client = await repos.clients.create({
    clientCode: 'SYN-REF-001',
    category: 'pregnant',
    givenName: 'Ama',
    familyName: 'ReferralSynthetic',
    sex: 'female',
    approximateAge: 28,
    approximateAgeUnit: 'years',
    primaryFacilityId: source.id,
    accountId,
  });
  const services = createReferralServices(repos, {
    withTransaction: (task) => manager.withTransaction(task),
  });
  return {
    manager,
    repos,
    services,
    source,
    destination,
    accountId,
    client,
  };
}
