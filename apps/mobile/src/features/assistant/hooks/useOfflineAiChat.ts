import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createOfflineAiChatProvider,
  type ChatMessage,
  type OfflineAiChatAvailability,
  type OfflineAiChatProvider,
  type OfflineAiChatState,
} from '../providers/offlineAi/offlineAiChatProvider';

export type UseOfflineAiChatReturn = {
  readonly messages: readonly ChatMessage[];
  readonly state: OfflineAiChatState;
  readonly availability: OfflineAiChatAvailability;
  readonly isModelAvailable: boolean;
  readonly isModelLoading: boolean;
  readonly sendMessage: (text: string) => void;
  readonly cancelGeneration: () => void;
  readonly clearMessages: () => void;
  readonly error: { code: string; message: string } | null;
};

function refreshFromProvider(
  provider: OfflineAiChatProvider,
  mounted: boolean,
  setters: {
    setMessages: (msgs: readonly ChatMessage[]) => void;
    setState: (s: OfflineAiChatState) => void;
    setAvailability: (a: OfflineAiChatAvailability) => void;
    setModelAvailable: (v: boolean) => void;
    setError: (e: { code: string; message: string } | null) => void;
  },
): void {
  if (!mounted) return;
  setters.setMessages([...provider.getMessages()]);
  setters.setState(provider.getState());
  setters.setAvailability(provider.getAvailability());
  setters.setModelAvailable(provider.isModelAvailable());
  setters.setError(provider.getLastError());
}

export function useOfflineAiChat(): UseOfflineAiChatReturn {
  const providerRef = useRef<OfflineAiChatProvider | null>(null);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [state, setState] = useState<OfflineAiChatState>('idle');
  const [availability, setAvailability] = useState<OfflineAiChatAvailability>('checking');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [modelAvailable, setModelAvailable] = useState(false);
  const mountedRef = useRef(true);

  const applySnapshot = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    refreshFromProvider(provider, mountedRef.current, {
      setMessages,
      setState,
      setAvailability,
      setModelAvailable,
      setError,
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!providerRef.current) {
      providerRef.current = createOfflineAiChatProvider();
    }
    applySnapshot();

    // Auto-load installed model when chat opens (async — keeps UI responsive).
    void providerRef.current.prepareModel().then(() => {
      applySnapshot();
    });

    return () => {
      mountedRef.current = false;
    };
  }, [applySnapshot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (providerRef.current && mountedRef.current) {
        applySnapshot();
      }
    }, availability === 'loading' || availability === 'checking' ? 400 : 2000);
    return () => clearInterval(interval);
  }, [applySnapshot, availability]);

  const sendMessage = useCallback(
    (text: string) => {
      const provider = providerRef.current;
      if (!provider) return;

      void provider.sendMessage(text).then(() => {
        applySnapshot();
      });
      // User bubble is appended synchronously inside sendMessage.
      applySnapshot();
    },
    [applySnapshot],
  );

  const cancelGeneration = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    void provider.cancelGeneration();
  }, []);

  const clearMessages = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    provider.clearMessages();
    setMessages([]);
    setState(provider.getState());
    setAvailability(provider.getAvailability());
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (providerRef.current) {
        void providerRef.current.cancelGeneration();
      }
    };
  }, []);

  const isModelLoading =
    availability === 'loading' ||
    availability === 'checking' ||
    state === 'loading_model';

  return {
    messages,
    state,
    availability,
    isModelAvailable: modelAvailable,
    isModelLoading,
    sendMessage,
    cancelGeneration,
    clearMessages,
    error,
  };
}
