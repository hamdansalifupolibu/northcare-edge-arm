import { SYNC_COPY } from '../design-system/offline/syncCopy';
import { en } from '../i18n/en';

describe('state accuracy copy', () => {
  it('keeps sync wording truthful and non-celebratory for failure', () => {
    expect(SYNC_COPY.syncFailed).toMatch(/could not be completed/i);
    expect(SYNC_COPY.waitingForConnection).toMatch(/waiting/i);
    expect(SYNC_COPY.savedLocally).toMatch(/this device/i);
    expect(SYNC_COPY.synced).toBe('Synced');
  });

  it('keeps administration offline wording distinct from clinical sync success', () => {
    expect(en.administration.offlineMutation).toMatch(/secure connection/i);
    expect(en.adminShell.offlineBody).toMatch(/not affected/i);
    expect(en.sync.foregroundOnly).toMatch(/Background sync is not enabled/i);
  });

  it('keeps auth recovery wording non-confirming for unknown accounts', () => {
    expect(en.auth.recoverySubmitted).toMatch(/If the account can receive/i);
  });
});
