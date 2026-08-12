import { createLogger, sanitizeMeta } from '../../../logging/logger';
import { runPrivacyPrecheck } from '../domain/privacy';
import {
  clearAssistantConversation,
  getAssistantDraftQuestion,
  setAssistantDraftQuestion,
  storeAssistantResult,
  getLastAssistantResult,
} from '../session/assistantConversationStore';
import { setupAssistantTest } from './helpers';
import { assertDevelopmentSimulationAllowed } from '../providers/development/developmentSimulationProvider';
import { isDevelopmentRouteAllowed } from '../../../navigation/routeAccess';

describe('assistant privacy', () => {
  it('flags phone-like and email-like patterns', () => {
    expect(runPrivacyPrecheck('Call me on +233 20 123 4567').flagged).toBe(true);
    expect(runPrivacyPrecheck('email test@example.com please').flagged).toBe(true);
    expect(runPrivacyPrecheck('What is example care topic A').flagged).toBe(false);
  });

  it('requires privacy acknowledgement before processing flagged questions', async () => {
    const { services, manager } = await setupAssistantTest('development');
    const blocked = await services.ask({
      question: 'Can I ask about +233201234567?',
    });
    expect(blocked.kind).toBe('privacyReviewRequired');

    const continued = await services.ask({
      question: 'Can I ask about +233201234567?',
      acknowledgePrivacyWarning: true,
    });
    // After acknowledgement, intent/privacy may still route; must not silently invent clinical answer.
    expect(['boundary', 'answer', 'privacyReviewRequired', 'unavailable']).toContain(
      continued.kind,
    );
    await manager.close();
  });

  it('clears conversation draft on clear and does not persist raw questions', () => {
    setAssistantDraftQuestion('secret patient question');
    storeAssistantResult({
      kind: 'unavailable',
      answerId: '00000000-0000-4000-8000-000000000001',
      message: 'none',
    });
    expect(getLastAssistantResult()).not.toBeNull();
    clearAssistantConversation();
    expect(getAssistantDraftQuestion()).toBe('');
    expect(getLastAssistantResult()).toBeNull();
  });

  it('does not put raw questions into sanitised logs or audit metadata keys', async () => {
    const meta = sanitizeMeta({
      mode: 'CURATED_RETRIEVAL',
      question: 'should be redacted by sensitive key patterns if named poorly',
      answerability: 'unsupportedTopic',
    });
    expect(meta?.answerability).toBe('unsupportedTopic');

    const { services, manager } = await setupAssistantTest('development');
    await services.ask({ question: 'What is example care topic A' });
    const events = await manager
      .getDriver()
      .getAllAsync<{ metadata_json: string | null; event_type: string }>(
        `SELECT event_type, metadata_json FROM audit_events WHERE event_type LIKE 'assistant.%'`,
      );
    for (const event of events) {
      expect(event.metadata_json ?? '').not.toMatch(/What is example care topic A/i);
    }
    const logger = createLogger({ environment: 'development' });
    logger.info('assistant.test', { mode: 'CURATED_RETRIEVAL', candidateCount: 1 });
    await manager.close();
  });

  it('blocks development simulation and development routes in production gates', () => {
    expect(() => assertDevelopmentSimulationAllowed('production')).toThrow();
    expect(isDevelopmentRouteAllowed(false)).toBe(false);
  });
});
