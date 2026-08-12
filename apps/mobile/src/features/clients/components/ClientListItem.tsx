import { Pressable, StyleSheet, View } from 'react-native';

import type { Client } from '../../../data/domain/entities/entities';
import { AppText } from '../../../design-system';
import { colors, layout, radii, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { formatAgePresentation, resolveAgePresentation } from '../domain/agePresentation';
import {
  ClientListCalendarIcon,
  ClientListChevronIcon,
  ClientListLocationIcon,
} from './ClientListIcons';

export function ClientListItem({
  client,
  onPress,
  testID,
}: {
  readonly client: Client;
  readonly onPress: () => void;
  readonly testID?: string;
}) {
  const t = useTranslation();
  const { colors: themeColors } = useThemeMode();
  const displayName =
    client.preferredName?.trim() || `${client.givenName} ${client.familyName}`.trim();
  const age = formatAgePresentation(
    resolveAgePresentation({
      dateOfBirth: client.dateOfBirth,
      approximateAge: client.approximateAge,
      approximateAgeUnit: client.approximateAgeUnit,
    }),
    {
      unknown: t.clients.age.unknown,
      approximate: (value, unit) => t.clients.age.approximate(value, unit),
      bornOn: (date) => t.clients.age.bornOn(date),
    },
  );
  const categoryLabel = t.clients.categories[client.category];
  const locationLabel = client.community?.trim() || client.district?.trim() || '—';
  const initials =
    `${client.givenName.trim().charAt(0)}${client.familyName.trim().charAt(0)}`.toUpperCase() ||
    '?';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${client.clientCode}, ${categoryLabel}, ${age}, ${locationLabel}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={styles.avatar}>
        <AppText variant="label" style={styles.avatarText}>
          {initials}
        </AppText>
      </View>

      <View style={styles.content}>
        <AppText variant="bodyStrong">{displayName}</AppText>
        <AppText variant="caption" color="secondary">
          {client.clientCode} · {categoryLabel}
        </AppText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <ClientListCalendarIcon />
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {age}
            </AppText>
          </View>
          <AppText variant="caption" color="secondary" accessibilityElementsHidden>
            |
          </AppText>
          <View style={[styles.metaItem, styles.locationItem]}>
            <ClientListLocationIcon />
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {locationLabel}
            </AppText>
          </View>
        </View>
      </View>

      <ClientListChevronIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.mutedSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    flexShrink: 1,
  },
  locationItem: {
    flex: 1,
  },
});
