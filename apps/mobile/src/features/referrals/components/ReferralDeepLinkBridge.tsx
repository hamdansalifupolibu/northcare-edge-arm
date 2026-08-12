import { useReferralPassportDeepLink } from '../navigation/useReferralPassportDeepLink';

/** Mount once under authenticated app tree to handle passport deep links. */
export function ReferralDeepLinkBridge() {
  useReferralPassportDeepLink();
  return null;
}
