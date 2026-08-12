import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, StatusChip } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import type { SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { VoiceRecordingListEntry } from '../domain/voiceRecordingSummary';
import { recordingListStatusLabel } from '../domain/recordingListPresentation';
import {
  formatRecordingDuration,
  formatRecordingTimestamp,
} from '../domain/voiceRecordingNavigation';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { clientInitials } from './VoiceTranscriptReviewUI';

function statusTone(
  status: VoiceRecordingListEntry['status'],
): 'neutral' | 'warning' | 'success' | 'offline' {
  if (status === 'confirmed') {
    return 'success';
  }
  if (status === 'reviewRequired' || status === 'failed') {
    return 'warning';
  }
  if (status === 'discarded') {
    return 'neutral';
  }
  return 'offline';
}

function accentColor(
  status: VoiceRecordingListEntry['status'],
  semantic: SemanticColors,
): string {
  if (status === 'confirmed') {
    return colors.success;
  }
  if (status === 'reviewRequired' || status === 'failed') {
    return colors.warning;
  }
  if (status === 'discarded') {
    return semantic.border.strong;
  }
  return colors.primary;
}

type VoiceRecordingListItemProps = {
  readonly entry: VoiceRecordingListEntry;
  readonly onPress: () => void;
  readonly testID?: string;
};

export function VoiceRecordingListItem({
  entry,
  onPress,
  testID,
}: VoiceRecordingListItemProps) {
  const voiceStrings = useVoiceStrings();
  const { semantic } = useThemeMode();
  const styles = useVoiceRecordingListItemStyles();
  const statusLabel = recordingListStatusLabel(entry, voiceStrings);
  const durationLabel = formatRecordingDuration(entry.durationMs);
  const timestampLabel = formatRecordingTimestamp(entry.updatedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.clientName}, ${statusLabel}, ${timestampLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: accentColor(entry.status, semantic), opacity: pressed ? 0.88 : 1 },
      ]}
      testID={testID ?? `voice-recording-item-${entry.sessionId}`}
    >
      <View style={styles.avatar}>
        <AppText variant="label" color="inverse" style={styles.avatarText}>
          {clientInitials(entry.clientName)}
        </AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <AppText variant="bodyStrong" style={styles.clientName} numberOfLines={1}>
            {entry.clientName}
          </AppText>
          <StatusChip label={statusLabel} tone={statusTone(entry.status)} />
        </View>

        <AppText variant="caption" color="secondary">
          {timestampLabel}
          {entry.durationMs ? ` · ${durationLabel}` : ''}
          {entry.languageHint ? ` · ${entry.languageHint}` : ''}
        </AppText>

        <View style={styles.metaRow}>
          <AppText variant="caption" color="secondary">
            {entry.hasAudio ? voiceStrings.recordingsHasAudio : voiceStrings.recordingsNoAudio}
          </AppText>
          <AppText variant="caption" color="action">
            {voiceStrings.recordingsResume} →
          </AppText>
        </View>

        {entry.transcriptSnippet ? (
          <AppText variant="body" color="secondary" numberOfLines={2} style={styles.snippet}>
            {entry.transcriptSnippet}
          </AppText>
        ) : (
          <AppText variant="caption" color="secondary" style={styles.snippetPlaceholder}>
            {voiceStrings.recordingsNoTranscript}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

function createVoiceRecordingListItemStyles(semantic: SemanticColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.base,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: semantic.border.default,
      borderLeftWidth: 4,
      backgroundColor: semantic.surface.primary,
      minHeight: 48,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radii.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontWeight: '700',
    },
    content: {
      flex: 1,
      gap: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    clientName: {
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    snippet: {
      marginTop: spacing.xxs,
    },
    snippetPlaceholder: {
      fontStyle: 'italic',
    },
  });
}

function useVoiceRecordingListItemStyles() {
  const { semantic } = useThemeMode();
  return useMemo(() => createVoiceRecordingListItemStyles(semantic), [semantic]);
}
