import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { QuestionField } from '../../screening/components/QuestionField';
import { evaluateVisibility } from '../../screening/engine/evaluateVisibility';
import {
  getNextSectionId,
  getPreviousSectionId,
  getSectionProgress,
} from '../../screening/engine/templateEngine';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import type { VisitDraft } from '../application/createVisitServices';
import { useVisitServices } from '../hooks/useVisitServices';

export function VisitScreeningSectionScreen() {
  const { clientId, visitId, sectionId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
    sectionId: string;
  }>();
  const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const services = useVisitServices();
  const [draft, setDraft] = useState<VisitDraft | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, RecordedScreeningAnswer>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!services || !visitId) {
      return;
    }
    setLoading(true);
    try {
      const result = await services.getVisitDraft(visitId);
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
  }, [services, visitId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const answerList = useMemo(() => Object.values(localAnswers), [localAnswers]);
  const section = draft?.template.sections.find((item) => item.id === sectionId);
  const progress = draft && sectionId ? getSectionProgress(draft.template, sectionId) : null;
  const visibleQuestions =
    section?.questions.filter((question) =>
      evaluateVisibility(question.visibleWhen, answerList),
    ) ?? [];

  const persistAnswer = async (answer: RecordedScreeningAnswer) => {
    if (!services || !session?.accountId || !visitId) {
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
      await services.recordMeasurement({
        visitId,
        accountId: session.accountId,
        questionId: answer.questionId,
        numericValue: answer.value.value,
        unit: answer.value.unit,
        measurementType: question.measurementType,
      });
      return;
    }
    await services.recordScreeningAnswer({
      visitId,
      accountId: session.accountId,
      answer,
    });
  };

  const saveAndContinue = async () => {
    if (!services || !session?.accountId || !draft || !sectionId) {
      return;
    }
    setSaving(true);
    try {
      const next = getNextSectionId(draft.template, sectionId);
      await services.saveVisitDraft({
        visitId: draft.encounter.id,
        accountId: session.accountId,
        progressSectionId: next ?? sectionId,
      });
      if (next) {
        router.push(`/(worker)/clients/${clientId}/visits/${visitId}/screening/${next}`);
      } else {
        router.push(`/(worker)/clients/${clientId}/visits/${visitId}/review`);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveAndExit = async () => {
    if (!services || !session?.accountId || !draft || !sectionId) {
      return;
    }
    setSaving(true);
    try {
      await services.saveVisitDraft({
        visitId: draft.encounter.id,
        accountId: session.accountId,
        progressSectionId: sectionId,
      });
      router.replace(`/(worker)/clients/${clientId}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <AppScreen>
        <LoadingState message={t.visits.loading} />
      </AppScreen>
    );
  }

  if (!section || !progress) {
    return (
      <AppScreen>
        <AppText variant="body">{t.visits.errors.sectionMissing}</AppText>
      </AppScreen>
    );
  }

  const previous = getPreviousSectionId(draft.template, sectionId);

  return (
    <ScrollableAppScreen testID="visit-screening-section">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{draft.template.title}</ScreenTitle>
        <AppText variant="caption" color="secondary" accessibilityLabel={progress.label}>
          {progress.label}
        </AppText>
        <AppText variant="caption" color="warning">
          {draft.template.developmentBanner}
        </AppText>
        <AppText variant="headingSmall">{section.title}</AppText>
        {section.description ? (
          <AppText variant="body" color="secondary">
            {section.description}
          </AppText>
        ) : null}

        {visibleQuestions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            answer={localAnswers[question.id]}
            onChange={(answer) => {
              void persistAnswer(answer);
            }}
          />
        ))}

        <AppButton
          label={t.visits.screening.continue}
          onPress={() => void saveAndContinue()}
          disabled={saving}
          testID="screening-continue"
        />
        <AppButton
          label={t.visits.screening.saveAndExit}
          variant="secondary"
          onPress={() => void saveAndExit()}
          disabled={saving}
        />
        {previous ? (
          <AppButton
            label={t.visits.screening.back}
            variant="tertiary"
            onPress={() =>
              router.push(
                `/(worker)/clients/${clientId}/visits/${visitId}/screening/${previous}`,
              )
            }
          />
        ) : null}
      </View>
    </ScrollableAppScreen>
  );
}
