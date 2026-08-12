import { setupVoiceTest } from './helpers';

describe('voice recordings list', () => {
  it('lists recent sessions for the worker account', async () => {
    const { manager, services, accountId, client } = await setupVoiceTest();
    await services.startSession({
      clientId: client.id,
      accountId,
    });

    const recordings = await services.listRecordings({ accountId, limit: 10 });
    expect(recordings.length).toBe(1);
    expect(recordings[0]?.clientName).toContain('Amina');
    expect(recordings[0]?.clientId).toBe(client.id);

    await manager.close();
  });

  it('filters by client when requested', async () => {
    const { manager, repos, services, accountId, client, facility } = await setupVoiceTest();
    const otherClient = await repos.clients.create({
      clientCode: 'SYN-VOC-002',
      category: 'childUnderFive',
      givenName: 'Kofi',
      familyName: 'Other',
      primaryFacilityId: facility.id,
      accountId,
    });
    await services.startSession({ clientId: client.id, accountId });
    await services.startSession({ clientId: otherClient.id, accountId });

    const filtered = await services.listRecordings({
      accountId,
      clientId: client.id,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.clientId).toBe(client.id);

    await manager.close();
  });

  it('includes transcript snippet loaded from sqlite', async () => {
    const { manager, services, accountId, client } = await setupVoiceTest();
    const session = await services.startSession({
      clientId: client.id,
      accountId,
    });
    await services.recordConsent({
      sessionId: session.id,
      status: 'recorded',
      accountId,
    });
    await services.saveManualTranscript({
      sessionId: session.id,
      transcriptText: 'SYNTHETIC transcript snippet for recordings list.',
      accountId,
    });

    const recordings = await services.listRecordings({ accountId, limit: 10 });
    expect(recordings[0]?.transcriptSnippet).toContain('SYNTHETIC transcript');

    await manager.close();
  });

  it('reports reviewable field count from the latest extraction run', async () => {
    const { manager, services, accountId, client } = await setupVoiceTest();
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
      transcriptText: 'SYNTHETIC reviewable field count list test.',
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

    const recordings = await services.listRecordings({ accountId, limit: 10 });
    expect(recordings[0]?.reviewableFieldCount).toBe(suggestions.length);
    expect(recordings[0]?.status).toBe('reviewRequired');

    await manager.close();
  });
});
