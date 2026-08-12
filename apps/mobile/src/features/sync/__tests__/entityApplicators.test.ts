import { applyRemoteChange } from '../application/entityApplicators';
import type { PullChange } from '../domain/protocol';

type FakeConflict = {
  id: string;
  entityType: string;
  entityId: string;
  state: string;
};

function createFakeDb(existingIds: Set<string> = new Set()) {
  const updates: string[] = [];
  return {
    updates,
    db: {
      async runAsync(sql: string) {
        updates.push(sql);
        const idMatch = /VALUES \(\?/.test(sql);
        if (idMatch) {
          // no-op for fake
        }
      },
      async getFirstAsync(_sql: string, params?: unknown[]) {
        const id = String(params?.[0] ?? '');
        return existingIds.has(id) ? { id } : null;
      },
      async getAllAsync() {
        return [];
      },
    },
  };
}

describe('applyRemoteChange', () => {
  it('upserts a remote client without advancing past local pending conflicts', async () => {
    const conflicts: FakeConflict[] = [];
    const { db, updates } = createFakeDb();
    const repos = {
      syncQueue: {
        listByState: async () => [],
      },
      syncConflicts: {
        upsert: async (input: FakeConflict) => {
          conflicts.push(input);
        },
      },
    };

    const change: PullChange = {
      changeId: 'c1',
      entityType: 'client',
      entityId: '11111111-1111-4111-8111-111111111111',
      operation: 'upsert',
      serverVersion: 2,
      payload: {
        clientCode: 'SYNC-A',
        givenName: 'Ama',
        familyName: 'Mensah',
        category: 'childUnderFive',
      },
      deleted: false,
      changedAt: '2026-08-02T12:00:00.000Z',
    };

    await applyRemoteChange({
      repos: repos as never,
      db: db as never,
      change,
      now: '2026-08-02T12:00:00.000Z' as never,
    });

    expect(updates.some((sql) => sql.includes('INSERT INTO clients'))).toBe(true);
    expect(conflicts).toHaveLength(0);
  });

  it('records a conflict when a local queue item is still active', async () => {
    const conflicts: FakeConflict[] = [];
    const { db, updates } = createFakeDb(new Set(['11111111-1111-4111-8111-111111111111']));
    const repos = {
      syncQueue: {
        listByState: async (state: string) =>
          state === 'pending'
            ? [{ entityType: 'client', entityId: '11111111-1111-4111-8111-111111111111' }]
            : [],
      },
      syncConflicts: {
        upsert: async (input: FakeConflict) => {
          conflicts.push(input);
        },
      },
    };

    await applyRemoteChange({
      repos: repos as never,
      db: db as never,
      change: {
        changeId: 'c2',
        entityType: 'client',
        entityId: '11111111-1111-4111-8111-111111111111',
        operation: 'upsert',
        serverVersion: 3,
        payload: { givenName: 'Server' },
        deleted: false,
        changedAt: '2026-08-02T12:00:00.000Z',
      },
      now: '2026-08-02T12:00:00.000Z' as never,
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.state).toBe('open');
    expect(updates.some((sql) => sql.includes("sync_status = 'conflict'"))).toBe(true);
    expect(updates.some((sql) => sql.includes('INSERT INTO clients'))).toBe(false);
  });

  it('applies tombstones as soft-deletes with server version', async () => {
    const { db, updates } = createFakeDb(new Set(['11111111-1111-4111-8111-111111111111']));
    const repos = {
      syncQueue: { listByState: async () => [] },
      syncConflicts: { upsert: async () => undefined },
    };
    await applyRemoteChange({
      repos: repos as never,
      db: db as never,
      change: {
        changeId: 'c3',
        entityType: 'client',
        entityId: '11111111-1111-4111-8111-111111111111',
        operation: 'delete',
        serverVersion: 4,
        payload: null,
        deleted: true,
        changedAt: '2026-08-02T12:00:00.000Z',
      },
      now: '2026-08-02T12:00:00.000Z' as never,
    });
    expect(updates.some((sql) => sql.includes('is_deleted = 1'))).toBe(true);
    expect(updates.some((sql) => sql.includes('server_version'))).toBe(true);
  });

  it('rejects unknown entity types without writing local rows', async () => {
    const { db, updates } = createFakeDb();
    const repos = {
      syncQueue: { listByState: async () => [] },
      syncConflicts: { upsert: async () => undefined },
    };
    await expect(
      applyRemoteChange({
        repos: repos as never,
        db: db as never,
        change: {
          changeId: 'c4',
          entityType: 'unknown_entity_type',
          entityId: '11111111-1111-4111-8111-111111111111',
          operation: 'upsert',
          serverVersion: 1,
          payload: {},
          deleted: false,
          changedAt: '2026-08-02T12:00:00.000Z',
        },
        now: '2026-08-02T12:00:00.000Z' as never,
      }),
    ).rejects.toThrow(/No approved local applicator/);
    expect(updates).toHaveLength(0);
  });
});
