import { getAppConfig } from '../../../config/appConfig';
import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { AppEnvironment } from '../../../types/env';
import { NutritionError } from '../domain/errors';
import type { NutritionAssessmentType, NutritionContentStatus } from '../domain/statuses';
import type {
  NutritionAssessmentTemplateDefinition,
  NutritionGuidancePackDefinition,
  NutritionReferencePackDefinition,
} from '../domain/types';
import { SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE } from './assessments/syntheticDevChildNutritionTemplate';
import { SYNTHETIC_DEV_MATERNAL_NUTRITION_TEMPLATE } from './assessments/syntheticDevMaternalNutritionTemplate';
import { SYNTHETIC_DEV_NUTRITION_GUIDANCE_PACK } from './guidance/syntheticDevNutritionGuidancePack';
import { SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK } from './references/syntheticDevNutritionReferencePack';

const ALL_TEMPLATES: readonly NutritionAssessmentTemplateDefinition[] = [
  SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE,
  SYNTHETIC_DEV_MATERNAL_NUTRITION_TEMPLATE,
];

const ALL_REFERENCE_PACKS: readonly NutritionReferencePackDefinition[] = [
  SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK,
];

const ALL_GUIDANCE_PACKS: readonly NutritionGuidancePackDefinition[] = [
  SYNTHETIC_DEV_NUTRITION_GUIDANCE_PACK,
];

function allowedStatusesForEnvironment(
  environment: AppEnvironment,
): readonly NutritionContentStatus[] {
  if (environment === 'production') {
    return ['APPROVED_FOR_PILOT'];
  }
  return ['APPROVED_FOR_DEVELOPMENT', 'APPROVED_FOR_PILOT'];
}

export function listLoadableNutritionTemplates(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly NutritionAssessmentTemplateDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_TEMPLATES.filter((template) => allowed.has(template.status));
}

export function listLoadableReferencePacks(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly NutritionReferencePackDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_REFERENCE_PACKS.filter((pack) => allowed.has(pack.status));
}

export function listLoadableGuidancePacks(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly NutritionGuidancePackDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_GUIDANCE_PACKS.filter((pack) => allowed.has(pack.status));
}

export function getNutritionTemplateById(
  templateId: string,
  version?: number,
  environment: AppEnvironment = getAppConfig().appEnv,
): NutritionAssessmentTemplateDefinition | null {
  return (
    listLoadableNutritionTemplates(environment).find(
      (template) =>
        template.templateId === templateId &&
        (version == null || template.version === version),
    ) ?? null
  );
}

export function getTemplateForPersistedAssessment(input: {
  readonly templateId: string;
  readonly templateVersion: number;
}): NutritionAssessmentTemplateDefinition | null {
  // History may resolve retired/original packs. New assessments never use them.
  return (
    ALL_TEMPLATES.find(
      (template) =>
        template.templateId === input.templateId &&
        template.version === input.templateVersion,
    ) ?? null
  );
}

export function listApplicableTemplatesForClient(input: {
  readonly category: ClientCategory;
  readonly environment?: AppEnvironment;
}): readonly NutritionAssessmentTemplateDefinition[] {
  const environment = input.environment ?? getAppConfig().appEnv;
  return listLoadableNutritionTemplates(environment).filter((template) =>
    template.applicableClientCategories.includes(input.category),
  );
}

export function resolveTemplateForNewAssessment(input: {
  readonly category: ClientCategory;
  readonly assessmentType?: NutritionAssessmentType;
  readonly environment?: AppEnvironment;
}): NutritionAssessmentTemplateDefinition | null {
  const applicable = listApplicableTemplatesForClient({
    category: input.category,
    environment: input.environment,
  });
  if (input.assessmentType) {
    return (
      applicable.find((template) => template.assessmentType === input.assessmentType) ?? null
    );
  }
  return applicable[0] ?? null;
}

export function requireTemplateForNewAssessment(input: {
  readonly category: ClientCategory;
  readonly assessmentType?: NutritionAssessmentType;
  readonly environment?: AppEnvironment;
}): NutritionAssessmentTemplateDefinition {
  const template = resolveTemplateForNewAssessment(input);
  if (!template) {
    throw new NutritionError(
      'assessmentUnavailable',
      'An approved nutrition-assessment template is not available for this client.',
    );
  }
  return template;
}

export function getReferencePackById(
  referencePackId: string,
  version?: number,
  environment: AppEnvironment = getAppConfig().appEnv,
): NutritionReferencePackDefinition | null {
  return (
    listLoadableReferencePacks(environment).find(
      (pack) =>
        pack.referencePackId === referencePackId &&
        (version == null || pack.version === version),
    ) ?? null
  );
}

export function getGuidancePackById(
  guidancePackId: string,
  version?: number,
  environment: AppEnvironment = getAppConfig().appEnv,
): NutritionGuidancePackDefinition | null {
  return (
    listLoadableGuidancePacks(environment).find(
      (pack) =>
        pack.guidancePackId === guidancePackId &&
        (version == null || pack.version === version),
    ) ?? null
  );
}

export function listAllRegisteredTemplatesForInventory(): readonly NutritionAssessmentTemplateDefinition[] {
  return ALL_TEMPLATES;
}

export function listAllRegisteredReferencePacksForInventory(): readonly NutritionReferencePackDefinition[] {
  return ALL_REFERENCE_PACKS;
}

export function listAllRegisteredGuidancePacksForInventory(): readonly NutritionGuidancePackDefinition[] {
  return ALL_GUIDANCE_PACKS;
}

export function countApprovedForPilotTemplates(): number {
  return ALL_TEMPLATES.filter((t) => t.status === 'APPROVED_FOR_PILOT').length;
}

export function countApprovedForPilotReferencePacks(): number {
  return ALL_REFERENCE_PACKS.filter((p) => p.status === 'APPROVED_FOR_PILOT').length;
}

export function countApprovedForPilotGuidancePacks(): number {
  return ALL_GUIDANCE_PACKS.filter((p) => p.status === 'APPROVED_FOR_PILOT').length;
}

export function countApprovedForDevelopmentTemplates(): number {
  return ALL_TEMPLATES.filter((t) => t.status === 'APPROVED_FOR_DEVELOPMENT').length;
}

export function countApprovedForDevelopmentReferencePacks(): number {
  return ALL_REFERENCE_PACKS.filter((p) => p.status === 'APPROVED_FOR_DEVELOPMENT').length;
}

export function countApprovedForDevelopmentGuidancePacks(): number {
  return ALL_GUIDANCE_PACKS.filter((p) => p.status === 'APPROVED_FOR_DEVELOPMENT').length;
}
