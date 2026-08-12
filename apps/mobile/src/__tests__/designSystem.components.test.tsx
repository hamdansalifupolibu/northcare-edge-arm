import React from 'react';
import renderer, { act } from 'react-test-renderer';

import {
  AppButton,
  AppStateView,
  AppText,
  AppTextInput,
  ConnectivityBanner,
  DesignSystemPreviewScreen,
  NorthCareLogo,
  RiskSummaryCard,
  StatusChip,
  SyncStatusIndicator,
} from '../design-system';
import { RISK_COPY } from '../design-system/risk/riskLabels';
import { SYNC_COPY } from '../design-system/offline/syncCopy';

function renderJson(element: React.ReactElement): string {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return JSON.stringify(tree!.toJSON());
}

describe('design-system components', () => {
  it('renders AppText variants', () => {
    const json = renderJson(<AppText variant="headingLarge">NorthCare AI</AppText>);
    expect(json).toContain('NorthCare AI');
  });

  it('renders primary and disabled buttons', () => {
    const primary = renderJson(
      <AppButton label="Continue" onPress={() => undefined} testID="btn-primary" />,
    );
    expect(primary).toContain('Continue');

    const disabled = renderJson(
      <AppButton label="Continue" onPress={() => undefined} disabled />,
    );
    expect(disabled).toContain('Continue');
  });

  it('shows loading affordance and keeps disabled label in tree', () => {
    const loadingJson = renderJson(
      <AppButton label="Save" onPress={() => undefined} loading />,
    );
    expect(loadingJson).toContain('Loading');

    const disabledJson = renderJson(
      <AppButton label="Save" onPress={() => undefined} disabled />,
    );
    expect(disabledJson).toContain('Save');
  });

  it('renders input label and error text', () => {
    const json = renderJson(
      <AppTextInput label="Worker name" errorText="Please complete this field" />,
    );
    expect(json).toContain('Worker name');
    expect(json).toContain('Please complete this field');
  });

  it('renders status chip with non-colour cue', () => {
    const json = renderJson(<StatusChip label="Offline" tone="offline" />);
    expect(json).toContain('Offline');
  });

  it('renders approved risk labels without clinical calculation', () => {
    const json = renderJson(<RiskSummaryCard level="red" />);
    expect(json).toContain(RISK_COPY.red.title);
    expect(json).toContain(RISK_COPY.red.subtitle);
  });

  it('uses approved offline wording', () => {
    const banner = renderJson(<ConnectivityBanner status="waitingForConnection" />);
    expect(banner).toContain(SYNC_COPY.waitingForConnection);

    const sync = renderJson(<SyncStatusIndicator status="savedLocally" />);
    expect(sync).toContain(SYNC_COPY.savedLocally);
  });

  it('renders state view actions', () => {
    const onPrimary = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <AppStateView
          variant="error"
          heading="Something went wrong"
          explanation="Synthetic error explanation"
          primaryActionLabel="Try again"
          onPrimaryAction={onPrimary}
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Something went wrong');
    expect(json).toContain('Try again');
  });

  it('exposes logo accessibility label', () => {
    const json = renderJson(<NorthCareLogo />);
    expect(json).toContain('NorthCare AI logo');
  });

  it('renders development preview without clinical claims', () => {
    const json = renderJson(<DesignSystemPreviewScreen />);
    expect(json).toContain('Development Preview');
    expect(json).toContain('synthetic');
    expect(json.toLowerCase()).not.toContain('blood pressure');
    expect(json.toLowerCase()).not.toContain('amina');
  });
});
