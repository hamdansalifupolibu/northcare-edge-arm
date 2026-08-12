/** @jest-environment node */

jest.mock('firebase-functions/params', () => ({
  defineString: (_name: string, options?: { default?: string }) => ({
    value: () => options?.default ?? 'NorthCareDemo1!',
  }),
}));

import request from 'supertest';

import { createApp } from '../app';
import { setTestDb } from '../db';
import {
  createInMemoryFirestore,
  getInMemoryStore,
} from '../testing/inMemoryFirestore';

const DEMO_PASSWORD = 'NorthCareDemo1!';
const WORKER_EMAIL = 'hamdansalifupolibu@gmail.com';
const ADMIN_EMAIL = 'hammydanny1@gmail.com';

async function fetchToken(app: ExpressApplication, email: string): Promise<string> {
  const response = await request(app)
    .post('/v1/development/auth/token')
    .send({ email, password: DEMO_PASSWORD });
  expect(response.status).toBe(200);
  return response.body.access_token as string;
}

type ExpressApplication = ReturnType<typeof createApp>;

describe('NorthCare Firebase demo sync flow', () => {
  let app: ExpressApplication;

  beforeEach(() => {
    setTestDb(createInMemoryFirestore());
    app = createApp();
  });

  afterEach(() => {
    setTestDb(null);
  });

  it('exposes health check without auth', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('issues worker and admin tokens for demo accounts', async () => {
    const workerToken = await fetchToken(app, WORKER_EMAIL);
    const adminToken = await fetchToken(app, ADMIN_EMAIL);
    expect(workerToken.length).toBeGreaterThan(20);
    expect(adminToken.length).toBeGreaterThan(20);
  });

  it('issues tokens for super-user colleagues with per-account passwords', async () => {
    for (const email of ['salmaabukari4@gmail.com', 'ibrahimtakiya06@gmail.com']) {
      const response = await request(app)
        .post('/v1/development/auth/token')
        .send({ email, password: 'NorthCare@123' });
      expect(response.status).toBe(200);
      expect(String(response.body.access_token).length).toBeGreaterThan(20);
    }
  });

  it('rejects invalid demo credentials', async () => {
    const response = await request(app)
      .post('/v1/development/auth/token')
      .send({ email: WORKER_EMAIL, password: 'wrong-password' });
    expect(response.status).toBe(401);
  });

  it('worker can register device and push client data to Firestore', async () => {
    const token = await fetchToken(app, WORKER_EMAIL);
    const deviceId = 'demo-device-worker-001';

    const registerResponse = await request(app)
      .post('/v1/devices/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId, userAgent: 'jest' });
    expect(registerResponse.status).toBe(200);
    expect(registerResponse.body.registered).toBe(true);

    const pushResponse = await request(app)
      .post('/v1/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        protocolVersion: 1,
        deviceId,
        operations: [
          {
            operationId: 'op-client-001',
            entityType: 'client',
            entityId: 'client-demo-001',
            operation: 'create',
            baseServerVersion: null,
            clientLocalVersion: 1,
            payload: {
              id: 'client-demo-001',
              givenName: 'Amina',
              familyName: 'Demo',
              sex: 'female',
            },
            occurredAt: '2026-08-09T12:00:00.000Z',
            requestHash: 'hash-client-001',
          },
        ],
      });

    expect(pushResponse.status).toBe(200);
    expect(pushResponse.body.results).toEqual([
      expect.objectContaining({
        operationId: 'op-client-001',
        status: 'acked',
        serverVersion: 1,
      }),
    ]);

    const db = (await import('../db')).getDb();
    const inMemoryStore = getInMemoryStore(db);
    const stored = inMemoryStore.get(
      'organisations/org-dev-001/facilities/fac-dev-001/synced_entities/client__client-demo-001',
    );
    expect(stored?.payload).toMatchObject({ givenName: 'Amina', familyName: 'Demo' });
  });

  it('admin can read worker-synced records after worker push', async () => {
    const workerToken = await fetchToken(app, WORKER_EMAIL);
    const adminToken = await fetchToken(app, ADMIN_EMAIL);
    const deviceId = 'demo-device-worker-002';

    await request(app)
      .post('/v1/devices/register')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ deviceId });

    await request(app)
      .post('/v1/sync/push')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        protocolVersion: 1,
        deviceId,
        operations: [
          {
            operationId: 'op-nutrition-001',
            entityType: 'nutrition_assessment',
            entityId: 'nutrition-demo-001',
            operation: 'create',
            baseServerVersion: null,
            clientLocalVersion: 1,
            payload: {
              id: 'nutrition-demo-001',
              classification: 'moderateAcuteMalnutrition',
            },
            occurredAt: '2026-08-09T12:30:00.000Z',
            requestHash: 'hash-nutrition-001',
          },
        ],
      });

    const homeResponse = await request(app)
      .get('/v1/admin/home')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(homeResponse.status).toBe(200);
    expect(homeResponse.body.syncedRecordCount).toBeGreaterThanOrEqual(1);

    const recordsResponse = await request(app)
      .get('/v1/admin/synced-records')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(recordsResponse.status).toBe(200);
    expect(recordsResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: 'nutrition_assessment',
          entityId: 'nutrition-demo-001',
          facilityId: 'fac-dev-001',
        }),
      ]),
    );
  });

  it('blocks admin-only account from worker sync push', async () => {
    const adminToken = await fetchToken(app, ADMIN_EMAIL);
    const response = await request(app)
      .post('/v1/sync/push')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        protocolVersion: 1,
        deviceId: 'admin-device-001',
        operations: [],
      });
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('workerRoleRequired');
  });

  it('blocks unauthenticated sync and admin routes', async () => {
    await request(app).post('/v1/sync/push').send({ protocolVersion: 1, deviceId: 'x'.repeat(8), operations: [] }).expect(401);
    await request(app).get('/v1/admin/home').expect(401);
  });

  it('returns duplicate status for repeated operation ids', async () => {
    const token = await fetchToken(app, WORKER_EMAIL);
    const deviceId = 'demo-device-worker-003';
    await request(app)
      .post('/v1/devices/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId });

    const body = {
      protocolVersion: 1,
      deviceId,
      operations: [
        {
          operationId: 'op-dup-001',
          entityType: 'referral',
          entityId: 'referral-demo-001',
          operation: 'create',
          baseServerVersion: null,
          clientLocalVersion: 1,
          payload: { id: 'referral-demo-001' },
          occurredAt: '2026-08-09T13:00:00.000Z',
          requestHash: 'hash-referral-001',
        },
      ],
    };

    const first = await request(app)
      .post('/v1/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(first.body.results[0].status).toBe('acked');

    const second = await request(app)
      .post('/v1/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(second.body.results[0].status).toBe('duplicate');
  });

  it('dual-role worker token can access admin home', async () => {
    const token = await fetchToken(app, WORKER_EMAIL);
    const response = await request(app)
      .get('/v1/admin/home')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.organisationId).toBe('org-dev-001');
  });
});
