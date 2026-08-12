import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export type VoiceAnalysisStep = 'loading' | 'reading' | 'extracting' | 'preparing';

type VoiceAnalysisProcessingStepsProps = {
  readonly activeStep: VoiceAnalysisStep;
  readonly testID?: string;
};

type StepState = 'done' | 'active' | 'pending';

function stepState(step: VoiceAnalysisStep, activeStep: VoiceAnalysisStep): StepState {
  const order: VoiceAnalysisStep[] = ['loading', 'reading', 'extracting', 'preparing'];
  const stepIndex = order.indexOf(step);
  const activeIndex = order.indexOf(activeStep);
  if (stepIndex < activeIndex) {
    return 'done';
  }
  if (stepIndex === activeIndex) {
    return 'active';
  }
  return 'pending';
}

function StepRow({
  label,
  state,
}: {
  readonly label: string;
  readonly state: StepState;
}) {
  const marker =
    state === 'done' ? '✓' : state === 'active' ? '◆' : '○';
  const textColor =
    state === 'done'
      ? 'stable'
      : state === 'active'
        ? 'inverse'
        : 'secondary';

  return (
    <View style={styles.row}>
      <AppText variant="label" color={textColor}>
        {marker}
      </AppText>
      <AppText variant="body" color={textColor}>
        {label}
      </AppText>
    </View>
  );
}

/** Checklist shown while NorthCare AI (not speech model) analyzes a confirmed transcript. */
export function VoiceAnalysisProcessingSteps({
  activeStep,
  testID = 'voice-analysis-processing-steps',
}: VoiceAnalysisProcessingStepsProps) {
  const voiceStrings = useVoiceStrings();

  return (
    <View testID={testID} style={styles.container}>
      <AppText variant="caption" color="inverse" style={styles.badge}>
        {voiceStrings.analysisModelBadge}
      </AppText>
      <StepRow
        label={voiceStrings.analysisStepLoading}
        state={stepState('loading', activeStep)}
      />
      <StepRow
        label={voiceStrings.analysisStepReading}
        state={stepState('reading', activeStep)}
      />
      <StepRow
        label={voiceStrings.analysisStepExtracting}
        state={stepState('extracting', activeStep)}
      />
      <StepRow
        label={voiceStrings.analysisStepPreparing}
        state={stepState('preparing', activeStep)}
      />
    </View>
  );
}

export function VoiceAnalysisPrivacyNote({ testID }: { readonly testID?: string }) {
  const voiceStrings = useVoiceStrings();

  return (
    <View testID={testID} style={styles.privacyNote}>
      <AppText variant="caption" color="inverse" style={styles.privacyText}>
        {voiceStrings.analysisProcessingPrivacy}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.primaryDarker,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  privacyNote: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(6, 78, 73, 0.55)',
  },
  privacyText: {
    textAlign: 'center',
    opacity: 0.92,
  },
});
