import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AppButton, AppText } from '../../../design-system';
import { sanitizeAssistantErrorMessage } from '../../../error/mapAssistantUserMessage';
import { spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type ChatModelUnavailableProps = {
  readonly reason?: 'missing' | 'unsupported' | 'error';
  readonly message?: string | null;
};

export function ChatModelUnavailable({
  reason = 'missing',
  message,
}: ChatModelUnavailableProps) {
  const router = useRouter();
  const { colors } = useThemeMode();
  const t = useAssistantStrings();

  const title =
    reason === 'unsupported'
      ? t.modelUnsupportedTitle
      : reason === 'error'
        ? t.modelErrorTitle
        : t.modelMissingTitle;

  const defaultBody =
    reason === 'unsupported'
      ? t.modelUnsupportedBody
      : reason === 'error'
        ? t.modelErrorBody
        : t.modelMissingBody;

  const body = message
    ? sanitizeAssistantErrorMessage(message, defaultBody)
    : defaultBody;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={title}
      testID="chat-model-unavailable"
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.mutedSurface }]}>
        <AppText variant="headingSmall" color="secondary">
          AI
        </AppText>
      </View>
      <AppText variant="headingSmall" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" color="secondary" style={styles.body}>
        {body}
      </AppText>
      <AppText variant="caption" color="secondary" style={styles.note}>
        {t.modelOfflineNote}
      </AppText>
      <AppButton
        label={t.openOfflineAiSettings}
        variant="secondary"
        onPress={() => router.push('/(development)/offline-ai' as Href)}
        testID="chat-open-offline-ai"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
  },
  note: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
