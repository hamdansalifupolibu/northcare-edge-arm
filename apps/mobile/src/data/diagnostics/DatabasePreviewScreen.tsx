import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText } from '../../design-system';
import { spacing } from '../../theme';
import { useDatabase } from '../providers/DatabaseProvider';

/**
 * Development-only diagnostics. Must not appear in production navigation.
 */
export function DatabasePreviewScreen({ onClose }: { readonly onClose: () => void }) {
  const db = useDatabase();
  const [message, setMessage] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [tables, setTables] = useState<string[] | null>(null);
  const [pendingSync, setPendingSync] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      setTables(await db.getTableNames());
      setCounts(await db.getSyntheticCounts());
      setPendingSync(await db.countPendingSyncItems());
      setMessage(`Ready=${db.readiness}; schema=${db.schemaVersion ?? 'n/a'}`);
    } finally {
      setBusy(false);
    }
  }, [db]);

  return (
    <AppScreen testID="database-preview">
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="headingSmall">Database preview (SYNTHETIC)</AppText>
        <AppText variant="body" color="secondary" style={styles.body}>
          Development diagnostics only. No real patient data. Counts are aggregate
          totals — records are not displayed.
        </AppText>

        <AppText variant="label">Readiness: {db.readiness}</AppText>
        <AppText variant="label">Schema version: {db.schemaVersion ?? '—'}</AppText>
        <AppText variant="label">
          Migrations: {db.appliedMigrations.map((m) => m.version).join(', ') || 'none'}
        </AppText>
        {message ? (
          <AppText variant="caption" color="secondary" style={styles.body}>
            {message}
          </AppText>
        ) : null}

        {tables ? (
          <AppText variant="caption" style={styles.body}>
            Tables: {tables.join(', ')}
          </AppText>
        ) : null}

        {counts ? (
          <AppText variant="caption" style={styles.body}>
            Counts: {JSON.stringify(counts)}
          </AppText>
        ) : null}
        {pendingSync != null ? (
          <AppText variant="caption" style={styles.body} testID="db-preview-pending-sync">
            Pending sync queue items: {pendingSync}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            label="Refresh status"
            onPress={() => {
              void refresh();
            }}
            disabled={busy || db.readiness !== 'ready'}
            testID="db-preview-refresh"
          />
          <AppButton
            label="Seed synthetic data"
            variant="secondary"
            onPress={() => {
              void (async () => {
                setBusy(true);
                try {
                  const result = await db.seedSynthetic();
                  setMessage(
                    `Seeded SYNTHETIC fixture (clients=${result.counts.clients})`,
                  );
                  await refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Seed failed');
                } finally {
                  setBusy(false);
                }
              })();
            }}
            disabled={busy || db.readiness !== 'ready'}
            testID="db-preview-seed"
          />
          <AppButton
            label="Run repository self-check"
            variant="secondary"
            onPress={() => {
              void (async () => {
                setBusy(true);
                try {
                  const result = await db.runSelfCheck();
                  setMessage(
                    result.ok
                      ? 'Self-check passed'
                      : `Self-check failed: ${result.checks
                          .filter((c) => !c.ok)
                          .map((c) => c.name)
                          .join(', ')}`,
                  );
                } catch (error) {
                  setMessage(
                    error instanceof Error ? error.message : 'Self-check failed',
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
            disabled={busy || db.readiness !== 'ready'}
            testID="db-preview-self-check"
          />
          <AppButton
            label="Reset synthetic database"
            variant="tertiary"
            onPress={() => {
              Alert.alert(
                'Reset development database?',
                'This permanently clears the local SYNTHETIC database and reapplies migrations. SecureStore session is not cleared.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      void (async () => {
                        setBusy(true);
                        try {
                          await db.resetDatabase();
                          setMessage('Database reset and migrations reapplied');
                          await refresh();
                        } catch (error) {
                          setMessage(
                            error instanceof Error ? error.message : 'Reset failed',
                          );
                        } finally {
                          setBusy(false);
                        }
                      })();
                    },
                  },
                ],
              );
            }}
            disabled={busy}
            testID="db-preview-reset"
          />
          <AppButton label="Close" variant="tertiary" onPress={onClose} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  body: {
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.base,
    gap: spacing.sm,
  },
});
