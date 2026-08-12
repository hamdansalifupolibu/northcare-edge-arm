import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, StatusChip } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import type { SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type VoiceClientContextCardProps = {
  readonly clientName: string;
  readonly categoryLabel: string;
  readonly consentConfirmed?: boolean;
  readonly onChange?: () => void;
  readonly testID?: string;
};

export function VoiceClientContextCard({
  clientName,
  categoryLabel,
  consentConfirmed = false,
  onChange,
  testID = 'voice-client-context',
}: VoiceClientContextCardProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceClientContextCardStyles();

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="caption" color="secondary">
          {voiceStrings.recordingFor}
        </AppText>
        {consentConfirmed ? (
          <StatusChip
            label={voiceStrings.consentConfirmedChip}
            tone="success"
            testID={`${testID}-consent`}
          />
        ) : null}
      </View>
      <View style={styles.bodyRow}>
        <View style={styles.textBlock}>
          <AppText variant="label">{clientName}</AppText>
          <AppText variant="caption" color="secondary">
            {categoryLabel}
          </AppText>
        </View>
        {onChange ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voiceStrings.changeClient}
            onPress={onChange}
            testID={`${testID}-change`}
            style={({ pressed }) => [styles.changeButton, pressed ? styles.changePressed : null]}
          >
            <AppText variant="label" color="primary">
              {voiceStrings.changeClient}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createVoiceClientContextCardStyles(semantic: SemanticColors) {
  return StyleSheet.create({
    card: {
      gap: spacing.sm,
      padding: spacing.base,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: semantic.border.default,
      backgroundColor: semantic.surface.primary,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xxs,
    },
    changeButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    changePressed: {
      opacity: 0.7,
    },
  });
}

function useVoiceClientContextCardStyles() {
  const { semantic } = useThemeMode();
  return useMemo(() => createVoiceClientContextCardStyles(semantic), [semantic]);
}
