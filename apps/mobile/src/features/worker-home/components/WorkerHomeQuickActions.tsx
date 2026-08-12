import type { ReactNode } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows, spacing, themedQuickActionCardBackground, type HexColor } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  AssistantIcon,
  ClientsIcon,
  NutritionIcon,
  VoiceIcon,
} from './WorkerHomeIcons';

type QuickAction = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly lightBackground: HexColor;
  readonly href: Href;
  readonly testID: string;
  readonly renderIcon: () => ReactNode;
};

export function WorkerHomeQuickActions() {
  const t = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useThemeMode();

  const actions: readonly QuickAction[] = [
    {
      id: 'clients',
      title: t.workerHome.quickRegisterClient,
      subtitle: t.workerHome.quickRegisterClientHint,
      lightBackground: '#E6F4F1',
      href: '/(worker)/clients/register',
      testID: 'worker-home-action-register',
      renderIcon: () => <ClientsIcon color={colors.primary} />,
    },
    {
      id: 'nutrition',
      title: t.workerHome.quickNutrition,
      subtitle: t.workerHome.quickNutritionHint,
      lightBackground: '#FFF8E1',
      href: '/(worker)/nutrition' as Href,
      testID: 'worker-home-action-nutrition',
      renderIcon: () => <NutritionIcon />,
    },
    {
      id: 'voice',
      title: t.workerHome.quickVoice,
      subtitle: t.workerHome.quickVoiceHint,
      lightBackground: '#F3E8FF',
      href: '/(worker)/voice' as Href,
      testID: 'worker-home-action-voice',
      renderIcon: () => <VoiceIcon />,
    },
    {
      id: 'assistant',
      title: t.workerHome.quickAssistant,
      subtitle: t.workerHome.quickAssistantHint,
      lightBackground: '#E8F4FD',
      href: '/(worker)/ask/chat',
      testID: 'worker-home-action-assistant',
      renderIcon: () => <AssistantIcon />,
    },
  ];

  return (
    <View style={styles.grid} testID="worker-home-quick-actions">
      {actions.map((action) => {
        const cardBackground = themedQuickActionCardBackground(colors, isDark, action.lightBackground);
        return (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={`${action.title}. ${action.subtitle}`}
          onPress={() => router.push(action.href)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: cardBackground,
              borderColor: colors.border,
              borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          testID={action.testID}
        >
          <View style={styles.iconWrap}>{action.renderIcon()}</View>
          <AppText variant="label" style={[styles.title, { color: colors.textPrimary }]}>
            {action.title}
          </AppText>
          <AppText variant="caption" color="secondary" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {action.subtitle}
          </AppText>
        </Pressable>
      );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    minHeight: 132,
    borderRadius: radii.lg,
    padding: spacing.base,
    gap: spacing.xs,
    ...shadows.sm,
  },
  iconWrap: {
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 18,
  },
});
