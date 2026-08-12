export type OfflineAiLifecycleState =
  | 'unsupported'
  | 'missing'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'loading'
  | 'loaded'
  | 'generating'
  | 'releasing'
  | 'error';

export type OfflineAiModelManifest = {
  readonly modelId: string;
  readonly displayName: string;
  readonly repository: string;
  readonly repositoryRevision: string;
  readonly filename: string;
  readonly format: 'GGUF';
  readonly quantisation: string;
  readonly actualByteSize: number;
  readonly sha256: string;
  readonly licence: string;
  readonly intendedPurpose: string;
  readonly maximumSupportedModelSize: number;
  readonly configuredContextSize: number;
  readonly configuredMaximumOutputTokens: number;
  readonly runtime: string;
  readonly installationMode: string;
  readonly verifiedAt: string;
  readonly downloadUrl: string;
  readonly checksumSource: string;
  readonly notes: readonly string[];
};

export type OfflineAiErrorCode =
  | 'RUNTIME_UNSUPPORTED'
  | 'NATIVE_MODULE_UNAVAILABLE'
  | 'MODEL_MISSING'
  | 'PARTIAL_MODEL'
  | 'CHECKSUM_MISMATCH'
  | 'SIZE_MISMATCH'
  | 'MODEL_TOO_LARGE'
  | 'INSUFFICIENT_STORAGE'
  | 'DOWNLOAD_FAILED'
  | 'DOWNLOAD_CANCELLED'
  | 'PROVISION_NOT_ALLOWED'
  | 'LOAD_FAILED'
  | 'UNSUPPORTED_GGUF'
  | 'MEMORY_ALLOCATION_FAILED'
  | 'GENERATION_FAILED'
  | 'GENERATION_CANCELLED'
  | 'GENERATION_BEFORE_LOAD'
  | 'DUPLICATE_DOWNLOAD'
  | 'DUPLICATE_LOAD'
  | 'DUPLICATE_GENERATION'
  | 'DELETE_WHILE_LOADED'
  | 'RELEASE_FAILED'
  | 'INVALID_STATE'
  | 'NETWORK_UNAVAILABLE';

export type OfflineAiError = {
  readonly code: OfflineAiErrorCode;
  readonly message: string;
};

export type OfflineAiRuntimeInspection = {
  readonly supported: boolean;
  readonly nativeModuleAvailable: boolean;
  readonly platform: string;
  readonly accelerationMode: 'cpu';
  readonly reason?: string;
};

export type OfflineAiModelInspection = {
  readonly stateHint: 'missing' | 'partial' | 'ready';
  readonly filename: string;
  readonly exists: boolean;
  readonly byteSize: number | null;
  readonly expectedByteSize: number;
  readonly sha256Verified: boolean | null;
  readonly storageCategory: 'app-private';
};

export type OfflineAiTimingResult = {
  readonly loadMs: number | null;
  readonly completionMs: number | null;
  readonly generatedTokenCount: number | null;
  readonly tokensPerSecond: number | null;
  readonly offline: boolean | null;
  readonly deviceModel: string | null;
  readonly androidVersion: string | null;
};

export type OfflineAiGenerationResult = {
  readonly text: string;
  readonly containsExpectedPhrase: boolean;
  readonly timing: OfflineAiTimingResult;
  readonly usedNativeRuntime: true;
  readonly networkInferenceUsed: false;
};

export type OfflineAiSnapshot = {
  readonly state: OfflineAiLifecycleState;
  readonly manifest: OfflineAiModelManifest;
  readonly runtime: OfflineAiRuntimeInspection;
  readonly model: OfflineAiModelInspection;
  readonly lastError: OfflineAiError | null;
  readonly lastTiming: OfflineAiTimingResult | null;
  readonly lastCompletionPreview: string | null;
  readonly downloadProgress: number | null;
  readonly threadCount: number;
  readonly contextSize: number;
  readonly maxOutputTokens: number;
  readonly temperature: number;
  readonly accelerationMode: 'cpu';
};

export type OfflineAiFileInfo = {
  readonly exists: boolean;
  readonly size: number | null;
  readonly isDirectory: boolean;
};

export type OfflineAiFileStore = {
  ensureDirectories(): Promise<void>;
  getInfo(uri: string): Promise<OfflineAiFileInfo>;
  deleteIfExists(uri: string): Promise<void>;
  moveAsync(from: string, to: string): Promise<void>;
  copyAsync(from: string, to: string): Promise<void>;
  hashSha256(uri: string): Promise<string>;
  getFreeDiskBytes(): Promise<number | null>;
  getModelUri(): string;
  getTempDownloadUri(): string;
  pickImportUri(): Promise<string | null>;
};

export type OfflineAiDownloader = {
  download(options: {
    readonly url: string;
    readonly destinationUri: string;
    readonly onProgress?: (ratio: number) => void;
    readonly signal?: AbortSignal;
  }): Promise<void>;
};

export type OfflineAiLlamaContext = {
  completion(params: {
    messages: readonly { role: 'system' | 'user' | 'assistant'; content: string }[];
    n_predict: number;
    temperature: number;
    stop?: string[];
  }): Promise<{
    text: string;
    timings?: {
      predicted_n?: number;
      predicted_per_second?: number;
      predicted_ms?: number;
    };
  }>;
  stopCompletion(): Promise<void> | void;
  release(): Promise<void> | void;
};

export type OfflineAiLlamaRuntime = {
  isNativeModuleAvailable(): boolean;
  init(options: {
    modelPath: string;
    n_ctx: number;
    n_threads: number;
    n_gpu_layers: number;
  }): Promise<OfflineAiLlamaContext>;
};

export const OFFLINE_AI_SMOKE_SYSTEM_PROMPT =
  'You are running a NorthCare offline model test. Follow the requested output format exactly. Do not provide additional explanation.';

export const OFFLINE_AI_SMOKE_USER_PROMPT = 'Reply with exactly: OFFLINE_MODEL_READY';

export const OFFLINE_AI_EXPECTED_PHRASE = 'OFFLINE_MODEL_READY';

export const OFFLINE_AI_MANAGED_DIRECTORY = 'offline-ai-models';
export const OFFLINE_AI_TEMP_DIRECTORY = 'offline-ai-temp';
