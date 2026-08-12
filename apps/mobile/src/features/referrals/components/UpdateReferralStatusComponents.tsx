import type { ReferralStatus } from '../../../data/domain/enums/domainEnums';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { colors, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { referralStatusLabel } from './ReferralStatusChip';
import {
  ReferralChevronRightIcon,
  ReferralShieldCheckIcon,
} from './ReferralListIcons';

const JOURNEY_ORDER: readonly ReferralStatus[] = [
  'created',
  'caregiverInformed',
  'journeyStarted',
  'facilityReached',
  'patientReceived',
  'completed',
];

type ReferralStatusJourneyBarProps = {
  readonly currentStatus: ReferralStatus;
};

export function ReferralStatusJourneyBar({ currentStatus }: ReferralStatusJourneyBarProps) {
  const { colors: themeColors, semantic } = useThemeMode();
  const currentIndex = JOURNEY_ORDER.indexOf(currentStatus);

  return (
    <View
      style={[
        styles.journeyBar,
        { backgroundColor: themeColors.surface, borderColor: semantic.border.default },
      ]}
      testID="referral-status-journey-bar"
    >
      {JOURNEY_ORDER.map((status, index) => {
        const reached = currentIndex >= index && currentIndex >= 0;
        const active = status === currentStatus;
        return (
          <View key={status} style={styles.journeyStep}>
            <View
              style={[
                styles.journeyDot,
                {
                  backgroundColor: reached ? colors.primary : themeColors.mutedSurface,
                  borderColor: active ? colors.primaryDark : 'transparent',
                  borderWidth: active ? 2 : 0,
                },
              ]}
            />
            {index < JOURNEY_ORDER.length - 1 ? (
              <View
                style={[
                  styles.journeyLine,
                  { backgroundColor: reached ? colors.primary : themeColors.mutedSurface },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

type ReferralStatusOptionCardProps = {
  readonly title: string;
  readonly description: string;
  readonly recommended?: boolean;
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly testID: string;
};

export function ReferralStatusOptionCard({
  title,
  description,
  recommended,
  disabled,
  onPress,
  testID,
}: ReferralStatusOptionCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${title}. ${description}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.statusOption,
        recommended
          ? { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }
          : {
              backgroundColor: themeColors.surface,
              borderColor: semantic.border.default,
            },
        { opacity: disabled ? 0.5 : pressed ? 0.92 : 1 },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.statusOptionIcon,
          {
            backgroundColor: recommended ? 'rgba(255,255,255,0.18)' : mintSurface,
          },
        ]}
      >
        <ReferralShieldCheckIcon
          size={20}
          color={recommended ? colors.textInverse : colors.primary}
        />
      </View>
      <View style={styles.statusOptionCopy}>
        {recommended ? (
          <AppText variant="caption" color="inverse" style={{ opacity: 0.9 }}>
            Recommended next step
          </AppText>
        ) : null}
        <AppText
          variant="bodyStrong"
          style={{ color: recommended ? colors.textInverse : themeColors.textPrimary }}
        >
          {title}
        </AppText>
        <AppText variant="caption" color={recommended ? 'inverse' : 'secondary'}>
          {description}
        </AppText>
      </View>
      <ReferralChevronRightIcon color={recommended ? colors.textInverse : colors.primary} />
    </Pressable>
  );
}

export function statusTransitionDescription(
  status: ReferralStatus,
  strings: {
    readonly statusTransitionCaregiverInformed: string;
    readonly statusTransitionJourneyStarted: string;
    readonly statusTransitionFacilityReached: string;
    readonly statusTransitionPatientReceived: string;
    readonly statusTransitionCompleted: string;
  },
): string {
  switch (status) {
    case 'caregiverInformed':
      return strings.statusTransitionCaregiverInformed;
    case 'journeyStarted':
      return strings.statusTransitionJourneyStarted;
    case 'facilityReached':
      return strings.statusTransitionFacilityReached;
    case 'patientReceived':
      return strings.statusTransitionPatientReceived;
    case 'completed':
      return strings.statusTransitionCompleted;
    default:
      return referralStatusLabel(status);
  }
}

const styles = StyleSheet.create({
  journeyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  journeyStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
  },
  journeyLine: {
    flex: 1,
    height: 3,
    borderRadius: radii.pill,
    marginHorizontal: spacing.xxs,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 80,
    ...shadows.sm,
  },
  statusOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
