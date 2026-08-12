import { StyleSheet, View } from 'react-native';

import { AppText } from '../../design-system/text/AppText';
import { useTranslation } from '../../i18n/LanguageProvider';
import { radii, semanticColors, spacing } from '../../theme';

export type OnboardingPageIndicatorProps = {
  readonly current: number;
  readonly total: number;
  readonly tone?: 'default' | 'inverse';
  readonly labelStyle?: 'pageOf' | 'fraction';
  readonly testID?: string;
};

export function OnboardingPageIndicator({
  current,
  total,
  tone = 'default',
  labelStyle = 'pageOf',
  testID = 'onboarding-page-indicator',
}: OnboardingPageIndicatorProps) {
  const t = useTranslation();
  const label =
    labelStyle === 'fraction'
      ? t.onboarding.pageFraction(current, total)
      : t.onboarding.pageOf(current, total);

  const inverse = tone === 'inverse';

  return (
    <View
      style={[styles.root, inverse ? styles.rootInverse : null]}
      accessibilityRole="text"
      accessibilityLabel={label}
      testID={testID}
    >
      <AppText variant="caption" color={inverse ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
      <View style={styles.dots} importantForAccessibility="no-hide-descendants">
        {Array.from({ length: total }, (_, index) => {
          const active = index + 1 === current;
          return (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                active
                  ? inverse
                    ? styles.dotActiveInverse
                    : styles.dotActive
                  : inverse
                    ? styles.dotInactiveInverse
                    : styles.dotInactive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  rootInverse: {
    alignItems: 'flex-start',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  dotActive: {
    backgroundColor: semanticColors.action.primary,
    width: 22,
  },
  dotInactive: {
    backgroundColor: semanticColors.border.default,
  },
  dotActiveInverse: {
    backgroundColor: semanticColors.action.accent,
    width: 22,
  },
  dotInactiveInverse: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
