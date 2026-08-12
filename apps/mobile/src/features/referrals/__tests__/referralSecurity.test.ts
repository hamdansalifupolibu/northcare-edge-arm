import { createLogger } from '../../../logging/logger';
import { buildReferralPassportUri } from '../security/qrPassportParser';
import { generateOpaquePassportToken, hashPassportToken } from '../security/tokenCrypto';
import {
  clearPendingPassportToken,
  consumePendingPassportToken,
  setPendingPassportToken,
} from '../security/transientPassportTokenStore';
import { setupReferralTest } from './helpers';

describe('referral security and privacy', () => {
  it('keeps signed QR free of client identity fields in the readable URI', async () => {
    const { manager, services, source, destination, accountId, client } =
      await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      environment: 'development',
    });
    await services.updateDraft({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      environment: 'development',
    });
    const confirmed = await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: true,
    });
    const uri = confirmed.passport!.uri;
    expect(uri.startsWith('northcare://referral-passport/v3/')).toBe(true);
    expect(uri).not.toContain(client.givenName);
    expect(uri).not.toContain(client.familyName);
    expect(uri).not.toContain(client.id);
    expect(uri.toLowerCase()).not.toContain(
      (client.phoneNumber ?? 'no-phone').toLowerCase(),
    );
    // Local opaque URI remains available for same-device lookup.
    expect(confirmed.passport!.localLookupUri.startsWith('northcare://referral-passport/v1/')).toBe(
      true,
    );

    const offline = services.verifyOfflinePassport(uri, {
      assignedFacilityKeyIds: ['fac-dev-001'],
    });
    expect(offline.ok).toBe(true);
    if (offline.ok) {
      expect(offline.claims.dstName).toBe(destination.name);
      expect(offline.sealedPatient.status).toBe('sealedForDestination');
      // Clear name must not appear in public claims JSON.
      const publicJson = JSON.stringify({
        ...offline.claims,
        sealed: '[redacted]',
      });
      expect(publicJson).not.toContain(client.givenName);
    }

    const unlocked = services.verifyOfflinePassport(uri, {
      assignedFacilityKeyIds: ['GH-TTH'],
    });
    expect(unlocked.ok).toBe(true);
    if (unlocked.ok) {
      expect(unlocked.sealedPatient.status).toBe('unlocked');
    }
    await manager.close();
  });

  it('does not log raw token or hash in passport issue info logs', () => {
    const token = generateOpaquePassportToken(() => new Uint8Array(16).fill(9));
    const hash = hashPassportToken(token);
    const logger = createLogger({ environment: 'development' });
    const spy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('referral_passport_issued', {
      referralId: '00000000-0000-4000-8000-000000000001',
      passportId: '00000000-0000-4000-8000-000000000002',
      reissue: false,
    });
    const joined = spy.mock.calls.map((call) => JSON.stringify(call)).join(' ');
    expect(joined).not.toContain(token);
    expect(joined).not.toContain(hash);
    spy.mockRestore();
  });

  it('clears transient deep-link tokens after consume', () => {
    clearPendingPassportToken();
    setPendingPassportToken('TransientTokenValue1');
    expect(consumePendingPassportToken()).toBe('TransientTokenValue1');
    expect(consumePendingPassportToken()).toBeNull();
  });

  it('builds only opaque bearer URIs', () => {
    const uri = buildReferralPassportUri('ABCDEFGHIJKLMNOP');
    expect(uri).toBe('northcare://referral-passport/v1/ABCDEFGHIJKLMNOP');
  });
});
