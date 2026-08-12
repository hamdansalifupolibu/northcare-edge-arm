import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type { SignedActivationClaimsV1 } from '../../../features/administration/security/signedActivationClaims';

export type OfflineRegisterWorkerPayload = {
  readonly displayName: string;
  readonly email: string;
  readonly facilityId: string;
  readonly facilityName: string;
  readonly profession: string;
  readonly professionLabel: string;
  readonly otherProfessionDescription: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly organisationId: string;
  readonly adminAccountId: string;
  readonly adminDisplayName: string;
};

export type AdminProvisioningOutboxRow = {
  readonly enrollmentId: string;
  readonly payload: OfflineRegisterWorkerPayload;
  readonly activationNonce: string;
  readonly activationUri: string;
  readonly status: 'saved_on_device';
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type WorkerActivationPendingRow = {
  readonly enrollmentId: string;
  readonly claims: SignedActivationClaimsV1;
  readonly email: string;
  readonly status: 'pending_credentials' | 'credentials_set';
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AdminProvisioningRepository = {
  saveOutbox(row: AdminProvisioningOutboxRow): Promise<void>;
  getOutbox(enrollmentId: string): Promise<AdminProvisioningOutboxRow | null>;
  listOutbox(): Promise<readonly AdminProvisioningOutboxRow[]>;
  savePendingActivation(row: WorkerActivationPendingRow): Promise<void>;
  getPendingActivation(enrollmentId: string): Promise<WorkerActivationPendingRow | null>;
  markActivationCredentialsSet(enrollmentId: string, updatedAt: string): Promise<void>;
  isNonceConsumed(nonce: string): Promise<boolean>;
  consumeNonce(nonce: string, consumedAt: string): Promise<void>;
  saveReferenceCache(cacheKey: string, payloadJson: string, updatedAt: string): Promise<void>;
  loadReferenceCache(cacheKey: string): Promise<string | null>;
};

type OutboxDbRow = {
  enrollment_id: string;
  payload_json: string;
  activation_nonce: string;
  activation_uri: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type PendingDbRow = {
  enrollment_id: string;
  claims_json: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapOutbox(row: OutboxDbRow): AdminProvisioningOutboxRow {
  return {
    enrollmentId: row.enrollment_id,
    payload: JSON.parse(row.payload_json) as OfflineRegisterWorkerPayload,
    activationNonce: row.activation_nonce,
    activationUri: row.activation_uri,
    status: 'saved_on_device',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPending(row: PendingDbRow): WorkerActivationPendingRow {
  return {
    enrollmentId: row.enrollment_id,
    claims: JSON.parse(row.claims_json) as SignedActivationClaimsV1,
    email: row.email,
    status: row.status === 'credentials_set' ? 'credentials_set' : 'pending_credentials',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteAdminProvisioningRepository(
  db: SqliteDriver,
): AdminProvisioningRepository {
  return {
    async saveOutbox(row) {
      await db.runAsync(
        `INSERT INTO admin_provisioning_outbox (
          enrollment_id, payload_json, activation_nonce, activation_uri, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(enrollment_id) DO UPDATE SET
          payload_json = excluded.payload_json,
          activation_nonce = excluded.activation_nonce,
          activation_uri = excluded.activation_uri,
          status = excluded.status,
          updated_at = excluded.updated_at`,
        [
          row.enrollmentId,
          JSON.stringify(row.payload),
          row.activationNonce,
          row.activationUri,
          row.status,
          row.createdAt,
          row.updatedAt,
        ],
      );
    },

    async getOutbox(enrollmentId) {
      const row = await db.getFirstAsync<OutboxDbRow>(
        `SELECT * FROM admin_provisioning_outbox WHERE enrollment_id = ?`,
        [enrollmentId],
      );
      return row ? mapOutbox(row) : null;
    },

    async listOutbox() {
      const rows = await db.getAllAsync<OutboxDbRow>(
        `SELECT * FROM admin_provisioning_outbox ORDER BY created_at DESC`,
      );
      return rows.map(mapOutbox);
    },

    async savePendingActivation(row) {
      await db.runAsync(
        `INSERT INTO worker_activation_pending (
          enrollment_id, claims_json, email, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(enrollment_id) DO UPDATE SET
          claims_json = excluded.claims_json,
          email = excluded.email,
          status = excluded.status,
          updated_at = excluded.updated_at`,
        [
          row.enrollmentId,
          JSON.stringify(row.claims),
          row.email,
          row.status,
          row.createdAt,
          row.updatedAt,
        ],
      );
    },

    async getPendingActivation(enrollmentId) {
      const row = await db.getFirstAsync<PendingDbRow>(
        `SELECT * FROM worker_activation_pending WHERE enrollment_id = ?`,
        [enrollmentId],
      );
      return row ? mapPending(row) : null;
    },

    async markActivationCredentialsSet(enrollmentId, updatedAt) {
      await db.runAsync(
        `UPDATE worker_activation_pending SET status = 'credentials_set', updated_at = ? WHERE enrollment_id = ?`,
        [updatedAt, enrollmentId],
      );
    },

    async isNonceConsumed(nonce) {
      const row = await db.getFirstAsync<{ nonce: string }>(
        `SELECT nonce FROM consumed_activation_nonces WHERE nonce = ?`,
        [nonce],
      );
      return row !== null;
    },

    async consumeNonce(nonce, consumedAt) {
      await db.runAsync(
        `INSERT OR IGNORE INTO consumed_activation_nonces (nonce, consumed_at) VALUES (?, ?)`,
        [nonce, consumedAt],
      );
    },

    async saveReferenceCache(cacheKey, payloadJson, updatedAt) {
      await db.runAsync(
        `INSERT INTO admin_reference_cache (cache_key, payload_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
        [cacheKey, payloadJson, updatedAt],
      );
    },

    async loadReferenceCache(cacheKey) {
      const row = await db.getFirstAsync<{ payload_json: string }>(
        `SELECT payload_json FROM admin_reference_cache WHERE cache_key = ?`,
        [cacheKey],
      );
      return row?.payload_json ?? null;
    },
  };
}
