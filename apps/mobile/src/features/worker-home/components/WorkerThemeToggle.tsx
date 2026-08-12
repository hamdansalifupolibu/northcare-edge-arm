import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { MoonIcon, SunIcon } from './WorkerHomeIcons';

export function WorkerThemeToggle() {
  const t = useTranslation();
  const { mode, toggleMode, colors } = useThemeMode();
  const isLight = mode === 'light';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: !isLight }}
      accessibilityLabel={isLight ? t.workerHome.switchToDarkMode : t.workerHome.switchToLightMode}
      onPress={toggleMode}
      style={[styles.track, { backgroundColor: colors.surface }]}
      testID="worker-theme-toggle"
    >
      <View
        style={[
          styles.option,
          isLight ? { backgroundColor: colors.accentLight } : null,
        ]}
      >
        <SunIcon size={16} color={isLight ? colors.primary : colors.textSecondary} />
      </View>
      <View
        style={[
          styles.option,
          !isLight ? { backgroundColor: colors.mutedSurface } : null,
        ]}
      >
        <MoonIcon size={16} color={!isLight ? colors.primary : colors.textSecondary} />
      </View>
      <AppText variant="caption" style={styles.srOnly}>
        {isLight ? t.workerHome.lightMode : t.workerHome.darkMode}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
    ...shadows.sm,
  },
  option: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
