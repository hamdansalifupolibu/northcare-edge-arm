import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { QuestionField } from '../../screening/components/QuestionField';
import { evaluateVisibility } from '../../screening/engine/evaluateVisibility';
import {
  getNextSectionId,
  getPreviousSectionId,
  getSectionProgress,
} from '../../screening/engine/templateEngine';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { NutritionCorrectionBanner } from '../components/centre/NutritionCorrectionBanner';
import { NutritionCriticalQuestionCard } from '../components/centre/NutritionCriticalQuestionCard';
import { NutritionSectionStepper } from '../components/centre/NutritionSectionStepper';
import { NutritionTemplateSectionHeader } from '../components/centre/NutritionTemplateSectionHeader';
import type { NutritionDraft } from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { isCriticalNutritionQuestion } from '../utils/nutritionSectionTheme';
import { nutritionBasePath } from './NutritionHistoryScreen';

export function NutritionSectionScreen() {
  const nutritionStrings = useNutritionStrings();
  const { clientId, assessmentId, sectionId } = useLocalSearchParams<{
    clientId: string;
    assessmentId: string;
    sectionId: string;
  }>();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const [draft, setDraft] = useState<NutritionDraft | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, RecordedScreeningAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !assessmentId) {
      return;
    }
    setLoading(true);
    try {
      const result = await services.getDraft(assessmentId);
      setDraft(result);
      if (result) {
        const map: Record<string, RecordedScreeningAnswer> = {};
        for (const answer of result.answers) {
          map[answer.questionId] = answer;
        }
        setLocalAnswers(map);
      }
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

  const screeningTemplate = draft ? services?.getScreeningTemplate(draft.template) : null;
  const answerList = useMemo(() => Object.values(localAnswers), [localAnswers]);
  const section = screeningTemplate?.sections.find((item) => item.id === sectionId);
  const progress =
    screeningTemplate && sectionId ? getSectionProgress(screeningTemplate, sectionId) : null;
  const visibleQuestions =
    section?.questions.filter((question) =>
      evaluateVisibility(question.visibleWhen, answerList),
    ) ?? [];
  const isCorrection = Boolean(draft?.assessment.supersedesId);

  const persistAnswer = async (answer: RecordedScreeningAnswer) => {
    if (!services || !account?.accountId || !assessmentId || locked) {
      return;
    }
    setLocalAnswers((prev) => ({ ...prev, [answer.questionId]: answer }));
    const question = section?.questions.find((item) => item.id === answer.questionId);
    if (
      question?.answerType === 'measurement' &&
      answer.state === 'answered' &&
      answer.value?.kind === 'measurement' &&
      question.measurementType
    ) {
      const updated = await services.recordMeasurement({
        assessmentId,
        accountId: account.accountId,
        questionId: answer.questionId,
        numericValue: answer.value.value,
        unit: answer.value.unit,
        measurementType: question.measurementType,
      });
      setDraft(updated);
      return;
    }
    const updated = await services.recordAnswer({
      assessmentId,
      accountId: account.accountId,
      answer,
    });
    setDraft(updated);
  };

  const saveAndContinue = async () => {
    if (!services || !account?.accountId || !draft || !sectionId || !screeningTemplate || locked) {
      return;
    }
    setSaving(true);
    try {
      const next = getNextSectionId(screeningTemplate, sectionId);
      await services.saveDraft({
        assessmentId: draft.assessment.id,
        accountId: account.accountId,
        progressSectionId: next ?? sectionId,
      });
      if (next) {
        router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/section/${next}`));
      } else {
        router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/review`));
      }
    } finally {
      setSaving(false);
    }
  };

  const saveAndExit = async () => {
    if (!services || !account?.accountId || !draft || !sectionId || locked) {
      return;
    }
    setSaving(true);
    try {
      await services.saveDraft({
        assessmentId: draft.assessment.id,
        accountId: account.accountId,
        progressSectionId: sectionId,
      });
      router.replace(asHref(`/(worker)/clients/${clientId}`));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft || !screeningTemplate) {
    return (
      <NutritionCentreShell testID="nutrition-section-screen">
        <LoadingState message={nutritionStrings.loading} />
      </NutritionCentreShell>
    );
  }

  if (!section || !progress) {
    return (
      <NutritionCentreShell>
        <AppText variant="body">{nutritionStrings.sectionMissing}</AppText>
      </NutritionCentreShell>
    );
  }

  const previous = getPreviousSectionId(screeningTemplate, sectionId);

  return (
    <NutritionCentreShell testID="nutrition-section-screen">
      <NutritionCentreHeader
        title={draft.template.title}
        subtitle={progress.label}
        onBack={() =>
          previous
            ? router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/section/${previous}`))
            : router.replace(asHref(`${nutritionBasePath(clientId)}`))
        }
        backLabel={nutritionStrings.sectionBack}
      />

      <NutritionSectionStepper
        sectionIndex={progress.sectionIndex}
        sectionCount={progress.sectionCount}
        label={progress.label}
      />

      {isCorrection ? <NutritionCorrectionBanner message={nutritionStrings.correctionBanner} /> : null}

      {locked ? (
        <AppText variant="body" color="warning">
          {nutritionStrings.lockedBanner}
        </AppText>
      ) : null}

      <NutritionTemplateSectionHeader
        sectionId={section.id}
        title={section.title}
        description={section.description}
      />

      <View style={{ gap: spacing.base }}>
        {visibleQuestions.map((question) => {
          const field = (
            <QuestionField
              key={question.id}
              question={question}
              answer={localAnswers[question.id]}
              onChange={(answer) => {
                void persistAnswer(answer);
              }}
            />
          );
          if (isCriticalNutritionQuestion(question.id)) {
            return (
              <NutritionCriticalQuestionCard
                key={question.id}
                title={question.label}
                helpText={question.helpText}
              >
                {field}
              </NutritionCriticalQuestionCard>
            );
          }
          return field;
        })}
      </View>

      <AppButton
        label={nutritionStrings.sectionContinue}
        onPress={() => void saveAndContinue()}
        disabled={saving || locked}
        testID="nutrition-section-continue"
      />
      <AppButton
        label={nutritionStrings.sectionSaveAndExit}
        variant="secondary"
        onPress={() => void saveAndExit()}
        disabled={saving || locked}
      />
    </NutritionCentreShell>
  );
}
