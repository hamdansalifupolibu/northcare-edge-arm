import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { FoundationScreen } from '../components/foundation/FoundationScreen';
import type { AppConfig } from '../config/appConfig';

const config: AppConfig = {
  productName: 'NorthCare AI',
  tagline: 'Smarter care. Stronger communities.',
  appVersion: '0.1.0',
  appEnv: 'development',
  buildType: 'development',
  apiBaseUrl: '',
  androidPackage: 'com.northcareai.app',
  androidPackageProvisional: true,
  diagnosticsEnabled: false,
  platform: 'android',
};

describe('FoundationScreen', () => {
  it('renders NorthCare AI foundation identity', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <FoundationScreen
          config={config}
          assetStatus="loaded"
          loggerStatus="ready"
          errorBoundaryStatus="active"
        />,
      );
    });

    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('NorthCare AI');
    expect(text).toContain('Smarter care. Stronger communities.');
    expect(text).toContain('Development Foundation');
    expect(text).toContain('Foundation verified');
    expect(text).not.toContain('Welcome to Expo');
  });
});
