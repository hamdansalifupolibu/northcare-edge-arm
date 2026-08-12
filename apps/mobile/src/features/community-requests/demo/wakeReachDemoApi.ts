import { reachDemoHealthUrl, REACH_DEMO_CONFIG } from '../config/reachDemoConfig';

export type WakeReachDemoApiResult = {
  readonly ok: boolean;
  readonly statusCode: number | null;
  readonly elapsedMs: number;
};

/**
 * Pings Render health endpoint to wake the hosted sandbox API.
 * Free tier may take 1–3 minutes on first request after sleep.
 */
export async function wakeReachDemoApi(
  signal?: AbortSignal,
): Promise<WakeReachDemoApiResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REACH_DEMO_CONFIG.wakeTimeoutMs);

  const linked = signal
    ? (() => {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      })()
    : undefined;
  void linked;

  try {
    const response = await fetch(reachDemoHealthUrl(), {
      method: 'GET',
      signal: controller.signal,
    });
    return {
      ok: response.ok,
      statusCode: response.status,
      elapsedMs: Date.now() - started,
    };
  } catch {
    return {
      ok: false,
      statusCode: null,
      elapsedMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timeout);
  }
}
