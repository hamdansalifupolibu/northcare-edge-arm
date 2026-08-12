export type RiskEngineErrorCode =
  | 'rulePackUnavailable'
  | 'rulePackInvalid'
  | 'rulePackStatusBlocked'
  | 'incompatibleEngineVersion'
  | 'incompatibleTemplate'
  | 'inputInvalid'
  | 'screeningIncomplete'
  | 'evaluationFailed'
  | 'persistenceFailed';

export class RiskEngineError extends Error {
  readonly code: RiskEngineErrorCode;
  readonly sanitisedMessage: string;

  constructor(code: RiskEngineErrorCode, sanitisedMessage: string) {
    super(sanitisedMessage);
    this.name = 'RiskEngineError';
    this.code = code;
    this.sanitisedMessage = sanitisedMessage;
  }
}

export function isRiskEngineError(error: unknown): error is RiskEngineError {
  return error instanceof RiskEngineError;
}
