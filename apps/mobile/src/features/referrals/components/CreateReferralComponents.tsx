import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Facility } from '../../../data/domain/entities/entities';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { AuthSetupActionButton } from '../../auth/components/AuthSetupUiElements';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { colors, layout, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { ReferralReasonDefinition } from '../content/types';
import {
  ReferralBackIcon,
  ReferralChevronRightIcon,
  ReferralChpsIcon,
  ReferralHospitalIcon,
  ReferralShieldCheckIcon,
} from './ReferralListIcons';

export type CreateReferralStep = 'destination' | 'reason' | 'review';

export const CREATE_REFERRAL_STEPS: readonly CreateReferralStep[] = [
  'destination',
  'reason',
  'review',
];

type CreateReferralShellProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly stepIndex: number;
  readonly stepTotal: number;
  readonly continueLabel: string;
  readonly continueDisabled?: boolean;
  readonly loading?: boolean;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly showBack?: boolean;
  readonly children: ReactNode;
  readonly testID?: string;
};

export function CreateReferralShell({
  title,
  subtitle,
  stepIndex,
  stepTotal,
  continueLabel,
  continueDisabled,
  loading,
  onBack,
  onContinue,
  showBack = true,
  children,
  testID = 'create-referral-shell',
}: CreateReferralShellProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, semantic, isDark } = useThemeMode();

  return (
    <View
      style={[styles.shellRoot, { backgroundColor: themeColors.background, paddingTop: insets.top }]}
      testID={testID}
    >
      <View style={styles.shellHeader}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={[styles.headerIconButton, { backgroundColor: themeColors.surface }]}
            testID="referral-create-back"
          >
            <ReferralBackIcon />
          </Pressable>
        ) : (
          <View style={styles.headerIconSpacer} />
        )}
        <View style={styles.headerLogoWrap}>
          <NorthCareLogo variant="stacked" size="sm" />
        </View>
        <WorkerThemeToggle />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.shellScroll,
          { paddingBottom: insets.bottom + spacing['3xl'] + 72 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <AppText variant="headingLarge" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
            {title}
          </AppText>
          <AppText variant="body" color="secondary">
            {subtitle}
          </AppText>
        </View>

        <CreateReferralProgressBar current={stepIndex + 1} total={stepTotal} />

        <View style={styles.shellBody}>{children}</View>
      </ScrollView>

      <View
        style={[
          styles.shellFooter,
          {
            paddingBottom: insets.bottom + spacing.sm,
            backgroundColor: themeColors.background,
            borderTopColor: semantic.border.default,
          },
        ]}
      >
        <AuthSetupActionButton
          label={continueLabel}
          onPress={onContinue}
          disabled={continueDisabled}
          loading={loading}
          testID="referral-create-continue"
        />
      </View>
    </View>
  );
}

