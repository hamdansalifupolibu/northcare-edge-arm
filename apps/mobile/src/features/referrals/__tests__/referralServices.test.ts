import { ReferralError } from '../domain/errors';
import { hashPassportToken } from '../security/tokenCrypto';
import { setupReferralTest } from './helpers';

describe('referral services', () => {
  it('creates, confirms, and issues a local passport', async () => {
    const { manager, services, source, destination, accountId, client } =
      await setupReferralTest();

    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      environment: 'development',
    });
    expect(draft.status).toBe('draft');
    expect(draft.priority).toBe('undetermined');
    expect(draft.prioritySource).toBe('noEnginePriority');
    expect(draft.caregiverInformed).toBe(false);
    expect(draft.referenceCode).toMatch(/^NCR-[0-9A-F]{8}$/);
    expect(draft.sourceFacilityId).toBe(source.id);

    await services.updateDraft({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      caregiverInformed: false,
      environment: 'development',
    });

    const confirmed = await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: true,
    });
    expect(confirmed.referral.status).toBe('created');
    expect(confirmed.passport).not.toBeNull();
    expect(confirmed.passport!.uri).toMatch(
      /^northcare:\/\/referral-passport\/v3\//,
    );
    expect(confirmed.passport!.localLookupUri).toMatch(
      /^northcare:\/\/referral-passport\/v1\/[A-Za-z0-9_-]{16}$/,
    );
    expect(confirmed.syncItems.length).toBeGreaterThan(0);

    const offline = services.verifyOfflinePassport(confirmed.passport!.uri, {
      assignedFacilityKeyIds: ['GH-TTH'],
    });
    expect(offline.ok).toBe(true);
    if (offline.ok) {
      expect(offline.sealedPatient.status).toBe('unlocked');
      if (offline.sealedPatient.status === 'unlocked') {
        expect(offline.sealedPatient.displayName).toContain('Ama');
      }
    }

    const resolved = await services.resolvePassportLocally(
      confirmed.passport!.localLookupUri,
    );
    expect(resolved.status).toBe('resolved');
    if (resolved.status === 'resolved') {
      expect(resolved.statusUnchanged).toBe(true);
      expect(resolved.referral.status).toBe('created');
      expect(resolved.referral.id).toBe(draft.id);
    }

    await manager.close();
  });

  it('rolls back confirm when sync queue enqueue fails', async () => {
    const { manager, repos, services, source, destination, accountId, client } =
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

    const original = repos.syncQueue.enqueue.bind(repos.syncQueue);
    repos.syncQueue.enqueue = async (input) => {
      if (input.entityType === 'referral') {
        throw new Error('forced-referral-sync-failure');
      }
      return original(input);
    };

    await expect(
      services.confirmReferral({
        referralId: draft.id,
        accountId,
        generatePassport: false,
      }),
    ).rejects.toBeTruthy();

    const stillDraft = await services.getDraft(draft.id);
    expect(stillDraft?.status).toBe('draft');
    await manager.close();
  });

  it('rejects invalid status transitions and accepts allowed ones', async () => {
    const { manager, services, source, destination, accountId, client } =
      await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      receivingFacilityId: destination.id,
      reasonCode: 'dev.urgent_follow_up',
      environment: 'development',
    });
    await services.updateDraft({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.urgent_follow_up',
      environment: 'development',
    });
    const { referral } = await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: false,
    });

    await expect(
      services.transitionStatus({
        referralId: referral.id,
        accountId,
        to: 'completed',
      }),
    ).rejects.toBeInstanceOf(ReferralError);

    const informed = await services.markCaregiverInformed({
      referralId: referral.id,
      accountId,
    });
    expect(informed.status).toBe('caregiverInformed');
    expect(informed.caregiverInformed).toBe(true);

    await services.markJourneyStarted({ referralId: referral.id, accountId });
    await services.markFacilityReached({ referralId: referral.id, accountId });
    await services.markClientReceived({ referralId: referral.id, accountId });
    const completed = await services.completeReferral({
      referralId: referral.id,
      accountId,
    });
    expect(completed.status).toBe('completed');
    await manager.close();
  });

  it('revokes and reissues passports; stores hash only', async () => {
    const { manager, repos, services, source, destination, accountId, client } =
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
    const first = await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: true,
    });
    const firstToken = first.passport!.opaqueToken;
    const firstHash = hashPassportToken(firstToken);

    const stored = await repos.referralPassports.findByTokenHash(firstHash);
    expect(stored).not.toBeNull();
    expect((stored as { tokenHash: string }).tokenHash).toBe(firstHash);

    const reissued = await services.generatePassport({
      referralId: draft.id,
      accountId,
      reissue: true,
    });
    expect(reissued.opaqueToken).not.toBe(firstToken);

    const oldResolve = await services.resolvePassportLocally(
      first.passport!.localLookupUri,
    );
    expect(oldResolve.status).toBe('revoked');

    const newResolve = await services.resolvePassportLocally(
      reissued.localLookupUri,
    );
    expect(newResolve.status).toBe('resolved');
    expect(services.verifyOfflinePassport(reissued.uri).ok).toBe(true);
    await manager.close();
  });

  it('resolves unknown passports as not available on this device without status change', async () => {
    const { manager, services } = await setupReferralTest();
    const result = await services.resolvePassportLocally(
      'northcare://referral-passport/v1/UnknownToken1234',
    );
    expect(result.status).toBe('notAvailableOnThisDevice');
    await manager.close();
  });

  it('cancels referral and revokes active passport in one transaction rollback path', async () => {
    const { manager, repos, services, source, destination, accountId, client } =
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

    const original = repos.syncQueue.enqueue.bind(repos.syncQueue);
    repos.syncQueue.enqueue = async (input) => {
      if (input.operation === 'update' && input.entityType === 'referral') {
        throw new Error('forced-cancel-sync-failure');
      }
      return original(input);
    };

    await expect(
      services.cancelReferral({
        referralId: confirmed.referral.id,
        accountId,
      }),
    ).rejects.toBeTruthy();

    const stillActive = await services.getReferralDetails(confirmed.referral.id);
    expect(stillActive?.referral.status).toBe('created');
    expect(stillActive?.activePassport?.status).toBe('active');
    await manager.close();
  });

  it('fails closed for production reason content gate', async () => {
    const { manager, services, source, accountId, client } = await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      environment: 'production',
    });
    await expect(
      services.updateDraft({
        referralId: draft.id,
        accountId,
        reasonCode: 'dev.further_assessment',
        environment: 'production',
      }),
    ).rejects.toMatchObject({ code: 'reasonUnavailable' });
    expect(services.listSelectableReasons('production')).toHaveLength(0);
    await manager.close();
  });

  it('does not default caregiver informed to true', async () => {
    const { manager, services, source, accountId, client } = await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      environment: 'development',
    });
    expect(draft.caregiverInformed).toBe(false);
    await manager.close();
  });

  it('resolves opaque dev facility codes and opaque account ids on save', async () => {
    const { manager, repos, services, destination, client } = await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId: 'dev-dual-8d2ce4bbb8e656c8afea',
      sourceFacilityId: 'fac-dev-001',
      origin: 'workerInitiated',
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      environment: 'development',
    });
    expect(draft.status).toBe('draft');
    expect(draft.sourceFacilityId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(draft.createdByAccountId).toBeNull();

    const resolved = await repos.facilities.findByExternalCode('fac-dev-001');
    expect(resolved?.id).toBe(draft.sourceFacilityId);

    await services.updateDraft({
      referralId: draft.id,
      accountId: 'dev-dual-8d2ce4bbb8e656c8afea',
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      transportStatus: 'arranged',
      environment: 'development',
    });

    const confirmed = await services.confirmReferral({
      referralId: draft.id,
      accountId: 'dev-dual-8d2ce4bbb8e656c8afea',
      generatePassport: true,
    });
    expect(confirmed.referral.status).toBe('created');
    expect(confirmed.passport).not.toBeNull();

    await manager.close();
  });

  it('edits a confirmed referral, records timeline event, and reissues passport', async () => {
    const { manager, services, source, destination, accountId, client, repos } =
      await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      environment: 'development',
    });
    await services.updateDraft({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      workerNotes: 'Initial concern',
      environment: 'development',
    });
    const confirmed = await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: true,
    });
    const originalPassportId = confirmed.passport?.referral.activePassportId;

    const edited = await services.editReferral({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.urgent_follow_up',
      workerNotes: 'Updated clinical summary',
      reissuePassport: true,
      environment: 'development',
    });

    expect(edited.referral.reasonCode).toBe('dev.urgent_follow_up');
    expect(edited.referral.workerNotes).toBe('Updated clinical summary');
    expect(edited.passport).not.toBeNull();
    expect(edited.referral.activePassportId).not.toBe(originalPassportId);

    const events = await repos.referrals.listEvents(draft.id);
    expect(events.map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['referral_edited', 'passport_reissued']),
    );

    await manager.close();
  });

  it('cancels an active referral and records status in timeline', async () => {
    const { manager, services, source, destination, accountId, client, repos } =
      await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      environment: 'development',
    });
    await services.updateDraft({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      workerNotes: 'Needs referral',
      environment: 'development',
    });
    await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: false,
    });

    const cancelled = await services.cancelReferral({
      referralId: draft.id,
      accountId,
      notes: 'Client chose local care',
    });
    expect(cancelled.status).toBe('cancelled');

    const events = await repos.referrals.listEvents(draft.id);
    expect(events.map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['status_cancelled', 'cancellation_note']),
    );

    await manager.close();
  });

  it('records status transition events when updating referral status', async () => {
    const { manager, services, source, destination, accountId, client, repos } =
      await setupReferralTest();
    const draft = await services.startReferralDraft({
      clientId: client.id,
      accountId,
      sourceFacilityId: source.id,
      origin: 'workerInitiated',
      environment: 'development',
    });
    await services.updateDraft({
      referralId: draft.id,
      accountId,
      receivingFacilityId: destination.id,
      reasonCode: 'dev.further_assessment',
      workerNotes: 'Needs referral',
      environment: 'development',
    });
    await services.confirmReferral({
      referralId: draft.id,
      accountId,
      generatePassport: false,
    });

    await services.transitionStatus({
      referralId: draft.id,
      accountId,
      to: 'caregiverInformed',
    });

    const details = await services.getReferralDetails(draft.id);
    expect(details?.referral.status).toBe('caregiverInformed');
    const events = await repos.referrals.listEvents(draft.id);
    expect(events.map((e) => e.eventType)).toContain('status_caregiverInformed');

    await manager.close();
  });
});
