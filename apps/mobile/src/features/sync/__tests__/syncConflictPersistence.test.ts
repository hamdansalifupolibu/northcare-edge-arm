import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';

describe('sync conflict persistence', () => {
  it('keeps conflicts locally until an explicit resolution', async () => {
    const { manager, repos } = await createTestDatabase();
    try {
      await repos.syncConflicts.upsert({
        id: 'conflict-1', serverConflictId: 'remote-1', entityType: 'client',
        entityId: 'client-1', conflictClass: 'staleBaseVersion', state: 'open',
      });
      expect(await repos.syncConflicts.listOpen()).toHaveLength(1);
      await repos.syncConflicts.resolve('conflict-1', 'keptForReview', 'keepForReview');
      expect(await repos.syncConflicts.listOpen()).toHaveLength(0);
    } finally {
      await manager.close();
    }
  });
});
