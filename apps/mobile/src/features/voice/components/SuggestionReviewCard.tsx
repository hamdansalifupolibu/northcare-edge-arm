import { View } from 'react-native';

import { AppButton, AppText, AppTextInput } from '../../../design-system';
import { spacing } from '../../../theme';
import type { VoiceExtractionSuggestion } from '../domain/types';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type SuggestionReviewCardProps = {
  readonly label: string;
  readonly suggestion: VoiceExtractionSuggestion;
  readonly proposedDisplay: string;
  readonly editValue: string;
  readonly onEditValueChange: (value: string) => void;
  readonly onAccept: () => void;
  readonly onEdit: () => void;
  readonly onReject: () => void;
  readonly disabled?: boolean;
};

function confidenceLabel(category: VoiceExtractionSuggestion['confidenceCategory']): string {
  switch (category) {
    case 'high':
      return voiceStrings.confidenceHigh;
    case 'medium':
      return voiceStrings.confidenceMedium;
    case 'low':
      return voiceStrings.confidenceLow;
    case 'uncertain':
      return voiceStrings.confidenceUncertain;
    default:
      return voiceStrings.confidenceUnknown;
  }
}

export function SuggestionReviewCard({
  label,
  suggestion,
  proposedDisplay,
  editValue,
  onEditValueChange,
  onAccept,
  onEdit,
  onReject,
  disabled = false,
}: SuggestionReviewCardProps) {
  const voiceStrings = useVoiceStrings();
  const confidence = confidenceLabel(suggestion.confidenceCategory);
  const statusLabel =
    suggestion.reviewStatus === 'accepted'
      ? 'Accepted'
      : suggestion.reviewStatus === 'edited'
        ? 'Edited'
        : suggestion.reviewStatus === 'rejected'
          ? 'Rejected'
          : 'Pending review';

  return (
    <View
      style={{ gap: spacing.sm, paddingVertical: spacing.sm }}
      accessibilityRole="summary"
      accessibilityLabel={voiceStrings.accessibilitySuggestion(label, confidence)}
      testID={`voice-suggestion-${suggestion.id}`}
    >
      <AppText variant="label">{label}</AppText>
      <AppText variant="caption" color="secondary">
        {confidence}
      </AppText>
      <AppText variant="body">{proposedDisplay}</AppText>
      <AppText variant="caption" color="secondary">
        {statusLabel}
      </AppText>
      <AppTextInput
        label="Edited value"
        value={editValue}
        onChangeText={onEditValueChange}
        editable={!disabled && suggestion.reviewStatus === 'pendingReview'}
        accessibilityLabel="Edited suggestion value"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <AppButton
          label={voiceStrings.reviewAccept}
          variant="secondary"
          onPress={onAccept}
          disabled={disabled || suggestion.reviewStatus !== 'pendingReview'}
          fullWidth={false}
        />
        <AppButton
          label={voiceStrings.reviewEdit}
          variant="secondary"
          onPress={onEdit}
          disabled={disabled || suggestion.reviewStatus !== 'pendingReview'}
          fullWidth={false}
        />
        <AppButton
          label={voiceStrings.reviewReject}
          variant="tertiary"
          onPress={onReject}
          disabled={disabled || suggestion.reviewStatus !== 'pendingReview'}
          fullWidth={false}
        />
      </View>
    </View>
  );
}
