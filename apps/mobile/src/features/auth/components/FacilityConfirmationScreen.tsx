import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppText } from '../../../design-system/text/AppText';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { AuthAccount } from '../domain/types';
import { AuthSetupScreenLayout } from './AuthSetupScreenLayout';
import {
  AuthFooterHint,
  AuthSetupActionButton,
  GoldAccentBar,
} from './AuthSetupUiElements';

export type FacilityConfirmationScreenProps = {
  readonly account: AuthAccount;
  readonly title: string;
  readonly subtitle: string;
  readonly roleLabel: string;
  readonly roleValue: string;
  readonly facilityTypeLabel: string;
  readonly regionLabel: string;
  readonly confirmLabel: string;
  readonly incorrectLabel: string;
  readonly incorrectBody: string | null;
  readonly footerHint: string;
  readonly onConfirm: () => void;
  readonly onIncorrect: () => void;
  readonly testID?: string;
};

function FacilityMapIcon({ fill, stroke }: { readonly fill: string; readonly stroke: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 21 C12 21 5 14.5 5 10 C5 6.1 8.1 3 12 3 C15.9 3 19 6.1 19 10 C19 14.5 12 21 12 21 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="2.5" fill={stroke} />
    </Svg>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon: 'building' | 'region' | 'role';
}) {
  const { colors, isDark } = useThemeMode();

  return (
    <View style={styles.detailRow}>
      <View
        style={[
          styles.detailIcon,
          { backgroundColor: isDark ? colors.mutedSurface : '#E6F3F0' },
        ]}
      >
        {icon === 'building' ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
            <Rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke={colors.primary} strokeWidth={1.6} />
            <Path d="M9 8 H11 M13 8 H15 M9 12 H11 M13 12 H15 M9 16 H15" stroke={colors.primary} strokeWidth={1.4} strokeLinecap="round" />
          </Svg>
        ) : null}
        {icon === 'region' ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
            <Circle cx="12" cy="12" r="8" fill="none" stroke={colors.primary} strokeWidth={1.6} />
            <Path d="M4 12 H20 M12 4 C14.5 7 14.5 17 12 20 C9.5 17 9.5 7 12 4 Z" fill="none" stroke={colors.primary} strokeWidth={1.4} />
          </Svg>
        ) : null}
        {icon === 'role' ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
            <Circle cx="12" cy="8" r="3" fill="none" stroke={colors.primary} strokeWidth={1.6} />
            <Path d="M5 19 C5 15.5 8 14 12 14 C16 14 19 15.5 19 19" fill="none" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
        ) : null}
      </View>
      <View style={styles.detailCopy}>
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
        <AppText variant="bodyStrong" style={{ color: colors.textPrimary }}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function FacilityConfirmationScreen({
  account,
  title,
  subtitle,
  roleLabel,
  roleValue,
  facilityTypeLabel,
  regionLabel,
  confirmLabel,
  incorrectLabel,
  incorrectBody,
  footerHint,
  onConfirm,
  onIncorrect,
  testID = 'facility-confirmation',
}: FacilityConfirmationScreenProps) {
  const { colors, isDark } = useThemeMode();

  return (
    <AuthSetupScreenLayout
      testID={testID}
      footer={<AuthFooterHint message={footerHint} />}
    >
      <View style={styles.heroWrap} accessibilityElementsHidden>
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: isDark ? colors.mutedSurface : '#E6F3F0' },
          ]}
        />
        <View
          style={[
            styles.heroBadge,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : '#D5E8E3',
            },
          ]}
        >
          <FacilityMapIcon
            fill={isDark ? colors.mutedSurface : '#E6F3F0'}
            stroke={colors.primary}
          />
        </View>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="headingLarge" color="action" align="center" style={styles.title}>
          {title}
        </AppText>
        <GoldAccentBar />
        <AppText variant="body" color="secondary" align="center" style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>

      <View
        style={[
          styles.facilityCard,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : '#DDE7E4',
          },
        ]}
        testID={`${testID}-card`}
      >
        <AppText variant="title" style={[styles.facilityName, { color: colors.primary }]}>
          {account.facilityName}
        </AppText>
        <View style={styles.detailList}>
          {account.facilityType ? (
            <DetailRow label={facilityTypeLabel} value={account.facilityType} icon="building" />
          ) : null}
          {account.districtOrRegion ? (
            <DetailRow label={regionLabel} value={account.districtOrRegion} icon="region" />
          ) : null}
          <DetailRow label={roleLabel} value={roleValue} icon="role" />
        </View>
      </View>

      {incorrectBody ? (
        <View
          style={[styles.errorBanner, { backgroundColor: colors.dangerBackground }]}
          testID={`${testID}-incorrect`}
        >
          <AppText variant="body" color="urgent" align="center">
            {incorrectBody}
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AuthSetupActionButton
          label={confirmLabel}
          onPress={onConfirm}
          testID={`${testID}-confirm`}
        />
        <AuthSetupActionButton
          label={incorrectLabel}
          variant="secondary"
          onPress={onIncorrect}
          testID={`${testID}-incorrect-action`}
        />
      </View>
    </AuthSetupScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    width: '100%',
    marginBottom: spacing.xs,
  },
  heroGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.9,
  },
  heroBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  titleBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 22,
    maxWidth: 320,
  },
  facilityCard: {
    width: '100%',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  facilityName: {
    fontWeight: '800',
  },
  detailList: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  errorBanner: {
    width: '100%',
    borderRadius: radii.md,
    padding: spacing.base,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
