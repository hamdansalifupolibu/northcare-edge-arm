import express, { type NextFunction, type Request, type Response } from 'express';

import {
  getAdminHome,
  getSessionAuthorisation,
  listAccounts,
  listFacilities,
  listSyncedRecords,
  touchAdminReadAudit,
} from './adminHandlers';
import {
  authErrorStatus,
  demoSyncPassword,
  issueDevelopmentToken,
  verifyBearerToken,
} from './auth';
import { assertAdministratorRole, assertWorkerRole } from './roles';
import {
  findDemoAccountByEmail,
  findDemoAccountById,
  isValidDemoAccountPassword,
  type PushOperationInput,
} from './types';
import {
  pullChanges,
  pushOperations,
  registerDevice,
  seedOrganisationMetadata,
} from './syncHandlers';

function handleRoleError(error: unknown, res: Response): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.message === 'administratorRoleRequired' || error.message === 'workerRoleRequired') {
    res.status(403).json({ code: error.message });
    return true;
  }
  return false;
}

function requireWorker(req: Request, res: Response, next: NextFunction): void {
  try {
    assertWorkerRole(req.auth!);
    next();
  } catch (error) {
    if (!handleRoleError(error, res)) {
      res.status(403).json({ code: 'forbidden' });
    }
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    assertAdministratorRole(req.auth!);
    next();
  } catch (error) {
    if (!handleRoleError(error, res)) {
      res.status(403).json({ code: 'forbidden' });
    }
  }
}

