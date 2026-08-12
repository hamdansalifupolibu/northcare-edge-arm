import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  AppTextInput,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { NutritionDetails } from '../application/createNutritionServices';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { nutritionBasePath } from './NutritionHistoryScreen';

export function NutritionCorrectScreen() {
  const nutritionStrings = useNutritionStrings();
const { clientId, assessmentId } = useLocalSearchParams<{
    clientId: string;
    assessmentId: string;
  }>();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const [details, setDetails] = useState<NutritionDetails | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !assessmentId) {
      return;
    }
    setLoading(true);
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

  const submit = async () => {
    if (!services || !account?.accountId || !details || !reason.trim() || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const corrected = await services.correctAssessment({
        assessmentId,
        accountId: account.accountId,
        reasonCode: reason.trim(),
        answers: details.answers,
        environment: 'development',
      });
      router.replace(
        asHref(`${nutritionBasePath(clientId)}/${corrected.assessment.id}/details`),
      );
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

  if (!details || details.assessment.status !== 'completed') {
    return (
      <AppScreen>
        <AppText variant="body">{nutritionStrings.missingAssessment}</AppText>
      </AppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="nutrition-correct-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{nutritionStrings.correctScreenTitle}</ScreenTitle>
        <AppText variant="body">{nutritionStrings.correctScreenBody}</AppText>
        {locked ? (
          <AppText variant="body" color="warning">
            {nutritionStrings.lockedBanner}
          </AppText>
        ) : null}
        <AppTextInput
          label={nutritionStrings.correctReasonLabel}
          value={reason}
          onChangeText={setReason}
          placeholder={nutritionStrings.correctReasonPlaceholder}
        />
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={nutritionStrings.correctSubmit}
          onPress={() => void submit()}
          disabled={!reason.trim() || busy || locked}
          testID="nutrition-correct-submit"
        />
        <AppButton
          label={nutritionStrings.correctCancel}
          variant="tertiary"
          onPress={() =>
            router.replace(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/details`))
          }
        />
      </View>
    </ScrollableAppScreen>
  );
}
