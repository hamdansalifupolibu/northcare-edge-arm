import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { AppErrorBoundary } from '../error/AppErrorBoundary';
import { createLogger } from '../logging/logger';

function Boom(): React.ReactElement {
  throw new Error('boom');
}

describe('AppErrorBoundary', () => {
  it('renders a calm fallback without exposing the stack', () => {
    const logger = createLogger({
      environment: 'development',
      sink: () => undefined,
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <AppErrorBoundary logger={logger} diagnosticsEnabled>
          <Boom />
        </AppErrorBoundary>,
      );
    });

    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('NorthCare AI encountered an unexpected problem.');
    expect(text).toContain('Your saved information has not been intentionally removed');
    expect(text).not.toContain('boom');
    expect(text).not.toContain('at Boom');

    consoleError.mockRestore();
  });

  it('renders children when no error occurs', () => {
    const logger = createLogger({
      environment: 'development',
      sink: () => undefined,
    });

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <AppErrorBoundary logger={logger} diagnosticsEnabled={false}>
          <Text>ok</Text>
        </AppErrorBoundary>,
      );
    });

    expect(JSON.stringify(tree!.toJSON())).toContain('ok');
  });
});
