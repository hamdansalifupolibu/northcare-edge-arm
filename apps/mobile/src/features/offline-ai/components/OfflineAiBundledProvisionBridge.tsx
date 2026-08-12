import { useEffect, useRef } from 'react';

import { createLogger } from '../../../logging/logger';
import { getAppConfig } from '../../../config/appConfig';
import { isBundledOfflineAiEnabled } from '../development/bundledOfflineAiFlag';
import { getOfflineAiServices } from '../services/createOfflineAiServices';

const logger = createLogger({ environment: getAppConfig().appEnv });

/**
 * First launch: copy bundled GGUF from APK assets into app-private storage (no worker download).
 */
export function OfflineAiBundledProvisionBridge() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !isBundledOfflineAiEnabled()) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (cancelled || started.current) {
          return;
        }
        started.current = true;
        try {
          const services = getOfflineAiServices();
          const snapshot = await services.getSnapshot();
          if (snapshot.model.exists && snapshot.model.byteSize === snapshot.manifest.actualByteSize) {
            return;
          }
          await services.provisionModel({ mode: 'bundle' });
          logger.info('Bundled offline AI model provisioned from APK assets');
        } catch (error) {
          const message = error instanceof Error ? error.message.slice(0, 160) : 'unknown';
          logger.warn('Bundled offline AI auto-provision skipped or failed', { message });
        }
      })();
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
