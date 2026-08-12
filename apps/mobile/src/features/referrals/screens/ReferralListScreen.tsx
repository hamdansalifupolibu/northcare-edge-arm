import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Referral } from '../../../data/domain/entities/entities';
import { AppText, LoadingState } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../../worker-home/domain/workerNav';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { ReferralStatusChip } from '../components/ReferralStatusChip';
import {
  ReferralEmptyStateCard,
  ReferralListHeader,
  ReferralPrimaryActions,
  ReferralVerifyOfflineSection,
} from '../components/ReferralListComponents';
import {
  getReferralNextAction,
  partitionReferralInbox,
} from '../domain/referralInbox';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function ReferralListScreen() {
  const referralStrings = useReferralStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors, semantic } = useThemeMode();
  const { isOnline, checking } = useConnectivity();
  const { touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [items, setItems] = useState<readonly Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!services) return;
    setLoading(true);
    try {
      setItems(await services.listReferrals());
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { open, closed } = useMemo(() => partitionReferralInbox(items), [items]);

  const onDeviceLabel = checking
    ? '…'
    : isOnline
      ? referralStrings.onDeviceOnlineLabel
      : referralStrings.onDeviceOfflineLabel;

  if (loading) {
    return (
      <View
        style={[styles.loadingRoot, { backgroundColor: themeColors.background, paddingTop: insets.top }]}
        testID="referral-list-loading"
      >
        <LoadingState message={referralStrings.loading} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: themeColors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + WORKER_BOTTOM_NAV_CLEARANCE + spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
      testID="referral-list-screen"
    >
      <ReferralListHeader
        title={referralStrings.listTitle}
        subtitle={referralStrings.listSubtitle}
        onDeviceLabel={onDeviceLabel}
        checking={checking}
      />

      <ReferralPrimaryActions
        prepareTitle={referralStrings.createReferral}
        prepareDescription={referralStrings.prepareReferralDescription}
        verifyTitle={referralStrings.verifyPassport}
        verifyDescription={referralStrings.verifyPassportCardDescription}
        onPreparePress={() => router.push('/(worker)/clients?purpose=referral')}
        onVerifyPress={() => router.push('/(worker)/referrals/verify')}
      />

      {items.length === 0 ? (
        <ReferralEmptyStateCard
          title={referralStrings.listEmptyTitle}
          bodyPrefix={referralStrings.listEmptyBodyPrefix}
          bodyAction={referralStrings.listEmptyBodyAction}
          bodySuffix={referralStrings.listEmptyBodySuffix}
        />
      ) : (
        <View style={styles.inboxBlock}>
          <AppText variant="label">{referralStrings.listPending}</AppText>
          {open.length === 0 ? (
            <AppText variant="body" color="secondary">
              {referralStrings.listOpenEmpty}
            </AppText>
          ) : (
            open.map((item) => (
              <ReferralInboxRow
                key={item.id}
                item={item}
                onPress={() => router.push(`/(worker)/referrals/${item.id}`)}
              />
            ))
          )}

          {closed.length > 0 ? (
            <View style={styles.closedBlock}>
              <AppText variant="label">{referralStrings.listClosed}</AppText>
              {closed.map((item) => (
                <ReferralInboxRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/(worker)/referrals/${item.id}`)}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}

      <ReferralVerifyOfflineSection
        title={referralStrings.verifyOfflineSectionTitle}
        body={referralStrings.verifyOfflineSectionBody}
        scanTitle={referralStrings.scanPassport}
        scanDescription={referralStrings.scanPassportDescription}
        manualTitle={referralStrings.enterCode}
        manualDescription={referralStrings.enterCodeDescription}
        onScanPress={() => router.push('/(worker)/referrals/verify')}
        onManualPress={() => router.push('/(worker)/referrals/enter-code')}
      />
    </ScrollView>
  );
}

function ReferralInboxRow({
  item,
  onPress,
}: {
  readonly item: Referral;
  readonly onPress: () => void;
}) {
  const referralStrings = useReferralStrings();
  const { colors: themeColors, semantic } = useThemeMode();
  const next = getReferralNextAction(item.status);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Referral ${item.referenceCode ?? item.id}. ${referralStrings.accessibilityStatus(item.status)}.${next ? ` Next: ${next.label}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.inboxRow,
        {
          borderColor: item.status === 'overdue' ? colors.danger : semantic.border.default,
          backgroundColor: themeColors.surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={`referral-inbox-row-${item.id}`}
    >
      <AppText variant="label">{item.referenceCode ?? 'Referral'}</AppText>
      <ReferralStatusChip status={item.status} />
      <AppText variant="caption" color="secondary">
        {referralStrings.accessibilityPriority(item.priority)}
      </AppText>
      {next ? (
        <AppText variant="caption" color="primary">
          {referralStrings.nextStepLabel}: {next.label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  inboxBlock: {
    gap: spacing.sm,
  },
  closedBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inboxRow: {
    gap: spacing.xs,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
