import jwt from 'jsonwebtoken';
import { defineString } from 'firebase-functions/params';

import type { AuthenticatedContext, DemoAccount } from './types';
import { findDemoAccountById } from './types';

export const demoSyncPassword = defineString('DEMO_SYNC_PASSWORD', {
  default: 'NorthCareDemo1!',
  description: 'Shared demo password for hackathon sync accounts.',
});

export const devAuthSecret = defineString('DEV_AUTH_SECRET', {
  default: 'northcare-demo-dev-secret-change-before-production',
  description: 'HS256 secret for development sync JWTs.',
});

type JwtClaims = jwt.JwtPayload & {
  readonly sub: string;
  readonly email?: string;
  readonly nc_account_id?: string;
  readonly nc_facility_id?: string;
  readonly nc_organisation_id?: string;
  readonly nc_roles?: string[];
};

export function issueDevelopmentToken(account: DemoAccount): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: account.remoteSubject,
      email: account.email,
      iat: now,
      exp: now + 3600,
      iss: 'northcare-development',
      nc_account_id: account.accountId,
      nc_facility_id: account.facilityId,
      nc_organisation_id: account.organisationId,
      nc_roles: [...account.roles],
    },
    devAuthSecret.value(),
    { algorithm: 'HS256' },
  );
}

export function verifyBearerToken(authorization: string | undefined): AuthenticatedContext {
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    throw new Error('AUTH_REQUIRED');
  }
  const token = authorization.slice('Bearer '.length).trim();
  let payload: JwtClaims;
  try {
    payload = jwt.verify(token, devAuthSecret.value(), {
      algorithms: ['HS256'],
    }) as JwtClaims;
  } catch {
    throw new Error('AUTH_REQUIRED');
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('AUTH_REQUIRED');
  }
  const accountId =
    typeof payload.nc_account_id === 'string' ? payload.nc_account_id : payload.sub;
  const facilityId =
    typeof payload.nc_facility_id === 'string' ? payload.nc_facility_id : 'fac-dev-001';
  const organisationId =
    typeof payload.nc_organisation_id === 'string'
      ? payload.nc_organisation_id
      : 'org-dev-001';
  const roles = Array.isArray(payload.nc_roles)
    ? payload.nc_roles.filter((role): role is string => typeof role === 'string')
    : ['worker'];
  const role = roles.includes('administrator') && roles.length === 1 ? 'administrator' : 'worker';
  const tokenIssuedAt =
    typeof payload.iat === 'number' ? payload.iat : Math.floor(Date.now() / 1000);

  const matched = findDemoAccountById(accountId);
  const displayName = matched?.displayName ?? 'Demo Account';
  const email = matched?.email ?? (typeof payload.email === 'string' ? payload.email : '');
  const accountStatus = matched?.accountStatus ?? 'active';
  const firstLoginRequired = matched?.firstLoginRequired ?? false;
  const accountVersion = matched?.accountVersion ?? 1;
  const permittedWorkspaces = matched
    ? [...matched.permittedWorkspaces]
    : roles.includes('administrator')
      ? roles.includes('worker')
        ? ['worker', 'administration']
        : ['administration']
      : ['worker'];

  return {
    accountId,
    remoteSubject: payload.sub,
    email,
    displayName,
    role,
    roles,
    permittedWorkspaces,
    facilityId,
    organisationId,
    accountStatus,
    firstLoginRequired,
    accountVersion,
    tokenIssuedAt,
  };
}

export function authErrorStatus(code: string): number {
  return code === 'AUTH_UNAVAILABLE' ? 503 : 401;
}
