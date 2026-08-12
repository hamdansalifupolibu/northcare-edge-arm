import { Modal, Pressable, View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { opacity, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type Props = {
  readonly visible: boolean;
  readonly title: string;
  readonly body: string;
  readonly continueLabel: string;
  readonly accessibilityLabel: string;
  readonly testID: string;
  readonly continueTestID: string;
  readonly detailPrimary?: string | null;
  readonly detailSecondary?: string | null;
  readonly onContinue: () => void;
};

/**
 * Warm, professional celebration overlay for referral create / verify success.
 * Does not mention crypto algorithms or technical implementation details.
 */
export function ReferralCelebrationModal({
  visible,
  title,
  body,
  continueLabel,
  accessibilityLabel,
  testID,
  continueTestID,
  detailPrimary,
  detailSecondary,
  onContinue,
}: Props) {
  const { colors, isDark } = useThemeMode();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
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
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Dismiss celebration"
        />
        <View
          style={{
            backgroundColor: isDark ? colors.mutedSurface : colors.surface,
            borderRadius: radii.modal,
            padding: spacing.lg,
            gap: spacing.md,
            elevation: 6,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? colors.border : 'transparent',
          }}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 56,
              height: 56,
              borderRadius: radii.pill,
              backgroundColor: colors.successBackground,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.sm,
            }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <AppText variant="headingSmall" color="stable">
              ✓
            </AppText>
          </View>
          <AppText variant="headingSmall" color="primary" align="center">
            {title}
          </AppText>
          <AppText variant="body" color="primary" align="center">
            {body}
          </AppText>
          {detailPrimary ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <AppText variant="body" color="secondary" align="center">
                {detailPrimary}
              </AppText>
              {detailSecondary ? (
                <AppText variant="caption" color="secondary" align="center">
                  {detailSecondary}
                </AppText>
              ) : null}
            </View>
          ) : null}
          <AppButton
            label={continueLabel}
            onPress={onContinue}
            testID={continueTestID}
            accessibilityHint="Closes this message and continues"
          />
        </View>
      </View>
    </Modal>
  );
}
