import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  LoadingState,
  ScrollableAppScreen,
  ScreenTitle,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { spacing } from '../../../theme';
import type { EvaluatedRiskResult } from '../application/createRiskServices';
import { MissingInformationCard } from '../components/MissingInformationCard';
import { PriorityExplanationCard } from '../components/PriorityExplanationCard';
import { PriorityResultHeader } from '../components/PriorityResultHeader';
import { RiskFactorList } from '../components/RiskFactorList';
import { RulePackUnavailableState } from '../components/RulePackUnavailableState';
import { WorkerAcknowledgement } from '../components/WorkerAcknowledgement';
import type { RiskUiState } from '../domain/results';
import { useRiskServices } from '../hooks/useRiskServices';
import { riskStrings } from '../i18n/riskStrings';

export function PriorityEvaluationScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const services = useRiskServices();
  const [uiState, setUiState] = useState<RiskUiState>('resolvingRulePack');
  const [evaluation, setEvaluation] = useState<EvaluatedRiskResult | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!services || !session?.accountId || !visitId) {
        return;
      }
      setUiState('evaluating');
      const result = await services.evaluateForVisit({
        visitId,
        accountId: session.accountId,
      });
      if (cancelled) {
        return;
      }
      setEvaluation(result);
      setUiState(
        result.uiState === 'resultReady' ? 'awaitingAcknowledgement' : result.uiState,
      );
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [services, session?.accountId, visitId]);

  const save = async () => {
    if (!services || !session?.accountId || !visitId || !evaluation?.outcome) {
      return;
    }
    setUiState('saving');
    setError(null);
    try {
      const saved = await services.saveAcknowledgedResult({
        visitId,
        accountId: session.accountId,
        outcome: evaluation.outcome,
        acknowledged: true,
      });
      setSavedAssessmentId(saved.assessment.id);
      setUiState('saved');
    } catch {
      setUiState('saveFailed');
      setError(riskStrings.saveFailed);
    }
  };

  if (
    uiState === 'resolvingRulePack' ||
    uiState === 'validatingInput' ||
    uiState === 'evaluating'
  ) {
    return (
      <ScrollableAppScreen testID="risk-loading">
        <LoadingState message={riskStrings.loading} />
      </ScrollableAppScreen>
    );
  }

  if (uiState === 'rulePackUnavailable') {
    return (
      <ScrollableAppScreen testID="risk-unavailable-screen">
        <RulePackUnavailableState
          onReturnToVisit={() =>
            router.replace(`/(worker)/clients/${clientId}/visits/${visitId}`)
          }
          onReview={() =>
            router.push(`/(worker)/clients/${clientId}/visits/${visitId}/review`)
          }
        />
      </ScrollableAppScreen>
    );
  }

  if (uiState === 'evaluationFailed' || uiState === 'inputIncomplete') {
    return (
      <ScrollableAppScreen testID="risk-failed-screen">
        <View style={{ gap: spacing.base }}>
          <ScreenTitle>
            {uiState === 'inputIncomplete'
              ? riskStrings.incompleteTitle
              : riskStrings.evaluationFailedTitle}
          </ScreenTitle>
          <AppText variant="body">
            {evaluation?.sanitisedMessage ??
              (uiState === 'inputIncomplete'
                ? riskStrings.incompleteBody
                : riskStrings.evaluationFailedBody)}
          </AppText>
          <AppButton
            label={riskStrings.returnToVisit}
            onPress={() =>
              router.replace(`/(worker)/clients/${clientId}/visits/${visitId}`)
            }
          />
        </View>
      </ScrollableAppScreen>
    );
  }

  if (uiState === 'saved' && evaluation?.outcome) {
    return (
      <ScrollableAppScreen testID="risk-saved-screen">
        <View style={{ gap: spacing.base }}>
          <PriorityResultHeader
            priority={evaluation.outcome.priority}
            developmentBanner={evaluation.outcome.developmentBanner}
          />
          <AppText variant="caption" color="secondary">
            {riskStrings.savedOnDevice}
          </AppText>
          <AppText variant="caption" color="secondary">
            {riskStrings.waitingForConnection}
          </AppText>
          <AppButton
            label={riskStrings.viewFactors}
            variant="secondary"
            onPress={() =>
              router.push(`/(worker)/clients/${clientId}/visits/${visitId}/risk/factors`)
            }
          />
          <AppButton
            label={riskStrings.viewHistory}
            variant="tertiary"
            onPress={() =>
              router.push(`/(worker)/clients/${clientId}/visits/${visitId}/risk/history`)
            }
          />
          <AppButton
            label={riskStrings.continueToReferral}
            disabled={!savedAssessmentId}
            onPress={() => {
              if (!savedAssessmentId) return;
              router.push(
                `/(worker)/clients/${clientId}/referrals/create?origin=priorityAssessment&riskAssessmentId=${savedAssessmentId}&visitId=${visitId}`,
              );
            }}
            testID="risk-continue-referral"
          />
          <AppButton
            label={riskStrings.returnToVisit}
            onPress={() =>
              router.replace(`/(worker)/clients/${clientId}/visits/${visitId}`)
            }
            testID="risk-saved-continue"
          />
        </View>
      </ScrollableAppScreen>
    );
  }

  if (!evaluation?.outcome) {
    return (
      <ScrollableAppScreen>
        <LoadingState message={riskStrings.loading} />
      </ScrollableAppScreen>
    );
  }

  const outcome = evaluation.outcome;
  return (
    <ScrollableAppScreen testID={`risk-result-${outcome.priority}`}>
      <View style={{ gap: spacing.base }}>
        <PriorityResultHeader
          priority={outcome.priority}
          developmentBanner={outcome.developmentBanner}
          testID="risk-result-header"
        />
        <PriorityExplanationCard
          summary={outcome.explanationSummary}
          detail={outcome.explanationDetail}
        />
        <RiskFactorList
          factors={outcome.matchedFactors.map((factor) => ({
            ruleId: factor.ruleId,
            factorLabel: factor.factorLabel,
            priority: factor.priority,
            explanationSummary: factor.explanationSummary,
            sourceQuestionKey: factor.sourceQuestionKey,
          }))}
        />
        <MissingInformationCard items={outcome.missingInformation} />
        <AppText variant="caption" color="secondary">
          {riskStrings.rulePackVersion}: {outcome.rulePackId} v{outcome.rulePackVersion}
        </AppText>
        <AppText variant="caption" color="secondary">
          {riskStrings.engineVersion}: {outcome.engineVersion}
        </AppText>
        {uiState !== 'saving' ? (
          <WorkerAcknowledgement checked={acknowledged} onChange={setAcknowledged} />
        ) : (
          <LoadingState message={riskStrings.saving} />
        )}
        {error || uiState === 'saveFailed' ? (
          <AppText variant="body" color="warning">
            {error ?? riskStrings.saveFailed}
          </AppText>
        ) : null}
        <AppButton
          label={riskStrings.saveResult}
          onPress={() => void save()}
          disabled={!acknowledged || uiState === 'saving'}
          testID="risk-save-result"
        />
        <AppButton
          label={riskStrings.returnToVisit}
          variant="tertiary"
          onPress={() =>
            router.replace(`/(worker)/clients/${clientId}/visits/${visitId}`)
          }
        />
      </View>
    </ScrollableAppScreen>
  );
}
