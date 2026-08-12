import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppHeader, AppText, ScrollableAppScreen } from '../../../design-system';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { APP_METADATA } from '../../../constants/metadata';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export function AboutNorthCareScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { colors } = useThemeMode();

  return (
    <ScrollableAppScreen testID="about-northcare">
      <AppHeader title={t.about.title} onBack={() => router.back()} />

      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <NorthCareLogo variant="symbol" size="lg" />
        <AppText variant="headingMedium" style={styles.productName}>
          {APP_METADATA.productName}
        </AppText>
        <AppText variant="body" color="secondary" align="center">
          {APP_METADATA.tagline}
        </AppText>
      </View>

      <AppText variant="title">{t.about.purposeTitle}</AppText>
      <AppText variant="body" color="secondary">
        {t.about.purposeBody}
      </AppText>

      <AppText variant="title" style={styles.sectionTitle}>
        {t.about.teamTitle}
      </AppText>
      {t.about.teamMembers.map((member) => (
        <View
          key={member.name}
          style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="bodyStrong">{member.name}</AppText>
          <AppText variant="body" color="secondary">
            {member.role}
          </AppText>
        </View>
      ))}

      <AppText variant="caption" color="secondary" style={styles.version}>
        {t.about.versionLabel(APP_METADATA.appVersion)}
      </AppText>
    </ScrollableAppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  productName: {
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  memberCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.xxs,
  },
  version: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
