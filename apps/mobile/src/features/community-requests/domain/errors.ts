export type CommunityRequestErrorCode =
  | 'communityRequestsRequireConnectivity'
  | 'requestTimedOut'
  | 'reachDemoDisabled'
  | 'workerAuthenticationRequired'
  | 'workerRoleRequired'
  | 'forbidden'
  | 'communityRequestNotFound'
  | 'communityRequestVersionConflict'
  | 'communityRequestAlreadyAssigned'
  | 'invalidCommunityRequestTransition'
  | 'emergencyCapabilityRequired'
  | 'validationFailed'
  | 'backendUnavailable'
  | 'internalError'
  | 'unknown';

const KNOWN_CODES: ReadonlySet<string> = new Set([
  'communityRequestsRequireConnectivity',
  'requestTimedOut',
  'reachDemoDisabled',
  'workerAuthenticationRequired',
  'workerRoleRequired',
  'forbidden',
  'communityRequestNotFound',
  'communityRequestVersionConflict',
  'communityRequestAlreadyAssigned',
  'invalidCommunityRequestTransition',
  'emergencyCapabilityRequired',
  'validationFailed',
  'backendUnavailable',
  'internalError',
  'unknown',
]);

export class CommunityRequestError extends Error {
  readonly code: CommunityRequestErrorCode;

  constructor(code: CommunityRequestErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'CommunityRequestError';
    this.code = code;
  }
}

export class CommunityRequestOfflineError extends CommunityRequestError {
  constructor() {
    super('communityRequestsRequireConnectivity');
  }
}

export class CommunityRequestTimeoutError extends CommunityRequestError {
  constructor() {
    super('requestTimedOut');
  }
}

export function parseCommunityRequestErrorCode(detail: unknown): CommunityRequestErrorCode {
  if (typeof detail === 'object' && detail !== null) {
    const code = (detail as { code?: unknown }).code;
    if (typeof code === 'string' && KNOWN_CODES.has(code)) {
      return code as CommunityRequestErrorCode;
    }
    if (typeof code === 'string') {
      if (code === 'administratorAuthenticationRequired') {
        return 'workerAuthenticationRequired';
      }
      return 'unknown';
    }
  }
  return 'unknown';
}

export type CommunityRequestUiErrorKind =
  | 'offline'
  | 'timeout'
  | 'reachDisabled'
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'alreadyAssigned'
  | 'invalidTransition'
  | 'generic';

export function mapCommunityRequestError(error: unknown): CommunityRequestUiErrorKind {
  if (error instanceof CommunityRequestOfflineError) return 'offline';
  if (error instanceof CommunityRequestTimeoutError) return 'timeout';
  if (!(error instanceof CommunityRequestError)) return 'generic';
  switch (error.code) {
    case 'communityRequestsRequireConnectivity':
      return 'offline';
    case 'requestTimedOut':
      return 'timeout';
    case 'reachDemoDisabled':
      return 'reachDisabled';
    case 'workerAuthenticationRequired':
      return 'auth';
    case 'forbidden':
    case 'workerRoleRequired':
    case 'emergencyCapabilityRequired':
      return 'forbidden';
    case 'communityRequestNotFound':
      return 'notFound';
    case 'communityRequestVersionConflict':
      return 'conflict';
    case 'communityRequestAlreadyAssigned':
      return 'alreadyAssigned';
    case 'invalidCommunityRequestTransition':
      return 'invalidTransition';
    default:
      return 'generic';
  }
}