function CreateReferralProgressBar({
  current,
  total,
}: {
  readonly current: number;
  readonly total: number;
}) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.progressRow} accessibilityRole="progressbar">
      {Array.from({ length: total }, (_, index) => {
        const filled = index < current;
        return (
          <View
            key={index}
            style={[
              styles.progressSegment,
              {
                backgroundColor: filled ? colors.primary : themeColors.mutedSurface,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

type CreateReferralInfoBannerProps = {
  readonly body: string;
};

export function CreateReferralInfoBanner({ body }: CreateReferralInfoBannerProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View
      style={[
        styles.infoBanner,
        { backgroundColor: mintSurface, borderColor: semantic.border.default },
      ]}
    >
      <ReferralShieldCheckIcon size={18} />
      <AppText variant="caption" color="secondary" style={styles.infoBannerText}>
        {body}
      </AppText>
    </View>
  );
}

function facilityTypeLabel(facilityType: string | null | undefined): string {
  if (!facilityType) return 'Facility';
  if (facilityType === 'CHPS') return 'CHPS compound';
  if (facilityType.includes('Hospital')) return 'Hospital';
  return 'Facility';
}

function FacilityTypeIcon({ facilityType }: { readonly facilityType: string | null | undefined }) {
  if (facilityType === 'CHPS') {
    return <ReferralChpsIcon />;
  }
  return <ReferralHospitalIcon />;
}

type DestinationFacilityCardProps = {
  readonly facility: Facility;
  readonly selected: boolean;
  readonly onPress: () => void;
};

export function DestinationFacilityCard({
  facility,
  selected,
  onPress,
}: DestinationFacilityCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const location = [facility.district, facility.region].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectCard,
        {
          backgroundColor: selected ? mintSurface : themeColors.surface,
          borderColor: selected ? colors.primary : semantic.border.default,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={`referral-facility-${facility.id}`}
    >
      <View style={[styles.selectIconWrap, { backgroundColor: mintSurface }]}>
        <FacilityTypeIcon facilityType={facility.facilityType} />
      </View>
      <View style={styles.selectCopy}>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
          {facility.name}
        </AppText>
        <AppText variant="caption" color="secondary">
          {facilityTypeLabel(facility.facilityType)}
          {location ? ` · ${location}` : ''}
        </AppText>
      </View>
      {selected ? (
        <View style={styles.selectedBadge}>
          <AppText variant="caption" style={styles.selectedBadgeText}>
            ✓
          </AppText>
        </View>
      ) : (
        <ReferralChevronRightIcon />
      )}
    </Pressable>
  );
}

type ReferralReasonCardProps = {
  readonly reason: ReferralReasonDefinition;
  readonly selected: boolean;
  readonly onPress: () => void;
};

export function ReferralReasonCard({ reason, selected, onPress }: ReferralReasonCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectCard,
        {
          backgroundColor: selected ? mintSurface : themeColors.surface,
          borderColor: selected ? colors.primary : semantic.border.default,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={`referral-reason-${reason.reasonCode}`}
    >
      <View style={[styles.selectIconWrap, { backgroundColor: mintSurface }]}>
        <ReferralShieldCheckIcon size={20} />
      </View>
      <View style={styles.selectCopy}>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
          {reason.label}
        </AppText>
        {reason.description ? (
          <AppText variant="caption" color="secondary">
            {reason.description}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.selectedBadge}>
          <AppText variant="caption" style={styles.selectedBadgeText}>
            ✓
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

type ClinicalNotesFieldProps = {
  readonly label: string;
  readonly hint: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly error?: string | null;
  readonly testID?: string;
};

export function ClinicalNotesField({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  required,
  error,
  testID = 'referral-clinical-summary',
}: ClinicalNotesFieldProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View style={styles.notesBlock}>
      <AppText variant="label" style={{ color: themeColors.textPrimary }}>
        {label}
        {required ? (
          <AppText variant="label" color="urgent">
            {' '}
            *
          </AppText>
        ) : null}
      </AppText>
      <AppText variant="caption" color="secondary">
        {hint}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor={themeColors.textSecondary}
        style={[
          styles.notesInput,
          {
            color: themeColors.textPrimary,
            backgroundColor: themeColors.surface,
            borderColor: error ? colors.urgent : semantic.border.default,
          },
        ]}
        testID={testID}
      />
      {error ? (
        <AppText variant="caption" color="urgent">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

type ReviewSummaryRowProps = {
  readonly label: string;
  readonly value: string;
};

export function ReviewSummaryRow({ label, value }: ReviewSummaryRowProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      style={[
        styles.reviewRow,
        { backgroundColor: themeColors.surface, borderColor: semantic.border.default },
      ]}
    >
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
        {value}
      </AppText>
    </View>
  );
}

type CaregiverInformedToggleProps = {
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
};

export function CaregiverInformedToggle({
  label,
  hint,
  checked,
  onChange,
}: CaregiverInformedToggleProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={[
        styles.caregiverToggle,
        {
          backgroundColor: checked ? mintSurface : themeColors.surface,
          borderColor: checked ? colors.primary : semantic.border.default,
        },
      ]}
      testID="referral-caregiver-informed"
    >
      <View
        style={[
          styles.checkboxBox,
          {
            backgroundColor: checked ? colors.primary : themeColors.surface,
            borderColor: checked ? colors.primary : semantic.border.default,
          },
        ]}
      >
        {checked ? (
          <AppText variant="caption" style={{ color: colors.textInverse, fontWeight: '800' }}>
            ✓
          </AppText>
        ) : null}
      </View>
      <View style={styles.caregiverCopy}>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
          {label}
        </AppText>
        <AppText variant="caption" color="secondary">
          {hint}
        </AppText>
      </View>
    </Pressable>
  );
}

export function CreateReferralErrorBanner({ message }: { readonly message: string }) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={[styles.errorBanner, { backgroundColor: themeColors.dangerBackground }]}>
      <AppText variant="body" color="urgent">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  shellRoot: {
    flex: 1,
  },
  shellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerIconSpacer: {
    width: 44,
  },
  headerLogoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  shellScroll: {
    paddingHorizontal: layout.screenHorizontalPadding,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
  },
  shellBody: {
    gap: spacing.md,
  },
  shellFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoBannerText: {
    flex: 1,
    lineHeight: 18,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  selectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: colors.textInverse,
    fontWeight: '800',
  },
  notesBlock: {
    gap: spacing.xs,
  },
  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 22,
  },
  reviewRow: {
    gap: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  caregiverToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  caregiverCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  errorBanner: {
    borderRadius: radii.lg,
    padding: spacing.md,
  },
});
