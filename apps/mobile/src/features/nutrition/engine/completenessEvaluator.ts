import type { NutritionAssessmentTemplateDefinition } from '../domain/types';
import type {
  RecordedScreeningAnswer,
  ScreeningTemplateDefinition,
} from '../../screening/content/types';
import {
  findIncompleteRequiredQuestions,
  listVisibleSections,
  resolveSkippedByCondition,
} from '../../screening/engine/templateEngine';

function toScreeningShape(
  template: NutritionAssessmentTemplateDefinition,
): ScreeningTemplateDefinition {
  return {
    templateId: template.templateId,
    version: template.version,
    status:
      template.status === 'REVIEW_REQUIRED'
        ? 'CLINICAL_REVIEW_REQUIRED'
        : template.status === 'APPROVED_FOR_DEVELOPMENT'
          ? 'APPROVED_FOR_DEVELOPMENT'
          : template.status === 'APPROVED_FOR_PILOT'
            ? 'APPROVED_FOR_PILOT'
            : template.status === 'RETIRED'
              ? 'RETIRED'
              : 'DRAFT',
    screeningType: 'nutrition',
    title: template.title,
    developmentBanner: template.developmentBanner,
    sections: template.sections,
    clinicalSourceRef: template.clinicalSourceRef,
  };
}

export function evaluateNutritionCompleteness(
  template: NutritionAssessmentTemplateDefinition,
  answers: readonly RecordedScreeningAnswer[],
): {
  readonly incompleteRequired: readonly string[];
  readonly resolvedAnswers: readonly RecordedScreeningAnswer[];
  readonly visibleSectionIds: readonly string[];
} {
  const screeningTemplate = toScreeningShape(template);
  const resolvedAnswers = resolveSkippedByCondition(screeningTemplate, answers);
  const incomplete = findIncompleteRequiredQuestions(screeningTemplate, resolvedAnswers);
  const visible = listVisibleSections(screeningTemplate, resolvedAnswers);
  return {
    incompleteRequired: incomplete.map((q) => q.id),
    resolvedAnswers,
    visibleSectionIds: visible.map((v) => v.section.id),
  };
}

export function nutritionTemplateAsScreening(
  template: NutritionAssessmentTemplateDefinition,
): ScreeningTemplateDefinition {
  return toScreeningShape(template);
}
