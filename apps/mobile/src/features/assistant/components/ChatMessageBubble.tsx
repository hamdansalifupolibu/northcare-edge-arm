import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import type { AssistantMessageSourceRecord } from '../../../data/repositories/contracts/assistantConversationTypes';
import { radii, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { AskBookIcon, AskChevronRightIcon } from './AskNorthCareChatIcons';
import type { ChatMessage } from '../providers/offlineAi/offlineAiChatProvider';
import { formatAssistantReplyForDisplay } from '../domain/formatAssistantReply';

type ChatMessageBubbleProps = {
  readonly message: ChatMessage;
  readonly sources?: readonly AssistantMessageSourceRecord[];
  readonly sourcesLabel?: (count: number) => string;
  readonly onSourcesPress?: () => void;
  readonly testID?: string;
};

export function ChatMessageBubble({
  message,
  sources = [],
  sourcesLabel,
  onSourcesPress,
  testID,
}: ChatMessageBubbleProps) {
  const { colors, semantic, isDark } = useThemeMode();
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : formatAssistantReplyForDisplay(message.content);
  const assistantSurface = themedMintSurface(colors, isDark);

  return (
    <View
      style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'NorthCare AI'}: ${displayContent}`}
    >
      {!isUser ? (
        <View style={styles.assistantHeader}>
          <NorthCareLogo variant="symbol" size="sm" />
          <AppText variant="bodyStrong" style={{ color: colors.primaryDark }}>
            NorthCare AI
          </AppText>
        </View>
      ) : null}
      <View style={[styles.contentColumn, isUser ? styles.contentColumnUser : null]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderBottomRightRadius: radii.sm }
              : {
                  backgroundColor: assistantSurface,
                  borderBottomLeftRadius: radii.sm,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: semantic.border.default,
                },
          ]}
        >
          <AppText
            variant="body"
            color={isUser ? 'inverse' : 'primary'}
            style={styles.messageText}
          >
            {displayContent}
          </AppText>
        </View>
        {!isUser && sources.length > 0 && onSourcesPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSourcesPress}
            style={({ pressed }) => [
              styles.sourcesButton,
              { backgroundColor: semantic.status.stableBackground, opacity: pressed ? 0.88 : 1 },
            ]}
            testID={testID ? `${testID}-sources` : undefined}
          >
            <AskBookIcon color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.primaryDark, fontWeight: '700' }}>
              {sourcesLabel ? sourcesLabel(sources.length) : `Sources (${sources.length})`}
            </AppText>
            <AskChevronRightIcon color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  contentColumn: {
    maxWidth: '92%',
    gap: spacing.sm,
  },
  contentColumnUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.xl,
  },
  messageText: {
    lineHeight: 22,
  },
  sourcesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
