import { setupVoiceTest } from './helpers';

describe('voice results save', () => {
  it('confirms client-only extraction by creating a draft visit when needed', async () => {
    const { manager, repos, services, accountId, client } = await setupVoiceTest();
    const session = await services.startSession({
      clientId: client.id,
      accountId,
    });
    await services.recordConsent({
      sessionId: session.id,
      status: 'recorded',
      accountId,
    });
    const transcript = await services.saveManualTranscript({
      sessionId: session.id,
      transcriptText: 'SYNTHETIC voice results save without visit context.',
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
      if (suggestion.targetKey === 'clientName' || suggestion.targetKey === 'babyName') {
        await services.reviewSuggestion({
          suggestionId: suggestion.id,
          accountId,
          action: 'reject',
          rejectionReasonCode: 'notDiscussed',
        });
        continue;
      }
      await services.reviewSuggestion({
        suggestionId: suggestion.id,
        accountId,
        action: 'accept',
      });
    }

    const result = await services.applyConfirmedSuggestions({
      sessionId: session.id,
      extractionRunId: run.id,
      accountId,
      workerConfirmed: true,
      sessionUnlocked: true,
    });

    expect(result.session.status).toBe('confirmed');
    expect(result.appliedCount).toBeGreaterThan(0);

    const encounters = await repos.encounters.listByClient(client.id);
    expect(encounters.length).toBeGreaterThan(0);

    await manager.close();
  });

  it('saves through quick apply when the linked visit is already closed', async () => {
    const { manager, repos, services, accountId, client, encounterId } = await setupVoiceTest({
      withEncounter: true,
    });
    await repos.encounters.complete(encounterId!, accountId);

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
      transcriptText: 'SYNTHETIC save after closed visit link.',
      accountId,
    });
    await services.confirmTranscript({
      transcriptId: transcript.id,
      accountId,
    });
    const { suggestions } = await services.requestExtraction({
      sessionId: session.id,
      transcriptId: transcript.id,
      accountId,
    });

    const reviewed = [];
    for (const suggestion of suggestions) {
      if (suggestion.targetKey === 'clientName' || suggestion.targetKey === 'babyName') {
        reviewed.push(
          await services.reviewSuggestion({
            suggestionId: suggestion.id,
            accountId,
            action: 'reject',
            rejectionReasonCode: 'notDiscussed',
          }),
        );
        continue;
      }
      reviewed.push(
        await services.reviewSuggestion({
          suggestionId: suggestion.id,
          accountId,
          action: 'accept',
        }),
      );
    }

    const accepted = reviewed.filter(
      (suggestion) =>
        suggestion.reviewStatus === 'accepted' || suggestion.reviewStatus === 'edited',
    );
    const result = await services.quickApplyExtraction({
      sessionId: session.id,
      accountId,
      suggestions: accepted,
      sessionUnlocked: true,
    });

    expect(result.appliedCount).toBeGreaterThan(0);
    const encounters = await repos.encounters.listByClient(client.id);
    expect(encounters.some((encounter) => encounter.status === 'draft')).toBe(true);

    await manager.close();
  });
});
