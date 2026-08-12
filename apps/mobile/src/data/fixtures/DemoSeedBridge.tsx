import { useEffect, useRef } from 'react';

import { getAppConfig } from '../../config/appConfig';
import { createLogger } from '../../logging/logger';
import { useDatabaseOptional } from '../providers/DatabaseProvider';
import { DEMO_SEED_AUDIT_EVENT, isDemoAutoSeedEnabled } from './demoAutoSeedFlag';
import { seedHackathonDemoDatabase } from './syntheticSeed';

const logger = createLogger({ environment: getAppConfig().appEnv });

/**
 * One-time hackathon demo data seed after the local database is ready.
 */
export function DemoSeedBridge() {
  const database = useDatabaseOptional();
  const started = useRef(false);

  useEffect(() => {
    if (
      started.current ||
      !isDemoAutoSeedEnabled() ||
      database?.readiness !== 'ready' ||
      !database.repositories
    ) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (cancelled || started.current || !database.repositories) {
          return;
        }
        started.current = true;
        try {
          const events = await database.repositories.auditEvents.listRecent({
            eventType: DEMO_SEED_AUDIT_EVENT,
            limit: 1,
          });
          const alreadySeeded = events.length > 0;
          if (alreadySeeded) {
            return;
          }
          const result = await seedHackathonDemoDatabase(database.repositories);
          logger.info('Hackathon demo database seeded', {
            clients: result.counts.clients,
            referrals: result.counts.referrals,
            reminders: result.counts.reminders,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message.slice(0, 160) : 'unknown';
          logger.warn('Hackathon demo seed skipped or failed', { message });
        }
      })();
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [database?.readiness, database?.repositories]);

  return null;
}
