import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import { isClientSex, type ClientSex } from '../../../data/domain/enums/clientSex';
import type { ConsentStatus, RelationshipType } from '../../../data/domain/enums/domainEnums';
import { AppText, FormErrorText } from '../../../design-system';
import { colors, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { RegisterClientDraft } from '../application/validation';
import { formatAgePresentation, resolveAgePresentation } from '../domain/agePresentation';
import {
  ChildUnderFiveCategoryIcon,
  NewbornCategoryIcon,
  PostnatalCategoryIcon,
  PregnantCategoryIcon,
} from './ClientRegisterCategoryIcons';
import { ClientRegisterShell } from './ClientRegisterShell';
import type { RegisterShellConfig } from './ClientRegisterFlowSteps';
import { RegisterStepHeading } from './ClientRegisterSharedUi';
import { PrivacyAvatar } from './PrivacyAvatar';

type RegisterStepId =
  | 'category'
  | 'identity'
  | 'age'
  | 'caregiver'
  | 'location'
  | 'consent';

type ReviewStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly facilityName: string;
  readonly heading: string;
  readonly instruction: string;
  readonly editLabel: string;
  readonly categoryLabel: (category: ClientCategory) => string;
  readonly consentLabel: (status: ConsentStatus) => string;
  readonly sexLabel: (sex: ClientSex) => string;
  readonly relationshipLabel: (relationship: RelationshipType) => string;
  readonly phoneNotAvailableLabel: string;
  readonly ageLabel: string;
  readonly locationLabel: string;
  readonly contactLabel: string;
  readonly consentFieldLabel: string;
  readonly facilityLabel: string;
  readonly caregiverLabel: string;
  readonly caregiverNotIncludedLabel: string;
  readonly ageUnknownLabel: string;
  readonly ageApproximateLabel: (value: number, unit: string) => string;
  readonly ageBornOnLabel: (date: string) => string;
  readonly saveLabel: string;
  readonly storageNotReadyMessage?: string;
  readonly fieldErrors: readonly { readonly field: string; readonly message: string }[];
  readonly onEditStep: (step: RegisterStepId) => void;
};

function ReviewRowIcon({
  children,
  mintSurface,
}: {
  readonly children: ReactNode;
  readonly mintSurface: string;
}) {
  return (
    <View style={[styles.rowIconCircle, { backgroundColor: mintSurface }]}>
      {children}
    </View>
  );
}

function LocationReviewIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 21 C12 21 5 14 5 9.5 C5 6.5 7.5 4 12 4 C16.5 4 19 6.5 19 9.5 C19 14 12 21 12 21 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.6}
      />
      <Circle cx="12" cy="9.5" r="2.2" fill={colors.primary} />
    </Svg>
  );
}

function PhoneReviewIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8 4 H16 C17.1 4 18 4.9 18 6 V18 C18 19.1 17.1 20 16 20 H8 C6.9 20 6 19.1 6 18 V6 C6 4.9 6.9 4 8 4 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
      />
      <Circle cx="12" cy="17" r="1" fill={colors.primary} />
    </Svg>
  );
}

function ConsentReviewIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19 12 22 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M9 12 L11 14 L15 10" fill="none" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function FacilityReviewIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 20 V8 L12 4 L20 8 V20"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M9 20 V12 H15 V20" fill="none" stroke={colors.primary} strokeWidth={1.5} />
    </Svg>
  );
}

function AgeReviewIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="8" fill="none" stroke={colors.primary} strokeWidth={1.5} />
      <Path d="M12 8 V12 L15 14" fill="none" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function CaregiverReviewIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="9" cy="9" r="2.2" fill={colors.primary} />
      <Path d="M5 18 C5 15 7 13 9 13 C11 13 12 14 12 15" fill="none" stroke={colors.primary} strokeWidth={1.4} />
      <Circle cx="15" cy="10" r="2" fill={colors.primary} />
      <Path d="M12 18 C12 16 13.5 14.5 15 14.5 C16.5 14.5 18 16 18 18" fill="none" stroke={colors.primary} strokeWidth={1.4} />
    </Svg>
  );
}

function EditPencilIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 17.5 V20 H6.5 L17 9.5 L14.5 7 L4 17.5 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M13 8 L16 11" fill="none" stroke={colors.primary} strokeWidth={1.6} />
    </Svg>
  );
}

function categoryIcon(category: ClientCategory) {
  switch (category) {
    case 'pregnant':
      return <PregnantCategoryIcon size={16} />;
    case 'postnatal':
      return <PostnatalCategoryIcon size={16} />;
    case 'newborn':
      return <NewbornCategoryIcon size={16} />;
    case 'childUnderFive':
      return <ChildUnderFiveCategoryIcon size={16} />;
    default:
      return null;
  }
}

type ReviewDetailRowProps = {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly editLabel: string;
  readonly mintSurface: string;
  readonly onEdit?: () => void;
  readonly testID?: string;
};

function ReviewDetailRow({
  icon,
  label,
  value,
  editLabel,
  mintSurface,
  onEdit,
  testID,
}: ReviewDetailRowProps) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={[styles.detailRow, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <ReviewRowIcon mintSurface={mintSurface}>{icon}</ReviewRowIcon>
      <View style={styles.detailCopy}>
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
          {value}
        </AppText>
      </View>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${editLabel} ${label}`}
          onPress={onEdit}
          style={({ pressed }) => [styles.editButton, { opacity: pressed ? 0.85 : 1 }]}
          testID={testID}
        >
          <EditPencilIcon />
          <AppText variant="caption" color="action" style={styles.editLabel}>
            {editLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatReviewAge(
  draft: RegisterClientDraft,
  labels: {
    readonly unknown: string;
    readonly approximate: (value: number, unit: string) => string;
    readonly bornOn: (date: string) => string;
  },
): string {
  const presentation = resolveAgePresentation({
    dateOfBirth: draft.ageMode === 'dateOfBirth' && draft.dateOfBirth ? draft.dateOfBirth : null,
    approximateAge:
      draft.ageMode === 'approximateAge' && draft.approximateAge
        ? Number(draft.approximateAge)
        : null,
    approximateAgeUnit:
      draft.ageMode === 'approximateAge' ? draft.approximateAgeUnit : null,
  });

  return formatAgePresentation(presentation, {
    unknown: labels.unknown,
    approximate: (value, unit) => labels.approximate(value, unit),
    bornOn: (date) => labels.bornOn(date),
  });
}

function formatLocationValue(draft: RegisterClientDraft): string {
  const community = draft.community.trim();
  const district = draft.district.trim();
  const region = draft.region.trim();
  if (!community && !region) {
    return '—';
  }
  if (district) {
    return `${community}, ${district}, ${region}`;
  }
  return `${community}, ${region}`;
}

export function ClientRegisterReviewStep({
  draft,
  facilityName,
  heading,
  instruction,
  editLabel,
  categoryLabel,
  consentLabel,
  sexLabel,
  relationshipLabel,
  phoneNotAvailableLabel,
  ageLabel,
  locationLabel,
  contactLabel,
  consentFieldLabel,
  facilityLabel,
  caregiverLabel,
  caregiverNotIncludedLabel,
  ageUnknownLabel,
  ageApproximateLabel,
  ageBornOnLabel,
  saveLabel,
  storageNotReadyMessage,
  fieldErrors,
  onEditStep,
  onContinue,
  loading,
  ...shell
}: ReviewStepProps) {
  const { colors: themeColors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const resolvedSex = isClientSex(draft.sex) ? sexLabel(draft.sex) : '—';
  const displayName = [draft.givenName.trim(), draft.familyName.trim()].filter(Boolean).join(' ') || '—';
  const categoryText = draft.category ? categoryLabel(draft.category) : '—';

  const caregiverValue = draft.includeCaregiver
    ? [
        `${draft.caregiverGivenName.trim()} ${draft.caregiverFamilyName.trim()}`.trim(),
        draft.relationshipType ? relationshipLabel(draft.relationshipType) : null,
        draft.caregiverPhone.trim() || null,
      ]
        .filter(Boolean)
        .join(' · ')
    : caregiverNotIncludedLabel;

  const contactValue =
    draft.phoneNotAvailable || !draft.phoneNumber.trim()
      ? phoneNotAvailableLabel
      : draft.phoneNumber.trim();

  return (
    <ClientRegisterShell
      {...shell}
      continueLabel={saveLabel}
      onContinue={onContinue}
      loading={loading}
      showFooterBack
    >
      <RegisterStepHeading heading={heading} instruction={instruction} />

      <View style={[styles.identityCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <View style={[styles.identityAvatarWrap, { backgroundColor: mintSurface }]}>
          <PrivacyAvatar
            givenName={draft.givenName}
            familyName={draft.familyName}
            size={56}
            showTrailingSpace={false}
            testID="register-review-avatar"
          />
        </View>
        <View style={styles.identityCopy}>
          <AppText variant="title" style={[styles.identityName, { color: themeColors.textPrimary }]}>
            {displayName}
          </AppText>
          {draft.preferredName.trim() ? (
            <AppText variant="body" color="secondary">
              {draft.preferredName.trim()}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${editLabel} client type`}
            onPress={() => onEditStep('category')}
            style={({ pressed }) => [styles.identityMetaRow, { opacity: pressed ? 0.85 : 1 }]}
            testID="register-review-edit-category"
          >
            {draft.category ? categoryIcon(draft.category) : null}
            <AppText variant="caption" color="secondary">
              {categoryText} · {resolvedSex}
            </AppText>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${editLabel} identity`}
          onPress={() => onEditStep('identity')}
          style={({ pressed }) => [styles.identityEdit, { opacity: pressed ? 0.85 : 1 }]}
          testID="register-review-edit-identity"
        >
          <EditPencilIcon />
          <AppText variant="caption" color="action">
            {editLabel}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.detailList}>
        <ReviewDetailRow
          icon={<AgeReviewIcon />}
          label={ageLabel}
          value={formatReviewAge(draft, {
            unknown: ageUnknownLabel,
            approximate: ageApproximateLabel,
            bornOn: ageBornOnLabel,
          })}
          editLabel={editLabel}
          mintSurface={mintSurface}
          onEdit={() => onEditStep('age')}
          testID="register-review-edit-age"
        />
        <ReviewDetailRow
          icon={<CaregiverReviewIcon />}
          label={caregiverLabel}
          value={caregiverValue}
          editLabel={editLabel}
          mintSurface={mintSurface}
          onEdit={() => onEditStep('caregiver')}
          testID="register-review-edit-caregiver"
        />
        <ReviewDetailRow
          icon={<LocationReviewIcon />}
          label={locationLabel}
          value={formatLocationValue(draft)}
          editLabel={editLabel}
          mintSurface={mintSurface}
          onEdit={() => onEditStep('location')}
          testID="register-review-edit-location"
        />
        <ReviewDetailRow
          icon={<PhoneReviewIcon />}
          label={contactLabel}
          value={contactValue}
          editLabel={editLabel}
          mintSurface={mintSurface}
          onEdit={() => onEditStep('location')}
          testID="register-review-edit-contact"
        />
        <ReviewDetailRow
          icon={<ConsentReviewIcon />}
          label={consentFieldLabel}
          value={draft.consentStatus ? consentLabel(draft.consentStatus) : '—'}
          editLabel={editLabel}
          mintSurface={mintSurface}
          onEdit={() => onEditStep('consent')}
          testID="register-review-edit-consent"
        />
        <ReviewDetailRow
          icon={<FacilityReviewIcon />}
          label={facilityLabel}
          value={facilityName || '—'}
          editLabel={editLabel}
          mintSurface={mintSurface}
          testID="register-review-facility"
        />
      </View>

      {storageNotReadyMessage ? <FormErrorText>{storageNotReadyMessage}</FormErrorText> : null}
      {fieldErrors.map((error) => (
        <FormErrorText key={error.field}>{error.message}</FormErrorText>
      ))}
    </ClientRegisterShell>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    ...shadows.sm,
  },
  identityAvatarWrap: {
    borderRadius: radii.pill,
    padding: spacing.xxs,
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  identityName: {
    fontWeight: '800',
  },
  identityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  identityEdit: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  detailList: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    ...shadows.sm,
  },
  rowIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  editButton: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  editLabel: {
    fontWeight: '600',
  },
});
