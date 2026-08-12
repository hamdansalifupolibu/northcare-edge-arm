import { sanitizeAssistantErrorMessage } from '../../../../error/mapAssistantUserMessage';
import type { OfflineAiLifecycle } from '../../../offline-ai/services/offlineAiLifecycle';
import { getOfflineAiServices } from '../../../offline-ai/services/createOfflineAiServices';

export type ChatMessage = {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: number;
  readonly generating?: boolean;
};

export type OfflineAiChatState =
  | 'idle'
  | 'loading_model'
  | 'generating'
  | 'error'
  | 'model_unavailable';

export type OfflineAiChatAvailability =
  | 'checking'
  | 'loading'
  | 'ready'
  | 'missing'
  | 'unsupported'
  | 'error';

export type OfflineAiChatError = {
  readonly code: string;
  readonly message: string;
};

const NORTHCARE_SYSTEM_PROMPT =
  'You are NorthCare AI, a health-information assistant for authorised community health workers in Northern Ghana. ' +
  'You ONLY help with community health work topics: maternal and child health, nutrition, danger signs, referrals, ' +
  'facility workflows, immunisation, hygiene, approved NorthCare knowledge packs, and related frontline care guidance. ' +
  'You do NOT answer general knowledge, coding, politics, entertainment, personal advice, or other non-health topics. ' +
  'You provide general health information only. You do not diagnose, prescribe medication, or provide dosage information. ' +
  'If asked about emergencies, advise calling 112. Always state uncertainty honestly. ' +
  'If a question is outside health work scope, politely decline and suggest an approved health topic.';

const SAFETY_BOUNDARY_PATTERNS = [
  /\b(diagnos(e|is|ing)|what disease|what illness|what condition is)\b/i,
  /\b(dosage|dose|mg\b|ml\b|how many tablets|how much medicine)\b/i,
  /\b(prescri(be|ption)|medication|medicine|drug|antibiotic)\b/i,
  /\b(this client|this child|this mother|this baby|for her|for him)\b/i,
] as const;

const OFF_TOPIC_BOUNDARY_PATTERNS = [
  /\b(javascript|typescript|python|programming|write code|debug my code|algorithm)\b/i,
  /\b(politics|election|president|parliament|who should i vote)\b/i,
  /\b(capital of|weather forecast|football score|movie|song lyrics|celebrity)\b/i,
  /\b(tell me a joke|write a poem|who are you really|chatgpt|general knowledge)\b/i,
  /\b(stock market|cryptocurrency|bitcoin|recipe for)\b/i,
] as const;

const HEALTH_TOPIC_HINT_PATTERNS = [
  /\b(health|patient|client|mother|child|baby|pregnan|nutrition|referral|danger sign|immuni|vaccin|malaria|diarrh|dehydrat|breastfeed|antenatal|postnatal|facility|clinic|midwife|nurse|ghs|northcare)\b/i,
] as const;

const SAFETY_REFUSAL_MESSAGE =
  'I cannot provide diagnosis, prescriptions, dosage information, or patient-specific advice. Please consult the authorised clinical supervisor or use the approved NorthCare screening workflows.';

const OFF_TOPIC_REFUSAL_MESSAGE =
  'NorthCare AI is limited to community health worker topics on this device — for example maternal and child health, nutrition, danger signs, referrals, and approved facility workflows. Please ask a health-related question or choose an approved topic from the menu.';

const EMERGENCY_PATTERN =
  /\b(emergency|urgent|immediately|unconscious|not breathing|severe bleeding|convulsion)\b/i;

const EMERGENCY_RESPONSE =
  'This sounds urgent. Please call 112 immediately and follow your approved urgent-assessment and referral procedures. Do not wait for this assistant.';

const MODEL_MISSING_MESSAGE =
  'The offline AI model is not installed on this device yet. Open Offline AI (development) to install or import the model, then return here to chat.';

const MODEL_UNAVAILABLE_MESSAGE =
  'The offline AI model could not be loaded. If it is installed, try again shortly. Otherwise open Offline AI (development) to provision the model.';

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function checkSafetyBoundary(text: string): string | null {
  if (EMERGENCY_PATTERN.test(text)) {
    return EMERGENCY_RESPONSE;
  }
  for (const pattern of SAFETY_BOUNDARY_PATTERNS) {
    if (pattern.test(text)) {
      return SAFETY_REFUSAL_MESSAGE;
    }
  }
  return null;
}

function checkOffTopicBoundary(text: string): string | null {
  const hasHealthHint = HEALTH_TOPIC_HINT_PATTERNS.some((pattern) => pattern.test(text));
  if (hasHealthHint) {
    return null;
  }
  for (const pattern of OFF_TOPIC_BOUNDARY_PATTERNS) {
    if (pattern.test(text)) {
      return OFF_TOPIC_REFUSAL_MESSAGE;
    }
  }
  return null;
}

