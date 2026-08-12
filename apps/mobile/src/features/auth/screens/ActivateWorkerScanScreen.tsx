import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { TextInput, View } from 'react-native';

import {
  AppButton,
  AppText,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { useOfflineProvisioningServices } from '../../administration/hooks/useOfflineProvisioningServices';
import {
  clearPendingActivationClaims,
  setPendingActivationClaims,
} from '../../administration/session/activationSessionStore';
import { WORKER_ACTIVATION_URI_PREFIX } from '../../administration/security/signedActivationCrypto';

export function ActivateWorkerScanScreen() {
  const t = useTranslation();
  const router = useRouter();
  const provisioning = useOfflineProvisioningServices();
  const [permission, requestPermission] = useCameraPermissions();
  const [paste, setPaste] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runVerify = useCallback(
    async (raw: string) => {
      if (!provisioning) {
        setError(t.administration.activation.databaseNotReady);
        return;
      }
      const result = await provisioning.verifyActivationQr(raw);
      if (!result.ok) {
        setError(mapUserFacingError(result.message, t.administration.activation.verifyFailed));
        return;
      }
      await provisioning.acceptVerifiedActivation(result.claims);
      setPendingActivationClaims(result.claims);
      setError(null);
      router.push('/(auth)/activate-confirm');
    },
    [provisioning, router, t.administration.activation.databaseNotReady, t.administration.activation.verifyFailed],
  );

  const onBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanLocked) return;
      setScanLocked(true);
      void runVerify(data).finally(() => setScanLocked(false));
    },
    [runVerify, scanLocked],
  );

  return (
    <ScrollableAppScreen testID="activate-worker-scan">
      <ScreenTitle>{t.administration.activation.scanTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">
        {t.administration.activation.scanBody}
      </AppText>

      {scanning && permission?.granted ? (
        <View style={{ height: 280, overflow: 'hidden', borderRadius: radii.md }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcode}
          />
        </View>
      ) : null}

      <AppButton
        label={t.administration.activation.scanAction}
        onPress={() => {
          if (!permission?.granted) {
            void requestPermission().then((res) => {
              if (res.granted) setScanning(true);
            });
            return;
          }
          setScanning(true);
        }}
      />

      <AppText variant="label">{t.administration.activation.pasteLabel}</AppText>
      <TextInput
        value={paste}
        onChangeText={setPaste}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={`${WORKER_ACTIVATION_URI_PREFIX}...`}
        placeholderTextColor={colors.disabled}
        style={{
          minHeight: 88,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          color: colors.textPrimary,
          backgroundColor: colors.mutedSurface,
        }}
      />
      <AppButton
        label={t.administration.activation.verifyPasted}
        variant="secondary"
        onPress={() => void runVerify(paste)}
      />

      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <AppButton
        label={t.auth.cancel}
        variant="tertiary"
        onPress={() => {
          clearPendingActivationClaims();
          router.back();
        }}
      />
    </ScrollableAppScreen>
  );
}
