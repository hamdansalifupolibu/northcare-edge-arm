import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { AppButton, AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { evaluateRouteAccess } from '../../../navigation/routeAccess';
import { spacing } from '../../../theme';
import { toSafeUiErrorMessage } from '../domain/errors';
import { getOfflineAiServices } from '../services/createOfflineAiServices';
import type { OfflineAiSnapshot } from '../domain/types';

function formatBytes(bytes: number | null): string {
  if (bytes == null) {
    return 'unknown';
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB (${bytes} bytes)`;
}

export function OfflineAiDevScreen() {
  const config = getAppConfig();
  const access = evaluateRouteAccess('development-only', {
    diagnosticsEnabled: config.diagnosticsEnabled,
  });
  const services = getOfflineAiServices();
  const [snapshot, setSnapshot] = useState<OfflineAiSnapshot>(() => services.getSnapshot());
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!access.allowed) {
    return <Redirect href={(access.redirectTo as '/') ?? '/'} />;
  }

  if (config.appEnv === 'production') {
    return <Redirect href="/" />;
  }

  async function refresh() {
    await services.refreshStateFromDisk();
    setSnapshot(services.getSnapshot());
  }

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true);
    setStatusMessage(null);
    try {
      await action();
      setStatusMessage(okMessage);
    } catch (error) {
      setStatusMessage(mapUserFacingError(error, 'Operation failed.'));
    } finally {
      setSnapshot(services.getSnapshot());
      setBusy(false);
    }
  }

  const errorText = toSafeUiErrorMessage(snapshot.lastError);

  return (
    <ScrollableAppScreen testID="offline-ai-dev-screen">
      <ScreenTitle>Offline AI Stage 1</ScreenTitle>
      <AppText variant="body" color="secondary">
        Development-only native runtime smoke test. Not connected to Ask NorthCare. Neutral prompts
        only.
      </AppText>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">Runtime: {snapshot.runtime.supported ? 'supported' : 'unsupported'}</AppText>
        <AppText variant="caption" color="secondary">
          Native module: {String(snapshot.runtime.nativeModuleAvailable)} · Acceleration:{' '}
          {snapshot.accelerationMode}
        </AppText>
        <AppText variant="label">Lifecycle state: {snapshot.state}</AppText>
        <AppText variant="label">Model: {snapshot.manifest.displayName}</AppText>
        <AppText variant="caption" color="secondary">
          Quantisation: {snapshot.manifest.quantisation}
        </AppText>
        <AppText variant="caption" color="secondary">
          Expected size: {formatBytes(snapshot.manifest.actualByteSize)}
        </AppText>
        <AppText variant="caption" color="secondary">
          Installed size: {formatBytes(snapshot.model.byteSize)}
        </AppText>
        <AppText variant="caption" color="secondary">
          Checksum verified: {String(snapshot.model.sha256Verified)}
        </AppText>
        <AppText variant="caption" color="secondary">
          Storage: app-private · ctx {snapshot.contextSize} · max out {snapshot.maxOutputTokens} ·
          threads {snapshot.threadCount}
        </AppText>
        {snapshot.downloadProgress != null ? (
          <AppText variant="caption" color="secondary">
            Download progress: {Math.round(snapshot.downloadProgress * 100)}%
          </AppText>
        ) : null}
        {snapshot.lastTiming ? (
          <AppText variant="caption" color="secondary" testID="offline-ai-timing">
            Load {snapshot.lastTiming.loadMs ?? '—'} ms · Completion{' '}
            {snapshot.lastTiming.completionMs ?? '—'} ms · Tokens{' '}
            {snapshot.lastTiming.generatedTokenCount ?? '—'} · tok/s{' '}
            {snapshot.lastTiming.tokensPerSecond ?? '—'} · offline{' '}
            {String(snapshot.lastTiming.offline)}
          </AppText>
        ) : null}
        {snapshot.lastCompletionPreview ? (
          <AppText variant="caption" testID="offline-ai-completion-preview">
            Last completion preview: {snapshot.lastCompletionPreview}
          </AppText>
        ) : null}
        {snapshot.lastError ? (
          <AppText variant="caption" color="urgent" testID="offline-ai-error">
            {errorText}
          </AppText>
        ) : null}
        {statusMessage ? (
          <AppText variant="caption" color="secondary" testID="offline-ai-status">
            {statusMessage}
          </AppText>
        ) : null}
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <AppButton
          label="Refresh status"
          variant="secondary"
          disabled={busy}
          onPress={() => void run(async () => refresh(), 'Status refreshed.')}
          testID="offline-ai-refresh"
        />
        <AppButton
          label="Download and verify model"
          disabled={busy || snapshot.state === 'downloading'}
          onPress={() =>
            void run(
              () => services.provisionModel({ mode: 'download' }),
              'Model provisioned and verified.',
            )
          }
          testID="offline-ai-download"
        />
        <AppButton
          label="Import local GGUF"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            void run(
              () => services.provisionModel({ mode: 'import' }),
              'Model imported and verified.',
            )
          }
          testID="offline-ai-import"
        />
        <AppButton
          label="Cancel download"
          variant="secondary"
          disabled={busy || snapshot.state !== 'downloading'}
          onPress={() => void run(() => services.cancelProvision(), 'Download cancel requested.')}
          testID="offline-ai-cancel-download"
        />
        <AppButton
          label="Load model"
          disabled={busy || snapshot.state === 'loading' || snapshot.state === 'loaded'}
          onPress={() => void run(() => services.loadModel(), 'Model loaded.')}
          testID="offline-ai-load"
        />
        <AppButton
          label="Run offline smoke test"
          disabled={busy || (snapshot.state !== 'loaded' && snapshot.state !== 'generating')}
          onPress={() =>
            void run(async () => {
              const result = await services.generate();
              if (!result.containsExpectedPhrase) {
                throw { code: 'GENERATION_FAILED', message: 'Expected phrase missing from output.' };
              }
            }, 'Smoke test completed through llama.rn.')
          }
          testID="offline-ai-smoke"
        />
        <AppButton
          label="Cancel generation"
          variant="secondary"
          disabled={busy || snapshot.state !== 'generating'}
          onPress={() => void run(() => services.cancelGeneration(), 'Generation cancel requested.')}
          testID="offline-ai-cancel-generate"
        />
        <AppButton
          label="Release model"
          variant="secondary"
          disabled={busy || (!['loaded', 'generating', 'releasing'].includes(snapshot.state) && !snapshot.runtime.nativeModuleAvailable)}
          onPress={() => void run(() => services.releaseModel(), 'Model released.')}
          testID="offline-ai-release"
        />
      </View>
    </ScrollableAppScreen>
  );
}
