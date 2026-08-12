import { setupVoiceTest } from './helpers';

/**
 * Development auth bypass uses opaque account ids like "dev-dual-…", not UUID v4.
 * Review/save must not crash on suggestion read-back after writing that actor id.
 */
describe('voice suggestion review with opaque account id', () => {
  it('accepts and quick-applies suggestions when accountId is not a UUID', async () => {
    const opaqueAccountId = 'dev-dual-8d2ce4bbb8e656c8afea';
    const { manager, services, client } = await setupVoiceTest();

    const session = await services.startSession({
      clientId: client.id,
      accountId: opaqueAccountId,
    });
    await services.recordConsent({
      sessionId: session.id,
      status: 'recorded',
      accountId: opaqueAccountId,
    });
    const transcript = await services.saveManualTranscript({
      sessionId: session.id,
      transcriptText: 'SYNTHETIC opaque account review and save test.',
      accountId: opaqueAccountId,
    });
    await services.confirmTranscript({
      transcriptId: transcript.id,
      accountId: opaqueAccountId,
    });
    const { suggestions } = await services.requestExtraction({
      sessionId: session.id,
      transcriptId: transcript.id,
      accountId: opaqueAccountId,
    });
    expect(suggestions.length).toBeGreaterThan(0);

    const reviewed = [];
    for (const suggestion of suggestions) {
      if (suggestion.targetKey === 'clientName' || suggestion.targetKey === 'babyName') {
        reviewed.push(
          await services.reviewSuggestion({
            suggestionId: suggestion.id,
            accountId: opaqueAccountId,
            action: 'reject',
            rejectionReasonCode: 'notDiscussed',
          }),
        );
        continue;
      }
      reviewed.push(
        await services.reviewSuggestion({
          suggestionId: suggestion.id,
          accountId: opaqueAccountId,
          action: 'accept',
        }),
      );
    }

    const accepted = reviewed.filter(
      (suggestion) =>
        suggestion.reviewStatus === 'accepted' || suggestion.reviewStatus === 'edited',
    );
    expect(accepted.length).toBeGreaterThan(0);

    const result = await services.quickApplyExtraction({
      sessionId: session.id,
      accountId: opaqueAccountId,
      suggestions: accepted,
      sessionUnlocked: true,
    });
    expect(result.appliedCount).toBeGreaterThan(0);

    await manager.close();
  });
});
