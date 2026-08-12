import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { VoiceOrb } from '../components/VoiceOrb';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export function VoiceSuccessScreen() {
  const voiceStrings = useVoiceStrings();
  const { clientId, sessionId, visitId } = useLocalSearchParams<{
    clientId: string;
    sessionId: string;
    visitId?: string;
  }>();
  const router = useRouter();
  const { account, authState } = useAuthSession();
  const services = useVoiceServices();
  const [busy, setBusy] = useState(false);
  const locked = authState === 'locked';

  const setRetention = async (retained: boolean) => {
    if (!services || !account?.accountId || !sessionId || locked) {
      return;
    }
    setBusy(true);
    try {
      await services.setRetentionDecision({
        sessionId,
        retentionStatus: retained ? 'retained' : 'pendingDecision',
        accountId: account.accountId,
      });
    } catch {
      // Non-blocking after success.
    } finally {
      setBusy(false);
    }
  };

  const deleteAudio = () => {
    Alert.alert(voiceStrings.deleteConfirmTitle, voiceStrings.deleteConfirmBody, [
      { text: voiceStrings.cancel, style: 'cancel' },
      {
        text: voiceStrings.retentionDelete,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!services || !account?.accountId || !sessionId) {
              return;
            }
            setBusy(true);
            try {
              await services.deleteAudio({
                sessionId,
                accountId: account.accountId,
                confirmed: true,
              });
            } catch (caught) {
              Alert.alert(voiceStrings.deleteFailedTitle, mapVoiceServiceError(caught));
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const footer = (
    <View style={styles.footerActions}>
      <AppButton
        label={voiceStrings.viewClientProfile}
        onPress={() =>
          router.replace(
            visitId
              ? `/(worker)/clients/${clientId}/visits/${visitId}`
              : `/(worker)/clients/${clientId}`,
          )
        }
      />
      <AppButton
        label={voiceStrings.recordAnotherCta}
        variant="secondary"
        onPress={() => router.replace(`/(worker)/clients/${clientId}/voice`)}
      />
    </View>
  );

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      footer={footer}
      testID="voice-success-screen"
    >
      <View style={styles.body}>
        <View style={styles.hero}>
          <VoiceOrb mode="saved" size={180} />
          <AppText variant="title">{voiceStrings.savedConfirmationTitle}</AppText>
          <AppText variant="body" color="secondary">
            {voiceStrings.savedConfirmationBody}
          </AppText>
        </View>

        <View style={styles.retentionCard}>
          <AppText variant="label">{voiceStrings.retentionTitle}</AppText>
          <AppButton
            label={voiceStrings.retentionKeep}
            variant="secondary"
            onPress={() => void setRetention(true)}
            disabled={busy || locked}
          />
          <AppButton
            label={voiceStrings.retentionDelete}
            variant="destructive"
            onPress={deleteAudio}
            disabled={busy || locked}
          />
        </View>
      </View>
    </VoiceToCareShell>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  retentionCard: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerActions: {
    gap: spacing.sm,
  },
});
