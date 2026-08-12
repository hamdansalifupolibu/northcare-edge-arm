import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { AppButton, AppStateView, AppText, LoadingState } from '../../../design-system';
import { asHref } from '../../../navigation/href';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { NutritionAssessmentTemplateDefinition } from '../domain/types';
import type { NutritionAssessmentType } from '../domain/statuses';
import { NutritionAssessmentTypeCard } from '../components/NutritionAssessmentTypeCard';
import { DevelopmentBanner } from '../components/DevelopmentBanner';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { NutritionDraftCard } from '../components/NutritionDraftCard';
import { NutritionMissingInformation } from '../components/NutritionMissingInformation';
import {
  mapNutritionServiceError,
  type NutritionDraft,
} from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { nutritionBasePath } from './NutritionHistoryScreen';

type RouteParams = {
  clientId: string;
  encounterId?: string;
};

export function NutritionStartScreen() {
  const nutritionStrings = useNutritionStrings();
  const { clientId, encounterId } = useLocalSearchParams<RouteParams>();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const db = useDatabase();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [templates, setTemplates] = useState<readonly NutritionAssessmentTemplateDefinition[]>(
    [],
  );
  const [moreInformationRequired, setMoreInformationRequired] = useState(false);
  const [existingDraft, setExistingDraft] = useState<NutritionDraft | null>(null);
  const [selectedType, setSelectedType] = useState<NutritionAssessmentType | null>(null);
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !clientId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (db.repositories) {
        const client = await db.repositories.clients.findById(clientId);
        if (client) {
          setClientName(
            [client.givenName, client.familyName].filter(Boolean).join(' ') ||
              nutritionStrings.unknownClient,
          );
        }
      }
      const applicable = await services.listApplicableTypes({ clientId });
      setTemplates(applicable.templates);
      setMoreInformationRequired(applicable.moreInformationRequired);
      const history = await services.getHistory(clientId);
      const draftRow = history.find((row) => row.status === 'draft');
      if (draftRow) {
        setExistingDraft(await services.getDraft(draftRow.id));
      } else {
        setExistingDraft(null);
      }
      if (applicable.templates.length === 1) {
        setSelectedType(applicable.templates[0]!.assessmentType);
      }
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, clientId, db.repositories, nutritionStrings.unknownClient]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const startLabel = useMemo(() => {
    if (templates.length > 1 && !selectedType) {
      return nutritionStrings.startChooseType;
    }
    return nutritionStrings.startConfirm;
  }, [nutritionStrings.startChooseType, nutritionStrings.startConfirm, selectedType, templates.length]);

  const developmentDisclaimer = useMemo(() => {
    const template =
      templates.find((entry) => entry.assessmentType === selectedType) ?? templates[0] ?? null;
    return template?.developmentBanner ?? null;
  }, [selectedType, templates]);

  const navigateToDraft = (draft: NutritionDraft, mode: 'resume' | 'review') => {
    const base = `${nutritionBasePath(clientId)}/${draft.assessment.id}`;
    if (mode === 'review') {
      router.push(asHref(`${base}/review`));
      return;
    }
    router.push(asHref(`${base}/resume`));
  };

  const discardDraft = () => {
    if (!services || !account?.accountId || !existingDraft || locked) {
      return;
    }
    Alert.alert(
      nutritionStrings.discardConfirmTitle,
      nutritionStrings.discardConfirmBody,
      [
        { text: nutritionStrings.discardCancel, style: 'cancel' },
        {
          text: nutritionStrings.discardConfirmAction,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await services.discardDraft({
                  assessmentId: existingDraft.assessment.id,
                  accountId: account.accountId,
                  confirmed: true,
                });
                setExistingDraft(null);
              } catch (caught) {
                setError(mapNutritionServiceError(caught));
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  const startSelected = async () => {
    if (!services || !account?.accountId || !clientId || !selectedType || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await services.startAssessment({
        clientId,
        accountId: account.accountId,
        assessmentType: selectedType,
        encounterId: encounterId ?? null,
      });
      if (result.kind === 'existingDraft') {
        setExistingDraft(result.draft);
        return;
      }
      if (result.kind === 'moreInformationRequired') {
        setMoreInformationRequired(true);
        setError(mapNutritionServiceError(result.message));
        return;
      }
      if (result.kind === 'unavailable') {
        setError(mapNutritionServiceError(result.message));
        return;
      }
      const sectionId =
        result.draft.progressSectionId ?? result.draft.template.sections[0]?.id;
      router.replace(
        asHref(`${nutritionBasePath(clientId)}/${result.draft.assessment.id}/section/${sectionId}`),
      );
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  const backToHistory = () => router.replace(asHref(`${nutritionBasePath(clientId)}`));

  if (loading) {
    return (
      <NutritionCentreShell testID="nutrition-start-screen">
        <LoadingState message={nutritionStrings.loading} />
      </NutritionCentreShell>
    );
  }

  if (existingDraft) {
    return (
      <NutritionCentreShell testID="nutrition-start-existing-draft">
        <NutritionCentreHeader
          title={nutritionStrings.startTitle}
          subtitle={clientName || nutritionStrings.clientEntry}
          onBack={backToHistory}
          backLabel={nutritionStrings.backToHistory}
        />
        {locked ? (
          <AppText variant="body" color="warning">
            {nutritionStrings.lockedBanner}
          </AppText>
        ) : null}
        <NutritionDraftCard
          draft={existingDraft}
          onResume={() => navigateToDraft(existingDraft, 'resume')}
          onReview={() => navigateToDraft(existingDraft, 'review')}
          onDiscard={discardDraft}
        />
      </NutritionCentreShell>
    );
  }

  if (templates.length === 0) {
    return (
      <NutritionCentreShell testID="nutrition-start-unavailable">
        <NutritionCentreHeader
          title={nutritionStrings.unavailableTitle}
          subtitle={clientName || nutritionStrings.clientEntry}
          onBack={backToHistory}
          backLabel={nutritionStrings.backToHistory}
        />
        <View style={styles.messageBlock}>
          {moreInformationRequired ? (
            <>
              <AppText variant="body">{nutritionStrings.moreInformationRequiredBody}</AppText>
              <NutritionMissingInformation items={['age']} />
            </>
          ) : (
            <AppText variant="body">{nutritionStrings.unavailableAssessmentBody}</AppText>
          )}
        </View>
      </NutritionCentreShell>
    );
  }

  return (
    <NutritionCentreShell testID="nutrition-start-screen">
      <NutritionCentreHeader
        title={nutritionStrings.startTitle}
        subtitle={clientName || nutritionStrings.clientEntry}
        onBack={backToHistory}
        backLabel={nutritionStrings.backToHistory}
      />

      {locked ? (
        <AppText variant="body" color="warning">
          {nutritionStrings.lockedBanner}
        </AppText>
      ) : null}

      {error ? (
        <AppStateView variant="error" heading={nutritionStrings.unavailableTitle} explanation={error} />
      ) : null}

      {templates.length > 1 ? (
        <AppText variant="caption" color="secondary">
          {nutritionStrings.startChooseType}
        </AppText>
      ) : null}

      <View style={styles.typeList}>
        {templates.map((template) => (
          <NutritionAssessmentTypeCard
            key={template.templateId}
            template={template}
            selected={selectedType === template.assessmentType}
            onPress={() => setSelectedType(template.assessmentType)}
          />
        ))}
      </View>

      {developmentDisclaimer ? (
        <DevelopmentBanner message={developmentDisclaimer} variant="info" />
      ) : null}

      <AppButton
        label={startLabel}
        onPress={() => void startSelected()}
        disabled={!selectedType || busy || locked}
        loading={busy}
        testID="nutrition-start-confirm"
      />
    </NutritionCentreShell>
  );
}

const styles = StyleSheet.create({
  typeList: {
    gap: spacing.base,
  },
  messageBlock: {
    gap: spacing.base,
  },
});
