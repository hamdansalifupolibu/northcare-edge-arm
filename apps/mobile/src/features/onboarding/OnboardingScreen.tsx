import type { ReactNode } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppButton } from '../../design-system/buttons/AppButton';
import { HeroImage } from '../../design-system/brand/HeroImage';
import { ScrollableAppScreen } from '../../design-system/layout/ScrollableAppScreen';
import { AppText } from '../../design-system/text/AppText';
import { useTranslation } from '../../i18n/LanguageProvider';
import { spacing } from '../../theme';
import { OnboardingPageIndicator } from './OnboardingPageIndicator';

type HeroImageConfig = {
  readonly source: ImageSourcePropType;
  readonly label: string;
};

export type OnboardingScreenProps = {
  readonly step: 1 | 2 | 3;
  readonly heading: string;
  readonly body: string;
  readonly hero: ReactNode | HeroImageConfig;
  readonly footnote?: string;
  readonly onNext: () => void;
  readonly onSkip: () => void;
  readonly nextLabel?: string;
  readonly saving?: boolean;
  readonly errorMessage?: string | null;
  readonly onRetrySave?: () => void;
};

function isHeroImageConfig(value: ReactNode | HeroImageConfig): value is HeroImageConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'source' in value &&
    'label' in value
  );
}

export function OnboardingScreen({
  step,
  heading,
  body,
  hero,
  footnote,
  onNext,
  onSkip,
  nextLabel,
  saving = false,
  errorMessage,
  onRetrySave,
}: OnboardingScreenProps) {
  const t = useTranslation();
  const isLast = step === 3;

  return (
    <ScrollableAppScreen testID={`onboarding-screen-${step}`}>
      <View style={styles.topRow}>
        <AppButton
          label={t.onboarding.skip}
          variant="tertiary"
          size="compact"
          onPress={onSkip}
          disabled={saving}
          accessibilityHint="Skip onboarding and choose a workspace"
          testID="onboarding-skip"
        />
      </View>

      {isHeroImageConfig(hero) ? (
        <HeroImage
          source={hero.source}
          accessibilityLabel={hero.label}
          aspectRatio={3 / 4}
          testID={`onboarding-hero-${step}`}
        />
      ) : (
        hero
      )}

      <View style={styles.copy}>
        <AppText variant="headingLarge">{heading}</AppText>
        <AppText variant="body" color="secondary">
          {body}
        </AppText>
        {footnote ? (
          <AppText variant="caption" color="secondary">
            {footnote}
          </AppText>
        ) : null}
      </View>

      <OnboardingPageIndicator current={step} total={3} />

      {errorMessage ? (
        <View style={styles.errorBlock}>
          <AppText variant="body" color="urgent">
            {errorMessage}
          </AppText>
          {onRetrySave ? (
            <AppButton label={t.preferenceError.retry} onPress={onRetrySave} variant="secondary" />
          ) : null}
        </View>
      ) : null}

      <AppButton
        label={nextLabel ?? (isLast ? t.onboarding.continue : t.onboarding.next)}
        onPress={onNext}
        loading={saving}
        fullWidth
        testID="onboarding-next"
      />
    </ScrollableAppScreen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  copy: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  errorBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});
