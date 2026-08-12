import { StyleSheet, View } from 'react-native';

import { PressableCard } from '../../../design-system';
import { spacing } from '../../../theme';
import type { ProfessionRegistryItem } from '../domain/types';

type AdminProfessionPickerProps = {
  readonly professions: readonly ProfessionRegistryItem[];
  readonly selectedProfession: string;
  readonly onSelect: (profession: string) => void;
};

export function AdminProfessionPicker({
  professions,
  selectedProfession,
  onSelect,
}: AdminProfessionPickerProps) {
  return (
    <View style={styles.list}>
      {professions.map((item) => (
        <PressableCard
          key={item.value}
          title={item.label}
          selected={selectedProfession === item.value}
          onPress={() => onSelect(item.value)}
          accessibilityHint="Select this profession"
          testID={`admin-profession-option-${item.value}`}
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
