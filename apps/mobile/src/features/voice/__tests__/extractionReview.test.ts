import { setupVoiceTest } from './helpers';

describe('voice extraction review', () => {
  it('requires individual accept, edit, and reject actions', async () => {
    const { manager, services, accountId, client, encounterId } = await setupVoiceTest({
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
      transcriptText: 'SYNTHETIC transcript for development extraction review only.',
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
    expect(suggestions.length).toBeGreaterThan(1);

    const first = suggestions[0]!;
    const accepted = await services.reviewSuggestion({
      suggestionId: first.id,
      accountId,
      action: 'accept',
    });
    expect(accepted.reviewStatus).toBe('accepted');

    const second = suggestions[1]!;
    const edited = await services.reviewSuggestion({
      suggestionId: second.id,
      accountId,
      action: 'edit',
      editedValue: 'Worker edited draft note.',
    });
    expect(edited.reviewStatus).toBe('edited');
    expect(edited.confirmedValueJson).toContain('Worker edited');

    if (suggestions.length > 2) {
      await expect(
        services.applyConfirmedSuggestions({
          sessionId: session.id,
          extractionRunId: run.id,
          accountId,
          workerConfirmed: true,
          sessionUnlocked: true,
        }),
      ).rejects.toThrow(/Review every suggestion/i);

      const rejected = await services.reviewSuggestion({
        suggestionId: suggestions[2]!.id,
        accountId,
        action: 'reject',
        rejectionReasonCode: 'incorrect',
      });
      expect(rejected.reviewStatus).toBe('rejected');
    }

    await manager.close();
  });
});
