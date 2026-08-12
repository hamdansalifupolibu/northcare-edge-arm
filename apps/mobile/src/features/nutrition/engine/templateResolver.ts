import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { Client } from '../../../data/domain/entities/entities';
import type { AppEnvironment } from '../../../types/env';
import { NutritionError } from '../domain/errors';
import type { NutritionAssessmentType } from '../domain/statuses';
import type { NutritionAssessmentTemplateDefinition } from '../domain/types';
import {
  listApplicableTemplatesForClient,
  resolveTemplateForNewAssessment,
} from '../content/registry';
import { deriveExactAgeYears, deriveApproximateAgeYears } from '../../risk/engine/ageHelpers';

export type NutritionAgeContext = {
  readonly ageDays: number | null;
  readonly precision: 'exact' | 'approximate' | 'unknown';
};

export function resolveClientAgeContext(
  client: Client,
  referenceDateOnly: string,
): NutritionAgeContext {
  if (client.dateOfBirth) {
    const years = deriveExactAgeYears(client.dateOfBirth, referenceDateOnly);
    if (years) {
      return { ageDays: Math.floor(years.years * 365.25), precision: 'exact' };
    }
  }
  if (client.approximateAge != null) {
    const unit = client.approximateAgeUnit ?? 'years';
    let years = client.approximateAge;
    if (unit === 'months') {
      years = client.approximateAge / 12;
    } else if (unit === 'weeks') {
      years = client.approximateAge / 52.1775;
    } else if (unit === 'days') {
      years = client.approximateAge / 365.25;
    }
    const derived = deriveApproximateAgeYears(years);
    if (derived) {
      return { ageDays: Math.floor(derived.years * 365.25), precision: 'approximate' };
    }
  }
  return { ageDays: null, precision: 'unknown' };
}

export function isTemplateAgeApplicable(
  template: NutritionAssessmentTemplateDefinition,
  age: NutritionAgeContext,
): { readonly ok: boolean; readonly reason?: 'moreInformationRequired' | 'incompatibleAge' } {
  const { ageApplicability } = template;
  if (ageApplicability.requireExactAge && age.precision !== 'exact') {
    return { ok: false, reason: 'moreInformationRequired' };
  }
  if (age.precision === 'unknown') {
    if (ageApplicability.minAgeDays != null || ageApplicability.maxAgeDays != null) {
      return { ok: false, reason: 'moreInformationRequired' };
    }
    return { ok: true };
  }
  if (age.precision === 'approximate' && !ageApplicability.allowApproximateAge) {
    return { ok: false, reason: 'moreInformationRequired' };
  }
  if (age.ageDays == null) {
    return { ok: false, reason: 'moreInformationRequired' };
  }
  if (ageApplicability.minAgeDays != null && age.ageDays < ageApplicability.minAgeDays) {
    return { ok: false, reason: 'incompatibleAge' };
  }
  if (ageApplicability.maxAgeDays != null && age.ageDays > ageApplicability.maxAgeDays) {
    return { ok: false, reason: 'incompatibleAge' };
  }
  return { ok: true };
}

export function resolveApplicableTemplates(input: {
  readonly client: Client;
  readonly referenceDateOnly: string;
  readonly assessmentType?: NutritionAssessmentType;
  readonly environment?: AppEnvironment;
}): {
  readonly templates: readonly NutritionAssessmentTemplateDefinition[];
  readonly age: NutritionAgeContext;
  readonly moreInformationRequired: boolean;
} {
  const age = resolveClientAgeContext(input.client, input.referenceDateOnly);
  const categoryTemplates = listApplicableTemplatesForClient({
    category: input.client.category,
    environment: input.environment,
  });
  const typed = input.assessmentType
    ? categoryTemplates.filter((t) => t.assessmentType === input.assessmentType)
    : categoryTemplates;

  const applicable: NutritionAssessmentTemplateDefinition[] = [];
  let moreInformationRequired = false;
  for (const template of typed) {
    const check = isTemplateAgeApplicable(template, age);
    if (check.ok) {
      applicable.push(template);
    } else if (check.reason === 'moreInformationRequired') {
      moreInformationRequired = true;
    }
  }

  return { templates: applicable, age, moreInformationRequired };
}

export function assertTemplateApplicableToClient(input: {
  readonly template: NutritionAssessmentTemplateDefinition;
  readonly client: Client;
  readonly referenceDateOnly: string;
}): void {
  if (!input.template.applicableClientCategories.includes(input.client.category)) {
    throw new NutritionError(
      'templateInapplicable',
      'This nutrition assessment type is not applicable for the client category.',
    );
  }
  const age = resolveClientAgeContext(input.client, input.referenceDateOnly);
  const check = isTemplateAgeApplicable(input.template, age);
  if (!check.ok) {
    throw new NutritionError(
      check.reason === 'moreInformationRequired' ? 'moreInformationRequired' : 'templateInapplicable',
      check.reason === 'moreInformationRequired'
        ? 'More age information is required before starting this nutrition assessment.'
        : 'This nutrition assessment type is not applicable for the client age.',
    );
  }
}

export function asScreeningTemplateShape(
  template: NutritionAssessmentTemplateDefinition,
): {
  readonly templateId: string;
  readonly version: number;
  readonly title: string;
  readonly sections: NutritionAssessmentTemplateDefinition['sections'];
  readonly developmentBanner: string;
} {
  return {
    templateId: template.templateId,
    version: template.version,
    title: template.title,
    sections: template.sections,
    developmentBanner: template.developmentBanner,
  };
}

export function pickTemplateOrThrow(input: {
  readonly category: ClientCategory;
  readonly assessmentType: NutritionAssessmentType;
  readonly environment?: AppEnvironment;
}): NutritionAssessmentTemplateDefinition {
  const template = resolveTemplateForNewAssessment({
    category: input.category,
    assessmentType: input.assessmentType,
    environment: input.environment,
  });
  if (!template) {
    throw new NutritionError(
      'assessmentUnavailable',
      'Nutrition assessment unavailable for the selected type in this environment.',
    );
  }
  return template;
}
