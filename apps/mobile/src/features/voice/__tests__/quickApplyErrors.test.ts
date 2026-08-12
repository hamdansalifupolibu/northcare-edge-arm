import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import { VoiceError } from '../domain/errors';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { setupVoiceTest } from './helpers';

describe('voice quick-apply error surfacing', () => {
  it('preserves VoiceError thrown inside DatabaseManager transactions', async () => {
    const { manager } = await createTestDatabase();

    await expect(
      manager.withTransaction(async () => {
        throw new VoiceError(
          'validationFailed',
          'Nothing could be saved from the reviewed fields. Try editing a field and save again.',
        );
      }),
    ).rejects.toMatchObject({
      name: 'VoiceError',
      sanitisedMessage:
        'Nothing could be saved from the reviewed fields. Try editing a field and save again.',
    });

    await manager.close();
  });

  it('maps preserved VoiceError to the worker-facing save message', () => {
    expect(
      mapVoiceServiceError(
        new VoiceError(
          'validationFailed',
          'Nothing could be saved from the reviewed fields. Try editing a field and save again.',
        ),
      ),
    ).toBe('Nothing could be saved from the reviewed fields. Try editing a field and save again.');
  });

  it('rejects quick apply when no reviewed suggestions are provided', async () => {
    const { manager, services, accountId, client } = await setupVoiceTest();
    const session = await services.startSession({
      clientId: client.id,
      accountId,
    });

    await expect(
      services.quickApplyExtraction({
        sessionId: session.id,
        accountId,
        suggestions: [],
        sessionUnlocked: true,
      }),
    ).rejects.toThrow(/Nothing could be saved/i);

    await manager.close();
  });
});
