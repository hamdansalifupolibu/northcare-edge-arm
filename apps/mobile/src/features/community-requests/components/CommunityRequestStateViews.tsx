import { AppStateView } from '../../../design-system';
import type { AppStrings } from '../../../i18n/en';
import { en } from '../../../i18n/en';
import { useTranslation } from '../../../i18n/LanguageProvider';
import {
  mapCommunityRequestError,
  type CommunityRequestUiErrorKind,
} from '../domain/errors';
import type { CommunityRequestListFilter } from '../domain/types';

export function communityRequestEmptyCopy(
  filter: CommunityRequestListFilter,
  strings: AppStrings['communityRequests'] = en.communityRequests,
): string {
  return strings.empty[filter];
}

export function communityRequestErrorCopy(
  kind: CommunityRequestUiErrorKind,
  strings: AppStrings['communityRequests'] = en.communityRequests,
): {
  readonly heading: string;
  readonly body: string;
} {
  switch (kind) {
    case 'offline':
      return {
        heading: strings.offlineTitle,
        body: strings.offlineBody,
      };
    case 'timeout':
      return {
        heading: strings.timeoutTitle,
        body: strings.timeoutBody,
      };
    case 'reachDisabled':
      return {
        heading: strings.reachDisabledTitle,
        body: strings.reachDisabledBody,
      };
    case 'auth':
      return {
        heading: strings.authTitle,
        body: strings.authBody,
      };
    case 'forbidden':
      return {
        heading: strings.forbiddenTitle,
        body: strings.forbiddenBody,
      };
    case 'notFound':
      return {
        heading: strings.notFoundTitle,
        body: strings.notFoundBody,
      };
    case 'conflict':
      return {
        heading: strings.conflictTitle,
        body: strings.conflictBody,
      };
    case 'alreadyAssigned':
      return {
        heading: strings.alreadyAssignedTitle,
        body: strings.alreadyAssignedBody,
      };
    case 'invalidTransition':
      return {
        heading: strings.invalidTransitionTitle,
        body: strings.invalidTransitionBody,
      };
    default:
      return {
        heading: strings.errorTitle,
        body: strings.errorBody,
      };
  }
}

export function CommunityRequestOfflineState(props: {
  readonly onRetry?: () => void;
  readonly onBackHome?: () => void;
}) {
  const t = useTranslation();

  return (
    <AppStateView
      variant="offline"
      heading={t.communityRequests.offlineTitle}
      explanation={t.communityRequests.offlineBody}
      primaryActionLabel={props.onRetry ? t.communityRequests.retry : undefined}
      onPrimaryAction={props.onRetry}
      secondaryActionLabel={props.onBackHome ? t.communityRequests.backHome : undefined}
      onSecondaryAction={props.onBackHome}
      testID="community-requests-offline"
    />
  );
}

export function CommunityRequestErrorState(props: {
  readonly error: unknown;
  readonly onRetry?: () => void;
  readonly onBack?: () => void;
  readonly testID?: string;
}) {
  const t = useTranslation();
  const kind = mapCommunityRequestError(props.error);
  const copy = communityRequestErrorCopy(kind, t.communityRequests);
  const variant = kind === 'offline' ? 'offline' : 'error';
  return (
    <AppStateView
      variant={variant}
      heading={copy.heading}
      explanation={copy.body}
      primaryActionLabel={props.onRetry ? t.communityRequests.retry : undefined}
      onPrimaryAction={props.onRetry}
      secondaryActionLabel={props.onBack ? t.communityRequests.back : undefined}
      onSecondaryAction={props.onBack}
      testID={props.testID ?? `community-requests-error-${kind}`}
    />
  );
}

export { mapCommunityRequestError };
