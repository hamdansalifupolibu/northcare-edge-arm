import type { RepositoryContainer } from '../repositories/contracts/types';
import { createIdGenerator } from '../domain/value-objects/idGenerator';
import { isRepositoryError } from '../repositories/errors/RepositoryError';

export type SelfCheckResult = {
  readonly ok: boolean;
  readonly checks: readonly { readonly name: string; readonly ok: boolean; readonly detail: string }[];
};

/**
 * Development repository self-check using temporary synthetic rows.
 * Does not log health details.
 */
export async function runRepositorySelfCheck(
  repos: RepositoryContainer,
): Promise<SelfCheckResult> {
  const ids = createIdGenerator();
  const checks: { name: string; ok: boolean; detail: string }[] = [];

  const facilityId = ids.nextId();
  const clientId = ids.nextId();

  try {
    await repos.facilities.create({
      id: facilityId,
      name: 'SYNTHETIC Self-Check Facility',
      externalCode: `SYN-SC-${facilityId.slice(0, 8)}`,
    });
    checks.push({ name: 'facility.create', ok: true, detail: 'ok' });

    await repos.clients.create({
      id: clientId,
      clientCode: `SYN-SC-${clientId.slice(0, 8)}`,
      category: 'childUnderFive',
      givenName: 'Self',
      familyName: 'Check',
      primaryFacilityId: facilityId,
      notes: 'SYNTHETIC self-check',
    });
    checks.push({ name: 'client.create', ok: true, detail: 'ok' });

    const found = await repos.clients.findById(clientId);
    checks.push({
      name: 'client.findById',
      ok: found?.id === clientId,
      detail: found ? 'found' : 'missing',
    });

    await repos.clients.archive(clientId);
    const hidden = await repos.clients.findById(clientId);
    const archived = await repos.clients.findById(clientId, { includeDeleted: true });
    checks.push({
      name: 'client.softDelete',
      ok: hidden === null && archived?.isDeleted === true,
      detail: 'soft-delete behaviour',
    });

    await repos.auditEvents.record({
      eventType: 'self_check',
      entityType: 'client',
      entityId: clientId,
      result: 'success',
      metadata: { marker: 'SYNTHETIC' },
    });
    checks.push({ name: 'audit.record', ok: true, detail: 'ok' });
  } catch (error) {
    const category = isRepositoryError(error) ? error.category : 'unknown';
    checks.push({
      name: 'selfCheck',
      ok: false,
      detail: category,
    });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}
