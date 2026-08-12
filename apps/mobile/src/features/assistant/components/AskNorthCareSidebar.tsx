import type { ReactNode } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import type { AssistantConversationSummary } from '../../../data/repositories/contracts/assistantConversationTypes';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import { colors, radii, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { formatConversationTimestamp } from '../domain/conversationPresentation';
import {
  AskLockFooterIcon,
  AskPlusIcon,
  AskSettingsIcon,
  AskTopicChildIcon,
  AskTopicGeneralIcon,
  AskTopicNutritionIcon,
  AskTopicPregnancyIcon,
  AskTopicReferralIcon,
  AskTrashIcon,
} from './AskNorthCareChatIcons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = Math.min(280, Math.round(SCREEN_WIDTH * 0.72));

function topicIcon(icon: AssistantConversationSummary['topicIcon']): ReactNode {
  switch (icon) {
    case 'pregnancy':
      return <AskTopicPregnancyIcon />;
    case 'child':
      return <AskTopicChildIcon />;
    case 'referral':
      return <AskTopicReferralIcon />;
    case 'nutrition':
      return <AskTopicNutritionIcon />;
    default:
      return <AskTopicGeneralIcon />;
  }
}

type Props = {
  readonly visible: boolean;
  readonly conversations: readonly AssistantConversationSummary[];
  readonly activeConversationId: EntityId | null;
  readonly onClose: () => void;
  readonly onNewConversation: () => void;
  readonly onSelectConversation: (conversationId: EntityId) => void;
  readonly onDeleteConversation: (conversationId: EntityId) => void;
  readonly onClearHistory: () => void;
  readonly labels: {
    readonly tagline: string;
    readonly onDevice: string;
    readonly newConversation: string;
    readonly recentChats: string;
    readonly clearHistory: string;
    readonly deleteConversationAccessibility: string;
    readonly storedTitle: string;
    readonly storedBody: string;
  };
};

export function AskNorthCareSidebar({
  visible,
  conversations,
  activeConversationId,
  onClose,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onClearHistory,
  labels,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(colors, isDark);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              width: SIDEBAR_WIDTH,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: insets.bottom + spacing.sm,
              backgroundColor: colors.surface,
              borderRightColor: colors.border,
              shadowColor: colors.textPrimary,
            },
          ]}
          testID="ask-northcare-sidebar"
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.brandRow}>
              <NorthCareLogo variant="stacked" size="sm" />
              <View style={styles.brandCopy}>
                <AppText variant="headingSmall" style={{ color: colors.primaryDark, fontWeight: '800' }}>
                  NorthCare <AppText style={{ color: colors.accent, fontWeight: '800' }}>AI</AppText>
                </AppText>
                <AppText variant="caption" color="secondary">
                  {labels.tagline}
                </AppText>
                <View style={styles.onDeviceRow}>
                  <View style={[styles.onDeviceDot, { backgroundColor: colors.success }]} />
                  <AppText variant="caption" color="secondary">
                    {labels.onDevice}
                  </AppText>
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onNewConversation();
                onClose();
              }}
              style={({ pressed }) => [
                styles.newConversationButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}
              testID="ask-new-conversation"
            >
              <AskPlusIcon color={colors.textInverse} />
              <AppText variant="button" style={styles.newConversationLabel}>
                {labels.newConversation}
              </AppText>
            </Pressable>

            <AppText variant="caption" color="secondary" style={styles.recentHeading}>
              {labels.recentChats}
            </AppText>

            <View style={styles.conversationList}>
              {conversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                return (
                  <Pressable
                    key={conversation.id}
                    accessibilityRole="button"
                    onPress={() => {
                      onSelectConversation(conversation.id);
                      onClose();
                    }}
                    style={[
                      styles.conversationItem,
                      active ? { backgroundColor: mintSurface } : null,
                    ]}
                    testID={`ask-conversation-${conversation.id}`}
                  >
                    <View style={[styles.conversationIconWrap, { backgroundColor: mintSurface }]}>
                      {topicIcon(conversation.topicIcon)}
                    </View>
                    <View style={styles.conversationCopy}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {conversation.title}
                      </AppText>
                      <AppText variant="caption" color="secondary" numberOfLines={1}>
                        {formatConversationTimestamp(conversation.updatedAt)}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={labels.deleteConversationAccessibility}
                      onPress={() => onDeleteConversation(conversation.id)}
                      style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}
                      testID={`ask-delete-conversation-${conversation.id}`}
                    >
                      <AskTrashIcon />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClearHistory}
              style={styles.clearHistoryRow}
              testID="ask-clear-history"
            >
              <AskSettingsIcon />
              <AppText variant="body" color="secondary">
                {labels.clearHistory}
              </AppText>
            </Pressable>

            <View style={[styles.storageCard, { backgroundColor: mintSurface }]}>
              <AskLockFooterIcon color={colors.primary} />
              <View style={styles.storageCopy}>
                <AppText variant="bodyStrong" style={{ color: colors.primaryDark }}>
                  {labels.storedTitle}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {labels.storedBody}
                </AppText>
              </View>
            </View>
          </ScrollView>
        </View>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Close menu"
          accessibilityRole="button"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 33, 31, 0.35)',
  },
  panel: {
    borderRightWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 8,
    zIndex: 2,
  },
  scroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  onDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  onDeviceDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.button,
    minHeight: 48,
    paddingHorizontal: spacing.base,
  },
  newConversationLabel: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  recentHeading: {
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  conversationList: {
    gap: spacing.xs,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  conversationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  storageCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  storageCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
