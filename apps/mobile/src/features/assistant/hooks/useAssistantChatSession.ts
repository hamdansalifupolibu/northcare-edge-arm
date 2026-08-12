import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { AssistantConversationSummary } from '../../../data/repositories/contracts/assistantConversationTypes';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import {
  createOfflineAiChatProvider,
  type ChatMessage,
  type OfflineAiChatAvailability,
  type OfflineAiChatProvider,
  type OfflineAiChatState,
} from '../providers/offlineAi/offlineAiChatProvider';
import type { AssistantMessageSourceRecord } from '../application/createAssistantConversationServices';
import { useAssistantConversationServices } from './useAssistantConversationServices';

export type PersistedChatMessage = ChatMessage & {
  readonly sources?: readonly AssistantMessageSourceRecord[];
};

type UseAssistantChatSessionReturn = {
  readonly conversations: readonly AssistantConversationSummary[];
  readonly activeConversationId: EntityId | null;
  readonly messages: readonly PersistedChatMessage[];
  readonly messageSources: Readonly<Record<string, readonly AssistantMessageSourceRecord[]>>;
  readonly state: OfflineAiChatState;
  readonly availability: OfflineAiChatAvailability;
  readonly isModelAvailable: boolean;
  readonly isModelLoading: boolean;
  readonly loadingConversations: boolean;
  readonly sendMessage: (text: string) => void;
  readonly startNewConversation: () => void;
  readonly selectConversation: (conversationId: EntityId) => void;
  readonly clearAllHistory: (title: string, message: string, confirmLabel: string, cancelLabel: string) => void;
  readonly deleteConversation: (
    conversationId: EntityId,
    title: string,
    message: string,
    confirmLabel: string,
    cancelLabel: string,
  ) => void;
  readonly refreshConversations: () => Promise<void>;
  readonly error: { code: string; message: string } | null;
};

function toChatMessage(record: {
  readonly id: EntityId;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly createdAt: string;
}): ChatMessage {
  return {
    id: record.id,
    role: record.role,
    content: record.content,
    timestamp: Date.parse(record.createdAt),
  };
}

