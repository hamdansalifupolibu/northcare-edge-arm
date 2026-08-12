import { StyleSheet, View } from 'react-native';

import { AppText, AppTextInput, CheckboxField } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { allowsOtherProfessionDescription } from '../domain/professions';
import type { ProfessionRegistryItem } from '../domain/types';
import { AdminProfessionPicker } from './AdminProfessionPicker';
import { AdminSectionCard } from './AdminSectionCard';

export type AdminProfessionalProfileFieldsProps = {
  readonly professions: readonly ProfessionRegistryItem[];
  readonly selectedProfession: string;
  readonly otherProfessionDescription: string;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly onProfessionChange: (profession: string) => void;
  readonly onOtherProfessionDescriptionChange: (value: string) => void;
  readonly onCommunityRequestsEnabledChange: (enabled: boolean) => void;
  readonly onEmergencyRequestsEnabledChange: (enabled: boolean) => void;
};

export function AdminProfessionalProfileFields({
  professions,
  selectedProfession,
  otherProfessionDescription,
  communityRequestsEnabled,
  emergencyRequestsEnabled,
  onProfessionChange,
  onOtherProfessionDescriptionChange,
  onCommunityRequestsEnabledChange,
  onEmergencyRequestsEnabledChange,
}: AdminProfessionalProfileFieldsProps) {
  const t = useTranslation();
  const showOtherDescription = allowsOtherProfessionDescription(selectedProfession);

  const handleProfessionSelect = (profession: string): void => {
    onProfessionChange(profession);
    if (!allowsOtherProfessionDescription(profession)) {
      onOtherProfessionDescriptionChange('');
    }
  };

  const handleCommunityChange = (enabled: boolean): void => {
    onCommunityRequestsEnabledChange(enabled);
    if (!enabled) {
      onEmergencyRequestsEnabledChange(false);
    }
  };

  return (
    <View style={styles.root} testID="admin-professional-profile-fields">
      <AppText variant="body" color="secondary">
        {t.administration.register.professionExplanation}
      </AppText>

      <AdminProfessionPicker
        professions={professions}
        selectedProfession={selectedProfession}
        onSelect={handleProfessionSelect}
      />

      {showOtherDescription ? (
        <AppTextInput
          label={t.administration.register.otherProfessionLabel}
          value={otherProfessionDescription}
          onChangeText={onOtherProfessionDescriptionChange}
        />
      ) : null}

      <AdminSectionCard testID="admin-profession-permissions">
        <View style={styles.permissions}>
          <CheckboxField
            label={t.administration.register.communityRequestsLabel}
            checked={communityRequestsEnabled}
            onChange={handleCommunityChange}
            testID="admin-profession-community-requests"
          />
          <CheckboxField
            label={t.administration.register.emergencyRequestsLabel}
            helperText={t.administration.register.emergencyExplanation}
            checked={emergencyRequestsEnabled}
            disabled={!communityRequestsEnabled}
            onChange={onEmergencyRequestsEnabledChange}
            testID="admin-profession-emergency-requests"
          />
        </View>
      </AdminSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  permissions: {
    gap: spacing.md,
  },
});
