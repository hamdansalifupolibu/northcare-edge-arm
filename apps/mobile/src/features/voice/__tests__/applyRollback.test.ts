import { setupVoiceTest } from './helpers';

describe('voice apply rollback', () => {
  it('rolls back completely when sync enqueue fails mid-transaction', async () => {
    const { manager, repos, services, accountId, client, encounterId } = await setupVoiceTest({
      withEncounter: true,
      withScreening: true,
    });
    const session = await services.startSession({
      clientId: client.id,
      encounterId,
      accountId,
    });
    await services.recordConsent({
      sessionId: session.id,
      status: 'recorded',
      accountId,
    });
    const transcript = await services.saveManualTranscript({
      sessionId: session.id,
      transcriptText: 'SYNTHETIC rollback transcript for apply test.',
      accountId,
    });
    await services.confirmTranscript({
      transcriptId: transcript.id,
      accountId,
    });
    const { run, suggestions } = await services.requestExtraction({
      sessionId: session.id,
      transcriptId: transcript.id,
      accountId,
    });
    for (const suggestion of suggestions) {
      await services.reviewSuggestion({
        suggestionId: suggestion.id,
        accountId,
        action: 'accept',
      });
    }

    const screeningBefore = await repos.screenings.findByEncounterId(encounterId!);
    const answersBefore = screeningBefore
      ? await repos.screenings.listAnswers(screeningBefore.id)
      : [];

    const originalEnqueue = repos.syncQueue.enqueue.bind(repos.syncQueue);
    repos.syncQueue.enqueue = async (input) => {
      if (input.entityType === 'voiceCaptureSession' && input.operation === 'update') {
        throw new Error('forced-voice-apply-sync-failure');
      }
      return originalEnqueue(input);
    };

    await expect(
      services.applyConfirmedSuggestions({
        sessionId: session.id,
        extractionRunId: run.id,
        accountId,
        workerConfirmed: true,
        sessionUnlocked: true,
      }),
    ).rejects.toThrow(/Transaction failed|forced-voice-apply-sync-failure/);

    const sessionAfter = await repos.voiceCaptureSessions.findById(session.id);
    expect(sessionAfter?.status).not.toBe('confirmed');
    expect(sessionAfter?.uiState).not.toBe('confirmed');

    const screeningAfter = await repos.screenings.findByEncounterId(encounterId!);
    const answersAfter = screeningAfter
      ? await repos.screenings.listAnswers(screeningAfter.id)
      : [];
    expect(answersAfter.length).toBe(answersBefore.length);

    const auditEvents = await repos.auditEvents.listForEntity(
      'voiceCaptureSession',
      session.id,
    );
    expect(auditEvents.some((e) => e.eventType === 'voice_suggestions_applied')).toBe(false);

    await manager.close();
  });
});
