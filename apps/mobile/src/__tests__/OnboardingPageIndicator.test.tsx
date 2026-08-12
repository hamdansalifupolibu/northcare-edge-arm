import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { OnboardingPageIndicator } from '../features/onboarding/OnboardingPageIndicator';
import { LanguageProvider } from '../i18n/LanguageProvider';

function renderIndicator(element: React.ReactElement) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<LanguageProvider>{element}</LanguageProvider>);
  });
  return tree!;
}

describe('OnboardingPageIndicator', () => {
  it('announces page position accessibly', () => {
    const tree = renderIndicator(<OnboardingPageIndicator current={2} total={6} />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Page 2 of 6');
  });

  it('supports immersive fraction labels', () => {
    const tree = renderIndicator(
      <OnboardingPageIndicator
        current={3}
        total={6}
        tone="inverse"
        labelStyle="fraction"
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('3 / 6');
  });
});
