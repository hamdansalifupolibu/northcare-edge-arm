import { createTestDatabase } from './helpers/testDatabase';

/**
 * Non-device performance baseline (Node / Jest).
 * Do not present these timings as Android approval.
 */
describe('database performance baseline (non-device)', () => {
  it('records open/migrate/insert/search timings', async () => {
    const openStarted = Date.now();
    const { manager, repos } = await createTestDatabase();
    const openMs = Date.now() - openStarted;

    const insertStarted = Date.now();
    for (let i = 0; i < 10; i += 1) {
      await repos.clients.create({
        clientCode: `SYN-PERF-${i}`,
        category: 'pregnant',
        givenName: `Perf${i}`,
        familyName: 'Synthetic',
      });
    }
    const insertMs = Date.now() - insertStarted;

    const searchStarted = Date.now();
    const results = await repos.clients.search('synthetic');
    const searchMs = Date.now() - searchStarted;

    expect(results.length).toBeGreaterThanOrEqual(10);
    // Soft ceilings for CI — environment-dependent, not device claims.
    expect(openMs).toBeLessThan(5000);
    expect(insertMs).toBeLessThan(5000);
    expect(searchMs).toBeLessThan(2000);

    const profileStarted = Date.now();
    const profile = await repos.clients.findById(results[0]!.id);
    const profileMs = Date.now() - profileStarted;
    expect(profile).not.toBeNull();

    console.info(
      JSON.stringify({
        environment: 'node-jest-non-device',
        note: 'Not Android device timings',
        openAndMigrateMs: openMs,
        insert10ClientsMs: insertMs,
        searchMs,
        profileLoadMs: profileMs,
      }),
    );

    await manager.close();
  });
});