export function useAssistantChatSession(): UseAssistantChatSessionReturn {
  const { session } = useAuthSession();
  const conversationServices = useAssistantConversationServices();
  const providerRef = useRef<OfflineAiChatProvider | null>(null);
  const activeConversationIdRef = useRef<EntityId | null>(null);
  const lastUserQuestionRef = useRef<string>('');

  const [conversations, setConversations] = useState<readonly AssistantConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<EntityId | null>(null);
  const [messages, setMessages] = useState<readonly PersistedChatMessage[]>([]);
  const [messageSources, setMessageSources] = useState<
    Readonly<Record<string, readonly AssistantMessageSourceRecord[]>>
  >({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [state, setState] = useState<OfflineAiChatState>('idle');
  const [availability, setAvailability] = useState<OfflineAiChatAvailability>('checking');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [modelAvailable, setModelAvailable] = useState(false);

  activeConversationIdRef.current = activeConversationId;

  const applyProviderSnapshot = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) {
      return;
    }
    setState(provider.getState());
    setAvailability(provider.getAvailability());
    setModelAvailable(provider.isModelAvailable());
    setError(provider.getLastError());
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!conversationServices || !session?.accountId) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }
    setLoadingConversations(true);
    try {
      const rows = await conversationServices.listConversations(session.accountId);
      setConversations(rows);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [conversationServices, session?.accountId]);

  const loadConversation = useCallback(
    async (conversationId: EntityId) => {
      if (!conversationServices || !providerRef.current) {
        return;
      }
      let detail;
      try {
        detail = await conversationServices.getConversation(conversationId);
      } catch {
        return;
      }
      if (!detail) {
        return;
      }
      const nextMessages = detail.messages.map((message) => ({
        ...toChatMessage(message),
        sources: message.sources,
      }));
      const nextSources: Record<string, readonly AssistantMessageSourceRecord[]> = {};
      for (const message of detail.messages) {
        if (message.sources.length > 0) {
          nextSources[message.id] = message.sources;
        }
      }
      providerRef.current.replaceMessages(nextMessages);
      setMessages(nextMessages);
      setMessageSources(nextSources);
      setActiveConversationId(conversationId);
      applyProviderSnapshot();
    },
    [applyProviderSnapshot, conversationServices],
  );

  useEffect(() => {
    if (!providerRef.current) {
      providerRef.current = createOfflineAiChatProvider();
    }
    applyProviderSnapshot();
    void providerRef.current.prepareModel().then(() => {
      applyProviderSnapshot();
    });
    void refreshConversations();
  }, [applyProviderSnapshot, refreshConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      applyProviderSnapshot();
    }, availability === 'loading' || availability === 'checking' ? 400 : 2000);
    return () => clearInterval(interval);
  }, [applyProviderSnapshot, availability]);

  const startNewConversation = useCallback(() => {
    providerRef.current?.clearMessages();
    setActiveConversationId(null);
    setMessages([]);
    setMessageSources({});
    applyProviderSnapshot();
  }, [applyProviderSnapshot]);

  const selectConversation = useCallback(
    (conversationId: EntityId) => {
      void loadConversation(conversationId);
    },
    [loadConversation],
  );

  const clearAllHistory = useCallback(
    (title: string, message: string, confirmLabel: string, cancelLabel: string) => {
      Alert.alert(title, message, [
        { text: cancelLabel, style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => {
            if (!conversationServices || !session?.accountId) {
              return;
            }
            void conversationServices.clearAllConversations(session.accountId).then(() => {
              startNewConversation();
              void refreshConversations();
            });
          },
        },
      ]);
    },
    [conversationServices, refreshConversations, session?.accountId, startNewConversation],
  );

  const deleteConversation = useCallback(
    (
      conversationId: EntityId,
      title: string,
      message: string,
      confirmLabel: string,
      cancelLabel: string,
    ) => {
      Alert.alert(title, message, [
        { text: cancelLabel, style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => {
            if (!conversationServices) {
              return;
            }
            void conversationServices.deleteConversation(conversationId).then(() => {
              if (activeConversationIdRef.current === conversationId) {
                startNewConversation();
              }
              void refreshConversations();
            });
          },
        },
      ]);
    },
    [conversationServices, refreshConversations, startNewConversation],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const provider = providerRef.current;
      if (!provider || !conversationServices || !session?.accountId) {
        return;
      }

      lastUserQuestionRef.current = text;
      const sendPromise = provider.sendMessage(text);
      setMessages([...provider.getMessages()]);
      applyProviderSnapshot();

      void (async () => {
        try {
          let conversationId = activeConversationIdRef.current;
          if (!conversationId) {
            const created = await conversationServices.createConversation({
              accountId: session.accountId,
              firstMessage: text,
            });
            conversationId = created.id;
            setActiveConversationId(created.id);
          }

          const detail = await conversationServices.getConversation(conversationId);
          const existingCount = detail?.messages.length ?? 0;

          await sendPromise;
          setMessages([...provider.getMessages()]);

          const providerMessages = provider.getMessages().slice(existingCount);
          for (let index = 0; index < providerMessages.length; index += 1) {
            const message = providerMessages[index];
            if (!message || message.role === 'system') {
              continue;
            }
            await conversationServices.appendMessage({
              conversationId,
              role: message.role,
              content: message.content,
              sortOrder: existingCount + index,
              questionForSources:
                message.role === 'assistant' ? lastUserQuestionRef.current : undefined,
            });
          }

          if (existingCount === 0) {
            await conversationServices.updateConversationTitle({
              conversationId,
              firstUserMessage: lastUserQuestionRef.current,
            });
          }

          await loadConversation(conversationId);
          await refreshConversations();
        } catch {
          applyProviderSnapshot();
        }
      })();
    },
    [
      applyProviderSnapshot,
      conversationServices,
      loadConversation,
      refreshConversations,
      session?.accountId,
    ],
  );

  const isModelLoading = useMemo(
    () =>
      availability === 'loading' ||
      availability === 'checking' ||
      state === 'loading_model',
    [availability, state],
  );

  return {
    conversations,
    activeConversationId,
    messages,
    messageSources,
    state,
    availability,
    isModelAvailable: modelAvailable,
    isModelLoading,
    loadingConversations,
    sendMessage,
    startNewConversation,
    selectConversation,
    clearAllHistory,
    deleteConversation,
    refreshConversations,
    error,
  };
}
