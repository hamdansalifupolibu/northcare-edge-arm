import { deriveConversationTitle } from '../domain/conversationPresentation';

describe('deriveConversationTitle', () => {
  it('returns a privacy-safe fallback for empty input', () => {
    expect(deriveConversationTitle('   ')).toBe('Health question');
  });

  it('strips markdown and capitalises the first letter', () => {
    expect(deriveConversationTitle('**what** are danger signs in `#pregnancy`?')).toBe(
      'What are danger signs in pregnancy?',
    );
  });

  it('truncates long questions at a word boundary near 40 characters', () => {
    const title = deriveConversationTitle(
      'How should a community health nurse counsel a mother about exclusive breastfeeding during the first six months of life?',
    );
    expect(title.length).toBeLessThanOrEqual(41);
    expect(title.endsWith('…')).toBe(true);
    expect(title.startsWith('How should a community health')).toBe(true);
  });
});
