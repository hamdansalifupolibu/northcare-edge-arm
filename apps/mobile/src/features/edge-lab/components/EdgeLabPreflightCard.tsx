import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppCard, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import type { EdgeLabPreflightReport } from '../services/edgeLabPreflight';
import { EdgeLabStatusBanner } from './EdgeLabStatusBanner';

type EdgeLabPreflightCardProps = {
  readonly report: EdgeLabPreflightReport | null;
  readonly busy: boolean;
  readonly onRefresh: () => void;
};

export function EdgeLabPreflightCard({ report, busy, onRefresh }: EdgeLabPreflightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ready = report?.readyToRun === true;

  return (
    <AppCard title="Session" subtitle={ready ? 'Ready' : report ? 'Blocked' : 'Checking…'}>
      {!report ? (
        <AppText variant="caption" color="secondary">
          Checking models, runtime, fixture…
        </AppText>
      ) : (
        <>
          <EdgeLabStatusBanner
            tone={ready ? 'ready' : 'blocked'}
            title={ready ? 'Ready to run' : `${report.blockingCount} blocking`}
            detail={ready ? 'Whisper · Qwen · fixture OK' : 'Expand checklist to fix items'}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded((v) => !v)}
            style={{ marginTop: spacing.sm, minHeight: 44, justifyContent: 'center' }}
          >
            <AppText variant="label" color="action">
              {expanded ? 'Hide checklist' : 'Show checklist'}
            </AppText>
          </Pressable>
          {expanded ? (
            <View style={{ gap: spacing.xxs, marginTop: spacing.xs }}>
              {report.items.map((item) => (
                <AppText key={item.id} variant="caption" color="secondary">
                  {item.ok ? '✓' : item.blocking ? '✕' : '·'} {item.label}
                </AppText>
              ))}
            </View>
          ) : null}
        </>
      )}
      <AppButton
        label="Refresh"
        variant="secondary"
        size="compact"
        disabled={busy}
        onPress={onRefresh}
      />
    </AppCard>
  );
}
