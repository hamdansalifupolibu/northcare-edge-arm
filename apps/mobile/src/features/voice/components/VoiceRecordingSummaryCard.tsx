import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, semanticColors, spacing } from '../../../theme';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type VoiceRecordingSummaryCardProps = {
  readonly durationLabel: string;
  readonly testID?: string;
};

export function VoiceRecordingSummaryCard({
  durationLabel,
  testID = 'voice-recording-summary',
}: VoiceRecordingSummaryCardProps) {
  const voiceStrings = useVoiceStrings();

  return (
    <View testID={testID} style={styles.card}>
      <AppText variant="label" color="inverse">
        {voiceStrings.recordingSavedTitle}
      </AppText>
      <AppText variant="body" color="inverse" style={styles.body}>
        {voiceStrings.recordingSavedBody}
      </AppText>
      <AppText variant="caption" color="inverse" style={styles.duration}>
        {durationLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.card,
    backgroundColor: semanticColors.action.primaryPressed,
    borderWidth: 1,
    borderColor: semanticColors.border.strong,
  },
  body: {
    opacity: 0.92,
  },
  duration: {
    opacity: 0.85,
  },
});
