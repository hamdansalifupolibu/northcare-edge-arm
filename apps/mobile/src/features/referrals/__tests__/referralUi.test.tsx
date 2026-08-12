import React, { type ReactElement } from 'react';
import renderer, { act } from 'react-test-renderer';

import { LanguageProvider } from '../../../i18n/LanguageProvider';
import { ThemeModeProvider } from '../../../theme/ThemeModeProvider';
import { ReferralQrCode } from '../components/ReferralQrCode';
import { ReferralStatusChip } from '../components/ReferralStatusChip';
import { ReferralTimeline } from '../components/ReferralTimeline';

function renderWithProviders(element: ReactElement) {
  return renderer.create(
    <ThemeModeProvider>
      <LanguageProvider>{element}</LanguageProvider>
    </ThemeModeProvider>,
  );
}

describe('referral UI components', () => {
  it('renders QR with privacy-safe accessibility label (not raw token)', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderWithProviders(
        <ReferralQrCode value="northcare://referral-passport/v1/ABCDEFGHIJKLMNOP" />,
      );
    });
    const root = tree!.root.findByProps({ testID: 'referral-passport-qr' });
    expect(root.props.accessibilityLabel).toMatch(/Signed offline summary only/i);
    expect(root.props.accessibilityLabel).not.toContain('ABCDEFGHIJKLMNOP');
  });

  it('renders status chip without relying on colour alone (prefix + label)', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderWithProviders(<ReferralStatusChip status="facilityReached" />);
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('Facility reached');
  });

  it('renders timeline event labels', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderWithProviders(
        <ReferralTimeline
          events={[
            {
              id: '00000000-0000-4000-8000-000000000001',
              referralId: '00000000-0000-4000-8000-000000000002',
              eventType: 'passport_issued',
              occurredAt: '2026-08-02T12:00:00.000Z',
              recordedByAccountId: null,
              facilityId: null,
              notes: null,
              createdAt: '2026-08-02T12:00:00.000Z',
              updatedAt: '2026-08-02T12:00:00.000Z',
              createdByAccountId: null,
              updatedByAccountId: null,
              localVersion: 1,
              serverVersion: null,
              syncStatus: 'localOnly',
              lastSyncedAt: null,
              deletedAt: null,
              isDeleted: false,
            },
          ]}
        />,
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('Passport issued');
  });
});
