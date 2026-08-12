import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, type AppStateStatus, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
  StatusChip,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import {
  canDemoDetailMarkSolved,
  canDemoDetailReopen,
  canDemoDetailTake,
} from '../demo/reachDemoActions';
import { isDemoReachRequestId, reopenSyntheticReachDemoRequest } from '../demo/reachDemoInbox';
import { CommunityRequestPrivacyNotice } from '../components/CommunityRequestPrivacyNotice';
import {
  CommunityRequestErrorState,
  communityRequestErrorCopy,
} from '../components/CommunityRequestStateViews';
import { EmergencyCoordinationBanner } from '../components/EmergencyCoordinationBanner';
import {
  canAcknowledge,
  canEscalate,
  canMarkHandled,
  canRecordContactAttempt,
} from '../domain/actions';
import { CommunityRequestError, mapCommunityRequestError } from '../domain/errors';
import {
  communityRequestCategoryLabel,
  communityRequestStatusLabel,
  communityRequestStatusTone,
  communityRequestTypeLabel,
  formatCommunityRequestSubmittedAt,
  isEmergencyRequest,
} from '../domain/labels';
import type { WorkerRequestDetail } from '../domain/types';
import { useCommunityRequestServices } from '../hooks/useCommunityRequestServices';
import { subscribeCommunityRequestViewClears } from '../session/communityRequestViewStore';

type MutationKind = 'acknowledge' | 'escalate' | 'contactAttempt' | 'markHandled';

