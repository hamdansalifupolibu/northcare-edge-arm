import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type RecordingIndicatorProps = {
  readonly state: 'recording' | 'paused' | 'ready' | 'idle';
  readonly elapsedLabel: string;
  readonly inverse?: boolean;
  readonly testID?: string;
};

export function RecordingIndicator({
  state,
  elapsedLabel,
  inverse = false,
  testID = 'voice-recording-indicator',
}: RecordingIndicatorProps) {
  const voiceStrings = useVoiceStrings();
  const statusLabel =
    state === 'recording'
      ? voiceStrings.recordingStatus
      : state === 'paused'
        ? voiceStrings.pausedStatus
        : state === 'ready'
          ? voiceStrings.readyStatus
          : voiceStrings.readyStatus;

  const accessibilityLabel =
    state === 'recording'
      ? voiceStrings.accessibilityRecording(elapsedLabel)
      : state === 'paused'
        ? voiceStrings.accessibilityPaused(elapsedLabel)
        : statusLabel;

  const labelColor = inverse ? 'inverse' : 'primary';
  const secondaryColor = inverse ? 'inverse' : 'secondary';

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={{ gap: spacing.xs, alignItems: 'center' }}
    >
      <AppText variant="label" color={labelColor}>
        {statusLabel}
      </AppText>
      <AppText variant="body" color={secondaryColor}>
        {elapsedLabel}
      </AppText>
    </View>
  );
}
