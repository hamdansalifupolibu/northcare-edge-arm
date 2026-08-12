import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import type { AssistantMessageSourceRecord } from '../../../data/repositories/contracts/assistantConversationTypes';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { HomeIcon } from '../../worker-home/components/WorkerHomeIcons';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { AskInfoIcon, AskMenuIcon } from '../components/AskNorthCareChatIcons';
import { AskNorthCareSidebar } from '../components/AskNorthCareSidebar';
import { ChatInput } from '../components/ChatInput';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { ChatModelLoadingBanner } from '../components/ChatModelLoadingBanner';
import { ChatModelUnavailable } from '../components/ChatModelUnavailable';
import { ChatTypingIndicator } from '../components/ChatTypingIndicator';
import { sanitizeAssistantErrorMessage } from '../../../error/mapAssistantUserMessage';
import { formatChatDateSeparator } from '../domain/conversationPresentation';
import { useAssistantChatSession } from '../hooks/useAssistantChatSession';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import type { PersistedChatMessage } from '../hooks/useAssistantChatSession';

export function AskNorthCareChatScreen() {
  const t = useAssistantStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, semantic, isDark } = useThemeMode();
  const flatListRef = useRef<FlatList<PersistedChatMessage>>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sourcesModal, setSourcesModal] = useState<readonly AssistantMessageSourceRecord[]>([]);

  const {
    conversations,
    activeConversationId,
    messages,
    messageSources,
    state,
    availability,
    isModelAvailable,
    isModelLoading,
    sendMessage,
    startNewConversation,
    selectConversation,
    clearAllHistory,
    deleteConversation,
    error,
  } = useAssistantChatSession();

  const handleDeleteConversation = useCallback(
    (conversationId: Parameters<typeof deleteConversation>[0]) => {
      deleteConversation(
        conversationId,
        t.deleteConversationTitle,
        t.deleteConversationConfirm,
        t.deleteConversationAction,
        t.deleteConversationCancel,
      );
    },
    [deleteConversation, t.deleteConversationAction, t.deleteConversationCancel, t.deleteConversationConfirm, t.deleteConversationTitle],
  );

  const sidebarProps = {
    conversations,
    activeConversationId,
    onClose: () => setSidebarOpen(false),
    onNewConversation: startNewConversation,
    onSelectConversation: selectConversation,
    onDeleteConversation: handleDeleteConversation,
    onClearHistory: () =>
      clearAllHistory(t.clearHistoryTitle, t.clearHistoryConfirm, t.clearHistoryAction, t.clearHistoryCancel),
    labels: {
      tagline: t.tagline,
      onDevice: t.onDevice,
      newConversation: t.newConversation,
      recentChats: t.recentChats,
      clearHistory: t.clearHistory,
      deleteConversationAccessibility: t.deleteConversationAccessibility,
      storedTitle: t.storedTitle,
      storedBody: t.storedBody,
    },
  };

  const scrollToEnd = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, state, scrollToEnd]);

  const showUnavailable =
    !isModelLoading &&
    !isModelAvailable &&
    (availability === 'missing' ||
      availability === 'unsupported' ||
      availability === 'error') &&
    messages.length === 0;

  const dateSeparator =
    messages.length > 0
      ? formatChatDateSeparator(new Date(messages[messages.length - 1]?.timestamp ?? Date.now()).toISOString())
      : null;

  const mintSurface = themedMintSurface(colors, isDark);

  const renderMessage = useCallback(
    ({ item }: { item: PersistedChatMessage }) => (
      <ChatMessageBubble
        message={item}
        sources={messageSources[item.id] ?? item.sources ?? []}
        sourcesLabel={(count) => t.sourcesCount(count)}
        onSourcesPress={() => setSourcesModal(messageSources[item.id] ?? item.sources ?? [])}
        testID={`chat-msg-${item.id}`}
      />
    ),
    [messageSources, t],
  );

  if (showUnavailable) {
    return (
      <View
        style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.background }]}
        testID="ask-chat-screen"
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ChatTopBar
          onHomePress={() => router.replace('/(worker)')}
          onMenuPress={() => setSidebarOpen(true)}
          onDeviceLabel={t.onDevice}
          mintSurface={mintSurface}
        />
        <ChatModelUnavailable
          reason={
            availability === 'unsupported'
              ? 'unsupported'
              : availability === 'error'
                ? 'error'
                : 'missing'
          }
          message={
            error?.message
              ? sanitizeAssistantErrorMessage(error.message, t.modelUnavailableFallback)
              : null
          }
        />
        <AskNorthCareSidebar visible={sidebarOpen} {...sidebarProps} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      testID="ask-chat-screen"
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ChatTopBar
        onHomePress={() => router.replace('/(worker)')}
        onMenuPress={() => setSidebarOpen(true)}
        onDeviceLabel={t.onDevice}
        mintSurface={mintSurface}
      />

      {isModelLoading ? <ChatModelLoadingBanner waitingToSend={false} /> : null}

      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.emptyState}>
              <NorthCareLogo variant="symbol" size="lg" />
              <AppText variant="headingSmall" style={{ color: colors.primaryDark, fontWeight: '800' }}>
                {t.title}
              </AppText>
              <AppText variant="body" color="secondary" style={styles.emptyBody}>
                {t.chatIntro}
              </AppText>
              <View style={[styles.disclaimerCard, { backgroundColor: mintSurface }]}>
                <AskInfoIcon color={colors.primary} />
                <AppText variant="body" color="secondary" style={styles.disclaimerText}>
                  {t.disclaimer}
                </AppText>
              </View>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              dateSeparator ? (
                <View style={styles.dateSeparatorWrap}>
                  <View style={[styles.dateSeparator, { backgroundColor: semantic.surface.muted }]}>
                    <AppText variant="caption" color="secondary">
                      {dateSeparator}
                    </AppText>
                  </View>
                </View>
              ) : null
            }
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}
        {state === 'generating' ? <ChatTypingIndicator /> : null}
      </View>

      <ChatInput
        onSend={sendMessage}
        disabled={state === 'generating'}
        placeholder={t.chatPlaceholder}
        testID="chat-input"
      />

      <AskNorthCareSidebar visible={sidebarOpen} {...sidebarProps} />

      <Modal visible={sourcesModal.length > 0} transparent animationType="fade" onRequestClose={() => setSourcesModal([])}>
        <View style={styles.sourcesOverlay}>
          <Pressable style={styles.sourcesBackdrop} onPress={() => setSourcesModal([])} />
          <View
            style={[
              styles.sourcesSheet,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <AppText variant="headingSmall" style={{ color: colors.primaryDark }}>
              {t.sources}
            </AppText>
            {sourcesModal.map((source) => (
              <Pressable
                key={source.id}
                accessibilityRole="button"
                onPress={() => {
                  setSourcesModal([]);
                  if (source.articleId) {
                    router.push(`/(worker)/ask/article/${source.articleId}`);
                  }
                }}
                style={[styles.sourceRow, { borderBottomColor: colors.border }]}
              >
                <AppText variant="bodyStrong">{source.title}</AppText>
                {source.referenceLabel ? (
                  <AppText variant="caption" color="secondary">
                    {source.referenceLabel}
                  </AppText>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ChatTopBar({
  onHomePress,
  onMenuPress,
  onDeviceLabel,
  mintSurface,
}: {
  readonly onHomePress: () => void;
  readonly onMenuPress: () => void;
  readonly onDeviceLabel: string;
  readonly mintSurface: string;
}) {
  const t = useTranslation();
  const { colors } = useThemeMode();

  return (
    <View
      style={[
        styles.topBar,
        {
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.topBarLeading}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.workerHome.navHome}
          onPress={onHomePress}
          style={styles.iconButton}
          testID="ask-chat-home"
        >
          <HomeIcon color={colors.primaryDark} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={onMenuPress}
          style={styles.iconButton}
          testID="ask-chat-menu"
        >
          <AskMenuIcon color={colors.primaryDark} />
        </Pressable>
      </View>
      <View style={styles.topBarCenter}>
        <NorthCareLogo variant="stacked" size="sm" />
      </View>
      <View style={styles.topBarTrailing}>
        <View style={[styles.onDevicePill, { backgroundColor: mintSurface }]}>
          <View style={[styles.onDeviceDot, { backgroundColor: colors.success }]} />
          <AppText variant="caption" style={{ color: colors.primaryDark, fontWeight: '600' }}>
            {onDeviceLabel}
          </AppText>
        </View>
        <WorkerThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarLeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  onDevicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  onDeviceDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
  disclaimerCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    lineHeight: 22,
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateSeparator: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  sourcesOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 33, 31, 0.35)',
  },
  sourcesBackdrop: {
    flex: 1,
  },
  sourcesSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.base,
    gap: spacing.sm,
  },
  sourceRow: {
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
