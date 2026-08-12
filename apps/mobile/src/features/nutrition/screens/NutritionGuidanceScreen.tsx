import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { NutritionGuidanceCard } from '../components/NutritionGuidanceCard';
import { NutritionGuidanceUnavailableState } from '../components/NutritionGuidanceUnavailableState';
import type { NutritionDetails } from '../application/createNutritionServices';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { nutritionBasePath } from './NutritionHistoryScreen';

export function NutritionGuidanceScreen() {
  const nutritionStrings = useNutritionStrings();
const { clientId, assessmentId } = useLocalSearchParams<{
    clientId: string;
    assessmentId: string;
  }>();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const { colors } = useThemeMode();
  const [details, setDetails] = useState<NutritionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !assessmentId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetails(await services.getDetails(assessmentId));
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, assessmentId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const acknowledge = async () => {
    if (
      !services ||
      !account?.accountId ||
      !details?.guidanceResolution ||
      locked
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await services.acknowledgeGuidance({
        assessmentId,
        resolutionId: details.guidanceResolution.id,
        accountId: account.accountId,
      });
      await load();
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={nutritionStrings.loading} />
      </AppScreen>
    );
  }

  if (!details) {
    return (
      <AppScreen>
        <AppText variant="body">{nutritionStrings.missingAssessment}</AppText>
      </AppScreen>
    );
  }

  const guidance = details.guidanceResult;
  const available = guidance?.outcome === 'guidanceAvailable';
  const interpretationCode = details.referenceEvaluation?.interpretationCode ?? null;

  return (
    <ScrollableAppScreen testID="nutrition-guidance-screen" background="primary">
      <View style={{ gap: spacing.lg }}>
        <ScreenTitle>{nutritionStrings.guidanceAvailableTitle}</ScreenTitle>

        {locked ? (
          <AppText variant="body" color="warning">
            {nutritionStrings.lockedBanner}
          </AppText>
        ) : null}

        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}

        {available && guidance ? (
          <>
            {guidance.cards.map((card) => (
              <NutritionGuidanceCard
                key={card.guidanceId}
                card={card}
                interpretationCode={interpretationCode}
              />
            ))}

            <View style={styles.acknowledgeSection}>
              {details.guidanceResolution?.acknowledgedAt ? (
                <View
                  style={[
                    styles.acknowledgedBanner,
                    {
                      backgroundColor: colors.successBackground,
                      borderColor: colors.success,
                      borderWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <AppText variant="caption" color="stable" style={{ fontWeight: '600' }}>
                    {'\u2713'} {nutritionStrings.guidanceAcknowledged}
                  </AppText>
                </View>
              ) : (
                <AppButton
                  label={nutritionStrings.guidanceAcknowledge}
                  onPress={() => void acknowledge()}
                  disabled={busy || locked}
                  testID="nutrition-guidance-acknowledge"
                />
              )}
            </View>
          </>
        ) : (
          <NutritionGuidanceUnavailableState
            outcome={guidance?.outcome ?? 'guidanceUnavailable'}
            missingInformation={guidance?.missingInformation}
          />
        )}

        <AppButton
          label={nutritionStrings.backToHistory}
          variant="tertiary"
          onPress={() => router.replace(asHref(`${nutritionBasePath(clientId)}`))}
        />
      </View>
    </ScrollableAppScreen>
  );
}

const styles = StyleSheet.create({
  acknowledgeSection: {
    marginTop: spacing.sm,
  },
  acknowledgedBanner: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
});
