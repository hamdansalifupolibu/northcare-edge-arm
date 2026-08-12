export type AssistantErrorCode =
  | 'assistantUnavailable'
  | 'contentUnavailable'
  | 'packRejected'
  | 'articleNotFound'
  | 'invalidFeedback'
  | 'productionGate'
  | 'providerUnavailable';

export class AssistantError extends Error {
  readonly code: AssistantErrorCode;

  constructor(code: AssistantErrorCode, message: string) {
    super(message);
    this.name = 'AssistantError';
    this.code = code;
  }
}
