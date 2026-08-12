import * as selectExtractionProviderModule from '../providers/extraction/selectExtractionProvider';
import { setupVoiceTest } from './helpers';

describe('empty voice extraction', () => {
  it('rejects completed extraction with zero suggestions', async () => {
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
      transcriptText: 'SYNTHETIC empty extraction guard test.',
      accountId,
    });
    await services.confirmTranscript({
      transcriptId: transcript.id,
      accountId,
    });

    const spy = jest.spyOn(selectExtractionProviderModule, 'selectExtractionProvider').mockReturnValue({
      id: 'test.empty.extraction',
      version: '1',
      availability: 'developmentOnly',
      supportsOffline: true,
      isSynthetic: true,
      async extract() {
        return {
          providerId: 'test.empty.extraction',
          providerVersion: '1',
          status: 'completed',
          suggestions: [],
          isSynthetic: true,
          connectivityRequired: false,
          errorCategory: null,
        };
      },
    });

    try {
      await expect(
        services.requestExtraction({
          sessionId: session.id,
          transcriptId: transcript.id,
          accountId,
        }),
      ).rejects.toThrow(/No fields could be extracted/i);

      const bundle = await services.getSessionBundle(session.id);
      expect(bundle?.session.status).not.toBe('reviewRequired');
    } finally {
      spy.mockRestore();
      await manager.close();
    }
  });
});