export type OfflineAiChatProvider = {
  readonly getState: () => OfflineAiChatState;
  readonly getAvailability: () => OfflineAiChatAvailability;
  readonly getMessages: () => readonly ChatMessage[];
  readonly isModelAvailable: () => boolean;
  readonly prepareModel: () => Promise<OfflineAiChatAvailability>;
  readonly sendMessage: (
    text: string,
    onToken?: (partial: string) => void,
  ) => Promise<ChatMessage>;
  readonly cancelGeneration: () => Promise<void>;
  readonly clearMessages: () => void;
  readonly replaceMessages: (messages: readonly ChatMessage[]) => void;
  readonly getLastError: () => OfflineAiChatError | null;
};

export function createOfflineAiChatProvider(): OfflineAiChatProvider {
  let lifecycle: OfflineAiLifecycle;
  try {
    lifecycle = getOfflineAiServices();
  } catch {
    return createUnavailableProvider();
  }

  let state: OfflineAiChatState = 'idle';
  let availability: OfflineAiChatAvailability = 'checking';
  let messages: ChatMessage[] = [];
  let lastError: OfflineAiChatError | null = null;
  let generating = false;
  let prepareStarted = false;
  let preparePromise: Promise<OfflineAiChatAvailability> | null = null;
  let sendQueue: Promise<void> = Promise.resolve();

  function syncAvailabilityFromSnapshot(): OfflineAiChatAvailability {
    const snapshot = lifecycle.getSnapshot();
    if (snapshot.state === 'loaded' || snapshot.state === 'generating') {
      availability = 'ready';
      if (state === 'loading_model' || state === 'model_unavailable') {
        state = 'idle';
      }
      return availability;
    }
    // Until prepareModel runs, keep UI in "checking" so missing-disk default does not flash.
    if (!prepareStarted) {
      availability = 'checking';
      return availability;
    }
    if (snapshot.state === 'loading') {
      availability = 'loading';
      state = 'loading_model';
      return availability;
    }
    if (snapshot.state === 'missing') {
      availability = 'missing';
      state = 'model_unavailable';
      return availability;
    }
    if (snapshot.state === 'unsupported') {
      availability = 'unsupported';
      state = 'model_unavailable';
      return availability;
    }
    if (snapshot.state === 'error') {
      availability = 'error';
      state = 'error';
      return availability;
    }
    if (snapshot.state === 'ready') {
      availability = 'loading';
      return availability;
    }
    return availability;
  }

  function isModelAvailable(): boolean {
    syncAvailabilityFromSnapshot();
    return availability === 'ready';
  }

  function getState(): OfflineAiChatState {
    syncAvailabilityFromSnapshot();
    if (generating) {
      return 'generating';
    }
    return state;
  }

  function getAvailability(): OfflineAiChatAvailability {
    syncAvailabilityFromSnapshot();
    return availability;
  }

  async function prepareModel(): Promise<OfflineAiChatAvailability> {
    if (preparePromise) {
      return preparePromise;
    }

    prepareStarted = true;
    preparePromise = (async () => {
      availability = 'loading';
      state = 'loading_model';
      lastError = null;
      const result = await lifecycle.ensureModelLoaded();
      if (result.ok) {
        availability = 'ready';
        state = 'idle';
        return availability;
      }
      if (result.state === 'missing') {
        availability = 'missing';
        state = 'model_unavailable';
        lastError = {
          code: result.error?.code ?? 'MODEL_MISSING',
          message: sanitizeAssistantErrorMessage(result.error?.message, MODEL_MISSING_MESSAGE),
        };
        return availability;
      }
      if (result.state === 'unsupported') {
        availability = 'unsupported';
        state = 'model_unavailable';
        lastError = {
          code: result.error?.code ?? 'RUNTIME_UNSUPPORTED',
          message: sanitizeAssistantErrorMessage(
            result.error?.message,
            'Offline AI is not supported on this device. A development build with the native runtime is required.',
          ),
        };
        return availability;
      }
      availability = 'error';
      state = 'error';
      lastError = {
        code: result.error?.code ?? 'LOAD_FAILED',
        message: sanitizeAssistantErrorMessage(result.error?.message, MODEL_UNAVAILABLE_MESSAGE),
      };
      return availability;
    })();

    try {
      return await preparePromise;
    } finally {
      preparePromise = null;
    }
  }

  function buildContextMessages(): { role: 'system' | 'user' | 'assistant'; content: string }[] {
    const contextMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: NORTHCARE_SYSTEM_PROMPT },
    ];

    const recentMessages = messages
      .filter((m) => m.role !== 'system' && !m.generating)
      .slice(-6);

    for (const msg of recentMessages) {
      contextMessages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    return contextMessages;
  }

  async function sendMessageNow(trimmed: string): Promise<ChatMessage> {
    const safetyResponse = checkSafetyBoundary(trimmed);
    if (safetyResponse) {
      const boundaryMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: safetyResponse,
        timestamp: Date.now(),
      };
      messages = [...messages, boundaryMessage];
      state = 'idle';
      return boundaryMessage;
    }

    const offTopicResponse = checkOffTopicBoundary(trimmed);
    if (offTopicResponse) {
      const boundaryMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: offTopicResponse,
        timestamp: Date.now(),
      };
      messages = [...messages, boundaryMessage];
      state = 'idle';
      return boundaryMessage;
    }

    const ready = await prepareModel();
    if (ready !== 'ready') {
      const content =
        ready === 'missing'
          ? MODEL_MISSING_MESSAGE
          : ready === 'unsupported'
            ? (lastError?.message ?? MODEL_UNAVAILABLE_MESSAGE)
            : MODEL_UNAVAILABLE_MESSAGE;
      const unavailableMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };
      messages = [...messages, unavailableMessage];
      state = 'model_unavailable';
      return unavailableMessage;
    }

    generating = true;
    state = 'generating';
    lastError = null;

    try {
      const contextMessages = buildContextMessages();

      const result = await lifecycle.generate({
        systemPrompt: NORTHCARE_SYSTEM_PROMPT,
        userPrompt:
          contextMessages.length > 2
            ? contextMessages
                .slice(1)
                .map((m) => `${m.role}: ${m.content}`)
                .join('\n') + `\nuser: ${trimmed}`
            : trimmed,
        expectPhrase: '',
      });

      const responseText =
        result.text.trim() ||
        'I was not able to generate a response. Please try rephrasing your question.';

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };
      messages = [...messages, assistantMessage];
      state = 'idle';
      return assistantMessage;
    } catch (error) {
      state = 'error';
      const errorObj = error as { code?: string; message?: string };
      if (errorObj.code === 'GENERATION_CANCELLED') {
        lastError = { code: 'CANCELLED', message: 'Generation was cancelled.' };
        const cancelledMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Response generation was cancelled.',
          timestamp: Date.now(),
        };
        messages = [...messages, cancelledMessage];
        state = 'idle';
        return cancelledMessage;
      }
      lastError = {
        code: errorObj.code ?? 'GENERATION_ERROR',
        message: errorObj.message ?? 'An error occurred while generating a response.',
      };
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating a response. Please try again.',
        timestamp: Date.now(),
      };
      messages = [...messages, errorMessage];
      state = 'idle';
      return errorMessage;
    } finally {
      generating = false;
    }
  }

  async function sendMessage(
    text: string,
    _onToken?: (partial: string) => void,
  ): Promise<ChatMessage> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Empty message');
    }

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    messages = [...messages, userMessage];

    // Queue sends so a question typed during model load waits, then runs when ready.
    const run = sendQueue.then(() => sendMessageNow(trimmed));
    sendQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function cancelGeneration(): Promise<void> {
    if (generating) {
      await lifecycle.cancelGeneration();
    }
  }

  function clearMessages(): void {
    messages = [];
    lastError = null;
    state = isModelAvailable() ? 'idle' : 'model_unavailable';
  }

  function replaceMessages(nextMessages: readonly ChatMessage[]): void {
    messages = nextMessages.map((message) => ({ ...message }));
    lastError = null;
    state = isModelAvailable() ? 'idle' : state;
  }

  return {
    getState,
    getAvailability,
    getMessages: () => messages,
    isModelAvailable,
    prepareModel,
    sendMessage,
    cancelGeneration,
    clearMessages,
    replaceMessages,
    getLastError: () => lastError,
  };
}

function createUnavailableProvider(): OfflineAiChatProvider {
  return {
    getState: () => 'model_unavailable',
    getAvailability: () => 'unsupported',
    getMessages: () => [],
    isModelAvailable: () => false,
    prepareModel: async () => 'unsupported',
    sendMessage: async () => {
      const response: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: MODEL_MISSING_MESSAGE,
        timestamp: Date.now(),
      };
      return response;
    },
    cancelGeneration: async () => undefined,
    clearMessages: () => undefined,
    replaceMessages: () => undefined,
    getLastError: () => ({ code: 'UNAVAILABLE', message: 'Offline AI runtime unavailable' }),
  };
}
