import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '../../../design-system/text/AppText';
import { FormErrorText, FormLabel } from '../../../design-system';
import type { AgeUnit } from '../../../data/domain/enums/ageUnit';
import {
  CLIENT_SEX_VALUES,
  type ClientSex,
} from '../../../data/domain/enums/clientSex';
import { colors, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type HeadingProps = {
  readonly heading: string;
  readonly instruction: string;
};

export function RegisterStepHeading({ heading, instruction }: HeadingProps) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.headingBlock}>
      <AppText variant="title" style={[styles.heading, { color: themeColors.textPrimary }]}>
        {heading}
      </AppText>
      <AppText variant="body" color="secondary">
        {instruction}
      </AppText>
    </View>
  );
}

type SelectCardProps = {
  readonly label: string;
  readonly description?: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
  readonly leading?: ReactNode;
};

function GoldCheckBadge({ compact = false }: { readonly compact?: boolean }) {
  return (
    <View style={[styles.checkBadge, compact ? styles.checkBadgeCompact : null]}>
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

export function RegisterSelectCard({
  label,
  description,
  selected,
  onPress,
  testID,
  leading,
}: SelectCardProps) {
  const { colors: themeColors } = useThemeMode();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: selected ? colors.primary : themeColors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={testID}
    >
      {selected ? <GoldCheckBadge /> : null}
      {leading ? <View style={styles.selectLeading}>{leading}</View> : null}
      <View style={styles.selectCopy}>
        <AppText variant="label" style={[styles.selectTitle, { color: themeColors.textPrimary }]}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color="secondary" style={styles.selectDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function RegisterFieldLabel({
  label,
  required = false,
}: {
  readonly label: string;
  readonly required?: boolean;
}) {
  return <FormLabel required={required}>{label}</FormLabel>;
}

type SexSelectorProps = {
  readonly label: string;
  readonly required?: boolean;
  readonly selectedSex: ClientSex | null;
  readonly onSelect: (sex: ClientSex) => void;
  readonly errorMessage?: string;
  readonly sexLabel: (sex: ClientSex) => string;
};

export function RegisterSexSelector({
  label,
  required = false,
  selectedSex,
  onSelect,
  errorMessage,
  sexLabel,
}: SexSelectorProps) {
  const { colors: themeColors } = useThemeMode();
  const resolvedSelection = selectedSex && CLIENT_SEX_VALUES.includes(selectedSex) ? selectedSex : null;

  return (
    <View style={styles.fieldBlock}>
      <RegisterFieldLabel label={label} required={required} />
      <View style={styles.sexRow}>
        {CLIENT_SEX_VALUES.map((sex) => {
          const selected = resolvedSelection === sex;
          return (
            <Pressable
              key={sex}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={sexLabel(sex)}
              onPress={() => onSelect(sex)}
              style={({ pressed }) => [
                styles.sexChip,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: selected ? colors.primary : themeColors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              testID={`register-sex-${sex}`}
            >
              {selected ? <GoldCheckBadge /> : null}
              <AppText variant="label" style={[styles.sexLabel, { color: themeColors.textPrimary }]}>
                {sexLabel(sex)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {errorMessage ? <FormErrorText>{errorMessage}</FormErrorText> : null}
    </View>
  );
}

type FormErrorProps = {
  readonly message?: string;
};

export function RegisterFormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }
  return <FormErrorText>{message}</FormErrorText>;
}

type UnitChipRowProps = {
  readonly label: string;
  readonly required?: boolean;
  readonly units: readonly AgeUnit[];
  readonly selectedUnit: AgeUnit | null;
  readonly onSelect: (unit: AgeUnit) => void;
  readonly unitLabel: (unit: AgeUnit) => string;
  readonly errorMessage?: string;
};

export function RegisterUnitChipRow({
  label,
  required = false,
  units,
  selectedUnit,
  onSelect,
  unitLabel,
  errorMessage,
}: UnitChipRowProps) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.fieldBlock}>
      <RegisterFieldLabel label={label} required={required} />
      <View style={styles.unitRow}>
        {units.map((unit) => {
          const selected = selectedUnit === unit;
          return (
            <Pressable
              key={unit}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={unitLabel(unit)}
              onPress={() => onSelect(unit)}
              style={({ pressed }) => [
                styles.unitChip,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: selected ? colors.primary : themeColors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              testID={`register-age-unit-${unit}`}
            >
              {selected ? <GoldCheckBadge compact /> : null}
              <AppText
                variant="caption"
                style={[styles.unitChipLabel, { color: themeColors.textPrimary }]}
              >
                {unitLabel(unit)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {errorMessage ? <FormErrorText>{errorMessage}</FormErrorText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headingBlock: {
    gap: spacing.xs,
  },
  heading: {
    fontWeight: '800',
  },
  selectCard: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
    ...shadows.sm,
  },
  selectLeading: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectTitle: {
    fontWeight: '700',
  },
  selectDescription: {
    lineHeight: 18,
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
  fieldBlock: {
    gap: spacing.sm,
  },
  sexRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sexChip: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  sexLabel: {
    fontWeight: '700',
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitChip: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  unitChipLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  checkBadgeCompact: {
    top: spacing.xxs,
    right: spacing.xxs,
    width: 18,
    height: 18,
  },
});
