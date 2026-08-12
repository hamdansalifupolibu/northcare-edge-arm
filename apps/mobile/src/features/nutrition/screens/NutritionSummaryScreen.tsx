import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { AppButton, AppText, LoadingState } from '../../../design-system';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { NutritionDetails } from '../application/createNutritionServices';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { NutritionClassificationHero } from '../components/centre/NutritionClassificationHero';
import { NutritionSuccessBanner } from '../components/centre/NutritionSuccessBanner';
import { NutritionGrowthIndicatorsPanel } from '../components/NutritionGrowthIndicatorsPanel';
import { NutritionIycfIndicatorsPanel } from '../components/NutritionIycfIndicatorsPanel';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { getNutritionClassificationStyle } from '../utils/nutritionClassification';
import { resolveNutritionSuccessMessage } from '../utils/nutritionSuccessMessage';
import { nutritionBasePath } from './NutritionHistoryScreen';

export function NutritionSummaryScreen() {
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  const startCorrection = async () => {
    if (!services || !account?.accountId || busy || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await services.startCorrection({ assessmentId, accountId: account.accountId });
      router.push(asHref(`${nutritionBasePath(clientId)}/${result.assessmentId}/resume`));
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!services || !account?.accountId || locked) {
      return;
    }
    if (details?.assessment.supersededById) {
      setError(nutritionStrings.deleteBlockedSuperseded);
      return;
    }
    Alert.alert(nutritionStrings.deleteConfirmTitle, nutritionStrings.deleteConfirmBody, [
      { text: nutritionStrings.deleteCancel, style: 'cancel' },
      {
        text: nutritionStrings.deleteConfirmAction,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            setError(null);
            try {
              await services.softDeleteAssessment({
                assessmentId,
                accountId: account.accountId,
                reason: 'Worker confirmed deletion',
                confirmed: true,
              });
              router.replace(asHref(`${nutritionBasePath(clientId)}`));
            } catch (caught) {
              setError(mapNutritionServiceError(caught));
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <NutritionCentreShell testID="nutrition-summary-screen">
        <LoadingState message={nutritionStrings.loading} />
      </NutritionCentreShell>
    );
  }

  const interpretationCode = details?.referenceEvaluation?.interpretationCode ?? null;
  const classification = getNutritionClassificationStyle(interpretationCode, nutritionStrings, colors);
  const successMessage = resolveNutritionSuccessMessage(details, nutritionStrings);
  const hasGrowthPanel =
    details?.growthEvaluation != null && details.growthEvaluation.indicators.length > 0;
  const muacDetail =
    details?.referenceEvaluation?.derivedValue != null && details.referenceEvaluation.derivedUnit
      ? `${nutritionStrings.measurementMuac}: ${details.referenceEvaluation.derivedValue} ${details.referenceEvaluation.derivedUnit}`
      : null;

  return (
    <NutritionCentreShell testID="nutrition-summary-screen">
      <NutritionCentreHeader
        title={nutritionStrings.summarySuccessTitle}
        subtitle={nutritionStrings.syncSavedOnDevice}
        onBack={() => router.replace(asHref(`${nutritionBasePath(clientId)}`))}
        backLabel={nutritionStrings.centreBackLabel}
      />

      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <NutritionSuccessBanner
        title={nutritionStrings.summarySuccessTitle}
        message={successMessage}
      />

      <NutritionClassificationHero
        style={classification}
        sectionLabel={nutritionStrings.classificationSection}
        muacDetail={muacDetail}
      />

      {hasGrowthPanel ? (
        <NutritionGrowthIndicatorsPanel evaluation={details?.growthEvaluation ?? null} />
      ) : (
        <AppText variant="caption" color="secondary">
          {nutritionStrings.summaryGrowthUnavailable}
        </AppText>
      )}

      <NutritionIycfIndicatorsPanel evaluation={details?.iycfEvaluation ?? null} />

      <View style={{ gap: 8 }}>
        <AppButton
          label={nutritionStrings.summaryViewGuidance}
          onPress={() =>
            router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/guidance`))
          }
          testID="nutrition-summary-guidance"
        />
        <AppButton
          label={nutritionStrings.summaryViewDetails}
          variant="secondary"
          onPress={() =>
            router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/details`))
          }
        />
        <AppButton
          label={nutritionStrings.summaryCreateReminder}
          variant="secondary"
          onPress={() =>
            router.push(
              asHref(
                `/(worker)/more/reminders/create?clientId=${clientId}&nutritionId=${assessmentId}`,
              ),
            )
          }
          testID="nutrition-create-reminder"
        />
        <AppButton
          label={nutritionStrings.summaryCorrectAssessment}
          variant="secondary"
          onPress={() => void startCorrection()}
          disabled={busy || locked}
        />
        <AppButton
          label={nutritionStrings.summaryDeleteAssessment}
          variant="tertiary"
          onPress={confirmDelete}
          disabled={busy || locked}
        />
      </View>
    </NutritionCentreShell>
  );
}
