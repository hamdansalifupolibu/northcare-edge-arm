import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export function StepProgress({
  current,
  total,
  testID,
}: {
  readonly current: number;
  readonly total: number;
  readonly testID?: string;
}) {
  const t = useTranslation();
  const { semantic } = useThemeMode();
  const label = t.clients.registration.stepOf(current, total);
  return (
    <View testID={testID} accessibilityRole="text" accessibilityLabel={label} style={{ gap: spacing.xs }}>
      <AppText variant="label" color="secondary">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {Array.from({ length: total }, (_, index) => {
          const active = index < current;
          return (
            <View
              key={`step-${index + 1}`}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: active
                  ? semantic.action.primary
                  : semantic.border.default,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
