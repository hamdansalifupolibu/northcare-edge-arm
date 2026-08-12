import type { OfflineAiLlamaContext, OfflineAiLlamaRuntime } from '../domain/types';

type LlamaRnModule = {
  initLlama: (params: Record<string, unknown>) => Promise<{
    completion: (
      params: Record<string, unknown>,
    ) => Promise<{
      text: string;
      timings?: {
        predicted_n?: number;
        predicted_per_second?: number;
        predicted_ms?: number;
      };
    }>;
    stopCompletion?: () => Promise<void> | void;
    release?: () => Promise<void> | void;
  }>;
};

function tryRequireLlamaRn(): LlamaRnModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('llama.rn') as LlamaRnModule;
  } catch {
    return null;
  }
}

export function createLlamaRnRuntime(): OfflineAiLlamaRuntime {
  return {
    isNativeModuleAvailable() {
      const mod = tryRequireLlamaRn();
      return Boolean(mod && typeof mod.initLlama === 'function');
    },

    async init(options) {
      const mod = tryRequireLlamaRn();
      if (!mod || typeof mod.initLlama !== 'function') {
        throw new Error('llama.rn native module unavailable');
      }

      // llama.rn normalizes file:// URIs; keep the Expo File URI as-is.
      const context = await mod.initLlama({
        model: options.modelPath,
        n_ctx: options.n_ctx,
        n_threads: options.n_threads,
        n_gpu_layers: options.n_gpu_layers,
        use_mlock: false,
      });

      const wrapped: OfflineAiLlamaContext = {
        async completion(params) {
          return context.completion({
            messages: [...params.messages],
            n_predict: params.n_predict,
            temperature: params.temperature,
            stop: params.stop ?? [
              '</s>',
              '<|end|>',
              '<|eot_id|>',
              '<|end_of_text|>',
              '<|im_end|>',
              '<|EOT|>',
              '<|END_OF_TURN_TOKEN|>',
              '<|end_of_turn|>',
              '<|endoftext|>',
            ],
          });
        },
        async stopCompletion() {
          if (typeof context.stopCompletion === 'function') {
            await context.stopCompletion();
          }
        },
        async release() {
          if (typeof context.release === 'function') {
            await context.release();
          }
        },
      };

      return wrapped;
    },
  };
}
