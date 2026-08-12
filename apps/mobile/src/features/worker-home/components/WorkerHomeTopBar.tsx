import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, shadows, spacing } from '../../../theme';
import { ConnectivityStatusPill } from './ConnectivityStatusPill';
import { MenuIcon } from './WorkerHomeIcons';
import { WorkerThemeToggle } from './WorkerThemeToggle';

type Props = {
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly onMenuPress: () => void;
};

export function WorkerHomeTopBar({ isOnline, checking, onMenuPress }: Props) {
  const t = useTranslation();

  return (
    <View style={styles.row} testID="worker-home-top-bar">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.workerHome.openMenu}
        onPress={onMenuPress}
        style={styles.menuButton}
        hitSlop={8}
        testID="worker-home-menu"
      >
        <MenuIcon color={colors.primaryDark} />
      </Pressable>

      <View style={styles.logoWrap}>
        <NorthCareLogo variant="symbol" size="sm" testID="worker-home-logo" />
      </View>

      <View style={styles.trailing}>
        <ConnectivityStatusPill
          isOnline={isOnline}
          checking={checking}
          variant="hero"
          testID="worker-home-connectivity"
        />
        <WorkerThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    minHeight: 48,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...shadows.sm,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
});
