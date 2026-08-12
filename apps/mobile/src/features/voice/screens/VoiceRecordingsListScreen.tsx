import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, LoadingState } from '../../../design-system';
import { asHref } from '../../../navigation/href';
import { radii, spacing } from '../../../theme';
import type { SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { VoiceRecordingListItem } from '../components/VoiceRecordingListItem';
import {
  VoiceTranscriptHeaderActions,
  VoiceTranscriptPrivacyRow,
} from '../components/VoiceTranscriptReviewUI';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import type { VoiceRecordingListEntry } from '../domain/voiceRecordingSummary';
import { resolveVoiceSessionRoute } from '../domain/voiceRecordingNavigation';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export function VoiceRecordingsListScreen() {
  const voiceStrings = useVoiceStrings();
  const router = useRouter();
  const { account, authState } = useAuthSession();
  const services = useVoiceServices();
  const styles = useVoiceRecordingsListScreenStyles();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const [items, setItems] = useState<readonly VoiceRecordingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!services || !account?.accountId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const recordings = await services.listRecordings({
        accountId: account.accountId,
        clientId: clientId ?? null,
        limit: 50,
      });
      setItems(recordings);
    } catch (caught) {
      console.error('[VoiceRecordingsList] load failed', caught);
      setItems([]);
      setError(mapVoiceServiceError(caught) || voiceStrings.recordingsLoadError);
    } finally {
      setLoading(false);
    }
  }, [account?.accountId, clientId, services, voiceStrings.recordingsLoadError]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const title = clientId ? voiceStrings.recordingsClientTitle : voiceStrings.recordingsTitle;

  const openRecording = (entry: VoiceRecordingListEntry) => {
    if (authState === 'locked') {
      return;
    }
    router.push(
      asHref(
        resolveVoiceSessionRoute({
          clientId: entry.clientId,
          sessionId: entry.sessionId,
          status: entry.status,
          encounterId: entry.encounterId,
          reviewableFieldCount: entry.reviewableFieldCount,
        }),
      ),
    );
  };

  if (loading || !services) {
    return (
      <VoiceToCareShell variant="light" testID="voice-recordings-loading">
        <LoadingState message={voiceStrings.loading} />
      </VoiceToCareShell>
    );
  }

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      showOnDeviceChip={false}
      rightAction={<VoiceTranscriptHeaderActions />}
      testID="voice-recordings-screen"
    >
      <View style={styles.stack}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTextBlock}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            <AppText variant="body" color="secondary">
              {voiceStrings.recordingsSubtitle}
            </AppText>
          </View>
          {items.length > 0 ? (
            <AppText variant="caption" color="secondary" testID="voice-recordings-count">
              {voiceStrings.recordingsCount(items.length)}
            </AppText>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBlock}>
            <AppText variant="body" color="urgent">
              {error}
            </AppText>
            <AppButton
              label={voiceStrings.recordingsRetry}
              variant="secondary"
              onPress={() => void load()}
              fullWidth={false}
              testID="voice-recordings-retry"
            />
          </View>
        ) : null}

        {items.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <AppText variant="body" color="secondary" style={styles.emptyText}>
              {voiceStrings.recordingsEmpty}
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((entry) => (
              <VoiceRecordingListItem
                key={entry.sessionId}
                entry={entry}
                onPress={() => openRecording(entry)}
              />
            ))}
          </View>
        )}

        <VoiceTranscriptPrivacyRow />

        {authState === 'locked' ? (
          <AppText variant="body" color="warning">
            {voiceStrings.lockedBanner}
          </AppText>
        ) : null}
      </View>
    </VoiceToCareShell>
  );
}

function createVoiceRecordingsListScreenStyles(semantic: SemanticColors) {
  return StyleSheet.create({
    stack: {
      gap: spacing.lg,
    },
    sectionHeader: {
      gap: spacing.xs,
    },
    sectionTextBlock: {
      gap: spacing.xs,
    },
    list: {
      gap: spacing.sm,
    },
    emptyState: {
      padding: spacing.xl,
      borderRadius: radii.card,
      backgroundColor: semantic.background.secondary,
    },
    emptyText: {
      textAlign: 'center',
    },
    errorBlock: {
      gap: spacing.sm,
      padding: spacing.base,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: semantic.border.default,
      backgroundColor: semantic.surface.primary,
    },
  });
}

function useVoiceRecordingsListScreenStyles() {
  const { semantic } = useThemeMode();
  return useMemo(() => createVoiceRecordingsListScreenStyles(semantic), [semantic]);
}
