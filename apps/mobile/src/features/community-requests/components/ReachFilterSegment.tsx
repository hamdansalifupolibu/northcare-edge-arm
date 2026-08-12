import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { colors, layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { CommunityRequestListFilter } from '../domain/types';

type Props = {
  readonly filters: readonly CommunityRequestListFilter[];
  readonly labels: Record<CommunityRequestListFilter, string>;
  readonly selected: CommunityRequestListFilter;
  readonly onSelect: (filter: CommunityRequestListFilter) => void;
};

export function ReachFilterSegment({ filters, labels, selected, onSelect }: Props) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="tablist"
      testID="reach-filter-segment"
    >
      {filters.map((key) => {
        const isSelected = selected === key;
        const isEmergency = key === 'emergency';
        return (
          <View
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={labels[key]}
          >
            <Pressable
              onPress={() => onSelect(key)}
              style={({ pressed }) => [
                styles.segment,
                {
                  backgroundColor: isSelected ? colors.primary : themeColors.surface,
                  borderColor: isEmergency && isSelected ? colors.accent : isSelected ? colors.primary : semantic.border.default,
                  opacity: pressed ? 0.9 : 1,
                },
                isSelected ? styles.segmentSelected : null,
              ]}
              testID={`community-requests-filter-${key}`}
            >
              <AppText
                variant="caption"
                style={{
                  color: isSelected ? colors.textInverse : themeColors.textPrimary,
                  fontWeight: isSelected ? '700' : '600',
                }}
                numberOfLines={1}
              >
                {labels[key]}
              </AppText>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  segment: {
    minHeight: layout.minTouchTarget - 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
});
