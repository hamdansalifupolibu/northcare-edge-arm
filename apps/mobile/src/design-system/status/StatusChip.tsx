import { View } from 'react-native';

import { radii, spacing, type SemanticColors } from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';

export type StatusChipTone =
  | 'neutral'
  | 'information'
  | 'success'
  | 'warning'
  | 'urgent'
  | 'offline'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'needsReview';

export type StatusChipProps = {
  readonly label: string;
  readonly tone?: StatusChipTone;
  readonly hidePrefix?: boolean;
  readonly testID?: string;
};

type ToneStyle = {
  readonly background: string;
  readonly text: 'primary' | 'secondary' | 'urgent' | 'warning' | 'stable' | 'info' | 'action';
  readonly prefix: string;
};

function toneStyles(semantic: SemanticColors): Record<StatusChipTone, ToneStyle> {
  return {
    neutral: {
      background: semantic.surface.muted,
      text: 'secondary',
      prefix: '•',
    },
    information: {
      background: semantic.status.infoBackground,
      text: 'info',
      prefix: 'i',
    },
    success: {
      background: semantic.status.stableBackground,
      text: 'stable',
      prefix: '✓',
    },
    warning: {
      background: semantic.status.warningBackground,
      text: 'warning',
      prefix: '!',
    },
    urgent: {
      background: semantic.status.urgentBackground,
      text: 'urgent',
      prefix: '!',
    },
    offline: {
      background: semantic.status.offlineBackground,
      text: 'secondary',
      prefix: '○',
    },
    pending: {
      background: semantic.status.warningBackground,
      text: 'warning',
      prefix: '…',
    },
    syncing: {
      background: semantic.status.infoBackground,
      text: 'info',
      prefix: '↻',
    },
    synced: {
      background: semantic.status.stableBackground,
      text: 'stable',
      prefix: '✓',
    },
    failed: {
      background: semantic.status.urgentBackground,
      text: 'urgent',
      prefix: '×',
    },
    needsReview: {
      background: semantic.status.warningBackground,
      text: 'warning',
      prefix: '?',
    },
  };
}

/**
 * Status chip — colour is never the only indicator (prefix glyph + label).
 */
export function StatusChip({
  label,
  tone = 'neutral',
  hidePrefix = false,
  testID,
}: StatusChipProps) {
  const { semantic } = useThemeMode();
  const style = toneStyles(semantic)[tone];
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`${tone}: ${label}`}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
        backgroundColor: style.background,
      }}
    >
      {!hidePrefix ? (
        <AppText variant="label" color={style.text}>
          {style.prefix}
        </AppText>
      ) : null}
      <AppText variant="label" color={style.text}>
        {label}
      </AppText>
    </View>
  );
}
