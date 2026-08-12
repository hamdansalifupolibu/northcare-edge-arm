import { getAppConfig } from '../../../config/appConfig';
import type { AppEnvironment } from '../../../types/env';
import type { ScreeningType } from '../../../data/domain/enums/domainEnums';
import { SYNTHETIC_DEV_WORKFLOW_TEMPLATE } from './syntheticDevWorkflowTemplate';
import type { ScreeningContentStatus, ScreeningTemplateDefinition } from './types';

const ALL_TEMPLATES: readonly ScreeningTemplateDefinition[] = [
  SYNTHETIC_DEV_WORKFLOW_TEMPLATE,
];

function allowedStatusesForEnvironment(
  environment: AppEnvironment,
): readonly ScreeningContentStatus[] {
  if (environment === 'production') {
    return ['APPROVED_FOR_PILOT'];
  }
  // development + staging may use development-approved synthetic packs
  return ['APPROVED_FOR_DEVELOPMENT', 'APPROVED_FOR_PILOT'];
}

export function listLoadableTemplates(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly ScreeningTemplateDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_TEMPLATES.filter((template) => allowed.has(template.status));
}

export function getTemplateById(
  templateId: string,
  version?: number,
  environment: AppEnvironment = getAppConfig().appEnv,
): ScreeningTemplateDefinition | null {
  const match = listLoadableTemplates(environment).find(
    (template) =>
      template.templateId === templateId &&
      (version == null || template.version === version),
  );
  return match ?? null;
}

export function resolveTemplateForNewVisit(input: {
  readonly screeningType?: ScreeningType;
  readonly environment?: AppEnvironment;
}): ScreeningTemplateDefinition | null {
  const environment = input.environment ?? getAppConfig().appEnv;
  const loadable = listLoadableTemplates(environment);
  if (input.screeningType) {
    const typed = loadable.find((template) => template.screeningType === input.screeningType);
    if (typed) {
      return typed;
    }
  }
  return loadable[0] ?? null;
}

export function getTemplateForPersistedScreening(input: {
  readonly screeningType: ScreeningType;
  readonly schemaVersion: number;
}): ScreeningTemplateDefinition | null {
  // Existing visits may resolve their original template version for review/history,
  // including retired packs. New visits never use retired/unapproved packs.
  return (
    ALL_TEMPLATES.find(
      (template) =>
        template.screeningType === input.screeningType &&
        template.version === input.schemaVersion,
    ) ?? null
  );
}

export function listAllRegisteredTemplatesForInventory(): readonly ScreeningTemplateDefinition[] {
  return ALL_TEMPLATES;
}
