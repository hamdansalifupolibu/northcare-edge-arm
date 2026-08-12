import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { parseReferralPassportQr } from '../security/qrPassportParser';
import {
  clearPendingPassportToken,
  setPendingPassportToken,
} from '../security/transientPassportTokenStore';

/**
 * Strict deep-link handling for referral passports.
 * Auth-gates resolution; keeps opaque token only in memory until consumed.
 */
export function useReferralPassportDeepLink(): void {
  const router = useRouter();
  const { authState, ready } = useAuthSession();

  useEffect(() => {
    if (!ready) {
      return;
    }

    const handleUrl = (url: string) => {
      const parsed = parseReferralPassportQr(url);
      if (!parsed.ok) {
        return;
      }
      if (parsed.version === 1) {
        setPendingPassportToken(parsed.opaqueToken);
        if (authState !== 'authenticated') {
          router.push('/(auth)/worker-login');
          return;
        }
        router.push('/(worker)/referrals/enter-code');
        return;
      }
      // Signed offline passport — verify screen does not need opaque token storage.
      router.push('/(worker)/referrals/verify');
    };

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      sub.remove();
    };
  }, [ready, authState, router]);

  useEffect(() => {
    if (authState === 'signedOut') {
      clearPendingPassportToken();
    }
  }, [authState]);
}
