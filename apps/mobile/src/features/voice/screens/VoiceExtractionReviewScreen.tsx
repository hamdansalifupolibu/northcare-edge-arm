import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
} from '../../../design-system';
import { getAppConfig } from '../../../config/appConfig';
import { colors, radii, spacing } from '../../../theme';
import { asHref } from '../../../navigation/href';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { SuggestionReviewCard } from '../components/SuggestionReviewCard';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import type { VoiceExtractionSuggestion } from '../domain/types';
import { requireDefaultExtractionSchema } from '../providers/extraction/schemas/registry';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { voiceBasePath } from './VoiceEntryScreen';
import { getOfflineAiServices } from '../../offline-ai/services/createOfflineAiServices';

export function VoiceExtractionReviewScreen() {
  const voiceStrings = useVoiceStrings();
  const { clientId, sessionId, visitId } = useLocalSearchParams<{
    clientId: string;
    sessionId: string;
    visitId?: string;
  }>();
  const router = useRouter();
  const { account, authState } = useAuthSession();
  const services = useVoiceServices();
  const [suggestions, setSuggestions] = useState<readonly VoiceExtractionSuggestion[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const locked = authState === 'locked';
  const isDev = getAppConfig().appEnv === 'development';

  const fieldLabels = useMemo(() => {
    const schema = requireDefaultExtractionSchema();
    const map = new Map<string, string>();
    for (const field of schema.allowedTargets) {
      map.set(`${field.targetType}.${field.targetKey}`, field.label);
    }
    return map;
  }, []);

  const load = useCallback(async () => {
    if (!services || !sessionId || !account?.accountId) {
      return;
    }
    setLoading(true);
    try {
      const bundle = await services.getSessionBundle(sessionId);
      const latestRun = bundle?.extractionRuns[0];
      if (latestRun) {
        setRunId(latestRun.run.id);
        setSuggestions(latestRun.suggestions);
        const initial: Record<string, string> = {};
        for (const s of latestRun.suggestions) {
          initial[s.id] = s.proposedValueJson;
        }
        setEditValues(initial);
        return;
      }
      const transcript = bundle?.transcripts.find((t) => t.status === 'confirmed');
      if (transcript) {
        const ai = getOfflineAiServices();
        const modelReady = ai.getSnapshot().model.exists;
        if (isDev || modelReady) {
          setBusy(true);
          try {
            const result = await services.requestExtraction({
              sessionId,
              transcriptId: transcript.id,
              accountId: account.accountId,
            });
            setRunId(result.run.id);
            setSuggestions(result.suggestions);
            const initial: Record<string, string> = {};
            for (const s of result.suggestions) {
              initial[s.id] = s.proposedValueJson;
            }
            setEditValues(initial);
          } catch (caught) {
            setError(mapVoiceServiceError(caught));
          } finally {
            setBusy(false);
          }
        }
      }
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, sessionId, account, isDev]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const review = async (
    suggestion: VoiceExtractionSuggestion,
    action: 'accept' | 'edit' | 'reject',
  ) => {
    if (!services || !account?.accountId || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let editedValue: unknown = editValues[suggestion.id];
      try {
        editedValue = JSON.parse(editValues[suggestion.id] ?? 'null') as unknown;
      } catch {
        editedValue = editValues[suggestion.id];
      }
      const updated = await services.reviewSuggestion({
        suggestionId: suggestion.id,
        accountId: account.accountId,
        action,
        editedValue: action === 'edit' ? editedValue : undefined,
        rejectionReasonCode: action === 'reject' ? 'incorrect' : undefined,
      });
      setSuggestions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!services || !account?.accountId || !sessionId || !runId || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await services.applyConfirmedSuggestions({
        sessionId,
        extractionRunId: runId,
        accountId: account.accountId,
        workerConfirmed: true,
        sessionUnlocked: authState === 'authenticated',
      });
      router.push(asHref(`${voiceBasePath(clientId, visitId)}/success?sessionId=${sessionId}`));
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  if (loading || !services) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.loading} />
      </AppScreen>
    );
  }

  if (busy && suggestions.length === 0) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.processingTitle} />
      </AppScreen>
    );
  }

  const ai = getOfflineAiServices();
  const modelReady = ai.getSnapshot().model.exists;

  const footer =
    !locked && suggestions.length > 0 ? (
      <AppButton
        label={voiceStrings.saveToClientRecord}
        onPress={() => void apply()}
        disabled={busy || locked}
      />
    ) : undefined;

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      footer={footer}
      testID="voice-extraction-review-screen"
    >
      <View style={styles.body}>
        <AppText variant="title">{voiceStrings.extractedInfoTitle}</AppText>
        <AppText variant="body" color="secondary">
          {voiceStrings.extractedInfoBody}
        </AppText>
        <AppText variant="caption" color="warning">
          {voiceStrings.extractionDevBanner}
        </AppText>
        <AppText variant="caption" color="secondary">
          {voiceStrings.reviewNoAcceptAll}
        </AppText>
        {locked ? (
          <AppText variant="body" color="warning">
            {voiceStrings.lockedBanner}
          </AppText>
        ) : null}
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}

        {!locked && suggestions.length > 0
          ? suggestions.map((suggestion) => {
              const label =
                fieldLabels.get(`${suggestion.targetType}.${suggestion.targetKey}`) ??
                suggestion.targetKey;
              return (
                <View key={suggestion.id} style={styles.fieldCard}>
                  <SuggestionReviewCard
                    label={label}
                    suggestion={suggestion}
                    proposedDisplay={suggestion.proposedValueJson}
                    editValue={editValues[suggestion.id] ?? ''}
                    onEditValueChange={(value) =>
                      setEditValues((prev) => ({ ...prev, [suggestion.id]: value }))
                    }
                    onAccept={() => void review(suggestion, 'accept')}
                    onEdit={() => void review(suggestion, 'edit')}
                    onReject={() => void review(suggestion, 'reject')}
                    disabled={busy}
                  />
                </View>
              );
            })
          : null}

        {!locked && suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="body">
              {modelReady
                ? 'Automatic extraction is unavailable. Use the transcript to complete the form manually.'
                : 'Automatic extraction is unavailable because the local Qwen model is not downloaded. Use the transcript to complete the form manually.'}
            </AppText>
            <AppButton
              label="Continue to manual screening"
              variant="secondary"
              onPress={() =>
                router.replace(
                  visitId
                    ? `/(worker)/clients/${clientId}/visits/${visitId}`
                    : `/(worker)/clients/${clientId}`,
                )
              }
            />
          </View>
        ) : null}
      </View>
    </VoiceToCareShell>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  fieldCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  emptyState: {
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.card,
    backgroundColor: colors.mutedSurface,
  },
});
