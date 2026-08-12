import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing, themedMintSurface } from '../../../theme';
import type { ColorPalette, SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export function VoiceResultsStepper({ testID = 'voice-results-stepper' }: { readonly testID?: string }) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceResultsReviewStyles();
  const steps = [
    { id: 'recorded', label: voiceStrings.resultsStepRecorded, state: 'done' as const },
    { id: 'transcript', label: voiceStrings.resultsStepTranscript, state: 'done' as const },
    { id: 'review', label: voiceStrings.resultsStepReview, state: 'active' as const },
  ];

  return (
    <View testID={testID} style={styles.stepper}>
      <View style={styles.stepperTrack}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepperSegment}>
            <View style={styles.stepperNodeRow}>
              {index > 0 ? (
                <View
                  style={[
                    styles.stepperLine,
                    step.state === 'active' || steps[index - 1]?.state === 'done'
                      ? styles.stepperLineDone
                      : null,
                  ]}
                />
              ) : (
                <View style={styles.stepperLineSpacer} />
              )}
              <View
                style={[
                  styles.stepperCircle,
                  step.state === 'done' ? styles.stepperCircleDone : styles.stepperCircleActive,
                ]}
              >
                <AppText variant="caption" color="inverse" style={styles.stepperCircleText}>
                  {step.state === 'done' ? '✓' : '3'}
                </AppText>
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.stepperLine,
                    step.state === 'done' ? styles.stepperLineDone : null,
                  ]}
                />
              ) : (
                <View style={styles.stepperLineSpacer} />
              )}
            </View>
            <AppText variant="caption" color="secondary" style={styles.stepperLabel}>
              {step.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

type VoiceResultsSectionHeaderProps = {
  readonly onViewTranscript?: () => void;
  readonly testID?: string;
};

export function VoiceResultsSectionHeader({
  onViewTranscript,
  testID = 'voice-results-section-header',
}: VoiceResultsSectionHeaderProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceResultsReviewStyles();

  return (
    <View testID={testID} style={styles.sectionHeader}>
      <View style={styles.sectionTextBlock}>
        <AppText variant="title">{voiceStrings.reviewTitle}</AppText>
        <AppText variant="body" color="secondary">
          {voiceStrings.resultsReviewBody}
        </AppText>
      </View>
      {onViewTranscript ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceStrings.resultsViewTranscript}
          onPress={onViewTranscript}
          style={({ pressed }) => [styles.viewTranscriptButton, pressed ? styles.pressed : null]}
          testID={`${testID}-view-transcript`}
        >
          <AppText variant="caption" color="action" style={styles.viewTranscriptIcon}>
            📄
          </AppText>
          <AppText variant="caption" color="action" style={styles.viewTranscriptLabel}>
            {voiceStrings.resultsViewTranscript}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export type VoiceResultFieldTone = 'mint' | 'blue' | 'green';

type VoiceExtractedFieldCardProps = {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly tone?: VoiceResultFieldTone;
  readonly edited?: boolean;
  readonly onEdit?: () => void;
  readonly testID?: string;
};

export function VoiceExtractedFieldCard({
  label,
  value,
  icon,
  tone = 'mint',
  edited = false,
  onEdit,
  testID = 'voice-result-field',
}: VoiceExtractedFieldCardProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceResultsReviewStyles();
  const palette = toneStyles(styles, tone);

  return (
    <View testID={testID} style={[styles.fieldCard, palette.card]}>
      <View style={[styles.fieldIconWrap, palette.iconWrap]}>
        <AppText variant="label">{icon}</AppText>
      </View>
      <View style={styles.fieldBody}>
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
        <AppText variant="label" style={styles.fieldValue}>
          {value || '—'}
        </AppText>
        <View style={styles.fieldBadges}>
          <View style={styles.extractedBadge}>
            <AppText variant="caption" color="info" style={styles.extractedBadgeIcon}>
              ✨
            </AppText>
            <AppText variant="caption" color="info">
              {voiceStrings.resultsExtractedBadge}
            </AppText>
          </View>
          {edited ? (
            <View style={styles.editedBadge}>
              <AppText variant="caption" color="warning">
                {voiceStrings.resultsEditedBadge}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [styles.fieldAction, pressed ? styles.pressed : null]}
        >
          <AppText variant="label" color="action">
            ✎
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

type VoiceUrgencyCheckCardProps = {
  readonly summary: string;
  readonly noUrgentFound: boolean;
  readonly edited?: boolean;
  readonly onEdit?: () => void;
  readonly onInfo?: () => void;
  readonly testID?: string;
};

export function VoiceUrgencyCheckCard({
  summary,
  noUrgentFound,
  edited = false,
  onEdit,
  onInfo,
  testID = 'voice-result-urgency',
}: VoiceUrgencyCheckCardProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceResultsReviewStyles();

  return (
    <View testID={testID} style={[styles.fieldCard, styles.fieldCardGreen]}>
      <View style={[styles.fieldIconWrap, styles.fieldIconGreen]}>
        <AppText variant="label">🛡</AppText>
      </View>
      <View style={styles.fieldBody}>
        <AppText variant="caption" color="secondary">
          {voiceStrings.resultsUrgentCareCheck}
        </AppText>
        <AppText variant="label" style={styles.fieldValue}>
          {summary}
        </AppText>
        <View style={styles.fieldBadges}>
          {noUrgentFound ? (
            <View style={styles.urgentOkBadge}>
              <AppText variant="caption" color="stable">
                ✓ {voiceStrings.resultsNoUrgentBadge}
              </AppText>
            </View>
          ) : null}
          {edited ? (
            <View style={styles.editedBadge}>
              <AppText variant="caption" color="warning">
                {voiceStrings.resultsEditedBadge}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${voiceStrings.resultsUrgentCareCheck}`}
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [styles.fieldAction, pressed ? styles.pressed : null]}
        >
          <AppText variant="label" color="action">
            ✎
          </AppText>
        </Pressable>
      ) : onInfo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Urgent-care check information"
          onPress={onInfo}
          hitSlop={8}
          style={({ pressed }) => [styles.infoAction, pressed ? styles.pressed : null]}
        >
          <AppText variant="caption" color="secondary">
            i
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function VoiceResultsControlNotice({ testID = 'voice-results-control-notice' }: { readonly testID?: string }) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceResultsReviewStyles();

  return (
    <View testID={testID} style={[styles.fieldCard, styles.fieldCardBlue, styles.noticeCard]}>
      <View style={[styles.fieldIconWrap, styles.fieldIconBlue]}>
        <AppText variant="label">🛡</AppText>
      </View>
      <View style={styles.fieldBody}>
        <AppText variant="label">{voiceStrings.resultsControlTitle}</AppText>
        <AppText variant="body" color="secondary" style={styles.noticeBody}>
          {voiceStrings.resultsControlBody}
        </AppText>
      </View>
    </View>
  );
}

export function voiceResultsReviewGapStyle(): StyleProp<ViewStyle> {
  return { gap: spacing.lg };
}

function toneStyles(
  styles: ReturnType<typeof createVoiceResultsReviewStyles>,
  tone: VoiceResultFieldTone,
) {
  switch (tone) {
    case 'blue':
      return {
        card: styles.fieldCardBlue,
        iconWrap: styles.fieldIconBlue,
      };
    case 'green':
      return {
        card: styles.fieldCardGreen,
        iconWrap: styles.fieldIconGreen,
      };
    default:
      return {
        card: styles.fieldCardMint,
        iconWrap: styles.fieldIconMint,
      };
  }
}

function createVoiceResultsReviewStyles(
  semantic: SemanticColors,
  palette: ColorPalette,
  isDark: boolean,
) {
  const mintSurface = themedMintSurface(palette, isDark);

  return StyleSheet.create({
    reviewStack: {
      gap: spacing.lg,
    },
    stepper: {
      paddingVertical: spacing.xs,
    },
    stepperTrack: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepperSegment: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
    },
    stepperNodeRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepperLine: {
      flex: 1,
      height: 2,
      backgroundColor: semantic.border.default,
    },
    stepperLineDone: {
      backgroundColor: colors.primary,
    },
    stepperLineSpacer: {
      flex: 1,
    },
    stepperCircle: {
      width: 28,
      height: 28,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperCircleDone: {
      backgroundColor: colors.primary,
    },
    stepperCircleActive: {
      backgroundColor: colors.primaryDark,
    },
    stepperCircleText: {
      fontWeight: '700',
      fontSize: 12,
      lineHeight: 14,
    },
    stepperLabel: {
      textAlign: 'center',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    sectionTextBlock: {
      flex: 1,
      gap: spacing.xxs,
    },
    viewTranscriptButton: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xxs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radii.button,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: semantic.surface.primary,
      minWidth: 88,
      minHeight: 64,
    },
    viewTranscriptIcon: {
      fontSize: 16,
      lineHeight: 18,
    },
    viewTranscriptLabel: {
      textAlign: 'center',
      lineHeight: 16,
    },
    fieldCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.base,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: semantic.border.default,
    },
    fieldCardMint: {
      backgroundColor: mintSurface,
    },
    fieldCardBlue: {
      backgroundColor: semantic.status.infoBackground,
    },
    fieldCardGreen: {
      backgroundColor: semantic.status.stableBackground,
    },
    fieldIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fieldIconMint: {
      backgroundColor: isDark ? palette.surface : semantic.status.stableBackground,
    },
    fieldIconBlue: {
      backgroundColor: isDark ? palette.surface : semantic.status.infoBackground,
    },
    fieldIconGreen: {
      backgroundColor: isDark ? palette.surface : semantic.status.stableBackground,
    },
    fieldBody: {
      flex: 1,
      gap: spacing.xxs,
    },
    fieldValue: {
      fontSize: 16,
      lineHeight: 22,
    },
    extractedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radii.pill,
      backgroundColor: semantic.status.infoBackground,
    },
    fieldBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xxs,
    },
    editedBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radii.pill,
      backgroundColor: semantic.status.warningBackground,
    },
    extractedBadgeIcon: {
      fontSize: 11,
    },
    urgentOkBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.xxs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radii.pill,
      backgroundColor: semantic.status.stableBackground,
    },
    fieldAction: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoAction: {
      width: 28,
      height: 28,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: semantic.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: semantic.surface.primary,
    },
    noticeCard: {
      alignItems: 'flex-start',
    },
    noticeBody: {
      lineHeight: 20,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

function useVoiceResultsReviewStyles() {
  const { colors: palette, semantic, isDark } = useThemeMode();
  return useMemo(
    () => createVoiceResultsReviewStyles(semantic, palette, isDark),
    [semantic, palette, isDark],
  );
}
