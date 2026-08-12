import { useEffect, useRef } from 'react';

import { getAppConfig } from '../../../config/appConfig';
import {
  clearOfflineAiAutoTrigger,
  readOfflineAiAutoTriggerModeAsync,
  runOfflineAiStage1Harness,
} from '../services/runOfflineAiStage1Harness';

/**
 * Development-only: when adb drops `offline-ai-auto-run.trigger` into app documents,
 * run the Stage 1 harness without requiring UI taps.
 */
export function OfflineAiStage1AutomationBridge() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    const config = getAppConfig();
    if (config.appEnv === 'production') {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const mode = await readOfflineAiAutoTriggerModeAsync();
        if (!mode || cancelled || started.current) {
          return;
        }
        started.current = true;
        clearOfflineAiAutoTrigger();
        await runOfflineAiStage1Harness(mode);
      })();
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
