import { nutritionStrings } from '../i18n/nutritionStrings';

describe('nutrition accessibility labels', () => {
  it('labels assessment type cards explicitly', () => {
    expect(nutritionStrings.accessibilityTypeCard('Child template')).toContain(
      'Nutrition assessment type',
    );
  });

  it('exposes distinct unknown and not assessed labels', () => {
    expect(nutritionStrings.unknownLabel).toBe('Unknown');
    expect(nutritionStrings.notAssessedLabel).toBe('Not assessed');
    expect(nutritionStrings.accessibilityUnknown).toContain('unknown');
    expect(nutritionStrings.accessibilityNotAssessed).toContain('not assessed');
  });

  it('describes guidance status and development warning textually', () => {
    expect(nutritionStrings.accessibilityGuidanceStatus('Guidance unavailable')).toContain(
      'Guidance status',
    );
    expect(nutritionStrings.accessibilityDevelopmentWarning).toContain('Development');
  });

  it('avoids green/normal/healthy wording in UI strings', () => {
    const blob = JSON.stringify(nutritionStrings);
    expect(blob).not.toMatch(/\bgreen\b/i);
    expect(blob).not.toMatch(/\bnormal\b/i);
    expect(blob).not.toMatch(/\bhealthy\b/i);
  });
});
