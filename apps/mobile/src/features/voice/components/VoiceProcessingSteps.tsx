import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import type { SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export type VoiceProcessingStep = 'captured' | 'transcribing' | 'preparing';

type VoiceProcessingStepsProps = {
  readonly activeStep: VoiceProcessingStep;
  readonly immersive?: boolean;
  readonly testID?: string;
};

type StepState = 'done' | 'active' | 'pending';

function stepState(step: VoiceProcessingStep, activeStep: VoiceProcessingStep): StepState {
  const order: VoiceProcessingStep[] = ['captured', 'transcribing', 'preparing'];
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
  immersive,
}: {
  readonly label: string;
  readonly state: StepState;
  readonly immersive: boolean;
}) {
  const styles = useVoiceProcessingStepsStyles();
  const marker =
    state === 'done' ? '✓' : state === 'active' ? '●' : '○';
  const textColor =
    state === 'done'
      ? immersive
        ? 'stable'
        : 'stable'
      : state === 'active'
        ? immersive
          ? 'inverse'
          : 'primary'
        : immersive
          ? 'secondary'
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

export function VoiceProcessingSteps({
  activeStep,
  immersive = false,
  testID = 'voice-processing-steps',
}: VoiceProcessingStepsProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceProcessingStepsStyles();

  return (
    <View
      testID={testID}
      style={[styles.container, immersive ? styles.containerImmersive : null]}
    >
      {immersive ? (
        <AppText variant="caption" color="inverse" style={styles.badge}>
          {voiceStrings.speechModelBadge}
        </AppText>
      ) : null}
      <StepRow
        label={voiceStrings.processingStepCaptured}
        state={stepState('captured', activeStep)}
        immersive={immersive}
      />
      <StepRow
        label={voiceStrings.processingStepTranscribing}
        state={stepState('transcribing', activeStep)}
        immersive={immersive}
      />
      <StepRow
        label={voiceStrings.processingStepPreparing}
        state={stepState('preparing', activeStep)}
        immersive={immersive}
      />
    </View>
  );
}

export function VoiceProcessingPrivacyNote({
  immersive = false,
  testID,
}: {
  readonly immersive?: boolean;
  readonly testID?: string;
}) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceProcessingStepsStyles();

  return (
    <View testID={testID} style={[styles.privacyNote, immersive ? styles.privacyImmersive : null]}>
      <AppText
        variant="caption"
        color={immersive ? 'inverse' : 'secondary'}
        style={styles.privacyText}
      >
        {voiceStrings.processingPrivacy}
      </AppText>
    </View>
  );
}

function createVoiceProcessingStepsStyles(semantic: SemanticColors) {
  return StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      gap: spacing.sm,
      padding: spacing.base,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: semantic.border.default,
      backgroundColor: semantic.surface.primary,
    },
    containerImmersive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryDark,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radii.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
      backgroundColor: semantic.surface.muted,
    },
    privacyImmersive: {
      backgroundColor: 'rgba(6, 78, 73, 0.55)',
    },
    privacyText: {
      textAlign: 'center',
      opacity: 0.92,
    },
  });
}

function useVoiceProcessingStepsStyles() {
  const { semantic } = useThemeMode();
  return useMemo(() => createVoiceProcessingStepsStyles(semantic), [semantic]);
}
