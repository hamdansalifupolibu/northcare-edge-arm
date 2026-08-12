import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../../../design-system/buttons/AppButton';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { layout, semanticColors, spacing } from '../../../theme';
import type { OnboardingSlideContextKind, OnboardingSlideDefinition } from '../content/onboardingSlides';
import { ONBOARDING_SLIDE_COUNT } from '../content/onboardingSlides';
import { OnboardingContextChip } from './OnboardingContextChip';
import { OnboardingFeatureChips } from './OnboardingFeatureChips';
import { OnboardingSdgChips } from './OnboardingSdgChips';
import { OnboardingPageIndicator } from '../OnboardingPageIndicator';

export type ImmersiveOnboardingSlideCopy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly imageLabel: string;
  readonly contextLabel?: string;
  readonly contextSecondary?: string;
  readonly featureChips?: readonly string[];
  readonly sdgPrimary?: readonly { readonly number: string; readonly label: string }[];
  readonly sdgSecondary?: { readonly number: string; readonly label: string };
  readonly footnote?: string;
};

export type ImmersiveOnboardingSlideProps = {
  readonly slide: OnboardingSlideDefinition;
  readonly step: number;
  readonly copy: ImmersiveOnboardingSlideCopy;
  readonly showSkip: boolean;
  readonly showBack: boolean;
  readonly isLast: boolean;
  readonly saving: boolean;
  readonly errorMessage: string | null;
  readonly onSkip: () => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onRetrySave?: () => void;
};

function SlideContext({
  kind,
  copy,
}: {
  readonly kind: OnboardingSlideContextKind;
  readonly copy: ImmersiveOnboardingSlideCopy;
}) {
  switch (kind) {
    case 'location':
    case 'offline':
    case 'verification':
      return copy.contextLabel ? (
        <OnboardingContextChip label={copy.contextLabel} testID="onboarding-context-chip" />
      ) : null;
    case 'features':
      return copy.featureChips ? (
        <OnboardingFeatureChips labels={copy.featureChips} testID="onboarding-feature-chips" />
      ) : null;
    case 'reach':
      return copy.contextLabel || copy.contextSecondary ? (
        <View style={styles.reachRow}>
          {copy.contextLabel ? (
            <OnboardingContextChip label={copy.contextLabel} testID="onboarding-reach-label" />
          ) : null}
          {copy.contextSecondary ? (
            <OnboardingContextChip
              label={copy.contextSecondary}
              testID="onboarding-sandbox-label"
            />
          ) : null}
        </View>
      ) : null;
    case 'sdg':
      return copy.sdgPrimary ? (
        <OnboardingSdgChips
          primary={copy.sdgPrimary}
          secondary={copy.sdgSecondary}
          testID="onboarding-sdg-chips"
        />
      ) : null;
    default:
      return null;
  }
}

export function ImmersiveOnboardingSlide({
  slide,
  step,
  copy,
  showSkip,
  showBack,
  isLast,
  saving,
  errorMessage,
  onSkip,
  onBack,
  onNext,
  onRetrySave,
}: ImmersiveOnboardingSlideProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const primaryLabel = isLast ? t.onboarding.getStarted : t.onboarding.next;

  return (
    <View style={[styles.root, { width }]} testID={`onboarding-screen-${step}`}>
      <StatusBar style="light" />
      <ImageBackground
        source={slide.image}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        imageStyle={[styles.backgroundImage, slide.imageStyle]}
        accessibilityLabel={copy.imageLabel}
        accessible
      >
        <AppLinearGradient
          colors={[
            // Must be rgba(..., 0) — CSS "transparent" becomes a black stop in SVG on Android.
            'rgba(6, 78, 73, 0)',
            'rgba(6, 78, 73, 0.22)',
            'rgba(6, 78, 73, 0.68)',
            semanticColors.action.primaryDarker,
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </ImageBackground>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <NorthCareLogo variant="stacked" size="sm" testID="onboarding-logo" />
          {showSkip ? (
            <Pressable
              onPress={onSkip}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t.onboarding.skip}
              accessibilityHint="Skip onboarding and choose a workspace"
              testID="onboarding-skip"
              hitSlop={8}
              style={({ pressed }) => [styles.skipButton, pressed ? styles.skipPressed : null]}
            >
              <AppText variant="bodyStrong" color="inverse">
                {t.onboarding.skip}
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomPanel}>
          <AppText variant="label" color="inverse" style={styles.eyebrow}>
            {copy.eyebrow}
          </AppText>
          <AppText variant="headingLarge" color="inverse" style={styles.title}>
            {copy.title}
          </AppText>
          <AppText variant="body" color="inverse" style={styles.body}>
            {copy.body}
          </AppText>

          <SlideContext kind={slide.contextKind} copy={copy} />

          {copy.footnote ? (
            <AppText variant="caption" color="inverse" style={styles.footnote}>
              {copy.footnote}
            </AppText>
          ) : null}

          <View style={styles.progressRow}>
            <OnboardingPageIndicator
              current={step}
              total={ONBOARDING_SLIDE_COUNT}
              tone="inverse"
              labelStyle="fraction"
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBlock}>
              <AppText variant="body" color="inverse">
                {errorMessage}
              </AppText>
              {onRetrySave ? (
                <AppButton
                  label={t.preferenceError.retry}
                  onPress={onRetrySave}
                  variant="secondary"
                  fullWidth={false}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.footerActions}>
            {showBack ? (
              <Pressable
                onPress={onBack}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={t.onboarding.back}
                testID="onboarding-back"
                hitSlop={8}
                style={({ pressed }) => [styles.backButton, pressed ? styles.backPressed : null]}
              >
                <AppText variant="bodyStrong" color="inverse">
                  {t.onboarding.back}
                </AppText>
              </Pressable>
            ) : (
              <View style={styles.backPlaceholder} />
            )}

            <AppButton
              label={primaryLabel}
              onPress={onNext}
              variant="accent"
              loading={saving && isLast}
              disabled={saving}
              fullWidth={false}
              style={styles.nextButton}
              testID="onboarding-next"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  bottomGradient: {
    bottom: 0,
    height: '50%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  skipPressed: {
    opacity: 0.75,
  },
  skipPlaceholder: {
    width: 56,
  },
  spacer: {
    flex: 1,
  },
  bottomPanel: {
    gap: spacing.md,
  },
  eyebrow: {
    color: semanticColors.action.accent,
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: '100%',
  },
  body: {
    opacity: 0.94,
  },
  footnote: {
    opacity: 0.82,
  },
  reachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  progressRow: {
    marginTop: spacing.xs,
  },
  errorBlock: {
    gap: spacing.sm,
  },
  footerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  backButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: spacing.xs,
  },
  backPressed: {
    opacity: 0.75,
  },
  backPlaceholder: {
    minWidth: 72,
  },
  nextButton: {
    minWidth: 148,
  },
});
