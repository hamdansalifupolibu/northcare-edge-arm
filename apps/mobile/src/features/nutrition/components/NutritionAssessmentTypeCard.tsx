import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '../../../design-system';
import { colors, layout, radii, shadows, spacing } from '../../../theme';
import type { NutritionAssessmentTemplateDefinition } from '../domain/types';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

type Props = {
  readonly template: NutritionAssessmentTemplateDefinition;
  readonly selected?: boolean;
  readonly onPress: () => void;
};

function splitTitle(title: string): { readonly headline: string; readonly ageBand: string | null } {
  const match = /\(([^)]+)\)\s*$/.exec(title);
  if (!match) {
    return { headline: title, ageBand: null };
  }
  return {
    headline: title.slice(0, match.index).trim(),
    ageBand: match[1] ?? null,
  };
}

function NutritionTypeIcon({ selected }: { readonly selected: boolean }) {
  const tint = selected ? colors.textInverse : colors.primary;
  return (
    <View style={[styles.iconWrap, selected ? styles.iconWrapSelected : styles.iconWrapIdle]}>
      <Svg width={28} height={28} viewBox="0 0 24 24" accessible={false}>
        <Circle cx={12} cy={8} r={3.5} fill="none" stroke={tint} strokeWidth={1.6} />
        <Path
          d="M6 20 C6 16 8.5 13.5 12 13.5 C15.5 13.5 18 16 18 20"
          fill="none"
          stroke={tint}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Path
          d="M4 11 H7 M17 11 H20"
          stroke={tint}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function SelectedMark() {
  return (
    <View style={styles.checkWrap}>
      <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
        <Path
          d="M6 12 L10 16 L18 8"
          fill="none"
          stroke={colors.textInverse}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function NutritionAssessmentTypeCard({ template, selected = false, onPress }: Props) {
  const nutritionStrings = useNutritionStrings();
  const { headline, ageBand } = splitTitle(template.title);
  const measurements = [
    ...template.requiredMeasurementTypes,
    ...template.optionalMeasurementTypes.filter(
      (type) => !template.requiredMeasurementTypes.includes(type),
    ),
  ].slice(0, 3);

  const measurementLabel = (type: string): string => {
    switch (type) {
      case 'muac':
        return nutritionStrings.measurementMuac;
      case 'weight':
        return nutritionStrings.measurementWeight;
      case 'height':
        return nutritionStrings.measurementHeight;
      default:
        return type;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nutritionStrings.accessibilityTypeCard(template.title)}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : styles.cardIdle,
        { opacity: pressed ? 0.92 : 1 },
      ]}
      testID={`nutrition-type-${template.assessmentType}`}
    >
      <View style={styles.row}>
        <NutritionTypeIcon selected={selected} />
        <View style={styles.copy}>
          <AppText
            variant="label"
            style={[styles.headline, selected ? styles.headlineSelected : null]}
          >
            {headline}
          </AppText>
          {ageBand ? (
            <View style={[styles.ageBand, selected ? styles.ageBandSelected : null]}>
              <AppText
                variant="caption"
                style={{
                  color: selected ? colors.textInverse : colors.primary,
                  fontWeight: '700',
                }}
              >
                {ageBand}
              </AppText>
            </View>
          ) : null}
          <View style={styles.chips}>
            {measurements.map((type) => (
              <View key={type} style={[styles.chip, selected ? styles.chipSelected : null]}>
                <AppText
                  variant="caption"
                  color={selected ? undefined : 'secondary'}
                  style={[styles.chipText, selected ? styles.chipTextSelected : null]}
                >
                  {measurementLabel(type)}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        {selected ? <SelectedMark /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.base,
    minHeight: layout.minTouchTarget + spacing.lg,
    ...shadows.sm,
  },
  cardIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapIdle: {
    backgroundColor: colors.mutedSurface,
  },
  iconWrapSelected: {
    backgroundColor: colors.primaryDark,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  headline: {
    fontWeight: '800',
    fontSize: 16,
  },
  headlineSelected: {
    color: colors.textInverse,
  },
  ageBand: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.mutedSurface,
  },
  ageBandSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipSelected: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxs,
  },
});
