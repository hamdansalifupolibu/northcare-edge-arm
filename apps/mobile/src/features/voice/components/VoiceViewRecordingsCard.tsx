import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type VoiceViewRecordingsCardProps = {
  readonly onPress: () => void;
  readonly testID?: string;
};

/**
 * In-body access to the recordings list — matches client-module card / quick-action patterns.
 */
export function VoiceViewRecordingsCard({
  onPress,
  testID = 'voice-view-recordings',
}: VoiceViewRecordingsCardProps) {
  const voiceStrings = useVoiceStrings();
  const { semantic } = useThemeMode();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={voiceStrings.viewRecordingsA11y}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: semantic.border.default,
          backgroundColor: semantic.surface.primary,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.iconCircle, { backgroundColor: semantic.surface.muted }]}>
        <AppText variant="label" color="inverse" style={styles.icon}>
          📋
        </AppText>
      </View>
      <View style={styles.textBlock}>
        <AppText variant="bodyStrong" color="primary">
          {voiceStrings.viewRecordings}
        </AppText>
        <AppText variant="caption" color="secondary">
          {voiceStrings.viewRecordingsBody}
        </AppText>
      </View>
      <AppText variant="label" color="action">
        →
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mutedSurface,
  },
  icon: {
    fontSize: 18,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
});
