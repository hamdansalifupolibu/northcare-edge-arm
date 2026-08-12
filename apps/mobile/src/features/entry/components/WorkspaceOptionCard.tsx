import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '../../../design-system/text/AppText';
import { borders, layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export type WorkspaceOptionCardProps = {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly accessibilityHint: string;
  readonly testID: string;
};

function SelectionIndicator({ selected }: { readonly selected: boolean }) {
  const { semantic } = useThemeMode();

  if (selected) {
    return (
      <View
        style={[styles.selectedIndicator, { backgroundColor: semantic.action.accent }]}
        testID="workspace-option-selected"
      >
        <Svg width={14} height={14} viewBox="0 0 14 14" accessible={false}>
          <Path
            d="M3 7 L6 10 L11 4"
            fill="none"
            stroke={semantic.text.inverse}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  }

  return (
    <View style={styles.unselectedIndicator} testID="workspace-option-unselected">
      <Svg width={INDICATOR_SIZE} height={INDICATOR_SIZE} viewBox="0 0 24 24" accessible={false}>
        <Circle
          cx="12"
          cy="12"
          r="11"
          fill="none"
          stroke={semantic.border.default}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

export function WorkspaceOptionCard({
  title,
  description,
  icon,
  selected,
  onPress,
  accessibilityHint,
  testID,
}: WorkspaceOptionCardProps) {
  const { semantic } = useThemeMode();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? semantic.surface.muted : semantic.surface.primary,
          borderColor: selected ? semantic.action.primary : semantic.border.default,
          borderWidth: selected ? borders.widthMedium : borders.widthThin,
        },
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.copy}>
        <AppText variant="title" color="action">
          {title}
        </AppText>
        <AppText variant="body" color="secondary">
          {description}
        </AppText>
      </View>
      <SelectionIndicator selected={selected} />
    </Pressable>
  );
}

const INDICATOR_SIZE = 24;

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radii.card,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: layout.minTouchTarget + spacing.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  selectedIndicator: {
    alignItems: 'center',
    borderRadius: INDICATOR_SIZE / 2,
    height: INDICATOR_SIZE,
    justifyContent: 'center',
    width: INDICATOR_SIZE,
  },
  unselectedIndicator: {
    alignItems: 'center',
    height: INDICATOR_SIZE,
    justifyContent: 'center',
    width: INDICATOR_SIZE,
  },
});
