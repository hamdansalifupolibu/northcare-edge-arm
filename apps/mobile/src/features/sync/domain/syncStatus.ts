export type SyncRunStatus = 'idle' | 'syncing' | 'succeeded' | 'failed';

export type SyncErrorCategory =
  | 'authentication'
  | 'configuration'
  | 'network'
  | 'server'
  | 'protocol'
  | 'unknown';

export function categoriseSyncError(error: unknown): SyncErrorCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('authentication') || message.includes('401') || message.includes('403')) return 'authentication';
  if (message.includes('configured') || message.includes('https')) return 'configuration';
  if (message.includes('network') || message.includes('fetch')) return 'network';
  if (message.includes('invalid') || message.includes('protocol')) return 'protocol';
  if (message.includes('request failed')) return 'server';
  return 'unknown';
}

export type SyncCentreMode =
  | 'syncing'
  | 'unavailable'
  | 'offline'
  | 'pending'
  | 'upToDate';

export type SyncErrorMessages = Readonly<{
  errorConfiguration: string;
  errorAuthentication: string;
  errorNetwork: string;
  errorServer: string;
  errorProtocol: string;
  errorUnknown: string;
}>;

export function syncErrorCategoryMessage(
  category: SyncErrorCategory,
  messages: SyncErrorMessages,
): string {
  switch (category) {
    case 'configuration':
      return messages.errorConfiguration;
    case 'authentication':
      return messages.errorAuthentication;
    case 'network':
      return messages.errorNetwork;
    case 'server':
      return messages.errorServer;
    case 'protocol':
      return messages.errorProtocol;
    default:
      return messages.errorUnknown;
  }
}

export function resolveSyncCentreMode(input: {
  readonly syncing: boolean;
  readonly syncConfigured: boolean;
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly pending: number;
}): SyncCentreMode {
  if (input.syncing) return 'syncing';
  if (!input.syncConfigured) return 'unavailable';
  if (!input.checking && !input.isOnline) return 'offline';
  if (input.pending > 0) return 'pending';
  return 'upToDate';
}
