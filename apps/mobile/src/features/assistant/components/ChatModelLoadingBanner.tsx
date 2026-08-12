import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppActivityIndicator, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type ChatModelLoadingBannerProps = {
  readonly message?: string;
  readonly waitingToSend?: boolean;
};

export function ChatModelLoadingBanner({
  message = 'Loading offline model…',
  waitingToSend = false,
}: ChatModelLoadingBannerProps) {
  const { colors } = useThemeMode();
  const label = waitingToSend ? 'Model loading — almost ready…' : message;
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.mutedSurface,
          borderBottomColor: colors.border,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      testID="chat-model-loading"
    >
      <AppActivityIndicator />
      <AppText variant="caption" color="secondary" style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  text: {
    flexShrink: 1,
  },
});
