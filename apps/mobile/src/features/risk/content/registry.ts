import { getAppConfig } from '../../../config/appConfig';
import type { AppEnvironment } from '../../../types/env';
import { RiskEngineError } from '../domain/errors';
import type { RiskContentStatus, RiskRulePackDefinition } from '../domain/rulePack';
import { assertValidRulePack } from '../engine/validation';
import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from './development/syntheticDevPriorityRulePack';

const ALL_RULE_PACKS: readonly RiskRulePackDefinition[] = [
  SYNTHETIC_DEV_PRIORITY_RULE_PACK,
  // approved/ remains empty until clinically reviewed APPROVED_FOR_PILOT packs exist.
];

function allowedStatusesForEnvironment(
  environment: AppEnvironment,
): readonly RiskContentStatus[] {
  if (environment === 'production') {
    return ['APPROVED_FOR_PILOT'];
  }
  // development + staging may load development-approved synthetic packs
  return ['APPROVED_FOR_DEVELOPMENT', 'APPROVED_FOR_PILOT'];
}

export function listLoadableRulePacks(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly RiskRulePackDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_RULE_PACKS.filter((pack) => allowed.has(pack.status));
}

export function getRulePackById(
  rulePackId: string,
  version?: number,
  environment: AppEnvironment = getAppConfig().appEnv,
): RiskRulePackDefinition | null {
  return (
    listLoadableRulePacks(environment).find(
      (pack) =>
        pack.rulePackId === rulePackId && (version == null || pack.version === version),
    ) ?? null
  );
}

export function resolveRulePackForScreening(input: {
  readonly screeningTemplateId: string;
  readonly screeningTemplateVersion: number;
  readonly environment?: AppEnvironment;
}): RiskRulePackDefinition | null {
  const environment = input.environment ?? getAppConfig().appEnv;
  const loadable = listLoadableRulePacks(environment);
  return (
    loadable.find(
      (pack) =>
        pack.applicableScreeningTemplateIds.includes(input.screeningTemplateId) &&
        pack.applicableScreeningTemplateVersions.includes(input.screeningTemplateVersion) &&
        pack.status !== 'RETIRED' &&
        pack.status !== 'DRAFT' &&
        pack.status !== 'CLINICAL_REVIEW_REQUIRED',
    ) ?? null
  );
}

/**
 * Resolve pack for evaluation or throw a typed fail-closed error.
 * Production never falls back to synthetic packs.
 */
export function requireRulePackForScreening(input: {
  readonly screeningTemplateId: string;
  readonly screeningTemplateVersion: number;
  readonly environment?: AppEnvironment;
}): RiskRulePackDefinition {
  const pack = resolveRulePackForScreening(input);
  if (!pack) {
    throw new RiskEngineError(
      'rulePackUnavailable',
      'An approved priority-assessment rule set is not available for this screening.',
    );
  }
  assertValidRulePack(pack);
  return pack;
}

export function listAllRegisteredRulePacksForInventory(): readonly RiskRulePackDefinition[] {
  return ALL_RULE_PACKS;
}

export function countApprovedForPilotPacks(): number {
  return ALL_RULE_PACKS.filter((pack) => pack.status === 'APPROVED_FOR_PILOT').length;
}
