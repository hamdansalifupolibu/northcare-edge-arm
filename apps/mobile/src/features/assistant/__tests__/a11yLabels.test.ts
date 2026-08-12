import { assistantStrings } from '../i18n/assistantStrings';

describe('assistant accessibility labels', () => {
  it('exposes scope, privacy, question, loading and boundary labels', () => {
    expect(assistantStrings.accessibilityScope.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilityPrivacy.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilityQuestion.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilitySearching).toContain('Searching approved information');
    expect(assistantStrings.accessibilityAnswerHeading.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilitySources.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilityUnsupported.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilityUrgent.length).toBeGreaterThan(0);
    expect(assistantStrings.accessibilityDevelopment).toContain('Development');
    expect(assistantStrings.accessibilityTopic('Example')).toContain('Example');
  });

  it('uses truthful loading wording without diagnosis claims', () => {
    expect(assistantStrings.searching).toBe(
      'Searching approved information on this device…',
    );
    expect(assistantStrings.searching.toLowerCase()).not.toContain('diagnos');
    expect(assistantStrings.searching.toLowerCase()).not.toContain('thinking');
    expect(assistantStrings.searching.toLowerCase()).not.toContain('cloud');
  });

  it('keeps urgent state copy non-colour-only', () => {
    expect(assistantStrings.urgentTitle.length).toBeGreaterThan(0);
    expect(assistantStrings.feedbackSaved).toBe('Feedback saved on this device');
  });
});
