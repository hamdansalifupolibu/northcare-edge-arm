import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { colors, layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { CommunityRequestListFilter } from '../domain/types';
import { ReachSignalIcon } from './ReachCentreIcons';

export type ReachLiveStatKey = 'awaiting' | 'assignedToMe' | 'emergency';

type StatTile = {
  readonly key: ReachLiveStatKey;
  readonly label: string;
  readonly count: number | null;
  readonly filter: CommunityRequestListFilter;
  readonly urgent?: boolean;
};

type Props = {
  readonly tiles: readonly StatTile[];
  readonly selectedFilter: CommunityRequestListFilter;
  readonly onSelectFilter: (filter: CommunityRequestListFilter) => void;
};

export function ReachLiveStatsRow({ tiles, selectedFilter, onSelectFilter }: Props) {
  return (
    <View style={styles.row} testID="reach-live-stats-row">
      {tiles.map((tile) => (
        <StatTileCard
          key={tile.key}
          tile={tile}
          selected={selectedFilter === tile.filter}
          onPress={() => onSelectFilter(tile.filter)}
        />
      ))}
    </View>
  );
}

function StatTileCard({
  tile,
  selected,
  onPress,
}: {
  readonly tile: StatTile;
  readonly selected: boolean;
  readonly onPress: () => void;
}) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const showUrgentGlow = tile.urgent === true && (tile.count ?? 0) > 0;
  const countLabel = tile.count == null ? '—' : String(tile.count);
  const borderColor = showUrgentGlow
    ? semantic.status.urgent
    : selected
      ? colors.primary
      : semantic.border.default;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${tile.label}, ${countLabel}`}
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}
      testID={`reach-stat-${tile.key}`}
    >
      <View
        style={[
          styles.tile,
          {
            backgroundColor: themeColors.surface,
            borderColor,
            borderWidth: selected || showUrgentGlow ? 2 : 1,
          },
          selected ? styles.tileSelected : null,
          showUrgentGlow ? styles.tileUrgent : null,
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: tile.urgent
                ? semantic.status.urgentBackground
                : isDark
                  ? themeColors.mutedSurface
                  : colors.mutedSurface,
            },
          ]}
        >
          <ReachSignalIcon
            size={18}
            color={tile.urgent ? semantic.status.urgent : colors.primary}
          />
        </View>
        <AppText variant="headingMedium" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
          {countLabel}
        </AppText>
        <AppText variant="caption" color="secondary" numberOfLines={1}>
          {tile.label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: spacing.xs,
    minHeight: layout.minTouchTarget + spacing.sm,
    ...shadows.sm,
  },
  tileSelected: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tileUrgent: {
    shadowColor: colors.danger,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
