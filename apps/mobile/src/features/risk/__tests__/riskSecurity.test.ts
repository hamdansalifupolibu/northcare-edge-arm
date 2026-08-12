import { evaluateRouteAccess, isDevelopmentRouteAllowed } from '../../../navigation/routeAccess';
import { createLogger } from '../../../logging/logger';
import { listLoadableRulePacks, requireRulePackForScreening } from '../content/registry';
import { isRiskEngineError } from '../domain/errors';
import { PRIORITY_DISPLAY } from '../domain/priorities';
import { riskStrings } from '../i18n/riskStrings';

describe('risk security and privacy', () => {
  it('blocks signed-out and locked worker access', () => {
    expect(
      evaluateRouteAccess('protected-worker', { authState: 'signedOut', role: null })
        .allowed,
    ).toBe(false);
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'locked',
        role: 'worker',
      }).allowed,
    ).toBe(false);
  });

  it('blocks administrator from worker risk routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'administrator',
      }).allowed,
    ).toBe(false);
  });

  it('gates development preview and synthetic packs in production', () => {
    expect(isDevelopmentRouteAllowed(false)).toBe(false);
    expect(listLoadableRulePacks('production')).toEqual([]);
    expect(() =>
      requireRulePackForScreening({
        screeningTemplateId: 'synthetic-dev-workflow-v1',
        screeningTemplateVersion: 1,
        environment: 'production',
      }),
    ).toThrow();
    try {
      requireRulePackForScreening({
        screeningTemplateId: 'synthetic-dev-workflow-v1',
        screeningTemplateVersion: 1,
        environment: 'production',
      });
    } catch (error) {
      expect(isRiskEngineError(error)).toBe(true);
      if (isRiskEngineError(error)) {
        expect(error.code).toBe('rulePackUnavailable');
        expect(error.sanitisedMessage).not.toContain('synthetic-dev-priority');
      }
    }
  });

  it('does not log answers, measurements, or client identity', () => {
    const lines: string[] = [];
    const logger = createLogger({
      environment: 'development',
      sink: (_level, message, meta) => {
        lines.push(`${message}:${JSON.stringify(meta ?? {})}`);
      },
    });
    logger.info('priority_evaluated', {
      engineVersion: 1,
      rulePackId: 'synthetic-dev-priority-v1',
      priority: 'red',
      matchedRuleCount: 1,
    });
    const joined = lines.join(' ');
    expect(joined).not.toMatch(/givenName|familyName|phone|item_a1|boolean|kg|PIN|token/i);
  });

  it('does not expose manual priority downgrade copy as an action', () => {
    expect(riskStrings.overrideUnavailable).toContain('not available');
    expect(PRIORITY_DISPLAY.green.summary).not.toMatch(/healthy|no risk|all clear/i);
    expect(PRIORITY_DISPLAY.red.summary).not.toMatch(/diagnosis|disease|medication/i);
  });
});
