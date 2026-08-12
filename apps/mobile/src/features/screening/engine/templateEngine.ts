import type {
  RecordedScreeningAnswer,
  ScreeningQuestionDefinition,
  ScreeningSectionDefinition,
  ScreeningTemplateDefinition,
} from '../content/types';
import { evaluateVisibility } from './evaluateVisibility';

export type VisibleSection = {
  readonly section: ScreeningSectionDefinition;
  readonly questions: readonly ScreeningQuestionDefinition[];
};

export type SectionProgress = {
  readonly sectionIndex: number;
  readonly sectionCount: number;
  readonly sectionId: string;
  readonly label: string;
};

export function listVisibleSections(
  template: ScreeningTemplateDefinition,
  answers: readonly RecordedScreeningAnswer[],
): readonly VisibleSection[] {
  return template.sections.map((section) => ({
    section,
    questions: section.questions.filter((question) =>
      evaluateVisibility(question.visibleWhen, answers),
    ),
  }));
}

export function getSectionProgress(
  template: ScreeningTemplateDefinition,
  sectionId: string,
): SectionProgress | null {
  const index = template.sections.findIndex((section) => section.id === sectionId);
  if (index < 0) {
    return null;
  }
  return {
    sectionIndex: index + 1,
    sectionCount: template.sections.length,
    sectionId,
    label: `Section ${index + 1} of ${template.sections.length}`,
  };
}

export function getNextSectionId(
  template: ScreeningTemplateDefinition,
  sectionId: string,
): string | null {
  const index = template.sections.findIndex((section) => section.id === sectionId);
  if (index < 0 || index >= template.sections.length - 1) {
    return null;
  }
  return template.sections[index + 1]?.id ?? null;
}

export function getPreviousSectionId(
  template: ScreeningTemplateDefinition,
  sectionId: string,
): string | null {
  const index = template.sections.findIndex((section) => section.id === sectionId);
  if (index <= 0) {
    return null;
  }
  return template.sections[index - 1]?.id ?? null;
}

export function resolveSkippedByCondition(
  template: ScreeningTemplateDefinition,
  answers: readonly RecordedScreeningAnswer[],
): readonly RecordedScreeningAnswer[] {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const result: RecordedScreeningAnswer[] = [];

  for (const section of template.sections) {
    for (const question of section.questions) {
      const visible = evaluateVisibility(question.visibleWhen, answers);
      const existing = answerMap.get(question.id);
      if (!visible) {
        result.push({
          questionId: question.id,
          state: 'skippedByCondition',
        });
        continue;
      }
      if (existing) {
        result.push(existing);
      }
    }
  }
  return result;
}

export function findIncompleteRequiredQuestions(
  template: ScreeningTemplateDefinition,
  answers: readonly RecordedScreeningAnswer[],
): readonly ScreeningQuestionDefinition[] {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const incomplete: ScreeningQuestionDefinition[] = [];

  for (const section of template.sections) {
    for (const question of section.questions) {
      if (!question.required) {
        continue;
      }
      if (!evaluateVisibility(question.visibleWhen, answers)) {
        continue;
      }
      const answer = answerMap.get(question.id);
      if (!answer) {
        incomplete.push(question);
        continue;
      }
      if (
        answer.state === 'answered' ||
        answer.state === 'unknown' ||
        answer.state === 'notAssessed' ||
        answer.state === 'declined' ||
        answer.state === 'notApplicable'
      ) {
        continue;
      }
      incomplete.push(question);
    }
  }
  return incomplete;
}

export function parseProgressSectionId(notes: string | null | undefined): string | null {
  if (!notes || !notes.startsWith('nc_progress:')) {
    return null;
  }
  const sectionId = notes.slice('nc_progress:'.length).trim();
  return sectionId.length > 0 ? sectionId : null;
}
