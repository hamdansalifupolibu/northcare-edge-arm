import type { StatusChipTone } from '../../../design-system';
import type { AppStrings } from '../../../i18n/en';
import { en } from '../../../i18n/en';

/** Central category labels — presentation only; no clinical interpretation. */
export function communityRequestCategoryLabel(
  category: string,
  strings: AppStrings['communityRequests'] = en.communityRequests,
): string {
  const map = strings.categories as Record<string, string>;
  return map[category] ?? category;
}

export function communityRequestTypeLabel(
  requestType: string,
  strings: AppStrings['communityRequests'] = en.communityRequests,
): string {
  const map = strings.requestTypes as Record<string, string>;
  return map[requestType] ?? requestType;
}

export function communityRequestStatusLabel(
  status: string,
  strings: AppStrings['communityRequests'] = en.communityRequests,
): string {
  const map = strings.statuses as Record<string, string>;
  return map[status] ?? status;
}

export function communityRequestStatusTone(status: string): StatusChipTone {
  switch (status) {
    case 'handled':
      return 'success';
    case 'cancelled':
      return 'neutral';
    case 'escalated':
      return 'warning';
    case 'contactAttempted':
      return 'information';
    case 'acknowledged':
      return 'pending';
    case 'assigned':
    case 'received':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function isEmergencyRequest(category: string, requestType: string): boolean {
  return category === 'emergency' || requestType === 'emergencyAssistance';
}

export function formatCommunityRequestSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  try {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Short relative time for list cards — falls back to locale date when older than 7 days. */
export function formatCommunityRequestRelativeTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    return iso;
  }
  const diffMs = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) {
    return 'now';
  }
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes}m`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours}h`;
  }
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return `${days}d`;
  }
  return formatCommunityRequestSubmittedAt(iso);
}
