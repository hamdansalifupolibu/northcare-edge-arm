import { View } from 'react-native';

import { spacing } from '../../theme';
import { AppButton } from '../buttons/AppButton';
import { AppText } from '../text/AppText';

export type AppStateVariant =
  | 'empty'
  | 'error'
  | 'offline'
  | 'permissionDenied'
  | 'noResults'
  | 'unavailable'
  | 'success';

export type AppStateViewProps = {
  readonly variant: AppStateVariant;
  readonly heading: string;
  readonly explanation: string;
  readonly primaryActionLabel?: string;
  readonly onPrimaryAction?: () => void;
  readonly secondaryActionLabel?: string;
  readonly onSecondaryAction?: () => void;
  readonly testID?: string;
};

const GLYPH: Record<AppStateVariant, string> = {
  empty: '◇',
  error: '!',
  offline: '○',
  permissionDenied: '⌀',
  noResults: '⌀',
  unavailable: '—',
  success: '✓',
};

/**
 * Generic empty / error / offline state. No health-specific instructions.
 */
export function AppStateView({
  variant,
  heading,
  explanation,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  testID,
}: AppStateViewProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={{
        alignItems: 'center',
        padding: spacing.xl,
        gap: spacing.base,
      }}
    >
      <AppText
        variant="displayLarge"
        color={variant === 'error' ? 'urgent' : 'secondary'}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {GLYPH[variant]}
      </AppText>
      <AppText variant="headingSmall" align="center" accessibilityRole="header">
        {heading}
      </AppText>
      <AppText variant="body" color="secondary" align="center">
        {explanation}
      </AppText>
      {primaryActionLabel && onPrimaryAction ? (
        <AppButton
          label={primaryActionLabel}
          onPress={onPrimaryAction}
          fullWidth={false}
        />
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <AppButton
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="tertiary"
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}
