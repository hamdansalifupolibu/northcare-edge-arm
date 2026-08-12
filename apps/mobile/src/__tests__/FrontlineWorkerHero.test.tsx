import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { FrontlineWorkerHero } from '../features/onboarding/FrontlineWorkerHero';

describe('FrontlineWorkerHero', () => {
  it('uses a temporary non-clinical illustration label', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FrontlineWorkerHero />);
    });

    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('frontline health worker');
    expect(json).not.toContain('patient');
  });
});
