import type { RepositoryContainer } from '../repositories/contracts/types';
import { createIdGenerator } from '../domain/value-objects/idGenerator';
import { DEMO_SEED_AUDIT_EVENT } from './demoAutoSeedFlag';

/** Stable synthetic IDs for development/tests — clearly fictional. */
export const SYNTHETIC_IDS = {
  facility: '11111111-1111-4111-8111-111111111111',
  account: '22222222-2222-4222-8222-222222222222',
  client: '33333333-3333-4333-8333-333333333333',
  caregiver: '44444444-4444-4444-8444-444444444444',
  encounter: '55555555-5555-4555-8555-555555555555',
  referral: '66666666-6666-4666-8666-666666666666',
} as const;

export const HACKATHON_DEMO_IDS = {
  facilityExternalCode: 'fac-dev-001',
  workerAccountId: 'dev-dual-8d2ce4bbb8e656c8afea',
  organisationId: 'org-dev-001',
  clients: [
    '77777777-7777-4777-8777-777777777701',
    '77777777-7777-4777-8777-777777777702',
    '77777777-7777-4777-8777-777777777703',
    '77777777-7777-4777-8777-777777777704',
    '77777777-7777-4777-8777-777777777705',
  ],
  encounters: [
    '88888888-8888-4888-8888-888888888801',
    '88888888-8888-4888-8888-888888888802',
    '88888888-8888-4888-8888-888888888803',
  ],
  referrals: [
    '99999999-9999-4999-8999-999999999901',
    '99999999-9999-4999-8999-999999999902',
    '99999999-9999-4999-8999-999999999903',
  ],
  reminders: [
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04',
  ],
} as const;

export type SyntheticSeedResult = {
  readonly facilityId: string;
  readonly clientId: string;
  readonly encounterId: string;
  readonly referralId: string;
  readonly counts: {
    readonly facilities: number;
    readonly clients: number;
    readonly encounters: number;
    readonly referrals: number;
  };
};

/**
 * Minimal SYNTHETIC fixtures. Never auto-seed production.
 */
export async function seedSyntheticDatabase(
  repos: RepositoryContainer,
): Promise<SyntheticSeedResult> {
  const ids = createIdGenerator();

  const facility = await repos.facilities.create({
    id: SYNTHETIC_IDS.facility,
    name: 'SYNTHETIC Northern Demo Clinic',
    externalCode: 'SYN-FAC-001',
    facilityType: 'CHPS',
    district: 'SYNTHETIC District',
    region: 'Northern',
    isActive: true,
  });

  await repos.localAccounts.upsert({
    accountId: SYNTHETIC_IDS.account,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'SYNTHETIC Worker Amina',
  });

  const client = await repos.clients.create({
    id: SYNTHETIC_IDS.client,
    clientCode: 'SYN-CLIENT-001',
    category: 'pregnant',
    givenName: 'Ama',
    familyName: 'Synthetic',
    preferredName: 'Ama S.',
    sex: 'female',
    dateOfBirth: '1998-04-12',
    pregnancyStatus: 'pregnant',
    estimatedDeliveryDate: '2026-11-15',
    phoneNumber: '+233000000001',
    community: 'SYNTHETIC Community',
    district: 'SYNTHETIC District',
    region: 'Northern',
    primaryFacilityId: facility.id,
    consentStatus: 'recorded',
    notes: 'SYNTHETIC fixture — not a real person',
    accountId: SYNTHETIC_IDS.account,
  });

  const caregiver = await repos.caregivers.create({
    id: SYNTHETIC_IDS.caregiver,
    givenName: 'Kofi',
    familyName: 'Synthetic',
    phoneNumber: '+233000000002',
    community: 'SYNTHETIC Community',
    notes: 'SYNTHETIC caregiver',
    accountId: SYNTHETIC_IDS.account,
  });

  await repos.caregivers.createRelationship({
    clientId: client.id,
    caregiverId: caregiver.id,
    relationshipType: 'guardian',
    isPrimary: true,
    accountId: SYNTHETIC_IDS.account,
  });

  const encounter = await repos.encounters.createDraft({
    id: SYNTHETIC_IDS.encounter,
    clientId: client.id,
    encounterType: 'antenatalVisit',
    facilityId: facility.id,
    workerAccountId: SYNTHETIC_IDS.account,
    notes: 'SYNTHETIC draft encounter',
    accountId: SYNTHETIC_IDS.account,
  });

  const referral = await repos.referrals.createDraft({
    id: SYNTHETIC_IDS.referral,
    clientId: client.id,
    encounterId: encounter.id,
    sourceFacilityId: facility.id,
    receivingFacilityId: facility.id,
    priority: 'amber',
    reasonSummary: 'SYNTHETIC referral reason — not clinical advice',
    accountId: SYNTHETIC_IDS.account,
  });

  await repos.syncQueue.enqueue({
    id: ids.nextId(),
    entityType: 'client',
    entityId: client.id,
    operation: 'create',
  });

  await repos.auditEvents.record({
    eventType: 'synthetic_seed_completed',
    entityType: 'database',
    entityId: null,
    actorAccountId: SYNTHETIC_IDS.account,
    result: 'success',
    metadata: { marker: 'SYNTHETIC', fixtureVersion: 1 },
  });

  return {
    facilityId: facility.id,
    clientId: client.id,
    encounterId: encounter.id,
    referralId: referral.id,
    counts: {
      facilities: 1,
      clients: 1,
      encounters: 1,
      referrals: 1,
    },
  };
}

