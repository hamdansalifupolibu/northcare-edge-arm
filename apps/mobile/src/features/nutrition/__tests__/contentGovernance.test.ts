import {
  countApprovedForPilotGuidancePacks,
  countApprovedForPilotReferencePacks,
  countApprovedForPilotTemplates,
  getGuidancePackById,
  getNutritionTemplateById,
  getReferencePackById,
  listLoadableGuidancePacks,
  listLoadableNutritionTemplates,
  listLoadableReferencePacks,
} from '../content/registry';
import { SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE } from '../content/assessments/syntheticDevChildNutritionTemplate';

describe('nutrition content governance', () => {
  it('blocks APPROVED_FOR_DEVELOPMENT templates in production', () => {
    expect(listLoadableNutritionTemplates('production')).toHaveLength(0);
    expect(listLoadableReferencePacks('production')).toHaveLength(0);
    expect(listLoadableGuidancePacks('production')).toHaveLength(0);
    expect(
      getNutritionTemplateById(SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE.templateId, 1, 'production'),
    ).toBeNull();
  });

  it('reports zero pilot-approved nutrition content', () => {
    expect(countApprovedForPilotTemplates()).toBe(0);
    expect(countApprovedForPilotReferencePacks()).toBe(0);
    expect(countApprovedForPilotGuidancePacks()).toBe(0);
  });

  it('does not load DRAFT or RETIRED packs for new assessments', () => {
    expect(
      getNutritionTemplateById('draft-only-template', 1, 'development'),
    ).toBeNull();
    expect(
      getReferencePackById('synthetic-dev-nutrition-reference-v1', 1, 'development')?.status,
    ).toBe('APPROVED_FOR_DEVELOPMENT');
    expect(getReferencePackById('missing-pack', 1, 'development')).toBeNull();
  });

  it('loads synthetic development content in development environment', () => {
    const templates = listLoadableNutritionTemplates('development');
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((t) => t.status === 'APPROVED_FOR_DEVELOPMENT')).toBe(true);
    expect(getGuidancePackById('synthetic-dev-nutrition-guidance-v1', 1, 'development')).not.toBeNull();
  });
});
