import { Modal, Pressable, View } from 'react-native';

import { AppButton, AppText, CheckboxField } from '../design-system';
import { opacity, radii, spacing } from '../theme';
import { useThemeMode } from '../theme/ThemeModeProvider';

import { en } from './en';

type Props = {
  readonly visible: boolean;
  readonly dontShowAgain: boolean;
  readonly onDontShowAgainChange: (value: boolean) => void;
  readonly onContinue: () => void;
  readonly onCancel: () => void;
  readonly testID?: string;
};

/**
 * Shown before switching to Dagbanli so workers know translations are still improving.
 * Copy stays in English because the user has not switched language yet.
 */
export function DagbanliTranslationDisclaimerModal({
  visible,
  dontShowAgain,
  onDontShowAgainChange,
  onContinue,
  onCancel,
  testID = 'dagbanli-translation-disclaimer-modal',
}: Props) {
  const { colors, isDark } = useThemeMode();
  const copy = en.language;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.72)' : `rgba(23, 33, 31, ${opacity.overlay})`,
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={copy.disclaimerCancel}
        />
        <View
          testID={testID}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={copy.disclaimerTitle}
          style={{
            backgroundColor: isDark ? colors.mutedSurface : colors.surface,
            borderRadius: radii.modal,
            padding: spacing.lg,
            gap: spacing.md,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? colors.border : 'transparent',
          }}
        >
          <AppText variant="headingSmall" color="primary">
            {copy.disclaimerTitle}
          </AppText>
          <AppText variant="body" color="primary">
            {copy.disclaimerBody}
          </AppText>
          <AppText variant="body" color="secondary">
            {copy.disclaimerDetail}
          </AppText>
          <CheckboxField
            label={copy.disclaimerDontShowAgain}
            checked={dontShowAgain}
            onChange={onDontShowAgainChange}
            testID={`${testID}-dont-show-again`}
          />
          <View style={{ gap: spacing.sm }}>
            <AppButton
              label={copy.disclaimerContinue}
              onPress={onContinue}
              testID={`${testID}-continue`}
            />
            <AppButton
              label={copy.disclaimerCancel}
              variant="secondary"
              onPress={onCancel}
              testID={`${testID}-cancel`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
