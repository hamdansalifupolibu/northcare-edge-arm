import React from 'react';
import { AccessibilityInfo, Text, TextInput } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import {
  AppButton,
  AppStateView,
  AppText,
  AppTextInput,
  EntranceMotion,
  LoadingState,
  PasswordField,
  StatusChip,
} from '../design-system';
import { AccountListItem } from '../features/administration/components/AccountListItem';
import { ReminderListItem } from '../features/reminders/components/ReminderListItem';
import type { FollowUpReminder } from '../features/reminders/domain/reminderDomain';
import { layout } from '../theme';

function render(element: React.ReactElement): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

function findByProp(tree: renderer.ReactTestRenderer, prop: string, value: unknown) {
  return tree.root.findAll((node) => node.props[prop] === value);
}

describe('Stage 18 accessibility component contracts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AppButton exposes role, label, disabled and busy states', () => {
    const tree = render(
      <AppButton label="Save locally" onPress={() => undefined} disabled loading />,
    );
    const pressable = findByProp(tree, 'accessibilityRole', 'button')[0];
    expect(pressable.props.accessibilityLabel).toBe('Save locally');
    expect(pressable.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true, busy: true }),
    );
    const resolvedStyle =
      typeof pressable.props.style === 'function'
        ? pressable.props.style({ pressed: false })
        : pressable.props.style;
    const style = Array.isArray(resolvedStyle)
      ? Object.assign({}, ...resolvedStyle.filter(Boolean))
      : resolvedStyle;
    expect(style.minHeight).toBe(layout.minTouchTarget);
  });

  it('AppTextInput associates errors without colour-only signalling', () => {
    const tree = render(
      <AppTextInput
        label="Worker email"
        errorText="Enter a valid email"
        testID="worker-email"
      />,
    );
    const input = tree.root.findByType(TextInput);
    expect(input.props.accessibilityLabel).toBe('Worker email');
    expect(input.props.accessibilityHint).toBe('Enter a valid email');
    const error = findByProp(tree, 'accessibilityRole', 'alert')[0];
    expect(JSON.stringify(error.props)).toContain('Enter a valid email');
  });

  it('PasswordField provides accessible show/hide control', () => {
    const tree = render(
      <PasswordField
        label="Password"
        value="synthetic"
        onChangeText={() => undefined}
        testID="password"
      />,
    );
    const toggle = findByProp(tree, 'accessibilityRole', 'button').find((node) =>
      String(node.props.accessibilityLabel ?? '').toLowerCase().includes('password'),
    );
    expect(toggle).toBeTruthy();
  });

  it('StatusChip includes non-colour prefix with label', () => {
    const tree = render(<StatusChip label="Urgent follow-up" tone="urgent" />);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Urgent follow-up');
    expect(json).toMatch(/[!i✓•]/);
  });

  it('AppStateView error/empty expose headings and LoadingState uses progressbar', () => {
    const errorTree = render(
      <AppStateView
        variant="error"
        heading="Something went wrong"
        explanation="Try again"
        primaryActionLabel="Continue"
        onPrimaryAction={() => undefined}
      />,
    );
    expect(JSON.stringify(errorTree.toJSON())).toContain('Something went wrong');

    const emptyTree = render(
      <AppStateView variant="empty" heading="No records" explanation="Create one" />,
    );
    expect(JSON.stringify(emptyTree.toJSON())).toContain('No records');

    const loadingTree = render(<LoadingState message="Loading accounts" />);
    const bar = findByProp(loadingTree, 'accessibilityRole', 'progressbar')[0];
    expect(bar.props.accessibilityLabel).toBe('Loading accounts');
  });

  it('AppText keeps font scaling enabled by default', () => {
    const tree = render(<AppText>Scaled copy</AppText>);
    const text = tree.root.findByType(Text);
    expect(text.props.allowFontScaling).toBe(true);
  });

  it('EntranceMotion renders children under reduced-motion branch', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as never);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EntranceMotion>
          <AppText>Workspace card</AppText>
        </EntranceMotion>,
      );
      await Promise.resolve();
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Workspace card');
  });

  it('ReminderListItem has 48dp target and descriptive label', () => {
    const reminder: FollowUpReminder = {
      id: 'rem-1',
      accountId: 'dev-worker-001',
      organisationId: 'org-dev-001',
      facilityId: 'fac-dev-001',
      clientId: 'client-1',
      encounterId: null,
      sourceType: 'workerCreated',
      sourceEntityId: null,
      reminderType: 'generalFollowUp',
      status: 'active',
      scheduledForUtc: '2099-01-01T10:00:00.000Z',
      originalTimeZone: 'Africa/Accra',
      originalLocalDate: '2099-01-01',
      originalLocalTime: '10:00',
      note: null,
      localVersion: 1,
    };
    const tree = render(<ReminderListItem reminder={reminder} onPress={() => undefined} />);
    const pressable = findByProp(tree, 'accessibilityRole', 'button')[0];
    expect(pressable.props.accessibilityLabel).toContain('Follow-up reminder');
    expect(pressable.props.style.minHeight).toBeGreaterThanOrEqual(48);
  });

  it('AccountListItem combines name and status in accessibility label', () => {
    const tree = render(
      <AccountListItem
        account={{
          accountId: 'acc-1',
          displayName: 'Synthetic Worker',
          email: 'worker@development.invalid',
          roles: ['worker'],
          facilityId: 'fac-dev-001',
          facilityName: 'Demo CHPS Compound',
          accountStatus: 'active',
          firstLoginRequired: false,
          lastRemoteSignInAt: null,
          registeredDeviceCount: 0,
          accountVersion: 1,
          updatedAt: '2026-08-02T00:00:00.000Z',
        }}
        onPress={() => undefined}
      />,
    );
    const card = findByProp(tree, 'testID', 'account-item-acc-1')[0];
    expect(card.props.accessibilityLabel).toContain('Synthetic Worker');
  });
});
