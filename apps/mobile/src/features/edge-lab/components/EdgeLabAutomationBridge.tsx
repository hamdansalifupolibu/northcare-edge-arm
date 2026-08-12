import { useEffect, useRef } from 'react';

import { getAppConfig } from '../../../config/appConfig';
import {
  clearEdgeLabAutoTrigger,
  isEdgeLabAutoTriggerPresent,
  runEdgeLabHarness,
} from '../services/runEdgeLabHarness';

const POLL_MS = 2000;
const POLL_FOR_MS = 120_000;

/**
 * Development-only: when adb drops `edge-lab-auto-run.trigger` into app documents,
 * run the Edge Lab harness without requiring UI taps.
 * Polls briefly so triggers created after cold start are still seen.
 */
export function EdgeLabAutomationBridge() {
  const started = useRef(false);

  useEffect(() => {
    const config = getAppConfig();
    if (config.appEnv === 'production') {
      return;
    }

    let cancelled = false;
    const begunAt = Date.now();

    const tick = () => {
      void (async () => {
        if (cancelled || started.current) {
          return;
        }
        const present = await isEdgeLabAutoTriggerPresent();
        if (!present) {
          if (Date.now() - begunAt < POLL_FOR_MS && !cancelled) {
            timer = setTimeout(tick, POLL_MS);
          }
          return;
        }
        started.current = true;
        clearEdgeLabAutoTrigger();
        await runEdgeLabHarness('auto');
      })();
    };

    let timer: ReturnType<typeof setTimeout> = setTimeout(tick, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