export type HackathonDemoSeedResult = SyntheticSeedResult & {
  readonly counts: SyntheticSeedResult['counts'] & {
    readonly reminders: number;
  };
};

async function ensureDemoFacility(repos: RepositoryContainer) {
  const existing = await repos.facilities.findByExternalCode(HACKATHON_DEMO_IDS.facilityExternalCode);
  if (existing) {
    return existing;
  }
  return repos.facilities.create({
    id: HACKATHON_DEMO_IDS.facilityExternalCode,
    name: 'Demo CHPS Compound',
    externalCode: HACKATHON_DEMO_IDS.facilityExternalCode,
    facilityType: 'CHPS',
    district: 'Tamale Metro (demo)',
    region: 'Northern',
    isActive: true,
  });
}

/**
 * Rich SYNTHETIC fixtures for hackathon demos — multiple clients, referrals, reminders.
 * Never auto-seed production.
 */
export async function seedHackathonDemoDatabase(
  repos: RepositoryContainer,
): Promise<HackathonDemoSeedResult> {
  const ids = createIdGenerator();
  const accountId = HACKATHON_DEMO_IDS.workerAccountId;
  const facility = await ensureDemoFacility(repos);

  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'Hamdan Salifu Polibu',
  });

  const clientProfiles = [
    {
      id: HACKATHON_DEMO_IDS.clients[0]!,
      code: 'DEMO-CLIENT-001',
      givenName: 'Ama',
      familyName: 'Demo',
      category: 'pregnant' as const,
      community: 'Kpalsi (demo)',
      pregnancyStatus: 'pregnant',
    },
    {
      id: HACKATHON_DEMO_IDS.clients[1]!,
      code: 'DEMO-CLIENT-002',
      givenName: 'Fatima',
      familyName: 'Demo',
      category: 'postnatal' as const,
      community: 'Sagnarigu (demo)',
      pregnancyStatus: 'postnatal',
    },
    {
      id: HACKATHON_DEMO_IDS.clients[2]!,
      code: 'DEMO-CLIENT-003',
      givenName: 'Rahinatu',
      familyName: 'Demo',
      category: 'childUnderFive' as const,
      community: 'Tolon (demo)',
      pregnancyStatus: null,
    },
    {
      id: HACKATHON_DEMO_IDS.clients[3]!,
      code: 'DEMO-CLIENT-004',
      givenName: 'Zuwera',
      familyName: 'Demo',
      category: 'pregnant' as const,
      community: 'Savelugu (demo)',
      pregnancyStatus: 'pregnant',
    },
    {
      id: HACKATHON_DEMO_IDS.clients[4]!,
      code: 'DEMO-CLIENT-005',
      givenName: 'Mariama',
      familyName: 'Demo',
      category: 'childUnderFive' as const,
      community: 'Yendi (demo)',
      pregnancyStatus: null,
    },
  ];

  for (const profile of clientProfiles) {
    const exists = await repos.clients.findById(profile.id);
    if (exists) {
      continue;
    }
    await repos.clients.create({
      id: profile.id,
      clientCode: profile.code,
      category: profile.category,
      givenName: profile.givenName,
      familyName: profile.familyName,
      preferredName: `${profile.givenName} D.`,
      sex: 'female',
      dateOfBirth: '1996-03-18',
      pregnancyStatus: profile.pregnancyStatus,
      estimatedDeliveryDate: profile.category === 'pregnant' ? '2026-12-01' : null,
      phoneNumber: '+233200000001',
      community: profile.community,
      district: 'Northern (demo)',
      region: 'Northern',
      primaryFacilityId: facility.id,
      consentStatus: 'recorded',
      notes: 'SYNTHETIC hackathon demo client — not a real person',
      accountId,
    });
  }

  const encounterIds: string[] = [];
  for (let index = 0; index < HACKATHON_DEMO_IDS.encounters.length; index += 1) {
    const encounterId = HACKATHON_DEMO_IDS.encounters[index]!;
    const clientId = HACKATHON_DEMO_IDS.clients[index]!;
    const existing = await repos.encounters.findById(encounterId);
    if (existing) {
      encounterIds.push(encounterId);
      continue;
    }
    const encounter = await repos.encounters.createDraft({
      id: encounterId,
      clientId,
      encounterType: index === 0 ? 'antenatalVisit' : 'childVisit',
      facilityId: facility.id,
      workerAccountId: accountId,
      notes: 'SYNTHETIC demo encounter',
      accountId,
    });
    encounterIds.push(encounter.id);
  }

  const referralPriorities = ['red', 'amber', 'green'] as const;
  for (let index = 0; index < HACKATHON_DEMO_IDS.referrals.length; index += 1) {
    const referralId = HACKATHON_DEMO_IDS.referrals[index]!;
    const existing = await repos.referrals.findById(referralId);
    if (existing) {
      continue;
    }
    await repos.referrals.createDraft({
      id: referralId,
      clientId: HACKATHON_DEMO_IDS.clients[index]!,
      encounterId: encounterIds[index] ?? null,
      sourceFacilityId: facility.id,
      receivingFacilityId: facility.id,
      priority: referralPriorities[index] ?? 'amber',
      reasonSummary: `SYNTHETIC ${referralPriorities[index] ?? 'amber'} referral for demo`,
      accountId,
    });
  }

  const reminderSchedule = [
    { date: '2026-08-12', time: '09:00:00', type: 'visitFollowUp' as const },
    { date: '2026-08-13', time: '11:30:00', type: 'nutritionFollowUp' as const },
    { date: '2026-08-14', time: '08:15:00', type: 'referralFollowUp' as const },
    { date: '2026-08-15', time: '14:00:00', type: 'generalFollowUp' as const },
  ];

  for (let index = 0; index < HACKATHON_DEMO_IDS.reminders.length; index += 1) {
    const reminderId = HACKATHON_DEMO_IDS.reminders[index]!;
    const existing = await repos.followUpReminders.findById(reminderId);
    if (existing) {
      continue;
    }
    const schedule = reminderSchedule[index]!;
    await repos.followUpReminders.create({
      id: reminderId,
      accountId,
      organisationId: HACKATHON_DEMO_IDS.organisationId,
      facilityId: facility.id,
      clientId: HACKATHON_DEMO_IDS.clients[index % HACKATHON_DEMO_IDS.clients.length]!,
      encounterId: encounterIds[index % encounterIds.length] ?? null,
      sourceType: 'workerCreated',
      sourceEntityId: null,
      reminderType: schedule.type,
      status: 'active',
      scheduledForUtc: `${schedule.date}T${schedule.time}Z`,
      originalTimeZone: 'Africa/Accra',
      originalLocalDate: schedule.date,
      originalLocalTime: schedule.time.slice(0, 5),
      note: 'SYNTHETIC demo reminder',
    });
  }

  await repos.syncQueue.enqueue({
    id: ids.nextId(),
    entityType: 'client',
    entityId: HACKATHON_DEMO_IDS.clients[0]!,
    operation: 'create',
  });

  await repos.auditEvents.record({
    eventType: DEMO_SEED_AUDIT_EVENT,
    entityType: 'database',
    entityId: null,
    actorAccountId: accountId,
    result: 'success',
    metadata: { marker: 'SYNTHETIC', fixtureVersion: 2, purpose: 'hackathon-demo' },
  });

  return {
    facilityId: facility.id,
    clientId: HACKATHON_DEMO_IDS.clients[0]!,
    encounterId: encounterIds[0]!,
    referralId: HACKATHON_DEMO_IDS.referrals[0]!,
    counts: {
      facilities: 1,
      clients: clientProfiles.length,
      encounters: encounterIds.length,
      referrals: HACKATHON_DEMO_IDS.referrals.length,
      reminders: HACKATHON_DEMO_IDS.reminders.length,
    },
  };
}