export function CommunityRequestDetailScreen() {
  const t = useTranslation();
  const { requestId: rawId } = useLocalSearchParams<{ requestId: string }>();
  const requestId = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const services = useCommunityRequestServices();
  const servicesRef = useRef(services);
  servicesRef.current = services;
  const { session, touchActivity, authState } = useAuthSession();
  const [detail, setDetail] = useState<WorkerRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [mutating, setMutating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const screenFocusedRef = useRef(false);

  const clearSensitive = useCallback(() => {
    setDetail(null);
    setStatusMessage(null);
  }, []);

  const load = useCallback(
    async (options?: { readonly silent?: boolean }) => {
      if (!requestId || !session || authState !== 'authenticated') {
        setLoading(false);
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (!options?.silent) setLoading(true);
      try {
        const next = await servicesRef.current.getCommunityRequest(requestId, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setDetail(next);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err);
      } finally {
        inFlightRef.current = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [authState, requestId, session],
  );

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    return subscribeCommunityRequestViewClears(() => {
      clearSensitive();
      setError(null);
    });
  }, [clearSensitive]);

  useFocusEffect(
    useCallback(() => {
      screenFocusedRef.current = true;
      if (!requestId) {
        setLoading(false);
        setError(new Error('missing-request-id'));
        return () => {
          screenFocusedRef.current = false;
        };
      }
      void load();
      return () => {
        screenFocusedRef.current = false;
        abortRef.current?.abort();
      };
    }, [load, requestId]),
  );

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (
        next === 'active' &&
        screenFocusedRef.current &&
        authState === 'authenticated' &&
        session
      ) {
        void load({ silent: true });
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [authState, load, session]);

  function escalateErrorAlert(kind: ReturnType<typeof mapCommunityRequestError>): {
    title: string;
    body: string;
  } {
    if (kind === 'conflict' || kind === 'alreadyAssigned' || kind === 'invalidTransition') {
      return {
        title: t.communityRequests.conflictTitle,
        body: t.communityRequests.escalateFailureConflict,
      };
    }
    if (kind === 'forbidden') {
      return {
        title: t.communityRequests.forbiddenTitle,
        body: t.communityRequests.escalateFailureForbidden,
      };
    }
    if (kind === 'offline' || kind === 'timeout' || kind === 'reachDisabled' || kind === 'auth') {
      const copy = communityRequestErrorCopy(kind, t.communityRequests);
      return { title: copy.heading, body: copy.body };
    }
    return {
      title: t.communityRequests.errorTitle,
      body: t.communityRequests.escalateFailureGeneric,
    };
  }

  async function runMutation(kind: MutationKind) {
    if (!detail || mutating) return;
    setMutating(true);
    setStatusMessage(null);
    try {
      const expectedVersion = detail.version;
      if (kind === 'acknowledge') {
        await servicesRef.current.acknowledgeCommunityRequest(detail.requestId, expectedVersion);
        setStatusMessage(t.communityRequests.acknowledgeSuccess);
      } else if (kind === 'escalate') {
        await servicesRef.current.escalateCommunityRequest(detail.requestId, expectedVersion);
        setStatusMessage(t.communityRequests.escalateSuccess);
      } else if (kind === 'contactAttempt') {
        await servicesRef.current.recordCommunityContactAttempt(detail.requestId, expectedVersion);
        setStatusMessage(t.communityRequests.contactAttemptSuccess);
      } else {
        await servicesRef.current.markCommunityRequestHandled(detail.requestId, expectedVersion);
        setStatusMessage(t.communityRequests.markHandledSuccess);
      }
      await load({ silent: true });
    } catch (err) {
      const kindMapped = mapCommunityRequestError(err);
      setError(err);
      setStatusMessage(null);
      if (kindMapped === 'alreadyAssigned' || kindMapped === 'conflict') {
        await load({ silent: true });
      }
      if (kind === 'escalate') {
        const copy = escalateErrorAlert(kindMapped);
        Alert.alert(copy.title, copy.body);
      } else {
        const copy = communityRequestErrorCopy(kindMapped, t.communityRequests);
        Alert.alert(copy.heading, copy.body);
      }
    } finally {
      setMutating(false);
    }
  }

  function confirmMutation(kind: MutationKind) {
    if (mutating) return;
    const emergency = detail
      ? isEmergencyRequest(detail.category, detail.requestType)
      : false;
    const titles: Record<MutationKind, { title: string; body: string; confirm: string }> = {
      acknowledge: {
        title: t.communityRequests.acknowledgeConfirmTitle,
        body: t.communityRequests.acknowledgeConfirmBody,
        confirm: t.communityRequests.confirmAction,
      },
      escalate: {
        title: t.communityRequests.escalateConfirmTitle,
        body: t.communityRequests.escalateConfirmBody,
        confirm: t.communityRequests.escalateConfirmAction,
      },
      contactAttempt: {
        title: t.communityRequests.contactAttemptConfirmTitle,
        body: t.communityRequests.contactAttemptConfirmBody,
        confirm: t.communityRequests.confirmAction,
      },
      markHandled: {
        title: t.communityRequests.markHandledConfirmTitle,
        body: emergency
          ? t.communityRequests.markHandledConfirmBodyEmergency
          : t.communityRequests.markHandledConfirmBody,
        confirm: t.communityRequests.confirmAction,
      },
    };
    const copy = titles[kind];
    Alert.alert(copy.title, copy.body, [
      { text: t.communityRequests.cancelAction, style: 'cancel' },
      {
        text: copy.confirm,
        onPress: () => {
          void runMutation(kind);
        },
      },
    ]);
  }

  if (!requestId) {
    return (
      <AppScreen testID="community-request-detail-missing">
        <CommunityRequestErrorState
          error={new CommunityRequestError('communityRequestNotFound')}
          onBack={() => router.replace('/(worker)/community-requests' as Href)}
        />
      </AppScreen>
    );
  }

  if (loading && !detail) {
    return (
      <AppScreen testID="community-request-detail-loading">
        <LoadingState message={t.communityRequests.loadingDetail} />
      </AppScreen>
    );
  }

  if (error && !detail) {
    return (
      <AppScreen testID="community-request-detail-error">
        <CommunityRequestErrorState
          error={error}
          onRetry={() => {
            void load();
          }}
          onBack={() => router.replace('/(worker)/community-requests' as Href)}
        />
      </AppScreen>
    );
  }

  if (!detail || !session) {
    return (
      <AppScreen testID="community-request-detail-unavailable">
        <CommunityRequestErrorState
          error={new CommunityRequestError('communityRequestNotFound')}
          onBack={() => router.replace('/(worker)/community-requests' as Href)}
        />
      </AppScreen>
    );
  }

  const emergency = isEmergencyRequest(detail.category, detail.requestType);
  const statusLabel = communityRequestStatusLabel(detail.status);
  const centre = t.communityRequests.centre;
  const isDemo = isDemoReachRequestId(detail.requestId);

  async function runDemoReopen() {
    if (!detail || mutating) return;
    setMutating(true);
    try {
      reopenSyntheticReachDemoRequest(detail.requestId, detail.version);
      setStatusMessage(t.communityRequests.acknowledgeSuccess);
      await load({ silent: true });
    } finally {
      setMutating(false);
    }
  }

  function confirmDemoReopen() {
    Alert.alert(centre.reopenRequest, centre.reopenRequestHint, [
      { text: t.communityRequests.cancelAction, style: 'cancel' },
      {
        text: t.communityRequests.confirmAction,
        onPress: () => {
          void runDemoReopen();
        },
      },
    ]);
  }

  return (
    <ScrollableAppScreen testID="community-request-detail-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.communityRequests.detailTitle}</ScreenTitle>
        {emergency ? <EmergencyCoordinationBanner /> : null}
        <CommunityRequestPrivacyNotice emergency={emergency} />
        {emergency ? (
          <AppText variant="label" color="urgent" testID="community-request-detail-emergency">
            {t.communityRequests.emergencyLabel}
          </AppText>
        ) : null}
        <AppText variant="bodyStrong">
          {communityRequestCategoryLabel(detail.category, t.communityRequests)}
        </AppText>
        <AppText variant="caption" color="secondary">
          {communityRequestTypeLabel(detail.requestType, t.communityRequests)}
        </AppText>
        <AppText
          variant="body"
          accessibilityLabel={`${t.communityRequests.communityOrLandmark}: ${detail.communityOrLandmark}`}
        >
          {t.communityRequests.communityOrLandmark}: {detail.communityOrLandmark}
        </AppText>
        <AppText variant="body">
          {t.communityRequests.preferredLanguage}: {detail.preferredLanguage}
        </AppText>
        <AppText
          variant="body"
          accessibilityLabel={`${t.communityRequests.contactNumber}: ${detail.contactNumber}`}
          testID="community-request-contact-number"
        >
          {t.communityRequests.contactNumber}: {detail.contactNumber}
        </AppText>
        <AppText
          variant="body"
          accessibilityLabel={`${t.communityRequests.consentToContact}: ${detail.consentToContact ? t.communityRequests.consentYes : t.communityRequests.consentNo}`}
        >
          {t.communityRequests.consentToContact}:{' '}
          {detail.consentToContact
            ? t.communityRequests.consentYes
            : t.communityRequests.consentNo}
        </AppText>
        <AppText
          variant="body"
          accessibilityLabel={`${t.communityRequests.consentToShareLocation}: ${detail.consentToShareLocation ? t.communityRequests.consentYes : t.communityRequests.consentNo}`}
        >
          {t.communityRequests.consentToShareLocation}:{' '}
          {detail.consentToShareLocation
            ? t.communityRequests.consentYes
            : t.communityRequests.consentNo}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
          <AppText variant="caption" color="secondary">
            {t.communityRequests.statusLabel}:
          </AppText>
          <StatusChip label={statusLabel} tone={communityRequestStatusTone(detail.status)} />
        </View>
        <AppText variant="caption" color="secondary">
          {t.communityRequests.assignmentLabel}:{' '}
          {detail.assignedToCaller
            ? t.communityRequests.assignedToMe
            : t.communityRequests.notAssignedToMe}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.communityRequests.submittedAt}:{' '}
          {formatCommunityRequestSubmittedAt(detail.createdAt)}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.communityRequests.updatedAt}:{' '}
          {formatCommunityRequestSubmittedAt(detail.updatedAt)}
        </AppText>
        <AppText variant="caption" color="secondary">
          {emergency
            ? t.communityRequests.emergencyHandledMeaning
            : (detail.handledMeans ?? t.communityRequests.handledMeansDefault)}
        </AppText>
        {statusMessage ? (
          <AppText
            variant="body"
            color="stable"
            accessibilityLiveRegion="polite"
            testID="community-request-status-message"
          >
            {statusMessage}
          </AppText>
        ) : null}
        {mutating ? (
          <AppText variant="caption" color="secondary">
            {t.communityRequests.mutating}
          </AppText>
        ) : null}
        {isDemo && canDemoDetailTake(detail) ? (
          <AppButton
            label={centre.takeRequest}
            onPress={() => confirmMutation('acknowledge')}
            disabled={mutating}
            loading={mutating}
            testID="community-request-demo-take"
          />
        ) : canAcknowledge(detail) ? (
          <AppButton
            label={t.communityRequests.acknowledge}
            onPress={() => confirmMutation('acknowledge')}
            disabled={mutating}
            loading={mutating}
            testID="community-request-acknowledge"
          />
        ) : null}
        {canEscalate(detail) ? (
          <AppButton
            label={t.communityRequests.escalate}
            variant="secondary"
            onPress={() => confirmMutation('escalate')}
            disabled={mutating}
            loading={mutating}
            accessibilityHint="Records that this request needs further human support. Does not contact an ambulance."
            testID="community-request-escalate"
          />
        ) : null}
        {canRecordContactAttempt(detail) ? (
          <AppButton
            label={t.communityRequests.contactAttempt}
            variant="secondary"
            onPress={() => confirmMutation('contactAttempt')}
            disabled={mutating}
            loading={mutating}
            testID="community-request-contact-attempt"
          />
        ) : null}
        {isDemo && canDemoDetailMarkSolved(detail) ? (
          <AppButton
            label={centre.markSolved}
            onPress={() => confirmMutation('markHandled')}
            disabled={mutating}
            loading={mutating}
            testID="community-request-demo-mark-handled"
          />
        ) : canMarkHandled(detail) ? (
          <AppButton
            label={t.communityRequests.markHandled}
            onPress={() => confirmMutation('markHandled')}
            disabled={mutating}
            loading={mutating}
            testID="community-request-mark-handled"
          />
        ) : null}
        {canDemoDetailReopen(detail) ? (
          <AppButton
            label={centre.reopenRequest}
            variant="secondary"
            onPress={confirmDemoReopen}
            disabled={mutating}
            loading={mutating}
            testID="community-request-demo-reopen"
          />
        ) : null}
        <AppButton
          label={t.communityRequests.startClientLookup}
          variant="secondary"
          onPress={() => router.push('/(worker)/clients' as Href)}
          disabled={mutating}
          testID="community-request-start-client-lookup"
        />
        <AppButton
          label={t.communityRequests.refresh}
          variant="tertiary"
          onPress={() => {
            void load();
          }}
          disabled={mutating}
          testID="community-request-detail-refresh"
        />
        <AppButton
          label={t.communityRequests.back}
          variant="tertiary"
          onPress={() => router.back()}
          testID="community-request-detail-back"
        />
      </View>
    </ScrollableAppScreen>
  );
}