export function createApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'northcare-firebase-sync', protocolVersion: 1 });
  });

  app.post('/v1/development/auth/token', async (req, res) => {
    const body = req.body as {
      email?: unknown;
      account_id?: unknown;
      identifier?: unknown;
      password?: unknown;
    };
    const password = typeof body.password === 'string' ? body.password : '';
    const email =
      typeof body.email === 'string'
        ? body.email
        : typeof body.identifier === 'string' && body.identifier.includes('@')
          ? body.identifier
          : undefined;
    const accountId =
      typeof body.account_id === 'string'
        ? body.account_id
        : typeof body.identifier === 'string' && !body.identifier.includes('@')
          ? body.identifier
          : undefined;

    const account = email
      ? findDemoAccountByEmail(email)
      : accountId
        ? findDemoAccountById(accountId)
        : undefined;

    if (
      !account ||
      !isValidDemoAccountPassword(account, password, demoSyncPassword.value())
    ) {
      res.status(401).json({ code: 'AUTH_REQUIRED' });
      return;
    }

    await seedOrganisationMetadata(account);
    const accessToken = issueDevelopmentToken(account);
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      account_id: account.accountId,
      role: account.role,
      roles: [...account.roles],
      permitted_workspaces: [...account.permittedWorkspaces],
      facility_id: account.facilityId,
      organisation_id: account.organisationId,
      account_status: account.accountStatus,
      first_login_required: account.firstLoginRequired,
      display_name: account.displayName,
      account_version: account.accountVersion,
    });
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      req.auth = verifyBearerToken(req.header('authorization') ?? undefined);
      next();
    } catch (error) {
      const code = error instanceof Error ? error.message : 'AUTH_REQUIRED';
      res.status(authErrorStatus(code)).json({ code });
    }
  });

  app.post('/v1/devices/register', requireWorker, async (req, res) => {
    const body = req.body as { deviceId?: unknown; userAgent?: unknown };
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
    if (deviceId.length < 8) {
      res.status(400).json({ code: 'INVALID_DEVICE' });
      return;
    }
    const userAgent = typeof body.userAgent === 'string' ? body.userAgent : undefined;
    await registerDevice(req.auth!, deviceId, userAgent);
    res.json({ deviceId, registered: true });
  });

  app.post('/v1/sync/push', requireWorker, async (req, res) => {
    const body = req.body as {
      protocolVersion?: unknown;
      deviceId?: unknown;
      operations?: unknown;
    };
    if (body.protocolVersion !== 1) {
      res.status(400).json({ code: 'PROTOCOL_VERSION_UNSUPPORTED' });
      return;
    }
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
    if (deviceId.length < 8) {
      res.status(400).json({ code: 'INVALID_DEVICE' });
      return;
    }
    const rawOperations = Array.isArray(body.operations) ? body.operations : [];
    const operations: PushOperationInput[] = rawOperations.map((item) => {
      const op = item as Record<string, unknown>;
      return {
        operationId: String(op.operationId ?? ''),
        entityType: String(op.entityType ?? ''),
        entityId: String(op.entityId ?? ''),
        operation: op.operation === 'delete' ? 'delete' : op.operation === 'update' ? 'update' : 'create',
        baseServerVersion:
          typeof op.baseServerVersion === 'number' ? op.baseServerVersion : null,
        clientLocalVersion: typeof op.clientLocalVersion === 'number' ? op.clientLocalVersion : 1,
        payload:
          op.payload && typeof op.payload === 'object' && !Array.isArray(op.payload)
            ? (op.payload as Record<string, unknown>)
            : {},
        occurredAt: typeof op.occurredAt === 'string' ? op.occurredAt : new Date().toISOString(),
        requestHash: typeof op.requestHash === 'string' ? op.requestHash : '',
      };
    });

    try {
      const result = await pushOperations(req.auth!, deviceId, operations);
      res.json(result);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'SYNC_FAILED';
      const status = code === 'DEVICE_NOT_REGISTERED' ? 400 : 403;
      res.status(status).json({ code });
    }
  });

  app.get('/v1/sync/changes', requireWorker, async (_req, res) => {
    res.json(await pullChanges());
  });

  app.get('/v1/sync/conflicts', requireWorker, async (_req, res) => {
    res.json({ conflicts: [] });
  });

  app.post('/v1/sync/conflicts/:conflictId/resolve', requireWorker, async (req, res) => {
    res.json({
      conflictId: req.params.conflictId,
      status: 'resolved',
    });
  });

  app.get('/v1/auth/session', requireAdmin, async (req, res) => {
    try {
      res.json(getSessionAuthorisation(req.auth!));
    } catch (error) {
      if (!handleRoleError(error, res)) {
        res.status(500).json({ code: 'internalError' });
      }
    }
  });

  app.get('/v1/admin/home', requireAdmin, async (req, res) => {
    try {
      res.json(await getAdminHome(req.auth!));
    } catch (error) {
      if (!handleRoleError(error, res)) {
        res.status(500).json({ code: 'internalError' });
      }
    }
  });

  app.get('/v1/admin/facilities', requireAdmin, async (req, res) => {
    try {
      res.json(await listFacilities(req.auth!));
    } catch (error) {
      if (!handleRoleError(error, res)) {
        res.status(500).json({ code: 'internalError' });
      }
    }
  });

  app.get('/v1/admin/accounts', requireAdmin, async (req, res) => {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);
      res.json(await listAccounts(req.auth!, page, pageSize));
    } catch (error) {
      if (!handleRoleError(error, res)) {
        res.status(500).json({ code: 'internalError' });
      }
    }
  });

  app.get('/v1/admin/synced-records', requireAdmin, async (req, res) => {
    try {
      const facilityId =
        typeof req.query.facilityId === 'string' ? req.query.facilityId : undefined;
      const entityType =
        typeof req.query.entityType === 'string' ? req.query.entityType : undefined;
      const limit = Number(req.query.limit ?? 50);
      const items = await listSyncedRecords(req.auth!, { facilityId, entityType, limit });
      await touchAdminReadAudit(req.auth!, items.length);
      res.json({ items, total: items.length, organisationId: req.auth!.organisationId });
    } catch (error) {
      if (!handleRoleError(error, res)) {
        res.status(500).json({ code: 'internalError' });
      }
    }
  });

  return app;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: import('./types').AuthenticatedContext;
  }
}
