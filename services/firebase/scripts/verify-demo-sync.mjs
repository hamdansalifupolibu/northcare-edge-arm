// Demo sync verification against running Firebase emulator or cloud API.
// Usage: node scripts/verify-demo-sync.mjs [baseUrl]

const baseUrl =
  process.argv[2] ?? 'http://127.0.0.1:5001/northcare-ai/us-central1/api';
const password = 'NorthCareDemo1!';
const workerEmail = 'hamdansalifupolibu@gmail.com';
const adminEmail = 'hammydanny1@gmail.com';

async function request(path, init = {}) {
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function tokenFor(email) {
  const result = await request('/v1/development/auth/token', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (result.status !== 200) {
    throw new Error(`Token failed for ${email}: ${result.status} ${JSON.stringify(result.body)}`);
  }
  return result.body.access_token;
}

async function main() {
  console.log(`Verifying demo sync at ${baseUrl}`);

  const health = await request('/health');
  if (health.status !== 200 || !health.body.ok) {
    throw new Error(`Health check failed: ${health.status}`);
  }
  console.log('✓ Health');

  const workerToken = await tokenFor(workerEmail);
  const adminToken = await tokenFor(adminEmail);
  console.log('✓ Demo tokens');

  const deviceId = 'verify-device-demo-001';
  const register = await request('/v1/devices/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${workerToken}` },
    body: JSON.stringify({ deviceId }),
  });
  if (register.status !== 200) {
    throw new Error(`Device register failed: ${register.status}`);
  }
  console.log('✓ Worker device registered');

  const push = await request('/v1/sync/push', {
    method: 'POST',
    headers: { Authorization: `Bearer ${workerToken}` },
    body: JSON.stringify({
      protocolVersion: 1,
      deviceId,
      operations: [
        {
          operationId: `verify-op-${Date.now()}`,
          entityType: 'client',
          entityId: 'client-verify-demo',
          operation: 'create',
          baseServerVersion: null,
          clientLocalVersion: 1,
          payload: { givenName: 'Verify', familyName: 'Demo' },
          occurredAt: new Date().toISOString(),
          requestHash: 'verify-hash',
        },
      ],
    }),
  });
  if (push.status !== 200 || push.body.results?.[0]?.status !== 'acked') {
    throw new Error(`Push failed: ${push.status} ${JSON.stringify(push.body)}`);
  }
  console.log('✓ Worker push acked');

  const records = await request('/v1/admin/synced-records', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (records.status !== 200 || !Array.isArray(records.body.items)) {
    throw new Error(`Admin read failed: ${records.status}`);
  }
  const found = records.body.items.some((item) => item.entityId === 'client-verify-demo');
  if (!found) {
    throw new Error('Admin could not read worker-synced client record');
  }
  console.log('✓ Admin read worker-synced record');
  console.log('\nDemo sync flow OK.');
}

main().catch((error) => {
  console.error('\nDemo sync verification FAILED:', error.message);
  process.exit(1);
});
