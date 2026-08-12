import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { EntranceMotion } from '../design-system/motion/EntranceMotion';

describe('EntranceMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when reduce motion is enabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as never);

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EntranceMotion testID="entrance">
          <Text>Workspace options</Text>
        </EntranceMotion>,
      );
      await Promise.resolve();
    });

    expect(JSON.stringify(tree!.toJSON())).toContain('Workspace options');
  });

  it('renders children when reduce motion is disabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as never);

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EntranceMotion>
          <Text>Session workspace</Text>
        </EntranceMotion>,
      );
      await Promise.resolve();
    });

    expect(JSON.stringify(tree!.toJSON())).toContain('Session workspace');
  });
});
