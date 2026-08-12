import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { createVoiceFileManager, type VoiceFileSystemGateway } from '../audio/fileManager';
import { createVoiceServices } from '../application/createVoiceServices';

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

export function createMockVoiceFileSystem(initial?: {
  readonly tempUri?: string;
  readonly tempSize?: number;
}): VoiceFileSystemGateway {
  const files = new Map<string, { size: number }>();
  const managedDir = 'file:///mock/voice/';
  if (initial?.tempUri) {
    files.set(initial.tempUri, { size: initial.tempSize ?? 1024 });
  }
  return {
    async ensureManagedDirectory() {
      return managedDir;
    },
    async getInfo(uri) {
      const entry = files.get(uri);
      return entry
        ? { exists: true, size: entry.size, isDirectory: false }
        : { exists: false, size: null, isDirectory: false };
    },
    async moveAsync(from, to) {
      const entry = files.get(from);
      if (!entry) {
        throw new Error('missing-source');
      }
      files.set(to, entry);
      files.delete(from);
    },
    async copyAsync(from, to) {
      const entry = files.get(from);
      if (!entry) {
        throw new Error('missing-source');
      }
      files.set(to, { ...entry });
    },
    async deleteAsync(uri) {
      files.delete(uri);
    },
    async listManagedFilenames() {
      return [...files.keys()]
        .filter((uri) => uri.startsWith(managedDir))
        .map((uri) => uri.replace(managedDir, ''));
    },
  };
}

export async function setupVoiceTest(options?: {
  readonly withEncounter?: boolean;
  readonly withScreening?: boolean;
}) {
  const { manager, repos } = await createTestDatabase();
  const facility = await repos.facilities.create({
    name: 'SYNTHETIC Voice Clinic',
    region: 'Northern',
  });
  const accountId = '44444444-4444-4444-8444-444444444444';
  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'SYNTHETIC Voice Worker',
  });
  const client = await repos.clients.create({
    clientCode: 'SYN-VOC-001',
    category: 'pregnant',
    givenName: 'Amina',
    familyName: 'VoiceSynthetic',
    primaryFacilityId: facility.id,
    accountId,
  });

  let encounterId: string | null = null;
  let screeningId: string | null = null;
  if (options?.withEncounter) {
    const encounter = await repos.encounters.createDraft({
      clientId: client.id,
      encounterType: 'antenatalVisit',
      facilityId: facility.id,
      accountId,
    });
    encounterId = encounter.id;
    if (options.withScreening) {
      const screening = await repos.screenings.create({
        encounterId: encounter.id,
        clientId: client.id,
        screeningType: 'antenatal',
        accountId,
      });
      screeningId = screening.id;
    }
  }

  const fs = createMockVoiceFileSystem({
    tempUri: 'file:///tmp/voice-test.m4a',
    tempSize: 2048,
  });
  const fileManager = createVoiceFileManager(fs);
  const services = createVoiceServices(
    repos,
    { withTransaction: (task) => manager.withTransaction(task) },
    { fileManager },
  );

  return {
    manager,
    repos,
    services,
    facility,
    accountId,
    client,
    encounterId,
    screeningId,
    fs,
    fileManager,
  };
}
