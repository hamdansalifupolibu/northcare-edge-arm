import { mapNutritionServiceError } from '../application/createNutritionServices';
import { NutritionError } from '../domain/errors';

describe('mapNutritionServiceError', () => {
  it('returns NutritionError message for domain errors', () => {
    expect(
      mapNutritionServiceError(
        new NutritionError('conflict', 'Assessment is already complete.'),
      ),
    ).toBe('Assessment is already complete.');
  });

  it('hides system errors behind fallback copy', () => {
    expect(
      mapNutritionServiceError(new Error("Property 't' doesn't exist")),
    ).toBe('Unable to complete the nutrition action.');
  });

  it('hides repository operation failures', () => {
    expect(
      mapNutritionServiceError(new Error('facility.listActive failed')),
    ).toBe('Unable to complete the nutrition action.');
  });
});
