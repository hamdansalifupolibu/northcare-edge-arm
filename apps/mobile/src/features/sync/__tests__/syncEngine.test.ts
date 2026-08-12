import { createSyncEngine, type SyncStore } from '../engine/syncEngine';
import type { SyncTransport } from '../transport/syncTransport';

const queue = {
  id: 'queue-1', operationId: 'operation-1', entityType: 'client', entityId: 'client-1',
  operation: 'update' as const, baseServerVersion: 2, clientLocalVersion: 3,
  payload: { id: 'client-1' }, occurredAt: '2026-08-02T00:00:00.000Z', requestHash: 'hash',
};

function setup() {
  const calls: string[] = [];
  const store: SyncStore = {
    deviceId: async () => 'device-1', listReady: async () => [queue],
    markAcknowledged: async () => { calls.push('ack'); }, markConflict: async () => { calls.push('conflict'); },
    markRejected: async () => { calls.push('rejected'); }, cursor: async () => null,
    applyChange: async () => { calls.push('apply'); }, saveCursor: async () => { calls.push('cursor'); },
    recordFailure: async () => { calls.push('failure'); }, recordSuccess: async () => { calls.push('success'); },
  };
  const transport: SyncTransport = {
    registerDevice: async () => { calls.push('register'); },
    push: async () => [{ operationId: 'operation-1', status: 'acked', serverVersion: 3 }],
    pull: async () => ({ changes: [{ changeId: '1', entityType: 'client', entityId: 'server-1', operation: 'upsert', serverVersion: 1, payload: {}, deleted: false, changedAt: '2026-08-02T00:00:00.000Z' }], nextCursor: 'cursor-1', hasMore: false }),
    listConflicts: async () => [], resolveConflict: async () => undefined,
  };
  return { calls, store, transport };
}

describe('sync engine', () => {
  it('acknowledges only after push acknowledgement and saves cursor after apply', async () => {
    const { calls, store, transport } = setup();
    await createSyncEngine(transport, store).syncNow();
    expect(calls.indexOf('ack')).toBeGreaterThan(calls.indexOf('register'));
    expect(calls.indexOf('cursor')).toBeGreaterThan(calls.indexOf('apply'));
  });

  it('coalesces concurrent sync requests into one run', async () => {
    const { store, transport } = setup();
    const engine = createSyncEngine(transport, store);
    const [first, second] = await Promise.all([engine.syncNow(), engine.syncNow()]);
    expect(first).toEqual(second);
  });

  it('does not advance the cursor when local application fails', async () => {
    const { calls, store, transport } = setup();
    store.applyChange = async () => { throw new Error('local apply failed'); };
    await expect(createSyncEngine(transport, store).syncNow()).rejects.toThrow('local apply failed');
    expect(calls).not.toContain('cursor');
  });

  it('does not advance cursor when the middle pull change fails', async () => {
    const { calls, store, transport } = setup();
    let applied = 0;
    transport.pull = async () => ({
      changes: [
        { changeId: '1', entityType: 'client', entityId: 'a', operation: 'upsert', serverVersion: 1, payload: {}, deleted: false, changedAt: '2026-08-02T00:00:00.000Z' },
        { changeId: '2', entityType: 'client', entityId: 'b', operation: 'upsert', serverVersion: 1, payload: {}, deleted: false, changedAt: '2026-08-02T00:00:00.000Z' },
        { changeId: '3', entityType: 'client', entityId: 'c', operation: 'upsert', serverVersion: 1, payload: {}, deleted: false, changedAt: '2026-08-02T00:00:00.000Z' },
      ],
      nextCursor: 'cursor-mid',
      hasMore: false,
    });
    store.applyChange = async () => {
      applied += 1;
      if (applied === 2) throw new Error('middle apply failed');
      calls.push('apply');
    };
    await expect(createSyncEngine(transport, store).syncNow()).rejects.toThrow('middle apply failed');
    expect(calls).not.toContain('cursor');
  });

  it('retries the same pull batch successfully after a prior apply failure', async () => {
    const { calls, store, transport } = setup();
    let attempts = 0;
    transport.pull = async () => ({
      changes: [
        { changeId: '1', entityType: 'client', entityId: 'server-1', operation: 'upsert', serverVersion: 1, payload: {}, deleted: false, changedAt: '2026-08-02T00:00:00.000Z' },
      ],
      nextCursor: 'cursor-retry',
      hasMore: false,
    });
    store.applyChange = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('transient');
      calls.push('apply');
    };
    const engine = createSyncEngine(transport, store);
    await expect(engine.syncNow()).rejects.toThrow('transient');
    expect(calls).not.toContain('cursor');
    await engine.syncNow();
    expect(calls.indexOf('cursor')).toBeGreaterThan(calls.indexOf('apply'));
  });

  it('keeps single-flight ownership across overlapping syncNow calls', async () => {
    const { store, transport } = setup();
    let pullCount = 0;
    transport.pull = async () => {
      pullCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { changes: [], nextCursor: null, hasMore: false };
    };
    const engine = createSyncEngine(transport, store);
    await Promise.all([engine.syncNow(), engine.syncNow(), engine.syncNow()]);
    expect(pullCount).toBe(1);
  });
});
