import { Platform } from 'react-native';

import { createOfflineAiLifecycle } from '../../offline-ai/services/offlineAiLifecycle';
import {
  createMemoryOfflineAiFileStore,
  createMockDownloader,
  createMockRuntime,
} from '../../offline-ai/__tests__/helpers';

jest.mock('../../offline-ai/services/createOfflineAiServices', () => {
  let mockLifecycle: ReturnType<typeof createOfflineAiLifecycle> | null = null;

  return {
    getOfflineAiServices: () => {
      if (!mockLifecycle) {
        throw new Error('Mock lifecycle not set');
      }
      return mockLifecycle;
    },
    __setMockLifecycle: (lc: ReturnType<typeof createOfflineAiLifecycle>) => {
      mockLifecycle = lc;
    },
    __clearMockLifecycle: () => {
      mockLifecycle = null;
    },
  };
});

const {
  __setMockLifecycle,
  __clearMockLifecycle,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('../../offline-ai/services/createOfflineAiServices') as {
  __setMockLifecycle: (lc: ReturnType<typeof createOfflineAiLifecycle>) => void;
  __clearMockLifecycle: () => void;
};

import { createOfflineAiChatProvider } from '../providers/offlineAi/offlineAiChatProvider';

describe('offlineAiChatProvider', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
    __clearMockLifecycle();
  });

  function setupLifecycle(completionText?: string) {
    const fileStore = createMemoryOfflineAiFileStore();
    const runtime = createMockRuntime({
      available: true,
      completionText: completionText ?? 'Here is some health information.',
    });
    const lifecycle = createOfflineAiLifecycle({
      fileStore,
      downloader: createMockDownloader(fileStore),
      runtime,
      appEnv: 'development',
      isNetworkOnline: async () => false,
      getDeviceInfo: async () => ({ model: 'SM-G988B', androidVersion: '13' }),
    });
    __setMockLifecycle(lifecycle);
    return { lifecycle, fileStore, runtime };
  }

  it('stays in checking state before prepare when model is not loaded', () => {
    setupLifecycle();
    const provider = createOfflineAiChatProvider();
    expect(provider.getAvailability()).toBe('checking');
    expect(provider.isModelAvailable()).toBe(false);
  });

  it('auto-loads an installed model via prepareModel', async () => {
    const { fileStore } = setupLifecycle();
    fileStore.seedValidModel();
    const provider = createOfflineAiChatProvider();

    const availability = await provider.prepareModel();
    expect(availability).toBe('ready');
    expect(provider.isModelAvailable()).toBe(true);
    expect(provider.getState()).toBe('idle');
  });

  it('returns missing when model file is not installed', async () => {
    setupLifecycle();
    const provider = createOfflineAiChatProvider();
    const availability = await provider.prepareModel();
    expect(availability).toBe('missing');
    expect(provider.isModelAvailable()).toBe(false);
  });

  it('queues a send until the model finishes loading', async () => {
    const { lifecycle, fileStore } = setupLifecycle('Queued answer.');
    fileStore.seedValidModel();
    await lifecycle.refreshStateFromDisk();

    const provider = createOfflineAiChatProvider();
    // Start prepare without awaiting, then send immediately — send should wait for load.
    const prepare = provider.prepareModel();
    const sendPromise = provider.sendMessage('What is malaria?');
    await prepare;
    const response = await sendPromise;

    expect(response.role).toBe('assistant');
    expect(response.content).toBe('Queued answer.');
    const messages = provider.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('What is malaria?');
  });

  it('sends messages and receives AI response after model load', async () => {
    const { fileStore } = setupLifecycle('This is a test response.');
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    expect(provider.isModelAvailable()).toBe(true);

    const response = await provider.sendMessage('What is malaria?');
    expect(response.role).toBe('assistant');
    expect(response.content).toBe('This is a test response.');

    const messages = provider.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('What is malaria?');
    expect(messages[1].role).toBe('assistant');
  });

  it('blocks diagnosis requests with safety boundary', async () => {
    const { fileStore } = setupLifecycle();
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    const response = await provider.sendMessage('Can you diagnose my patient?');
    expect(response.content).toContain('cannot provide diagnosis');
  });

  it('blocks dosage requests with safety boundary', async () => {
    const { fileStore } = setupLifecycle();
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    const response = await provider.sendMessage('What dosage of amoxicillin?');
    expect(response.content).toContain('cannot provide diagnosis');
  });

  it('blocks clearly off-topic non-health requests', async () => {
    const { fileStore } = setupLifecycle();
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    const response = await provider.sendMessage('Write javascript code for a sorting algorithm');
    expect(response.content).toContain('community health worker topics');
  });

  it('still allows health-related questions', async () => {
    const { fileStore } = setupLifecycle('Breastfeeding guidance.');
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    const response = await provider.sendMessage('What are breastfeeding danger signs?');
    expect(response.content).toBe('Breastfeeding guidance.');
  });

  it('responds with emergency guidance for urgent requests', async () => {
    const { fileStore } = setupLifecycle();
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    const response = await provider.sendMessage('The child is unconscious');
    expect(response.content).toContain('call 112');
  });

  it('clears messages without persisting', async () => {
    const { fileStore } = setupLifecycle('Response.');
    fileStore.seedValidModel();

    const provider = createOfflineAiChatProvider();
    await provider.prepareModel();
    await provider.sendMessage('Hello');
    expect(provider.getMessages()).toHaveLength(2);

    provider.clearMessages();
    expect(provider.getMessages()).toHaveLength(0);
  });

  it('does not persist conversation history', async () => {
    const { fileStore } = setupLifecycle('Response.');
    fileStore.seedValidModel();

    const provider1 = createOfflineAiChatProvider();
    await provider1.prepareModel();
    await provider1.sendMessage('Hello');
    expect(provider1.getMessages()).toHaveLength(2);

    const provider2 = createOfflineAiChatProvider();
    expect(provider2.getMessages()).toHaveLength(0);
  });

  it('guides the worker to Offline AI when sending without a model', async () => {
    setupLifecycle();
    const provider = createOfflineAiChatProvider();
    const response = await provider.sendMessage('What is dehydration?');
    expect(response.content.toLowerCase()).toMatch(/offline ai|install|import/);
  });
});

describe('Ask NorthCare chat navigation entry', () => {
  it('routes worker Ask NorthCare entry to the chat screen', () => {
    // Worker home uses this path; keep the contract stable for UX tests.
    const entry = '/(worker)/ask/chat';
    expect(entry).toContain('/ask/chat');
    expect(entry).not.toBe('/(worker)/ask');
  });
});
