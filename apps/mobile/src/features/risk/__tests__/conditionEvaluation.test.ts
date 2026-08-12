import { evaluateCondition } from '../engine/conditionEvaluator';
import { convertMeasurementUnit } from '../engine/unitConversion';
import { buildSyntheticInput, makeAnswers } from './helpers';

describe('condition evaluation', () => {
  it('evaluates equals / notEquals without treating unknown as no', () => {
    const unknown = buildSyntheticInput(
      makeAnswers([{ questionId: 'item_a1', state: 'unknown' }]),
    );
    expect(
      evaluateCondition({ op: 'equals', questionKey: 'item_a1', value: false }, unknown)
        .status,
    ).toBe('missingInput');
    expect(
      evaluateCondition({ op: 'equals', questionKey: 'item_a1', value: true }, unknown)
        .status,
    ).toBe('missingInput');

    const answered = buildSyntheticInput(
      makeAnswers([
        { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: true } },
      ]),
    );
    expect(
      evaluateCondition({ op: 'equals', questionKey: 'item_a1', value: true }, answered)
        .status,
    ).toBe('true');
    expect(
      evaluateCondition({ op: 'notEquals', questionKey: 'item_a1', value: false }, answered)
        .status,
    ).toBe('true');
  });

  it('evaluates in / notIn / exists / isMissing / answerStateIs', () => {
    const input = buildSyntheticInput(
      makeAnswers([
        {
          questionId: 'item_a2',
          state: 'answered',
          value: { kind: 'option', value: 'option_two' },
        },
        { questionId: 'item_c1', state: 'declined' },
      ]),
    );
    expect(
      evaluateCondition(
        { op: 'in', questionKey: 'item_a2', values: ['option_two', 'option_three'] },
        input,
      ).status,
    ).toBe('true');
    expect(
      evaluateCondition(
        { op: 'notIn', questionKey: 'item_a2', values: ['option_one'] },
        input,
      ).status,
    ).toBe('true');
    expect(evaluateCondition({ op: 'exists', questionKey: 'item_a2' }, input).status).toBe(
      'true',
    );
    expect(evaluateCondition({ op: 'isMissing', questionKey: 'item_c1' }, input).status).toBe(
      'true',
    );
    expect(
      evaluateCondition(
        { op: 'answerStateIs', questionKey: 'item_c1', state: 'declined' },
        input,
      ).status,
    ).toBe('true');
  });

  it('evaluates numeric operators with unit conversion', () => {
    const input = buildSyntheticInput(
      makeAnswers([
        {
          questionId: 'item_b1_weight',
          state: 'answered',
          value: { kind: 'measurement', value: 70000, unit: 'g' },
        },
        {
          questionId: 'item_b2',
          state: 'answered',
          value: { kind: 'number', value: 8 },
        },
      ]),
    );
    expect(
      evaluateCondition(
        {
          op: 'between',
          questionKey: 'item_b1_weight',
          min: 1,
          max: 200,
          measurementUnit: 'kg',
        },
        input,
      ).status,
    ).toBe('true');
    expect(
      evaluateCondition(
        { op: 'greaterThanOrEqual', questionKey: 'item_b2', value: 5 },
        input,
      ).status,
    ).toBe('true');
    expect(
      evaluateCondition(
        { op: 'lessThan', questionKey: 'item_b2', value: 10 },
        input,
      ).status,
    ).toBe('true');
    expect(convertMeasurementUnit(1000, 'g', 'kg')?.convertedValue).toBe(1);
  });

  it('evaluates logical and context operators deterministically', () => {
    const input = buildSyntheticInput(
      makeAnswers([
        { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: false } },
        {
          questionId: 'item_a2',
          state: 'answered',
          value: { kind: 'option', value: 'option_one' },
        },
      ]),
    );
    expect(
      evaluateCondition(
        {
          op: 'all',
          conditions: [
            { op: 'clientCategoryIs', category: 'pregnant' },
            { op: 'visitTypeIs', visitType: 'antenatalVisit' },
            { op: 'screeningTemplateIs', templateId: 'synthetic-dev-workflow-v1' },
            { op: 'templateVersionIs', version: 1 },
            {
              op: 'any',
              conditions: [
                { op: 'equals', questionKey: 'item_a1', value: false },
                { op: 'equals', questionKey: 'item_a1', value: true },
              ],
            },
            {
              op: 'not',
              condition: { op: 'equals', questionKey: 'item_a2', value: 'option_two' },
            },
          ],
        },
        input,
      ).status,
    ).toBe('true');
  });

  it('requires exact age unless approximate is allowed', () => {
    const input = buildSyntheticInput([]);
    expect(
      evaluateCondition(
        {
          op: 'ageInRange',
          minYearsInclusive: 20,
          maxYearsInclusive: 40,
          allowApproximate: false,
        },
        input,
      ).status,
    ).toBe('missingInput');
    expect(
      evaluateCondition(
        {
          op: 'ageInRange',
          minYearsInclusive: 20,
          maxYearsInclusive: 40,
          allowApproximate: true,
        },
        input,
      ).status,
    ).toBe('true');
  });
});
