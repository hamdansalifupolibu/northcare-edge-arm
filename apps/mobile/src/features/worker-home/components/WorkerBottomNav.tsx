import type { ReactNode } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  AssessmentIcon,
  ClientsIcon,
  HomeIcon,
  MoreIcon,
  ReferralIcon,
} from './WorkerHomeIcons';

export type WorkerNavTab = 'home' | 'clients' | 'assessments' | 'referrals' | 'more';

type TabSpec = {
  readonly id: WorkerNavTab;
  readonly label: string;
  readonly href: Href;
  readonly testID: string;
  readonly renderIcon: (active: boolean) => ReactNode;
};

type Props = {
  readonly activeTab: WorkerNavTab;
};

export function WorkerBottomNav({ activeTab }: Props) {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();

  const tabs: readonly TabSpec[] = [
    {
      id: 'home',
      label: t.workerHome.navHome,
      href: '/(worker)/',
      testID: 'worker-nav-home',
      renderIcon: (active) => <HomeIcon color={active ? colors.primary : colors.textSecondary} />,
    },
    {
      id: 'clients',
      label: t.workerHome.navClients,
      href: '/(worker)/clients',
      testID: 'worker-nav-clients',
      renderIcon: (active) => (
        <ClientsIcon size={22} color={active ? colors.primary : colors.textSecondary} />
      ),
    },
    {
      id: 'assessments',
      label: t.workerHome.navAssessments,
      href: '/(worker)/nutrition' as Href,
      testID: 'worker-nav-assessments',
      renderIcon: (active) => (
        <AssessmentIcon size={22} color={active ? colors.primary : colors.textSecondary} />
      ),
    },
    {
      id: 'referrals',
      label: t.workerHome.navReferrals,
      href: '/(worker)/referrals',
      testID: 'worker-nav-referrals',
      renderIcon: (active) => (
        <ReferralIcon size={22} color={active ? colors.primary : colors.textSecondary} />
      ),
    },
    {
      id: 'more',
      label: t.workerHome.navMore,
      href: '/(worker)/more' as Href,
      testID: 'worker-nav-more',
      renderIcon: (active) => (
        <MoreIcon size={22} color={active ? colors.primary : colors.textSecondary} />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
      testID="worker-bottom-nav"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!active) {
                router.push(tab.href);
              }
            }}
            style={styles.tab}
            testID={tab.testID}
          >
            {active ? (
              <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
            ) : null}
            {tab.renderIcon(active)}
            <AppText
              variant="caption"
              style={[{ color: colors.textSecondary, fontWeight: '500' }, active ? { color: colors.primary, fontWeight: '700' } : null]}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    ...shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    minHeight: 56,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: radii.pill,
  },
});
