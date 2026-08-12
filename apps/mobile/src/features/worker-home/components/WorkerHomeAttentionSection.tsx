import type { ReactNode } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { WorkerHomeSummary } from '../hooks/useWorkerHomeSummary';
import { ChevronRightIcon, CommunityIcon, ReferralIcon } from './WorkerHomeIcons';

type Props = {
  readonly summary: WorkerHomeSummary;
};

function AttentionRow({
  title,
  body,
  count,
  toneColor,
  onPress,
  testID,
  renderIcon,
}: {
  readonly title: string;
  readonly body: string;
  readonly count: number;
  readonly toneColor: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly renderIcon: () => ReactNode;
}) {
  const { colors } = useThemeMode();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.88 : 1 }]}
      testID={testID}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${toneColor}18` }]}>
        {renderIcon()}
      </View>
      <View style={styles.copy}>
        <AppText variant="label" style={[styles.rowTitle, { color: colors.textPrimary }]}>
          {title}
        </AppText>
        <AppText variant="caption" color="secondary">
          {body}
        </AppText>
      </View>
      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: toneColor }]}>
          <AppText variant="caption" style={styles.badgeText}>
            {count}
          </AppText>
        </View>
      ) : null}
      <ChevronRightIcon />
    </Pressable>
  );
}

export function WorkerHomeAttentionSection({ summary }: Props) {
  const t = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useThemeMode();

  const communityCount =
    summary.communityAvailable && summary.awaitingRequests != null
      ? summary.awaitingRequests
      : 0;

  return (
    <View style={styles.section} testID="worker-home-attention">
      <AppText variant="label" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t.workerHome.needsAttention}
      </AppText>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.mutedSurface : colors.surface,
            borderColor: colors.border,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <AttentionRow
          title={t.workerHome.referralsAttention}
          body={t.workerHome.referralsAttentionBody(summary.openReferrals)}
          count={summary.openReferrals}
          toneColor="#7C3AED"
          onPress={() => router.push('/(worker)/referrals')}
          testID="worker-home-attention-referrals"
          renderIcon={() => <ReferralIcon color="#7C3AED" />}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <AttentionRow
          title={t.workerHome.communityAttention}
          body={
            summary.communityAvailable
              ? t.workerHome.communityAttentionBody(communityCount)
              : t.workerHome.communityUnavailable
          }
          count={communityCount}
          toneColor={colors.primary}
          onPress={() => router.push('/(worker)/community-requests' as Href)}
          testID="worker-home-attention-community"
          renderIcon={() => <CommunityIcon />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: '700',
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.base,
  },
});
