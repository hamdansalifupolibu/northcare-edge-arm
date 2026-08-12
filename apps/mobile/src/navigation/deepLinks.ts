/**
 * Deep-link foundation for scheme `northcare`.
 * Stage 4 only supports safe public entry paths.
 */

export type DeepLinkPolicyResult = {
  readonly allowed: boolean;
  readonly redirectPath: string;
  readonly note: string;
};

const PUBLIC_SAFE_PREFIXES = [
  '/',
  '/(entry)/splash',
  '/(entry)/onboarding',
  '/(entry)/workspace-selection',
  '/(auth)/worker-login',
  '/(auth)/admin-login',
  '/(entry)/worker-entry',
  '/(entry)/admin-entry',
] as const;

/**
 * Reserved / implemented deep-link patterns:
 * - northcare://referral-passport/v1/{opaqueToken} — Stage 10 (auth-gated; handled by ReferralDeepLinkBridge)
 * Future / not fully routed here:
 * - northcare://worker
 * - northcare://admin
 * - northcare://referral/{id}
 * - northcare://client/{id}
 */
export function resolveDeepLinkPath(path: string): DeepLinkPolicyResult {
  const normalised = path.trim() === '' ? '/' : path.startsWith('/') ? path : `/${path}`;

  if (normalised.startsWith('/(development)') || normalised.startsWith('/development')) {
    return {
      allowed: false,
      redirectPath: '/',
      note: 'Development routes are not deep-linkable.',
    };
  }

  if (
    normalised.startsWith('/(worker)') ||
    normalised.startsWith('/worker') ||
    normalised.includes('/referral-passport/') ||
    normalised.includes('/referral/') ||
    normalised.includes('/client/')
  ) {
    return {
      allowed: false,
      redirectPath: '/(auth)/worker-login',
      note: 'Protected or health-related deep links redirect to the worker authentication boundary.',
    };
  }

  if (normalised.startsWith('/(admin)') || normalised.startsWith('/admin')) {
    return {
      allowed: false,
      redirectPath: '/(auth)/admin-login',
      note: 'Administrator deep links redirect to the administrator authentication boundary.',
    };
  }

  const isPublic = PUBLIC_SAFE_PREFIXES.some(
    (prefix) => normalised === prefix || normalised.startsWith(`${prefix}/`),
  );

  if (isPublic || normalised === '/') {
    return {
      allowed: true,
      redirectPath: normalised === '/' ? '/(entry)/splash' : normalised,
      note: 'Public entry path.',
    };
  }

  return {
    allowed: false,
    redirectPath: '/(entry)/splash',
    note: 'Unknown deep link redirected to splash entry.',
  };
}
