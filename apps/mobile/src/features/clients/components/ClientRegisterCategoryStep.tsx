import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '../../../design-system/text/AppText';
import { FormErrorText } from '../../../design-system';
import {
  CLIENT_CATEGORIES,
  type ClientCategory,
} from '../../../data/domain/enums/clientCategory';
import { colors, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import type { ColorPalette } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  ChildUnderFiveCategoryIcon,
  NewbornCategoryIcon,
  PostnatalCategoryIcon,
  PregnantCategoryIcon,
} from './ClientRegisterCategoryIcons';
import { ClientRegisterShell } from './ClientRegisterShell';

function categoryVisuals(palette: ColorPalette, isDark: boolean): Record<
  ClientCategory,
  { readonly iconBackground: string; readonly renderIcon: () => ReactNode }
> {
  const mintSurface = themedMintSurface(palette, isDark);
  return {
    pregnant: {
      iconBackground: mintSurface,
      renderIcon: () => <PregnantCategoryIcon />,
    },
    postnatal: {
      iconBackground: isDark ? palette.mutedSurface : '#FFF8E1',
      renderIcon: () => <PostnatalCategoryIcon />,
    },
    newborn: {
      iconBackground: isDark ? palette.mutedSurface : '#F3E8FF',
      renderIcon: () => <NewbornCategoryIcon />,
    },
    childUnderFive: {
      iconBackground: isDark ? palette.mutedSurface : '#E8F4FD',
      renderIcon: () => <ChildUnderFiveCategoryIcon />,
    },
  };
}

type Props = {
  readonly selectedCategory: ClientCategory | null;
  readonly onSelectCategory: (category: ClientCategory) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
  readonly errorMessage?: string;
  readonly testID?: string;
  readonly title: string;
  readonly subtitle: string;
  readonly stepLabel: string;
  readonly heading: string;
  readonly instruction: string;
  readonly continueLabel: string;
  readonly securityTitle: string;
  readonly securityBody: string;
  readonly categoryLabel: (category: ClientCategory) => string;
  readonly categoryDescription: (category: ClientCategory) => string;
};

function GoldCheckBadge() {
  return (
    <View style={styles.checkBadge}>
      <Svg width={12} height={12} viewBox="0 0 24 24" accessible={false}>
        <Path
          d="M6 12 L10 16 L18 8"
          fill="none"
          stroke={colors.textInverse}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function ClientRegisterCategoryStep({
  selectedCategory,
  onSelectCategory,
  onContinue,
  onBack,
  errorMessage,
  testID,
  title,
  subtitle,
  stepLabel,
  heading,
  instruction,
  continueLabel,
  securityTitle,
  securityBody,
  categoryLabel,
  categoryDescription,
}: Props) {
  const { colors: themeColors, isDark } = useThemeMode();
  const visuals = categoryVisuals(themeColors, isDark);

  return (
    <ClientRegisterShell
      testID={testID}
      title={title}
      subtitle={subtitle}
      stepLabel={stepLabel}
      stepCurrent={1}
      stepTotal={8}
      continueLabel={continueLabel}
      onBack={onBack}
      onContinue={onContinue}
      continueDisabled={!selectedCategory}
      securityTitle={securityTitle}
      securityBody={securityBody}
    >
      <View style={styles.headingBlock}>
        <AppText variant="title" style={[styles.heading, { color: themeColors.textPrimary }]}>
          {heading}
        </AppText>
        <AppText variant="body" color="secondary">
          {instruction}
        </AppText>
      </View>

      <View style={styles.grid}>
        {CLIENT_CATEGORIES.map((category) => {
          const selected = selectedCategory === category;
          const visual = visuals[category];
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${categoryLabel(category)}. ${categoryDescription(category)}`}
              onPress={() => onSelectCategory(category)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: selected ? colors.primary : themeColors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              testID={`register-category-${category}`}
            >
              {selected ? <GoldCheckBadge /> : null}
              <View style={[styles.iconCircle, { backgroundColor: visual.iconBackground }]}>
                {visual.renderIcon()}
              </View>
              <AppText variant="label" style={[styles.cardTitle, { color: themeColors.textPrimary }]}>
                {categoryLabel(category)}
              </AppText>
              <AppText variant="caption" color="secondary" style={styles.cardDescription}>
                {categoryDescription(category)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {errorMessage ? <FormErrorText>{errorMessage}</FormErrorText> : null}
    </ClientRegisterShell>
  );
}

const styles = StyleSheet.create({
  headingBlock: {
    gap: spacing.xs,
  },
  heading: {
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    minHeight: 168,
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.base,
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
    ...shadows.sm,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  cardTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  cardDescription: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
