import { Platform } from 'react-native';

/**
 * Conservative CPU thread count for Stage 1.
 * Prefer stability over saturating every core.
 */
export function resolveOfflineAiThreadCount(): number {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return 1;
  }
  // S20 Ultra class devices commonly expose 8 cores; keep half for UI/runtime headroom.
  return 4;
}
