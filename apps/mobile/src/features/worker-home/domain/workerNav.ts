import type { WorkerNavTab } from '../components/WorkerBottomNav';

/** Client list routes that share the clients tab but are not a profile screen. */
const CLIENTS_TAB_STATIC_ROUTES = new Set(['register']);

function isClientProfileRoute(segments: readonly string[]): boolean {
  return (
    segments.length === 3 &&
    segments[1] === 'clients' &&
    !CLIENTS_TAB_STATIC_ROUTES.has(segments[2])
  );
}

/** Show bottom nav only on primary worker tab roots — hide during clinical sub-flows. */
export function resolveWorkerNavTab(segments: readonly string[]): WorkerNavTab | null {
  if (segments[0] !== '(worker)') {
    return null;
  }
  if (segments.length === 1) {
    return 'home';
  }
  const section = segments[1];
  if (segments.length === 2) {
    if (section === 'clients') return 'clients';
    if (section === 'nutrition') return 'assessments';
    if (section === 'referrals') return 'referrals';
    if (section === 'more') return 'more';
  }
  if (section === 'clients' && isClientProfileRoute(segments)) {
    return 'clients';
  }
  if (section === 'more' && segments.length === 3) {
    if (segments[2] === 'settings' || segments[2] === 'reset-password') {
      return 'more';
    }
  }
  return null;
}

export function shouldShowWorkerBottomNav(segments: readonly string[]): boolean {
  return resolveWorkerNavTab(segments) !== null;
}

/** Extra scroll padding when bottom nav is visible. */
export const WORKER_BOTTOM_NAV_CLEARANCE = 72;
