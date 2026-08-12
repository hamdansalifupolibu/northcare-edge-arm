import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import type { AdminFacility } from '../domain/types';
import type { RegisterWorkerDraft } from '../session/registerWorkerDraftStore';
import { AdminSectionCard } from './AdminSectionCard';
import { formatAdminFacilitySubtitle } from './AdminFacilityPicker';

type SummaryRowProps = {
  readonly label: string;
  readonly value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

type AdminRegistrationReviewSummaryProps = {
  readonly draft: RegisterWorkerDraft;
  readonly facilities: readonly AdminFacility[];
  readonly professionLabel: string;
};

export function AdminRegistrationReviewSummary({
  draft,
  facilities,
  professionLabel,
}: AdminRegistrationReviewSummaryProps) {
  const t = useTranslation();
  const selectedFacility = facilities.find((facility) => facility.facilityId === draft.facilityId);
  const facilityName = selectedFacility?.name ?? draft.facilityId;
  const facilitySubtitle = selectedFacility ? formatAdminFacilitySubtitle(selectedFacility) : null;
  const permissionValue = (enabled: boolean): string =>
    enabled ? t.administration.account.enabled : t.administration.account.disabled;

  return (
    <View style={styles.sections} testID="admin-register-review-summary">
      <AdminSectionCard testID="admin-register-review-identity">
        <AppText variant="label">{t.administration.register.identityHeading}</AppText>
        <View style={styles.sectionBody}>
          <SummaryRow label={t.administration.register.displayNameLabel} value={draft.displayName} />
          <SummaryRow label={t.administration.register.emailLabel} value={draft.email} />
        </View>
      </AdminSectionCard>

      <AdminSectionCard testID="admin-register-review-profession">
        <AppText variant="label">{t.administration.register.professionHeading}</AppText>
        <View style={styles.sectionBody}>
          <SummaryRow label={t.administration.register.professionLabel} value={professionLabel} />
          {draft.otherProfessionDescription ? (
            <SummaryRow
              label={t.administration.register.otherProfessionLabel}
              value={draft.otherProfessionDescription}
            />
          ) : null}
          <SummaryRow
            label={t.administration.register.communityRequestsLabel}
            value={permissionValue(draft.communityRequestsEnabled)}
          />
          <SummaryRow
            label={t.administration.register.emergencyRequestsLabel}
            value={permissionValue(draft.emergencyRequestsEnabled)}
          />
        </View>
      </AdminSectionCard>

      <AdminSectionCard testID="admin-register-review-facility">
        <AppText variant="label">{t.administration.register.facilityHeading}</AppText>
        <View style={styles.sectionBody}>
          <SummaryRow label={t.administration.register.facilityLabel} value={facilityName} />
          {facilitySubtitle ? (
            <AppText variant="body" color="secondary">
              {facilitySubtitle}
            </AppText>
          ) : null}
        </View>
      </AdminSectionCard>

      <AppText variant="caption" color="secondary">
        {t.administration.register.offlineSubmitNote}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.md,
  },
  sectionBody: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  row: {
    gap: spacing.xxs,
  },
});
