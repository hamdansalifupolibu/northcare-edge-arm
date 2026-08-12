import { StyleSheet, View } from 'react-native';

import { PressableCard } from '../../../design-system';
import { spacing } from '../../../theme';
import type { AdminFacility } from '../domain/types';

export function formatAdminFacilitySubtitle(facility: AdminFacility): string {
  return [facility.facilityType, facility.district, facility.region]
    .filter(Boolean)
    .join(' · ');
}

type AdminFacilityPickerProps = {
  readonly facilities: readonly AdminFacility[];
  readonly selectedFacilityId: string | null;
  readonly onSelect: (facilityId: string) => void;
};

export function AdminFacilityPicker({
  facilities,
  selectedFacilityId,
  onSelect,
}: AdminFacilityPickerProps) {
  return (
    <View style={styles.list}>
      {facilities.map((facility) => (
        <PressableCard
          key={facility.facilityId}
          title={facility.name}
          subtitle={formatAdminFacilitySubtitle(facility)}
          selected={selectedFacilityId === facility.facilityId}
          onPress={() => onSelect(facility.facilityId)}
          accessibilityHint="Select this facility"
          testID={`admin-facility-option-${facility.facilityId}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
