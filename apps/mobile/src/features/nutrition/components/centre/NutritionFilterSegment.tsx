import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { radii, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';
import type { NutritionListFilter } from '../../utils/nutritionClassification';

type FilterOption = {
  readonly id: NutritionListFilter;
  readonly label: string;
};

type Props = {
  readonly options: readonly FilterOption[];
  readonly value: NutritionListFilter;
  readonly onChange: (value: NutritionListFilter) => void;
};

export function NutritionFilterSegment({ options, value, onChange }: Props) {
  const { colors, isDark } = useThemeMode();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="nutrition-filter-segment"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={[
              styles.chip,
              selected
                ? { backgroundColor: colors.primary, borderWidth: 0 }
                : {
                    backgroundColor: isDark ? colors.mutedSurface : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
            ]}
          >
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                { color: selected ? colors.textInverse : colors.textPrimary },
              ]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontWeight: '700',
  },
});
