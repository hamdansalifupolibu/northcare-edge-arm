import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { NutritionCentreBackground } from '../../nutrition/components/centre/NutritionCentreBackground';

type Props = {
  readonly children: ReactNode;
  readonly testID?: string;
};

export function AdminPortalShell({ children, testID }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={testID}>
      <NutritionCentreBackground />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.base,
            paddingBottom: insets.bottom + spacing.xl,
            paddingHorizontal: spacing.base,
          },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
});
