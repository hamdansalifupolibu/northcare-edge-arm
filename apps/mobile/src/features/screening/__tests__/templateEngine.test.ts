import { evaluateVisibility } from '../engine/evaluateVisibility';
import {
  findIncompleteRequiredQuestions,
  getSectionProgress,
  resolveSkippedByCondition,
} from '../engine/templateEngine';
import { SYNTHETIC_DEV_WORKFLOW_TEMPLATE } from '../content/syntheticDevWorkflowTemplate';
import { listLoadableTemplates, resolveTemplateForNewVisit } from '../content/registry';
import type { RecordedScreeningAnswer } from '../content/types';

describe('screening template engine', () => {
  it('evaluates typed visibility without treating unknown as no', () => {
    const answers: RecordedScreeningAnswer[] = [
      { questionId: 'item_a2', state: 'unknown' },
    ];
    expect(
      evaluateVisibility(
        { op: 'equals', questionId: 'item_a2', value: 'option_two' },
        answers,
      ),
    ).toBe(false);
    expect(
      evaluateVisibility(
        { op: 'equals', questionId: 'item_a2', value: false },
        answers,
      ),
    ).toBe(false);
  });

  it('evaluates numeric age visibility for IYCF branching', () => {
    const age14 = [{ questionId: 'child_age_months', state: 'answered' as const, value: { kind: 'number' as const, value: 14 } }];
    expect(
      evaluateVisibility(
        { op: 'numberGreaterThanOrEqual', questionId: 'child_age_months', value: 6 },
        age14,
      ),
    ).toBe(true);
    expect(
      evaluateVisibility(
        { op: 'numberLessThan', questionId: 'child_age_months', value: 6 },
        age14,
      ),
    ).toBe(false);

    const age4 = [{ questionId: 'child_age_months', state: 'answered' as const, value: { kind: 'number' as const, value: 4 } }];
    expect(
      evaluateVisibility(
        { op: 'numberLessThan', questionId: 'child_age_months', value: 6 },
        age4,
      ),
    ).toBe(true);
    expect(
      evaluateVisibility(
        { op: 'numberGreaterThanOrEqual', questionId: 'child_age_months', value: 6 },
        age4,
      ),
    ).toBe(false);

    expect(
      evaluateVisibility(
        { op: 'numberGreaterThanOrEqual', questionId: 'child_age_months', value: 6 },
        [],
      ),
    ).toBe(false);
  });

  it('shows conditional question only when equals matches', () => {
    const hidden = evaluateVisibility(
      { op: 'equals', questionId: 'item_a2', value: 'option_two' },
      [{ questionId: 'item_a2', state: 'answered', value: { kind: 'option', value: 'option_one' } }],
    );
    const shown = evaluateVisibility(
      { op: 'equals', questionId: 'item_a2', value: 'option_two' },
      [{ questionId: 'item_a2', state: 'answered', value: { kind: 'option', value: 'option_two' } }],
    );
    expect(hidden).toBe(false);
    expect(shown).toBe(true);
  });

  it('marks skipped-by-condition answers and section progress textually', () => {
    const answers: RecordedScreeningAnswer[] = [
      {
        questionId: 'item_a2',
        state: 'answered',
        value: { kind: 'option', value: 'option_one' },
      },
    ];
    const resolved = resolveSkippedByCondition(SYNTHETIC_DEV_WORKFLOW_TEMPLATE, answers);
    expect(resolved.find((a) => a.questionId === 'item_a3_detail')?.state).toBe(
      'skippedByCondition',
    );
    const progress = getSectionProgress(SYNTHETIC_DEV_WORKFLOW_TEMPLATE, 'section-b');
    expect(progress?.label).toBe('Section 2 of 3');
  });

  it('treats unknown and notAssessed as satisfying required items', () => {
    const answers: RecordedScreeningAnswer[] = [
      { questionId: 'item_a1', state: 'unknown' },
      { questionId: 'item_a2', state: 'notAssessed' },
      {
        questionId: 'item_b1_weight',
        state: 'notAssessed',
      },
      {
        questionId: 'item_b3_ack',
        state: 'answered',
        value: { kind: 'acknowledgement', acknowledged: true },
      },
    ];
    const incomplete = findIncompleteRequiredQuestions(
      SYNTHETIC_DEV_WORKFLOW_TEMPLATE,
      resolveSkippedByCondition(SYNTHETIC_DEV_WORKFLOW_TEMPLATE, answers),
    );
    expect(incomplete.map((q) => q.id)).toEqual([]);
  });

  it('gates production to pilot-approved templates only', () => {
    expect(listLoadableTemplates('production')).toHaveLength(0);
    expect(resolveTemplateForNewVisit({ environment: 'production' })).toBeNull();
    expect(listLoadableTemplates('development').length).toBeGreaterThan(0);
    expect(resolveTemplateForNewVisit({ environment: 'development' })?.templateId).toBe(
      'synthetic-dev-workflow-v1',
    );
  });
});
